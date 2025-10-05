// Movie scraper for popular movie websites
const axios = require('axios');
const cheerio = require('cheerio');

class MovieScraper {
  constructor() {
    this.baseUrls = {
      imdb: 'https://www.imdb.com',
      rottenTomatoes: 'https://www.rottentomatoes.com',
      metacritic: 'https://www.metacritic.com'
    };
  }

  // Scrape IMDB for new releases
  async scrapeIMDBNewReleases() {
    try {
      console.log('Scraping IMDB new releases...');
      const response = await axios.get('https://www.imdb.com/movies-coming-soon/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 15000
      });
      
      console.log('IMDB response status:', response.status);
      const $ = cheerio.load(response.data);
      const movies = [];
      
      // Try different selectors for IMDB structure
      $('.list_item, .lister-item, .titleColumn, .ipc-metadata-list-item').each((index, element) => {
        if (index >= 5) return false;
        
        let title = '';
        let year = '';
        let rating = '';
        let plot = '';
        
        // Try multiple selectors for title
        title = $(element).find('h4 a, .titleColumn a, a[href*="/title/"], .ipc-title-link-wrapper h3 a').first().text().trim();
        
        // Try multiple selectors for year
        year = $(element).find('.year_type, .secondaryInfo, .ipc-metadata-list-item__label').text().trim();
        
        // Try multiple selectors for rating
        rating = $(element).find('.rating .value, .imdbRating strong, .ipc-rating-star').text().trim();
        
        // Try multiple selectors for plot
        plot = $(element).find('.outline, .summary, .ipc-metadata-list-item__content-container').text().trim();
        
        // Clean up the data
        if (title && title.length > 2) {
          // Clean year
          year = year.replace(/[()]/g, '').trim() || new Date().getFullYear().toString();
          
          // Clean rating
          rating = rating.replace(/[^\d.]/g, '') || 'N/A';
          
          // Clean plot
          plot = plot.substring(0, 200) || 'No description available';
          
          movies.push({
            title: title.trim(),
            year: year,
            rating: rating,
            plot: plot,
            poster: '',
            source: 'IMDB'
          });
        }
      });
      
      console.log(`Found ${movies.length} movies from IMDB`);
      return movies;
    } catch (error) {
      console.error('Error scraping IMDB:', error.message);
      return [];
    }
  }

  // Scrape Rotten Tomatoes for new releases
  async scrapeRottenTomatoesNewReleases() {
    try {
      const response = await axios.get('https://www.rottentomatoes.com/browse/movies_in_theaters/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const movies = [];
      
      $('.movie_info').each((index, element) => {
        if (index >= 5) return false;
        
        const title = $(element).find('h3 a').text().trim();
        const year = $(element).find('.year').text().trim();
        const rating = $(element).find('.tMeterScore').text().trim();
        const plot = $(element).find('.synopsis').text().trim();
        
        if (title) {
          movies.push({
            title,
            year: year || new Date().getFullYear().toString(),
            rating: rating || 'N/A',
            plot: plot || 'No description available',
            source: 'Rotten Tomatoes'
          });
        }
      });
      
      return movies;
    } catch (error) {
      console.error('Error scraping Rotten Tomatoes:', error);
      return [];
    }
  }

  // Scrape from a more reliable source - Box Office Mojo
  async scrapeBoxOfficeMojo() {
    try {
      console.log('Scraping from Box Office Mojo...');
      const response = await axios.get('https://www.boxofficemojo.com/coming-soon/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const movies = [];
      
      $('tr, .a-text-left').each((index, element) => {
        if (index >= 5) return false;
        
        const title = $(element).find('a').first().text().trim();
        const date = $(element).find('td').eq(1).text().trim();
        
        if (title && title.length > 2) {
          movies.push({
            title,
            year: new Date().getFullYear().toString(),
            rating: 'N/A',
            plot: `Coming soon: ${date}`,
            source: 'Box Office Mojo'
          });
        }
      });
      
      console.log(`Found ${movies.length} movies from Box Office Mojo`);
      return movies;
    } catch (error) {
      console.error('Error scraping Box Office Mojo:', error.message);
      return [];
    }
  }

  // Create fallback movies if scraping fails
  async getFallbackMovies() {
    console.log('Using fallback movie data...');
    return [
      {
        title: "Dune: Part Two",
        year: "2024",
        rating: "8.5",
        plot: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
        poster: "https://image.tmdb.org/t/p/w500/8gx8rV01i6nO4n6B4u4G7N0F3t7.jpg",
        source: "Fallback"
      },
      {
        title: "Oppenheimer",
        year: "2023",
        rating: "8.3",
        plot: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XVOykELK9UF3etzi.jpg",
        source: "Fallback"
      },
      {
        title: "Barbie",
        year: "2023",
        rating: "7.0",
        plot: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.",
        poster: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
        source: "Fallback"
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        year: "2023",
        rating: "8.6",
        plot: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
        poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        source: "Fallback"
      },
      {
        title: "The Batman",
        year: "2022",
        rating: "7.8",
        plot: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption.",
        poster: "https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
        source: "Fallback"
      }
    ];
  }

  // Scrape multiple sources and combine results
  async getNewReleases(genre = '') {
    try {
      console.log('Getting movie data from multiple sources...');
      
      // Try multiple sources in parallel
      const [imdbMovies, rtMovies, boxOfficeMovies] = await Promise.allSettled([
        this.scrapeIMDBNewReleases(),
        this.scrapeRottenTomatoesNewReleases(),
        this.scrapeBoxOfficeMojo()
      ]);
      
      // Combine results from all sources
      const allMovies = [];
      
      if (imdbMovies.status === 'fulfilled' && imdbMovies.value.length > 0) {
        allMovies.push(...imdbMovies.value);
      }
      if (rtMovies.status === 'fulfilled' && rtMovies.value.length > 0) {
        allMovies.push(...rtMovies.value);
      }
      if (boxOfficeMovies.status === 'fulfilled' && boxOfficeMovies.value.length > 0) {
        allMovies.push(...boxOfficeMovies.value);
      }
      
      // If no movies found from scraping, use fallback
      if (allMovies.length === 0) {
        console.log('No movies found from scraping, using fallback data');
        const fallbackMovies = await this.getFallbackMovies();
        allMovies.push(...fallbackMovies);
      }
      
      // Deduplicate movies
      const uniqueMovies = this.deduplicateMovies(allMovies);
      
      // Filter by genre if specified
      if (genre) {
        return this.filterByGenre(uniqueMovies, genre);
      }
      
      console.log(`Returning ${uniqueMovies.length} movies`);
      return uniqueMovies.slice(0, 5); // Return top 5
    } catch (error) {
      console.error('Error getting new releases:', error);
      // Return fallback data on error
      const fallbackMovies = await this.getFallbackMovies();
      return fallbackMovies.slice(0, 3);
    }
  }

  // Deduplicate movies based on title similarity
  deduplicateMovies(movies) {
    const unique = [];
    const seen = new Set();
    
    movies.forEach(movie => {
      const key = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(movie);
      }
    });
    
    return unique;
  }

  // Simple genre filtering based on keywords
  filterByGenre(movies, genre) {
    const genreKeywords = {
      'action': ['action', 'adventure', 'thriller', 'war'],
      'comedy': ['comedy', 'romance'],
      'drama': ['drama', 'romance'],
      'horror': ['horror', 'thriller'],
      'sci-fi': ['science fiction', 'sci-fi', 'fantasy'],
      'romance': ['romance', 'drama'],
      'thriller': ['thriller', 'mystery', 'crime']
    };
    
    const keywords = genreKeywords[genre.toLowerCase()] || [genre.toLowerCase()];
    
    return movies.filter(movie => {
      const text = `${movie.title} ${movie.plot}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    });
  }

  // Get trending movies from IMDB
  async getTrendingMovies() {
    try {
      console.log('Scraping trending movies from IMDB...');
      const response = await axios.get('https://www.imdb.com/chart/moviemeter/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const movies = [];
      
      $('.lister-list tr, .ipc-metadata-list-item').each((index, element) => {
        if (index >= 5) return false;
        
        const title = $(element).find('.titleColumn a, .ipc-title-link-wrapper h3 a').text().trim();
        const year = $(element).find('.titleColumn .secondaryInfo, .ipc-metadata-list-item__label').text().trim();
        const rating = $(element).find('.imdbRating strong, .ipc-rating-star').text().trim();
        
        if (title && title.length > 2) {
          movies.push({
            title,
            year: year.replace(/[()]/g, '').trim() || new Date().getFullYear().toString(),
            rating: rating.replace(/[^\d.]/g, '') || 'N/A',
            plot: 'Trending movie',
            poster: 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=Movie+Poster',
            source: 'IMDB Trending'
          });
        }
      });
      
      console.log(`Found ${movies.length} trending movies`);
      return movies;
    } catch (error) {
      console.error('Error scraping trending movies:', error.message);
      // Return fallback trending movies with posters
      return [
        {
          title: "Top Gun: Maverick",
          year: "2022",
          rating: "8.3",
          plot: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission that demands the ultimate sacrifice from those chosen to fly it.",
          poster: "https://image.tmdb.org/t/p/w500/62HCnUTziuWnlh2GcrV1XHyN61a.jpg",
          source: "Trending"
        },
        {
          title: "Avatar: The Way of Water",
          year: "2022",
          rating: "7.8",
          plot: "Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family, the trouble that follows them, the lengths they go to keep each other safe.",
          poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
          source: "Trending"
        },
        {
          title: "Black Panther: Wakanda Forever",
          year: "2022",
          rating: "6.7",
          plot: "The nation of Wakanda is pitted against intervening world powers as they mourn the loss of King T'Challa.",
          poster: "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
          source: "Trending"
        }
      ];
    }
  }
}

module.exports = MovieScraper;
