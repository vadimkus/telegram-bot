require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Start command
bot.start((ctx) => {
  ctx.reply('🎬 Welcome to Daily Movie & TV Series Bot! 🎬\n\nThis is a test version to verify the bot is working.');
});

// Help command
bot.help((ctx) => {
  ctx.reply('❓ Help & Commands\n\n/start - Start the bot\n/help - Show this help\n\nThis is a test version.');
});

// Handle any message
bot.on('message', (ctx) => {
  ctx.reply('✅ Bot is working! This is a test message.');
});

// Webhook setup for Vercel
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).send('OK');
    }
  } catch (error) {
    console.error('Error in Vercel webhook handler:', error);
    res.status(500).send('Internal Server Error');
  }
};