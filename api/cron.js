// api/cron.js - Vercel Cron Job for Daily Movie Updates
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Fetch new movies/TV from TMDb API
async function fetchNewReleases(type = 'movie', genre = '') {
  const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=release_date.desc&release_date.gte=${new Date().toISOString().split('T')[0]}&with_genres=${genre}&page=1`;
  const response = await axios.get(url);
  return response.data.results.slice(0, 5); // Top 5 new releases
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
      if (user.genre) {
        const releases = await fetchNewReleases('movie', user.genre);
        let message = `🎬 Daily ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)} Movie Updates:\n\n`;
        
        releases.forEach((item) => {
          message += `🎭 <b>${item.title}</b> (${item.release_date})\n`;
          message += `⭐ Rating: ${item.vote_average}/10\n`;
          message += `📝 ${item.overview.slice(0, 150)}...\n\n`;
        });
        
        await sendTelegramMessage(user.telegramId, message);
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
