// Ultra simple bot for testing
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('🎬 Bot is working! This is a test message.');
});

bot.on('message', (ctx) => {
  ctx.reply('✅ Bot received your message: ' + ctx.message.text);
});

// Export for Vercel
module.exports = (req, res) => {
  if (req.method === 'POST') {
    bot.handleUpdate(req.body, res);
  } else {
    res.status(200).send('OK');
  }
};
