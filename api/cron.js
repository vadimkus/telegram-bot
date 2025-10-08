// api/cron.js - Vercel Cron Job for Daily Movie Updates
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const TMDBScraper = require('../lib/tmdb-scraper');

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Initialize TMDB scraper
const tmdbScraper = new TMDBScraper(TMDB_API_KEY);

// Fetch new movies/TV using the new TMDB scraper
async function fetchNewReleases(type = 'movie', genre = '') {
  try {
    if (type === 'series') {
      if (genre && genre !== '') {
        const result = await tmdbScraper.getTVSeriesByGenreName(genre);
        return result.series || result;
      } else {
        const result = await tmdbScraper.getPopularTVSeries();
        return result.series || result;
      }
    } else {
      if (genre && genre !== '') {
        const result = await tmdbScraper.getMoviesByGenreName(genre);
        return result.movies || result;
      } else {
        const result = await tmdbScraper.getPopularMovies();
        return result.movies || result;
      }
    }
  } catch (error) {
    console.error(`Error fetching ${type} releases for genre ${genre}:`, error);
    return [];
  }
}

// Send message to Telegram
async function sendTelegramMessage(chatId, message) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all users with their genre preferences
    const users = await prisma.user.findMany();
    
    // Send personalized updates to each user
    for (const user of users) {
      if (user.genre && user.contentType) {
        const releases = await fetchNewReleases(user.contentType, user.genre);
        
        if (releases.length > 0) {
          const contentTypeText = user.contentType === 'series' ? 'TV Series' : 'Movies';
          const genreName = user.genre.charAt(0).toUpperCase() + user.genre.slice(1);
          let message = `🎬 Daily ${genreName} ${contentTypeText} Updates:\n\n`;
          
          releases.slice(0, 5).forEach((item) => {
            const year = item.year || (item.release_date ? item.release_date.split('-')[0] : new Date().getFullYear().toString());
            const rating = item.rating || item.vote_average || 'N/A';
            const plot = item.plot || item.overview || 'No description available';
            
            message += `🎭 <b>${item.title}</b> (${year})\n`;
            message += `⭐ Rating: ${rating}/10\n`;
            message += `📝 ${plot.slice(0, 150)}...\n\n`;
          });
          
          await sendTelegramMessage(user.telegramId, message);
        }
      }
    }
    
    // Send general update to channel
    if (CHANNEL_ID) {
      const generalReleases = await fetchNewReleases('movie');
      let channelMessage = '🎬 Daily Movie Updates:\n\n';
      
      generalReleases.forEach((item) => {
        channelMessage += `🎭 <b>${item.title}</b> (${item.release_date})\n`;
        channelMessage += `⭐ Rating: ${item.vote_average}/10\n`;
        channelMessage += `📝 ${item.overview.slice(0, 150)}...\n\n`;
      });
      
      await sendTelegramMessage(CHANNEL_ID, channelMessage);
    }
    
    res.status(200).json({ success: true, message: 'Daily updates sent successfully' });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: 'Failed to send daily updates' });
  }
}

