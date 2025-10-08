// Simple working bot for Vercel
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');

const bot = new Telegraf(process.env.BOT_TOKEN);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Start command
bot.start(async (ctx) => {
  try {
    // Save user to database
    const user = await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: { 
        genre: 'action',
        contentType: 'movie'
      },
      create: { 
        telegramId: ctx.from.id.toString(),
        genre: 'action',
        contentType: 'movie'
      }
    });
    
    const welcomeMessage = `🎬 Welcome to Daily Movie & TV Series Bot! 🎬

You're user #${user.id} in our database!
Your genre: ${user.genre}
Content type: ${user.contentType}

What would you like to explore?`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🚀 START', callback_data: 'content_movies' },
          { text: '🎬 Movies', callback_data: 'content_movies' }
        ],
        [
          { text: '📺 TV Series', callback_data: 'content_series' },
          { text: '🔥 Trending Now', callback_data: 'trending_now' }
        ],
        [
          { text: '📅 Today\'s Releases', callback_data: 'today_releases' },
          { text: '❓ Help & Commands', callback_data: 'show_help' }
        ]
      ]
    };
    
    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Database error occurred');
  }
});

// Help command
bot.help(async (ctx) => {
  try {
    const userCount = await prisma.user.count();
    ctx.reply(`📊 Total users in database: ${userCount}\n\nThis bot is working with the database!`);
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Database error occurred');
  }
});

// Handle callback queries
bot.action('content_movies', async (ctx) => {
  await ctx.answerCbQuery('🎬 Movies selected!');
  ctx.reply('🎬 Great choice! You selected Movies.\n\nThis feature is coming soon!');
});

bot.action('content_series', async (ctx) => {
  await ctx.answerCbQuery('📺 TV Series selected!');
  ctx.reply('📺 Great choice! You selected TV Series.\n\nThis feature is coming soon!');
});

bot.action('trending_now', async (ctx) => {
  await ctx.answerCbQuery('🔥 Loading trending content...');
  ctx.reply('🔥 Trending content coming soon!\n\nThis feature is being developed.');
});

bot.action('today_releases', async (ctx) => {
  await ctx.answerCbQuery('📅 Loading today\'s releases...');
  ctx.reply('📅 Today\'s releases coming soon!\n\nThis feature is being developed.');
});

bot.action('show_help', async (ctx) => {
  await ctx.answerCbQuery('❓ Help information');
  ctx.reply('❓ **Help & Commands**\n\n/start - Start the bot\n/help - Show this help\n\nThis bot is working with the database!');
});

// Handle any message
bot.on('message', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (user) {
      ctx.reply(`✅ Found you in database!\nGenre: ${user.genre}\nContent: ${user.contentType}\n\nUse /start to see the main menu!`);
    } else {
      ctx.reply('❌ User not found in database. Use /start to register!');
    }
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Database error occurred');
  }
});

// Export for Vercel
module.exports = (req, res) => {
  if (req.method === 'POST') {
    bot.handleUpdate(req.body, res);
  } else {
    res.status(200).send('OK');
  }
};