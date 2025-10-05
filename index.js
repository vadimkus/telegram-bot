const { Telegraf } = require('telegraf');
require('dotenv').config();

// Initialize bot with token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Start command
bot.start((ctx) => {
  ctx.reply('Hello! Welcome to the bot! 🤖\n\nUse /help to see available commands.');
});

// Help command
bot.help((ctx) => {
  const helpText = `
🤖 *Bot Commands:*

/start - Start the bot
/help - Show this help message
/hello - Say hello
/info - Get bot information
/echo <text> - Echo your message

*Features:*
• Simple command handling
• Message echoing
• User information display
  `;
  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Hello command
bot.command('hello', (ctx) => {
  ctx.reply(`Hello ${ctx.from.first_name}! 👋`);
});

// Info command
bot.command('info', (ctx) => {
  const userInfo = `
👤 *User Information:*
• Name: ${ctx.from.first_name} ${ctx.from.last_name || ''}
• Username: @${ctx.from.username || 'Not set'}
• ID: ${ctx.from.id}
• Language: ${ctx.from.language_code || 'Not set'}
  `;
  ctx.reply(userInfo, { parse_mode: 'Markdown' });
});

// Echo command
bot.command('echo', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (text) {
    ctx.reply(`Echo: ${text}`);
  } else {
    ctx.reply('Please provide text to echo. Usage: /echo <text>');
  }
});

// Handle any text message
bot.on('text', (ctx) => {
  ctx.reply(`You said: "${ctx.message.text}"`);
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Sorry, something went wrong! 😅');
});

// Start the bot
if (process.env.BOT_TOKEN) {
  bot.launch();
  console.log('🤖 Bot is running!');
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.error('❌ BOT_TOKEN not found in environment variables');
  console.log('Please create a .env file with your bot token');
}
