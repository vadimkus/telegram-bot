require('dotenv').config();
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const tmdb = require('../lib/lightweight-tmdb');

const bot = new Telegraf(process.env.BOT_TOKEN);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Start command
bot.start(async (ctx) => {
  try {
    const user = await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: { firstName: ctx.from.first_name },
      create: { 
        telegramId: ctx.from.id.toString(),
        firstName: ctx.from.first_name,
        genre: 'action',
        contentType: 'movie'
      },
    });

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎬 Movies', callback_data: 'movies' },
          { text: '📺 TV Shows', callback_data: 'tv' }
        ],
        [
          { text: '🔥 Trending', callback_data: 'trending' },
          { text: '⭐ Popular', callback_data: 'popular' }
        ]
      ]
    };
    
    await ctx.reply(`🎬 Welcome to Movie Bot!\n\nYou're user #${user.id}`, { reply_markup: keyboard });
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('❌ Error occurred');
  }
});

// Handle any message
bot.on('message', async (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎬 Movies', callback_data: 'movies' },
        { text: '📺 TV Shows', callback_data: 'tv' }
      ],
      [
        { text: '🔥 Trending', callback_data: 'trending' },
        { text: '⭐ Popular', callback_data: 'popular' }
      ]
    ]
  };
  
  await ctx.reply('🎬 Choose what you want to explore:', { reply_markup: keyboard });
});

// Movies
bot.action('movies', async (ctx) => {
  try {
    await ctx.answerCbQuery('🎬 Loading movies...');
    await ctx.editMessageText('🎬 **Movies**\n\nChoose a category:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔥 Trending Movies', callback_data: 'trending_movies' },
            { text: '⭐ Popular Movies', callback_data: 'popular_movies' }
          ],
          [
            { text: '🔙 Back', callback_data: 'back' }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    ctx.reply('❌ Error occurred');
  }
});

// TV Shows
bot.action('tv', async (ctx) => {
  try {
    await ctx.answerCbQuery('📺 Loading TV shows...');
    await ctx.editMessageText('📺 **TV Shows**\n\nChoose a category:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔥 Trending TV', callback_data: 'trending_tv' },
            { text: '⭐ Popular TV', callback_data: 'popular_tv' }
          ],
          [
            { text: '🔙 Back', callback_data: 'back' }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    ctx.reply('❌ Error occurred');
  }
});

// Trending
bot.action('trending', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔥 Loading trending...');
    await ctx.editMessageText('🔥 **Trending**\n\nChoose content type:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎬 Trending Movies', callback_data: 'trending_movies' },
            { text: '📺 Trending TV', callback_data: 'trending_tv' }
          ],
          [
            { text: '🔙 Back', callback_data: 'back' }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    ctx.reply('❌ Error occurred');
  }
});

// Popular
bot.action('popular', async (ctx) => {
  try {
    await ctx.answerCbQuery('⭐ Loading popular...');
    await ctx.editMessageText('⭐ **Popular**\n\nChoose content type:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎬 Popular Movies', callback_data: 'popular_movies' },
            { text: '📺 Popular TV', callback_data: 'popular_tv' }
          ],
          [
            { text: '🔙 Back', callback_data: 'back' }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    ctx.reply('❌ Error occurred');
  }
});

// Trending Movies
bot.action('trending_movies', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔥 Loading trending movies...');
    await ctx.editMessageText('🔥 Loading trending movies...');
    
    const movies = await tmdb.getTrendingMovies();
    
    if (movies.length === 0) {
      return ctx.reply('❌ No trending movies found');
    }
    
    await ctx.reply('🔥 **Trending Movies**');
    
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      const message = `${i + 1}. **${movie.title}** (${movie.year})\n⭐ ${movie.rating}\n📝 ${movie.plot}`;
      
      if (movie.poster) {
        try {
          await ctx.replyWithPhoto(movie.poster, { caption: message });
        } catch (error) {
          await ctx.reply(message);
        }
      } else {
        await ctx.reply(message);
      }
    }
    
    await ctx.reply('💡 That\'s all the trending movies!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main', callback_data: 'back' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('❌ Error fetching trending movies');
  }
});

// Popular Movies
bot.action('popular_movies', async (ctx) => {
  try {
    await ctx.answerCbQuery('⭐ Loading popular movies...');
    await ctx.editMessageText('⭐ Loading popular movies...');
    
    const movies = await tmdb.getPopularMovies();
    
    if (movies.length === 0) {
      return ctx.reply('❌ No popular movies found');
    }
    
    await ctx.reply('⭐ **Popular Movies**');
    
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      const message = `${i + 1}. **${movie.title}** (${movie.year})\n⭐ ${movie.rating}\n📝 ${movie.plot}`;
      
      if (movie.poster) {
        try {
          await ctx.replyWithPhoto(movie.poster, { caption: message });
        } catch (error) {
          await ctx.reply(message);
        }
      } else {
        await ctx.reply(message);
      }
    }
    
    await ctx.reply('💡 That\'s all the popular movies!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main', callback_data: 'back' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('❌ Error fetching popular movies');
  }
});

// Trending TV
bot.action('trending_tv', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔥 Loading trending TV...');
    await ctx.editMessageText('🔥 Loading trending TV...');
    
    const shows = await tmdb.getTrendingTV();
    
    if (shows.length === 0) {
      return ctx.reply('❌ No trending TV shows found');
    }
    
    await ctx.reply('🔥 **Trending TV Shows**');
    
    for (let i = 0; i < shows.length; i++) {
      const show = shows[i];
      const message = `${i + 1}. **${show.title}** (${show.year})\n⭐ ${show.rating}\n📝 ${show.plot}`;
      
      if (show.poster) {
        try {
          await ctx.replyWithPhoto(show.poster, { caption: message });
        } catch (error) {
          await ctx.reply(message);
        }
      } else {
        await ctx.reply(message);
      }
    }
    
    await ctx.reply('💡 That\'s all the trending TV shows!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main', callback_data: 'back' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('❌ Error fetching trending TV shows');
  }
});

// Popular TV
bot.action('popular_tv', async (ctx) => {
  try {
    await ctx.answerCbQuery('⭐ Loading popular TV...');
    await ctx.editMessageText('⭐ Loading popular TV...');
    
    const shows = await tmdb.getPopularTV();
    
    if (shows.length === 0) {
      return ctx.reply('❌ No popular TV shows found');
    }
    
    await ctx.reply('⭐ **Popular TV Shows**');
    
    for (let i = 0; i < shows.length; i++) {
      const show = shows[i];
      const message = `${i + 1}. **${show.title}** (${show.year})\n⭐ ${show.rating}\n📝 ${show.plot}`;
      
      if (show.poster) {
        try {
          await ctx.replyWithPhoto(show.poster, { caption: message });
        } catch (error) {
          await ctx.reply(message);
        }
      } else {
        await ctx.reply(message);
      }
    }
    
    await ctx.reply('💡 That\'s all the popular TV shows!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main', callback_data: 'back' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('❌ Error fetching popular TV shows');
  }
});

// Back to main
bot.action('back', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔙 Back to main menu');
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎬 Movies', callback_data: 'movies' },
          { text: '📺 TV Shows', callback_data: 'tv' }
        ],
        [
          { text: '🔥 Trending', callback_data: 'trending' },
          { text: '⭐ Popular', callback_data: 'popular' }
        ]
      ]
    };
    
    await ctx.editMessageText('🎬 **Main Menu**\n\nChoose what you want to explore:', { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    ctx.reply('❌ Error occurred');
  }
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
    console.error('Error in webhook handler:', error);
    res.status(500).send('Internal Server Error');
  }
};
