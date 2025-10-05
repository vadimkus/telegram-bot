// lib/error-handler.js - Error handling utilities with retry logic
const axios = require('axios');

class ErrorHandler {
  // Retry function with exponential backoff
  static async retry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Safe API call with retry logic
  static async safeApiCall(apiCall, fallback = null, maxRetries = 3) {
    try {
      return await this.retry(apiCall, maxRetries);
    } catch (error) {
      console.error('API call failed after retries:', error.message);
      
      if (fallback) {
        console.log('Using fallback data...');
        return fallback;
      }
      
      throw error;
    }
  }

  // Handle TMDB API errors
  static handleTMDBError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return 'Invalid API key. Please check your TMDB API configuration.';
        case 404:
          return 'Requested content not found.';
        case 429:
          return 'Rate limit exceeded. Please try again later.';
        case 500:
          return 'TMDB server error. Please try again later.';
        default:
          return `TMDB API error: ${data?.status_message || error.message}`;
      }
    } else if (error.request) {
      return 'Network error. Please check your internet connection.';
    } else {
      return `Unexpected error: ${error.message}`;
    }
  }

  // Handle Telegram API errors
  static handleTelegramError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return 'Bad request. Please try again.';
        case 401:
          return 'Invalid bot token. Please check your configuration.';
        case 403:
          return 'Bot is blocked by user.';
        case 404:
          return 'User not found.';
        case 429:
          return 'Rate limit exceeded. Please try again later.';
        default:
          return `Telegram API error: ${data?.description || error.message}`;
      }
    } else if (error.request) {
      return 'Network error. Please check your internet connection.';
    } else {
      return `Unexpected error: ${error.message}`;
    }
  }

  // Get fallback content when API fails
  static getFallbackContent(type = 'movie', genre = '') {
    const fallbackMovies = [
      {
        title: 'The Shawshank Redemption',
        year: '1994',
        rating: '9.3',
        plot: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        source: 'Fallback Content'
      },
      {
        title: 'The Godfather',
        year: '1972',
        rating: '9.2',
        plot: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
        poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        source: 'Fallback Content'
      },
      {
        title: 'The Dark Knight',
        year: '2008',
        rating: '9.0',
        plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        source: 'Fallback Content'
      }
    ];

    const fallbackTV = [
      {
        title: 'Breaking Bad',
        year: '2008',
        rating: '9.5',
        plot: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
        poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        source: 'Fallback Content'
      },
      {
        title: 'Game of Thrones',
        year: '2011',
        rating: '9.3',
        plot: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
        poster: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
        source: 'Fallback Content'
      },
      {
        title: 'The Sopranos',
        year: '1999',
        rating: '9.2',
        plot: 'New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life that affect his mental state, leading him to seek professional psychiatric counseling.',
        poster: 'https://image.tmdb.org/t/p/w500/rTc7ZXdroqjkKivFPvCPX0Ru2UW.jpg',
        source: 'Fallback Content'
      }
    ];

    return type === 'series' ? fallbackTV : fallbackMovies;
  }
}

module.exports = ErrorHandler;
