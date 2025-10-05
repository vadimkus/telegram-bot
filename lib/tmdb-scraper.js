// TMDB API scraper for real movie data
const axios = require('axios');

class TMDBScraper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  }

  // Get movie videos/trailers (optimized with shorter timeout)
  async getMovieVideos(movieId) {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/${movieId}/videos`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        },
        timeout: 3000 // Reduced timeout to 3 seconds
      });

      // Find the first trailer or teaser
      const videos = response.data.results;
      const trailer = videos.find(video => 
        video.type === 'Trailer' && 
        video.site === 'YouTube' && 
        video.official === true
      ) || videos.find(video => 
        video.type === 'Teaser' && 
        video.site === 'YouTube'
      ) || videos.find(video => 
        video.site === 'YouTube'
      );

      return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    } catch (error) {
      // Silently fail for video fetching to avoid hanging
      return null;
    }
  }

  // Get popular movies from TMDB (optimized)
  async getPopularMovies() {
    try {
      console.log('Fetching popular movies from TMDB...');
      const response = await axios.get(`${this.baseUrl}/movie/popular`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          page: 1
        },
        timeout: 10000
      });

      // Limit to 3 movies to reduce API calls
      const movieResults = response.data.results.slice(0, 3);
      
      // Fetch videos in parallel with Promise.allSettled to avoid hanging
      const videoPromises = movieResults.map(movie => this.getMovieVideos(movie.id));
      const videoResults = await Promise.allSettled(videoPromises);
      
      const movies = movieResults.map((movie, index) => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : new Date().getFullYear().toString(),
        rating: movie.vote_average ? movie.vote_average.toString() : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        videoUrl: videoResults[index].status === 'fulfilled' ? videoResults[index].value : null,
        movieId: movie.id,
        source: 'TMDB Popular'
      }));

      console.log(`Found ${movies.length} popular movies from TMDB`);
      return movies;
    } catch (error) {
      console.error('Error fetching popular movies from TMDB:', error.message);
      return [];
    }
  }

  // Get trending movies from TMDB (optimized)
  async getTrendingMovies() {
    try {
      console.log('Fetching trending movies from TMDB...');
      const response = await axios.get(`${this.baseUrl}/trending/movie/week`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        },
        timeout: 10000
      });

      // Limit to 3 movies to reduce API calls
      const movieResults = response.data.results.slice(0, 3);
      
      // Fetch videos in parallel with Promise.allSettled to avoid hanging
      const videoPromises = movieResults.map(movie => this.getMovieVideos(movie.id));
      const videoResults = await Promise.allSettled(videoPromises);
      
      const movies = movieResults.map((movie, index) => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : new Date().getFullYear().toString(),
        rating: movie.vote_average ? movie.vote_average.toString() : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        videoUrl: videoResults[index].status === 'fulfilled' ? videoResults[index].value : null,
        movieId: movie.id,
        source: 'TMDB Trending'
      }));

      console.log(`Found ${movies.length} trending movies from TMDB`);
      return movies;
    } catch (error) {
      console.error('Error fetching trending movies from TMDB:', error.message);
      return [];
    }
  }

  // Get movies by genre
  async getMoviesByGenre(genreId) {
    try {
      console.log(`Fetching movies for genre ID ${genreId} from TMDB...`);
      const response = await axios.get(`${this.baseUrl}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          with_genres: genreId,
          sort_by: 'popularity.desc',
          page: 1
        },
        timeout: 10000
      });

      const movies = response.data.results.slice(0, 5).map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : new Date().getFullYear().toString(),
        rating: movie.vote_average ? movie.vote_average.toString() : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        source: 'TMDB Genre'
      }));

      console.log(`Found ${movies.length} movies for genre from TMDB`);
      return movies;
    } catch (error) {
      console.error('Error fetching movies by genre from TMDB:', error.message);
      return [];
    }
  }

  // Get new releases
  async getNewReleases() {
    try {
      console.log('Fetching new releases from TMDB...');
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${this.baseUrl}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          sort_by: 'release_date.desc',
          'release_date.gte': today,
          page: 1
        },
        timeout: 10000
      });

      const movies = response.data.results.slice(0, 5).map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : new Date().getFullYear().toString(),
        rating: movie.vote_average ? movie.vote_average.toString() : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        source: 'TMDB New Releases'
      }));

      console.log(`Found ${movies.length} new releases from TMDB`);
      return movies;
    } catch (error) {
      console.error('Error fetching new releases from TMDB:', error.message);
      return [];
    }
  }

  // Get movies by genre name (converts genre name to ID)
  async getMoviesByGenreName(genreName) {
    // Movie genres from TMDB API
    const movieGenreMap = {
      'action': 28,
      'adventure': 12,
      'animation': 16,
      'comedy': 35,
      'crime': 80,
      'documentary': 99,
      'drama': 18,
      'family': 10751,
      'fantasy': 14,
      'history': 36,
      'horror': 27,
      'music': 10402,
      'mystery': 9648,
      'romance': 10749,
      'science fiction': 878,
      'thriller': 53,
      'war': 10752,
      'western': 37
    };

    const genreId = movieGenreMap[genreName.toLowerCase()];
    if (genreId) {
      console.log(`Fetching movies for genre: ${genreName} (ID: ${genreId})`);
      return await this.getMoviesByGenre(genreId);
    } else {
      console.log(`Unknown movie genre: ${genreName}`);
      return [];
    }
  }

  // Get TV series videos/trailers
  async getTVSeriesVideos(seriesId) {
    try {
      const response = await axios.get(`${this.baseUrl}/tv/${seriesId}/videos`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        },
        timeout: 3000
      });

      const videos = response.data.results;
      const trailer = videos.find(video => 
        video.type === 'Trailer' && 
        video.site === 'YouTube' && 
        video.official === true
      ) || videos.find(video => 
        video.type === 'Teaser' && 
        video.site === 'YouTube'
      ) || videos.find(video => 
        video.site === 'YouTube'
      );

      return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    } catch (error) {
      return null;
    }
  }

  // Get popular TV series
  async getPopularTVSeries() {
    try {
      console.log('Fetching popular TV series from TMDB...');
      const response = await axios.get(`${this.baseUrl}/tv/popular`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          page: 1
        },
        timeout: 10000
      });

      // Limit to 3 series to reduce API calls
      const seriesResults = response.data.results.slice(0, 3);
      
      // Fetch videos in parallel with Promise.allSettled to avoid hanging
      const videoPromises = seriesResults.map(series => this.getTVSeriesVideos(series.id));
      const videoResults = await Promise.allSettled(videoPromises);
      
      const series = seriesResults.map((item, index) => ({
        title: item.name,
        year: item.first_air_date ? item.first_air_date.split('-')[0] : new Date().getFullYear().toString(),
        rating: item.vote_average ? item.vote_average.toString() : 'N/A',
        plot: item.overview || 'No description available',
        poster: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : '',
        videoUrl: videoResults[index].status === 'fulfilled' ? videoResults[index].value : null,
        seriesId: item.id,
        source: 'TMDB Popular TV'
      }));

      console.log(`Found ${series.length} popular TV series from TMDB`);
      return series;
    } catch (error) {
      console.error('Error fetching popular TV series from TMDB:', error.message);
      return [];
    }
  }

  // Get trending TV series
  async getTrendingTVSeries() {
    try {
      console.log('Fetching trending TV series from TMDB...');
      const response = await axios.get(`${this.baseUrl}/trending/tv/week`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        },
        timeout: 10000
      });

      // Limit to 3 series to reduce API calls
      const seriesResults = response.data.results.slice(0, 3);
      
      // Fetch videos in parallel with Promise.allSettled to avoid hanging
      const videoPromises = seriesResults.map(series => this.getTVSeriesVideos(series.id));
      const videoResults = await Promise.allSettled(videoPromises);
      
      const series = seriesResults.map((item, index) => ({
        title: item.name,
        year: item.first_air_date ? item.first_air_date.split('-')[0] : new Date().getFullYear().toString(),
        rating: item.vote_average ? item.vote_average.toString() : 'N/A',
        plot: item.overview || 'No description available',
        poster: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : '',
        videoUrl: videoResults[index].status === 'fulfilled' ? videoResults[index].value : null,
        seriesId: item.id,
        source: 'TMDB Trending TV'
      }));

      console.log(`Found ${series.length} trending TV series from TMDB`);
      return series;
    } catch (error) {
      console.error('Error fetching trending TV series from TMDB:', error.message);
      return [];
    }
  }

  // Get TV series by genre
  async getTVSeriesByGenre(genreId) {
    try {
      console.log(`Fetching TV series for genre ID ${genreId} from TMDB...`);
      const response = await axios.get(`${this.baseUrl}/discover/tv`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          with_genres: genreId,
          sort_by: 'popularity.desc',
          page: 1
        },
        timeout: 10000
      });

      return response.data.results.map(series => ({
        id: series.id,
        title: series.name,
        first_air_date: series.first_air_date,
        vote_average: series.vote_average,
        overview: series.overview,
        poster_path: series.poster_path ? `${this.imageBaseUrl}${series.poster_path}` : '',
        genre_ids: series.genre_ids
      }));
    } catch (error) {
      console.error('Error fetching TV series by genre from TMDB:', error.message);
      return [];
    }
  }

  // Get TV series by genre name (converts genre name to ID)
  async getTVSeriesByGenreName(genreName) {
    // TV series genres from TMDB API
    const tvGenreMap = {
      'action & adventure': 10759,
      'animation': 16,
      'comedy': 35,
      'crime': 80,
      'documentary': 99,
      'drama': 18,
      'family': 10751,
      'kids': 10762,
      'mystery': 9648,
      'news': 10763,
      'reality': 10764,
      'sci-fi & fantasy': 10765,
      'soap': 10766,
      'talk': 10767,
      'war & politics': 10768,
      'western': 37,
      // Map common movie genres to TV equivalents
      'action': 10759, // Action & Adventure
      'adventure': 10759, // Action & Adventure
      'fantasy': 10765, // Sci-Fi & Fantasy
      'science fiction': 10765, // Sci-Fi & Fantasy
      'horror': 10765, // Sci-Fi & Fantasy (closest match)
      'thriller': 18, // Drama (closest match)
      'romance': 18, // Drama (closest match)
      'music': 18, // Drama (closest match)
      'history': 18, // Drama (closest match)
      'war': 10768 // War & Politics
    };

    const genreId = tvGenreMap[genreName.toLowerCase()];
    if (genreId) {
      console.log(`Fetching TV series for genre: ${genreName} (ID: ${genreId})`);
      return await this.getTVSeriesByGenre(genreId);
    } else {
      console.log(`Unknown TV series genre: ${genreName}`);
      return [];
    }
  }
}

module.exports = TMDBScraper;
