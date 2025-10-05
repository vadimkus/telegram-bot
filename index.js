const { Telegraf } = require('telegraf');
require('dotenv').config();
const db = require('./lib/database');

// Initialize bot with token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Start command
bot.start(async (ctx) => {
  try {
    // Create or update user in database
    const user = await db.createOrUpdateUser(ctx.from);
    
    // Track analytics
    await db.trackEvent('user_started', { command: '/start' }, user.id);
    
    // Create new session
    const session = await db.createSession(user.id);
    
    ctx.reply(`Hello ${ctx.from.first_name}! Welcome to the bot! 🤖\n\nUse /help to see available commands.`);
  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('Hello! Welcome to the bot! 🤖\n\nUse /help to see available commands.');
  }
});

// Help command
bot.help(async (ctx) => {
  try {
    // Track analytics
    await db.trackEvent('command_used', { command: '/help' });
    
    const helpText = `
🤖 *Bot Commands:*

/start - Start the bot
/help - Show this help message
/hello - Say hello
/info - Get bot information
/stats - Get bot statistics (admin)
/echo <text> - Echo your message

*Features:*
• Simple command handling
• Message echoing
• User information display
• Database integration
• Analytics tracking
  `;
    ctx.reply(helpText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in help command:', error);
    ctx.reply('Help command is temporarily unavailable.');
  }
});

// Hello command
bot.command('hello', async (ctx) => {
  try {
    await db.trackEvent('command_used', { command: '/hello' });
    ctx.reply(`Hello ${ctx.from.first_name}! 👋`);
  } catch (error) {
    console.error('Error in hello command:', error);
    ctx.reply(`Hello ${ctx.from.first_name}! 👋`);
  }
});

// Info command
bot.command('info', async (ctx) => {
  try {
    await db.trackEvent('command_used', { command: '/info' });
    
    const userInfo = `
👤 *User Information:*
• Name: ${ctx.from.first_name} ${ctx.from.last_name || ''}
• Username: @${ctx.from.username || 'Not set'}
• ID: ${ctx.from.id}
• Language: ${ctx.from.language_code || 'Not set'}
• Premium: ${ctx.from.is_premium ? 'Yes' : 'No'}
  `;
    ctx.reply(userInfo, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in info command:', error);
    ctx.reply('Info command is temporarily unavailable.');
  }
});

// Stats command (admin)
bot.command('stats', async (ctx) => {
  try {
    await db.trackEvent('command_used', { command: '/stats' });
    
    const stats = await db.getStats();
    const statsText = `
📊 *Bot Statistics:*
• Total Users: ${stats.totalUsers}
• Active Users: ${stats.activeUsers}
• Total Messages: ${stats.totalMessages}
• Total Sessions: ${stats.totalSessions}
• New Users (24h): ${stats.recentUsers}
  `;
    ctx.reply(statsText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in stats command:', error);
    ctx.reply('Stats command is temporarily unavailable.');
  }
});

// Echo command
bot.command('echo', async (ctx) => {
  try {
    await db.trackEvent('command_used', { command: '/echo' });
    
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (text) {
      ctx.reply(`Echo: ${text}`);
    } else {
      ctx.reply('Please provide text to echo. Usage: /echo <text>');
    }
  } catch (error) {
    console.error('Error in echo command:', error);
    ctx.reply('Echo command is temporarily unavailable.');
  }
});

// Handle any text message
bot.on('text', async (ctx) => {
  try {
    // Get or create user
    const user = await db.createOrUpdateUser(ctx.from);
    
    // Get active session
    let session = await db.getActiveSession(user.id);
    if (!session) {
      session = await db.createSession(user.id);
    }
    
    // Save message to database
    await db.createMessage({
      messageId: ctx.message.message_id,
      text: ctx.message.text,
      messageType: 'text',
      userId: user.id,
      sessionId: session.id,
    });
    
    // Track analytics
    await db.trackEvent('message_sent', { 
      messageType: 'text',
      textLength: ctx.message.text.length 
    }, user.id);
    
    ctx.reply(`You said: "${ctx.message.text}"`);
  } catch (error) {
    console.error('Error handling text message:', error);
    ctx.reply(`You said: "${ctx.message.text}"`);
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Sorry, something went wrong! 😅');
});

// Start the bot
if (process.env.BOT_TOKEN) {
  bot.launch();
  console.log('🤖 Bot is running with database integration!');
  
  // Enable graceful stop
  process.once('SIGINT', async () => {
    console.log('🛑 Shutting down bot...');
    await db.cleanup();
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', async () => {
    console.log('🛑 Shutting down bot...');
    await db.cleanup();
    bot.stop('SIGTERM');
  });
} else {
  console.error('❌ BOT_TOKEN not found in environment variables');
  console.log('Please create a .env file with your bot token');
}
