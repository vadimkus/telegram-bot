// Ultra-lightweight TMDB scraper for Vercel
const axios = require('axios');

class LightweightTMDB {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  }

  // Single method to fetch any TMDB endpoint
  async fetch(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: { api_key: this.apiKey, ...params },
        timeout: 5000 // 5 second timeout
      });
      return response.data.results || [];
    } catch (error) {
      console.error(`TMDB Error: ${endpoint}`, error.message);
      return [];
    }
  }

  // Format any movie/TV item consistently
  formatItem(item) {
    return {
      title: item.title || item.name || 'Unknown',
      year: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A',
      rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
      plot: (item.overview || 'No description').slice(0, 100) + '...',
      poster: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : ''
    };
  }

  // Get trending movies (simplified)
  async getTrendingMovies() {
    const data = await this.fetch('/trending/movie/week');
    return data.slice(0, 3).map(item => this.formatItem(item));
  }

  // Get trending TV (simplified)
  async getTrendingTV() {
    const data = await this.fetch('/trending/tv/week');
    return data.slice(0, 3).map(item => this.formatItem(item));
  }

  // Get popular movies (simplified)
  async getPopularMovies() {
    const data = await this.fetch('/movie/popular');
    return data.slice(0, 3).map(item => this.formatItem(item));
  }

  // Get popular TV (simplified)
  async getPopularTV() {
    const data = await this.fetch('/tv/popular');
    return data.slice(0, 3).map(item => this.formatItem(item));
  }
}

module.exports = new LightweightTMDB();
