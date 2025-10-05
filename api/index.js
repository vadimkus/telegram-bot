// index.js - Daily Movie and TV Show Update Bot for Telegram
// Deploy on Vercel as serverless function with webhook
// Requires .env with BOT_TOKEN, TMDB_API_KEY, CHANNEL_ID (for posting), DATABASE_URL (Prisma)

require('dotenv').config();
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cron = require('node-cron');

const bot = new Telegraf(process.env.BOT_TOKEN);
const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID; // e.g., '@your_channel'

// Command: /start - Welcome and subscribe
bot.start((ctx) => {
  ctx.reply('Welcome to Daily Movie & TV Bot! Use /subscribe <genre> to get daily updates (e.g., /subscribe action). Genres: action, drama, comedy, etc.');
});

// Command: /subscribe genre - Save user preference
bot.command('subscribe', async (ctx) => {
  const genre = ctx.message.text.split(' ')[1].toLowerCase();
  if (!genre) return ctx.reply('Please specify a genre, e.g., /subscribe action');
  await prisma.user.upsert({
    where: { telegramId: ctx.from.id.toString() },
    update: { genre },
    create: { telegramId: ctx.from.id.toString(), genre }
  });
  ctx.reply(`Subscribed to ${genre}! You'll get daily updates.`);
});

// Fetch new movies/TV from TMDb API
async function fetchNewReleases(type = 'movie', genre = '') {
  const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=release_date.desc&release_date.gte=${new Date().toISOString().split('T')[0]}&with_genres=${genre}&page=1`;
  const response = await axios.get(url);
  return response.data.results.slice(0, 5); // Top 5 new releases
}

// Daily cron job to post to channel (runs at midnight)
cron.schedule('0 0 * * *', async () => {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const releases = await fetchNewReleases('movie', user.genre);
    let message = `Daily ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)} Movie Updates:\n`;
    releases.forEach((item) => {
      message += `${item.title} (${item.release_date}) - Rating: ${item.vote_average}\nOverview: ${item.overview.slice(0, 100)}...\n\n`;
    });
    await bot.telegram.sendMessage(user.telegramId, message);
  }
  // Post to channel (general, no genre)
  const generalReleases = await fetchNewReleases('movie');
  let channelMessage = 'Daily Movie Updates:\n';
  generalReleases.forEach((item) => {
    channelMessage += `${item.title} (${item.release_date}) - Rating: ${item.vote_average}\nOverview: ${item.overview.slice(0, 100)}...\n\n`;
  });
  await bot.telegram.sendMessage(CHANNEL_ID, channelMessage);
});

// Webhook setup for Vercel (export as handler)
module.exports = (req, res) => {
  if (req.method === 'POST') {
    bot.handleUpdate(req.body, res);
  } else {
    res.status(200).send('OK');
  }
};

// Local testing: bot.launch();