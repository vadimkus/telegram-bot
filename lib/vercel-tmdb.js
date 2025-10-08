// Lightweight TMDB scraper optimized for Vercel
const axios = require('axios');

class VercelTMDBScraper {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    
    // Configure axios for Vercel
    this.axiosConfig = {
      timeout: 8000, // 8 second timeout for Vercel
      headers: {
        'User-Agent': 'TelegramBot/1.0'
      }
    };
  }

  // Generic method to fetch from TMDB API
  async fetchFromAPI(endpoint, params = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, {
        ...this.axiosConfig,
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          ...params
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`TMDB API Error for ${endpoint}:`, error.message);
      return { results: [] };
    }
  }

  // Format movie data consistently
  formatMovie(movie) {
    return {
      title: movie.title || movie.name || 'Unknown Title',
      year: movie.release_date ? movie.release_date.split('-')[0] : 
            movie.first_air_date ? movie.first_air_date.split('-')[0] : 'N/A',
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
      plot: movie.overview || 'No description available',
      poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
      id: movie.id,
      type: movie.title ? 'movie' : 'tv'
    };
  }

  // Get trending movies
  async getTrendingMovies() {
    try {
      const data = await this.fetchFromAPI('/trending/movie/week');
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      return [];
    }
  }

  // Get trending TV series
  async getTrendingTVSeries() {
    try {
      const data = await this.fetchFromAPI('/trending/tv/week');
      return data.results.slice(0, 5).map(series => this.formatMovie(series));
    } catch (error) {
      console.error('Error fetching trending TV series:', error);
      return [];
    }
  }

  // Get popular movies
  async getPopularMovies() {
    try {
      const data = await this.fetchFromAPI('/movie/popular');
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  }

  // Get popular TV series
  async getPopularTVSeries() {
    try {
      const data = await this.fetchFromAPI('/tv/popular');
      return data.results.slice(0, 5).map(series => this.formatMovie(series));
    } catch (error) {
      console.error('Error fetching popular TV series:', error);
      return [];
    }
  }

  // Get top rated movies
  async getTopRatedMovies() {
    try {
      const data = await this.fetchFromAPI('/movie/top_rated');
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return [];
    }
  }

  // Get top rated TV series
  async getTopRatedTVSeries() {
    try {
      const data = await this.fetchFromAPI('/tv/top_rated');
      return data.results.slice(0, 5).map(series => this.formatMovie(series));
    } catch (error) {
      console.error('Error fetching top rated TV series:', error);
      return [];
    }
  }

  // Get now playing movies
  async getNowPlayingMovies() {
    try {
      const data = await this.fetchFromAPI('/movie/now_playing');
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      return [];
    }
  }

  // Get now airing TV series
  async getNowAiringTVSeries() {
    try {
      const data = await this.fetchFromAPI('/tv/on_the_air');
      return data.results.slice(0, 5).map(series => this.formatMovie(series));
    } catch (error) {
      console.error('Error fetching now airing TV series:', error);
      return [];
    }
  }

  // Get new releases (this week's movies)
  async getNewReleases() {
    try {
      const data = await this.fetchFromAPI('/movie/now_playing');
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error fetching new releases:', error);
      return [];
    }
  }

  // Search movies
  async searchMovies(query) {
    try {
      const data = await this.fetchFromAPI('/search/movie', { query });
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  }

  // Search TV series
  async searchTVSeries(query) {
    try {
      const data = await this.fetchFromAPI('/search/tv', { query });
      return data.results.slice(0, 5).map(series => this.formatMovie(series));
    } catch (error) {
      console.error('Error searching TV series:', error);
      return [];
    }
  }

  // Get movie details
  async getMovieDetails(movieId) {
    try {
      const data = await this.fetchFromAPI(`/movie/${movieId}`);
      return this.formatMovie(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  }

  // Get TV series details
  async getTVSeriesDetails(seriesId) {
    try {
      const data = await this.fetchFromAPI(`/tv/${seriesId}`);
      return this.formatMovie(data);
    } catch (error) {
      console.error('Error fetching TV series details:', error);
      return null;
    }
  }

  // Get genre-specific content
  async getMoviesByGenre(genreId) {
    try {
      const data = await this.fetchFromAPI('/discover/movie', { with_genres: genreId });
      return data.results.slice(0, 5).map(movie => this.formatMovie(movie));
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      return [];
    }
  }

  // Get TV series by genre
  async getTVSeriesByGenre(genreId) {
    try {
      const data = await this.fetchFromAPI('/discover/tv', { with_genres: genreId });
      return data.results.slice(0, 5).map(series => this.formatMovie(series));
    } catch (error) {
      console.error('Error fetching TV series by genre:', error);
      return [];
    }
  }

  // Get available genres
  async getGenres(type = 'movie') {
    try {
      const data = await this.fetchFromAPI(`/genre/${type}/list`);
      return data.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new VercelTMDBScraper();
