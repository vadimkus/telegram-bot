// Simple working bot with database
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
    
    ctx.reply(`🎬 Welcome! You're user #${user.id} in our database!\n\nYour genre: ${user.genre}\nContent type: ${user.contentType}`);
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

// Handle any message
bot.on('message', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (user) {
      ctx.reply(`✅ Found you in database!\nGenre: ${user.genre}\nContent: ${user.contentType}`);
    } else {
      ctx.reply('❌ User not found in database');
    }
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Database error occurred');
  }
});

// Start bot
bot.launch();
console.log('Bot started in polling mode');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
