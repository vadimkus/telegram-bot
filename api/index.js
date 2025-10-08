require('dotenv').config();
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const tmdbScraper = require('../lib/tmdb-scraper');

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
        genre: 'action', // Default genre
        contentType: 'movie' // Default content type
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
          { text: '📅 Today\'s Releases', callback_data: 'today_releases' },
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
Use /start to select your favorite genre, then come back here for personalized recommendations!
Or use /trending to see what's popular right now.`;
      return await ctx.reply(setupMessage);
    }
    
    // Show trending content from TMDB
    let result;
    let trendingContent = [];
    let contentType = user.contentType || 'movie';
    
    if (contentType === 'series') {
      // Get trending TV series
      result = await tmdbScraper.getTrendingTVSeries();
      trendingContent = result.series || result;
    } else {
      // Get trending movies
      result = await tmdbScraper.getTrendingMovies();
      trendingContent = result.movies || result;
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
      const year = item.year || (item.release_date ? item.release_date.split('-')[0] : new Date().getFullYear().toString());
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const keyboard = [];
      if (item.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
      }
      
      const replyOptions = {
        caption: itemMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
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
    
    // Check if there are more pages available
    const hasMore = result.hasMore !== undefined ? result.hasMore : true;
    const currentPage = result.currentPage || 1;
    const totalPages = result.totalPages || 1;
    
    let buttonText = '📈 Load More Trending';
    let message = `💡 That's a lot of trending content!`;
    
    if (!hasMore) {
      buttonText = '🔚 No More Content';
      message = `🏁 **End of Recommendations**\n\nYou've reached the end of trending content! (Page ${currentPage} of ${totalPages})\n\n💡 Use /unsubscribe to change your genre preference!`;
    }
    
    // Add load more and back to main menu buttons
    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: buttonText, callback_data: hasMore ? 'load_more_trending' : 'no_more_content' },
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
    await ctx.answerCbQuery('📅 Loading today\'s releases...', { show_alert: false });
    await ctx.editMessageText(`📅 Fetching today's releases...`);
    
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (!user) {
      const setupMessage = `🎬 Welcome! First, let's set up your preferences.
Use /start to select your favorite genre, then come back here for personalized recommendations!
Or use /trending to see what's popular right now.`;
      return await ctx.reply(setupMessage);
    }
    
    const contentType = user.contentType || 'movie';
    const newReleases = await fetchNewReleases(contentType);
    
    if (newReleases.length === 0) {
      return ctx.reply(`❌ Sorry, couldn't find new ${contentType} releases right now. Please try again later.`);
    }
    
    const contentTypeText = contentType === 'series' ? 'TV Series' : 'Movies';
    await ctx.reply(`📅 New ${contentTypeText} Releases`);
    
    // Send each new release with its poster
    for (let i = 0; i < newReleases.length; i++) {
      const item = newReleases[i];
      const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : '⭐ No rating yet';
      const year = item.release_date ? item.release_date.split('-')[0] : new Date().getFullYear().toString();
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.overview.slice(0, 120)}...`;
      
      const replyOptions = {
        caption: itemMessage
      };
      
      // Send item with poster if available
      if (item.poster_path && item.poster_path !== '') {
        try {
          await ctx.replyWithPhoto(`https://image.tmdb.org/t/p/w500${item.poster_path}`, replyOptions);
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
    
    const result = await tmdbScraper.getTopRatedMovies();
    const movies = result.movies || result;
    
    if (movies.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find top rated movies right now. Please try again later.');
    }
    
    await ctx.reply('⭐ Top Rated Movies');
    
    // Send each movie with its poster
    for (let i = 0; i < movies.length; i++) {
      const item = movies[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || (item.release_date ? item.release_date.split('-')[0] : new Date().getFullYear().toString());
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const keyboard = [];
      if (item.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
      }
      
      const replyOptions = {
        caption: itemMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
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
    
    const result = await tmdbScraper.getNowPlayingMovies();
    const movies = result.movies || result;
    
    if (movies.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find now playing movies right now. Please try again later.');
    }
    
    await ctx.reply('🎬 Now Playing Movies');
    
    // Send each movie with its poster
    for (let i = 0; i < movies.length; i++) {
      const item = movies[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || (item.release_date ? item.release_date.split('-')[0] : new Date().getFullYear().toString());
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const keyboard = [];
      if (item.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
      }
      
      const replyOptions = {
        caption: itemMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
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
    
    const result = await tmdbScraper.getTopRatedTVSeries();
    const series = result.series || result;
    
    if (series.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find top rated series right now. Please try again later.');
    }
    
    await ctx.reply('⭐ Top Rated TV Series');
    
    // Send each series with its poster
    for (let i = 0; i < series.length; i++) {
      const item = series[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || (item.first_air_date ? item.first_air_date.split('-')[0] : new Date().getFullYear().toString());
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const keyboard = [];
      if (item.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
      }
      
      const replyOptions = {
        caption: itemMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
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
    
    const result = await tmdbScraper.getNowAiringTVSeries();
    const series = result.series || result;
    
    if (series.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t find now airing series right now. Please try again later.');
    }
    
    await ctx.reply('📺 Now Airing TV Series');
    
    // Send each series with its poster
    for (let i = 0; i < series.length; i++) {
      const item = series[i];
      const rating = item.rating !== 'N/A' ? `⭐ ${item.rating}` : '⭐ No rating yet';
      const year = item.year || (item.first_air_date ? item.first_air_date.split('-')[0] : new Date().getFullYear().toString());
      const itemMessage = `${i + 1}. **${item.title}** (${year})\n${rating}\n📝 ${item.plot.slice(0, 120)}...`;
      
      const keyboard = [];
      if (item.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
      }
      
      const replyOptions = {
        caption: itemMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
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
          { text: '📅 Today\'s Releases', callback_data: 'today_releases' },
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
4. Browse content with posters and trailers
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

// Helper function to fetch new releases
async function fetchNewReleases(type = 'movie') {
  try {
    console.log(`Fetching ${type} using TMDB API...`);
    
    let content = [];
    
    if (type === 'series') {
      // Get popular TV series
      const result = await tmdbScraper.getPopularTVSeries();
      content = result.series || result;
    } else {
      // Get popular movies
      const result = await tmdbScraper.getPopularMovies();
      content = result.movies || result;
      
      // If no movies found, try new releases
      if (content.length === 0) {
        const newReleases = await tmdbScraper.getNewReleases();
        content = newReleases;
      }
    }
    
    // Format content to match expected structure
    return content.map(item => ({
      title: item.title,
      release_date: item.year || item.first_air_date,
      vote_average: item.rating === 'N/A' ? 0 : parseFloat(item.rating) || 0,
      overview: item.plot,
      poster_path: item.poster,
      videoUrl: item.videoUrl
    }));
    
  } catch (error) {
    console.error(`Error fetching new ${type} releases:`, error);
    return [];
  }
}

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