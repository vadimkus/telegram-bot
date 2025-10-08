// Simplified TMDB API scraper
const axios = require('axios');

class SimpleTMDBScraper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  }

  // Get trending movies
  async getTrendingMovies() {
    try {
      const response = await axios.get(`${this.baseUrl}/trending/movie/week`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        release_date: movie.release_date,
        videoUrl: null // Simplified - no trailer fetching
      }));
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      return [];
    }
  }

  // Get trending TV series
  async getTrendingTVSeries() {
    try {
      const response = await axios.get(`${this.baseUrl}/trending/tv/week`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(series => ({
        title: series.name,
        year: series.first_air_date ? series.first_air_date.split('-')[0] : 'N/A',
        rating: series.vote_average ? series.vote_average.toFixed(1) : 'N/A',
        plot: series.overview || 'No description available',
        poster: series.poster_path ? `${this.imageBaseUrl}${series.poster_path}` : '',
        first_air_date: series.first_air_date,
        videoUrl: null // Simplified - no trailer fetching
      }));
    } catch (error) {
      console.error('Error fetching trending TV series:', error);
      return [];
    }
  }

  // Get popular movies
  async getPopularMovies() {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/popular`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        release_date: movie.release_date,
        videoUrl: null
      }));
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  }

  // Get popular TV series
  async getPopularTVSeries() {
    try {
      const response = await axios.get(`${this.baseUrl}/tv/popular`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(series => ({
        title: series.name,
        year: series.first_air_date ? series.first_air_date.split('-')[0] : 'N/A',
        rating: series.vote_average ? series.vote_average.toFixed(1) : 'N/A',
        plot: series.overview || 'No description available',
        poster: series.poster_path ? `${this.imageBaseUrl}${series.poster_path}` : '',
        first_air_date: series.first_air_date,
        videoUrl: null
      }));
    } catch (error) {
      console.error('Error fetching popular TV series:', error);
      return [];
    }
  }

  // Get top rated movies
  async getTopRatedMovies() {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/top_rated`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        release_date: movie.release_date,
        videoUrl: null
      }));
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return [];
    }
  }

  // Get top rated TV series
  async getTopRatedTVSeries() {
    try {
      const response = await axios.get(`${this.baseUrl}/tv/top_rated`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(series => ({
        title: series.name,
        year: series.first_air_date ? series.first_air_date.split('-')[0] : 'N/A',
        rating: series.vote_average ? series.vote_average.toFixed(1) : 'N/A',
        plot: series.overview || 'No description available',
        poster: series.poster_path ? `${this.imageBaseUrl}${series.poster_path}` : '',
        first_air_date: series.first_air_date,
        videoUrl: null
      }));
    } catch (error) {
      console.error('Error fetching top rated TV series:', error);
      return [];
    }
  }

  // Get now playing movies
  async getNowPlayingMovies() {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/now_playing`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
        plot: movie.overview || 'No description available',
        poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
        release_date: movie.release_date,
        videoUrl: null
      }));
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      return [];
    }
  }

  // Get now airing TV series
  async getNowAiringTVSeries() {
    try {
      const response = await axios.get(`${this.baseUrl}/tv/on_the_air`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });
      
      return response.data.results.slice(0, 5).map(series => ({
        title: series.name,
        year: series.first_air_date ? series.first_air_date.split('-')[0] : 'N/A',
        rating: series.vote_average ? series.vote_average.toFixed(1) : 'N/A',
        plot: series.overview || 'No description available',
        poster: series.poster_path ? `${this.imageBaseUrl}${series.poster_path}` : '',
        first_air_date: series.first_air_date,
        videoUrl: null
      }));
    } catch (error) {
      console.error('Error fetching now airing TV series:', error);
      return [];
    }
  }
}

module.exports = new SimpleTMDBScraper(process.env.TMDB_API_KEY);
