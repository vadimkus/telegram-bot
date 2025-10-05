// Real movie scraper that gets actual data from reliable sources
const axios = require('axios');
const cheerio = require('cheerio');

class RealMovieScraper {
  constructor() {
    this.baseUrls = {
      imdb: 'https://www.imdb.com',
      metacritic: 'https://www.metacritic.com',
      justwatch: 'https://www.justwatch.com'
    };
  }

  // Scrape real movies from IMDB using a different approach
  async scrapeRealMovies() {
    try {
      console.log('Scraping real movies from IMDB...');
      
      // Try the main IMDB page first
      const response = await axios.get('https://www.imdb.com/chart/moviemeter/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      });
      
      console.log('IMDB response status:', response.status);
      const $ = cheerio.load(response.data);
      const movies = [];
      
      // Look for movie entries in the chart
      $('tbody.lister-list tr').each((index, element) => {
        if (index >= 5) return false;
        
        const titleElement = $(element).find('.titleColumn a');
        const title = titleElement.text().trim();
        const year = $(element).find('.titleColumn .secondaryInfo').text().trim();
        const rating = $(element).find('.imdbRating strong').text().trim();
        
        if (title && title.length > 2) {
          movies.push({
            title: title,
            year: year.replace(/[()]/g, '').trim() || new Date().getFullYear().toString(),
            rating: rating || 'N/A',
            plot: 'Popular movie',
            poster: '',
            source: 'IMDB Real'
          });
        }
      });
      
      console.log(`Found ${movies.length} real movies from IMDB`);
      return movies;
    } catch (error) {
      console.error('Error scraping real movies:', error.message);
      return [];
    }
  }

  // Scrape from Metacritic for additional real data
  async scrapeMetacriticMovies() {
    try {
      console.log('Scraping real movies from Metacritic...');
      
      const response = await axios.get('https://www.metacritic.com/browse/movies/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const movies = [];
      
      $('.c-productTile').each((index, element) => {
        if (index >= 5) return false;
        
        const title = $(element).find('.c-productTile_title a').text().trim();
        const year = $(element).find('.c-productTile_title .c-productTile_meta').text().trim();
        const rating = $(element).find('.c-siteReviewScore').text().trim();
        
        if (title && title.length > 2) {
          movies.push({
            title: title,
            year: year || new Date().getFullYear().toString(),
            rating: rating || 'N/A',
            plot: 'Metacritic movie',
            poster: '',
            source: 'Metacritic Real'
          });
        }
      });
      
      console.log(`Found ${movies.length} real movies from Metacritic`);
      return movies;
    } catch (error) {
      console.error('Error scraping Metacritic:', error.message);
      return [];
    }
  }

  // Get real movies from multiple sources
  async getRealMovies(genre = '') {
    try {
      console.log('Getting real movie data from multiple sources...');
      
      // Try multiple sources in parallel
      const [imdbMovies, metacriticMovies] = await Promise.allSettled([
        this.scrapeRealMovies(),
        this.scrapeMetacriticMovies()
      ]);
      
      // Combine results from all sources
      const allMovies = [];
      
      if (imdbMovies.status === 'fulfilled' && imdbMovies.value.length > 0) {
        allMovies.push(...imdbMovies.value);
      }
      if (metacriticMovies.status === 'fulfilled' && metacriticMovies.value.length > 0) {
        allMovies.push(...metacriticMovies.value);
      }
      
      // If we have real movies, return them
      if (allMovies.length > 0) {
        console.log(`Returning ${allMovies.length} real movies`);
        return allMovies.slice(0, 5);
      }
      
      // If no real movies found, return empty array (no fallback)
      console.log('No real movies found, returning empty array');
      return [];
      
    } catch (error) {
      console.error('Error getting real movies:', error);
      return [];
    }
  }

  // Get real trending movies
  async getRealTrendingMovies() {
    try {
      console.log('Getting real trending movies...');
      
      const movies = await this.scrapeRealMovies();
      
      if (movies.length > 0) {
        console.log(`Found ${movies.length} real trending movies`);
        return movies.slice(0, 5);
      }
      
      console.log('No real trending movies found');
      return [];
      
    } catch (error) {
      console.error('Error getting real trending movies:', error);
      return [];
    }
  }
}

module.exports = RealMovieScraper;
