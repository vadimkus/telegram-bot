// Simple test bot without Prisma
require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Simple /start command
bot.start((ctx) => {
  ctx.reply('🎬 Welcome to Daily Movie & TV Series Bot! 🎬\n\nThis is a test version. The bot is working!');
});

// Simple /help command
bot.help((ctx) => {
  ctx.reply('This is a test bot. It\'s working correctly!');
});

// Handle any message
bot.on('message', (ctx) => {
  ctx.reply('Bot is responding! This is a test message.');
});

// Export for Vercel
module.exports = (req, res) => {
  if (req.method === 'POST') {
    bot.handleUpdate(req.body, res);
  } else {
    res.status(200).send('OK');
  }
};
