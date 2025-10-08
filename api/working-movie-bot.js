require('dotenv').config();
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const tmdb = require('../lib/vercel-tmdb');

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
    // Save user to database
    const user = await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: {
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
        languageCode: ctx.from.language_code,
        isBot: ctx.from.is_bot,
        genre: 'action',
        contentType: 'movie'
      },
      create: {
        telegramId: ctx.from.id.toString(),
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
        languageCode: ctx.from.language_code,
        isBot: ctx.from.is_bot,
        genre: 'action',
        contentType: 'movie'
      },
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
          { text: '📅 New Releases', callback_data: 'today_releases' },
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

// Handle any message with START button
bot.on('message', async (ctx) => {
  try {
    const welcomeMessage = `🎬 Welcome to Daily Movie & TV Series Bot! 🎬

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
          { text: '📅 New Releases', callback_data: 'today_releases' },
          { text: '❓ Help & Commands', callback_data: 'show_help' }
        ]
      ]
    };
    
    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
  } catch (error) {
    console.error('Error in message handler:', error);
    ctx.reply('❌ Sorry, there was an error processing your message.');
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

// Content type selection
bot.action('content_movies', async (ctx) => {
  try {
    await ctx.answerCbQuery('🎬 Movies selected!');
    
    // Update user preference
    await prisma.user.update({
      where: { telegramId: ctx.from.id.toString() },
      data: { contentType: 'movie' }
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔥 Trending Movies', callback_data: 'trending_now' },
          { text: '📅 New Releases', callback_data: 'today_releases' }
        ],
        [
          { text: '⭐ Top Rated Movies', callback_data: 'top_rated_movies' },
          { text: '🎬 Now Playing', callback_data: 'now_playing_movies' }
        ],
        [
          { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
        ]
      ]
    };
    
    await ctx.editMessageText('🎬 **Movies Selected!**\n\nChoose what you want to explore:', { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in content_movies:', error);
    ctx.reply('❌ Sorry, there was an error processing your request.');
  }
});

bot.action('content_series', async (ctx) => {
  try {
    await ctx.answerCbQuery('📺 TV Series selected!');
    
    // Update user preference
    await prisma.user.update({
      where: { telegramId: ctx.from.id.toString() },
      data: { contentType: 'series' }
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔥 Trending Series', callback_data: 'trending_now' },
          { text: '📅 New Releases', callback_data: 'today_releases' }
        ],
        [
          { text: '⭐ Top Rated Series', callback_data: 'top_rated_series' },
          { text: '📺 Now Airing', callback_data: 'now_airing_series' }
        ],
        [
          { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
        ]
      ]
    };
    
    await ctx.editMessageText('📺 **TV Series Selected!**\n\nChoose what you want to explore:', { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in content_series:', error);
    ctx.reply('❌ Sorry, there was an error processing your request.');
  }
});

// Trending content
bot.action('trending_now', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔥 Loading trending content...', { show_alert: false });
    await ctx.editMessageText(`🔥 Fetching trending content...`);
    
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (!user) {
      const setupMessage = `🎬 Welcome! First, let's set up your preferences.
Use /start to select your favorite genre, then come back here for personalized recommendations!`;
      return await ctx.reply(setupMessage);
    }
    
    // Show trending content from TMDB
    let trendingContent = [];
    let contentType = user.contentType || 'movie';
    
    if (contentType === 'series') {
      trendingContent = await tmdb.getTrendingTVSeries();
    } else {
      trendingContent = await tmdb.getTrendingMovies();
    }
    
    if (trendingContent.length === 0) {
      return ctx.reply(`❌ Sorry, couldn't find trending ${contentType} right now. Please try again later.`);
    }
    
    const contentTypeText = contentType === 'series' ? 'TV Series' : 'Movies';
    await ctx.reply(`🔥 Trending ${contentTypeText} Right Now`);
    
    // Send each trending item with its poster
    for (let i = 0; i < trendingContent.length; i++) {
      const item = trendingContent[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || 'N/A';
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster && item.poster !== '') {
        try {
          await ctx.replyWithPhoto(item.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(itemMessage);
        }
      } else {
        await ctx.reply(itemMessage);
      }
    }
    
    // Add back to main menu button
    await ctx.reply('💡 That\'s all the trending content!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching trending content:', error);
    ctx.reply('❌ Sorry, there was an error fetching trending content. Please try again later.');
  }
});

// Today's releases
bot.action('today_releases', async (ctx) => {
  try {
    await ctx.answerCbQuery('📅 Loading new releases...', { show_alert: false });
    await ctx.editMessageText(`📅 Fetching new releases...`);
    
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (!user) {
      const setupMessage = `🎬 Welcome! First, let's set up your preferences.
Use /start to select your favorite genre, then come back here for personalized recommendations!`;
      return await ctx.reply(setupMessage);
    }
    
    const contentType = user.contentType || 'movie';
    let newReleases = [];
    
    if (contentType === 'series') {
      newReleases = await tmdb.getPopularTVSeries();
    } else {
      newReleases = await tmdb.getNewReleases();
    }
    
    if (newReleases.length === 0) {
      return ctx.reply(`❌ Sorry, couldn't find new ${contentType} releases right now. Please try again later.`);
    }
    
    const contentTypeText = contentType === 'series' ? 'TV Series' : 'Movies';
    await ctx.reply(`📅 New ${contentTypeText} Releases`);
    
    // Send each new release with its poster
    for (let i = 0; i < newReleases.length; i++) {
      const item = newReleases[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || 'N/A';
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster && item.poster !== '') {
        try {
          await ctx.replyWithPhoto(item.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(itemMessage);
        }
      } else {
        await ctx.reply(itemMessage);
      }
    }
    
    // Add back to main menu button
    await ctx.reply('💡 That\'s all the new releases!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching new releases:', error);
    ctx.reply('❌ Sorry, there was an error fetching new releases. Please try again later.');
  }
});

// Top rated movies
bot.action('top_rated_movies', async (ctx) => {
  try {
    await ctx.answerCbQuery('⭐ Loading top rated movies...', { show_alert: false });
    await ctx.editMessageText(`⭐ Fetching top rated movies...`);
    
    const movies = await tmdb.getTopRatedMovies();
    
    if (movies.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find top rated movies right now. Please try again later.');
    }
    
    await ctx.reply('⭐ Top Rated Movies');
    
    // Send each movie with its poster
    for (let i = 0; i < movies.length; i++) {
      const item = movies[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || 'N/A';
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster && item.poster !== '') {
        try {
          await ctx.replyWithPhoto(item.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(itemMessage);
        }
      } else {
        await ctx.reply(itemMessage);
      }
    }
    
    // Add back to main menu button
    await ctx.reply('💡 That\'s all the top rated movies!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    ctx.reply('❌ Sorry, there was an error fetching top rated movies. Please try again later.');
  }
});

// Now playing movies
bot.action('now_playing_movies', async (ctx) => {
  try {
    await ctx.answerCbQuery('🎬 Loading now playing movies...', { show_alert: false });
    await ctx.editMessageText(`🎬 Fetching now playing movies...`);
    
    const movies = await tmdb.getNowPlayingMovies();
    
    if (movies.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find now playing movies right now. Please try again later.');
    }
    
    await ctx.reply('🎬 Now Playing Movies');
    
    // Send each movie with its poster
    for (let i = 0; i < movies.length; i++) {
      const item = movies[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || 'N/A';
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster && item.poster !== '') {
        try {
          await ctx.replyWithPhoto(item.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(itemMessage);
        }
      } else {
        await ctx.reply(itemMessage);
      }
    }
    
    // Add back to main menu button
    await ctx.reply('💡 That\'s all the now playing movies!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    ctx.reply('❌ Sorry, there was an error fetching now playing movies. Please try again later.');
  }
});

// Top rated series
bot.action('top_rated_series', async (ctx) => {
  try {
    await ctx.answerCbQuery('⭐ Loading top rated series...', { show_alert: false });
    await ctx.editMessageText(`⭐ Fetching top rated series...`);
    
    const series = await tmdb.getTopRatedTVSeries();
    
    if (series.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find top rated series right now. Please try again later.');
    }
    
    await ctx.reply('⭐ Top Rated TV Series');
    
    // Send each series with its poster
    for (let i = 0; i < series.length; i++) {
      const item = series[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || 'N/A';
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster && item.poster !== '') {
        try {
          await ctx.replyWithPhoto(item.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(itemMessage);
        }
      } else {
        await ctx.reply(itemMessage);
      }
    }
    
    // Add back to main menu button
    await ctx.reply('💡 That\'s all the top rated series!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching top rated series:', error);
    ctx.reply('❌ Sorry, there was an error fetching top rated series. Please try again later.');
  }
});

// Now airing series
bot.action('now_airing_series', async (ctx) => {
  try {
    await ctx.answerCbQuery('📺 Loading now airing series...', { show_alert: false });
    await ctx.editMessageText(`📺 Fetching now airing series...`);
    
    const series = await tmdb.getNowAiringTVSeries();
    
    if (series.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find now airing series right now. Please try again later.');
    }
    
    await ctx.reply('📺 Now Airing TV Series');
    
    // Send each series with its poster
    for (let i = 0; i < series.length; i++) {
      const item = series[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || 'N/A';
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster && item.poster !== '') {
        try {
          await ctx.replyWithPhoto(item.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(itemMessage);
        }
      } else {
        await ctx.reply(itemMessage);
      }
    }
    
    // Add back to main menu button
    await ctx.reply('💡 That\'s all the now airing series!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching now airing series:', error);
    ctx.reply('❌ Sorry, there was an error fetching now airing series. Please try again later.');
  }
});

// Back to main menu
bot.action('back_to_main', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔙 Back to main menu');
    
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
          { text: '📅 New Releases', callback_data: 'today_releases' },
          { text: '❓ Help & Commands', callback_data: 'show_help' }
        ]
      ]
    };
    
    await ctx.editMessageText('🎬 **Main Menu**\n\nWhat would you like to explore?', { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in back_to_main:', error);
    ctx.reply('❌ Sorry, there was an error processing your request.');
  }
});

// Help action
bot.action('show_help', async (ctx) => {
  try {
    await ctx.answerCbQuery('❓ Help information');
    
    const helpMessage = `❓ **Help & Commands**

**Main Commands:**
/start - Start the bot and show main menu
/help - Show this help information

**Bot Features:**
🎬 **Movies** - Browse trending, new releases, top rated, and now playing movies
📺 **TV Series** - Browse trending, new releases, top rated, and now airing series
🔥 **Trending** - See what's popular right now
📅 **New Releases** - Discover the latest content

**How to Use:**
1. Use /start to begin
2. Choose Movies or TV Series
3. Select from trending, new releases, top rated, or now playing/airing
4. Browse content with posters and ratings
5. Use the back button to navigate

**Database Status:** ✅ Connected and working!`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
        ]
      ]
    };
    
    await ctx.editMessageText(helpMessage, { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in show_help:', error);
    ctx.reply('❌ Sorry, there was an error processing your request.');
  }
});

// Webhook setup for Vercel (export as handler)
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
