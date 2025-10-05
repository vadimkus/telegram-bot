// index.js - Daily Movie and TV Show Update Bot for Telegram
// Deploy on Vercel as serverless function with webhook
// Requires .env with BOT_TOKEN, TMDB_API_KEY, CHANNEL_ID (for posting), DATABASE_URL (Prisma)

require('dotenv').config();
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cron = require('node-cron');
const TMDBScraper = require('../lib/tmdb-scraper');

const bot = new Telegraf(process.env.BOT_TOKEN);
const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID; // e.g., '@your_channel'
const tmdbScraper = new TMDBScraper(TMDB_API_KEY);

// Available genres mapping
const GENRES = {
  'action': 28,
  'adventure': 12,
  'animation': 16,
  'comedy': 35,
  'crime': 80,
  'documentary': 99,
  'drama': 18,
  'family': 10751,
  'fantasy': 14,
  'history': 36,
  'horror': 27,
  'music': 10402,
  'mystery': 9648,
  'romance': 10749,
  'science fiction': 878,
  'thriller': 53,
  'war': 10752,
  'western': 37
};

// Command: /start - Welcome and content type selection
bot.start(async (ctx) => {
  const welcomeMessage = `🎬 Welcome to Daily Movie & TV Series Bot! 🎬

I'll send you daily recommendations for movies and TV shows based on your favorite genres!

What would you like to explore?`;

  // Create main menu with content type selection
  const mainKeyboard = {
    inline_keyboard: [
      [
        { text: '🎬 Movies', callback_data: 'content_movies' },
        { text: '📺 TV Series', callback_data: 'content_series' }
      ],
      [
        { text: '🔥 Trending Now', callback_data: 'trending_now' },
        { text: '📅 Today\'s Releases', callback_data: 'today_releases' }
      ],
      [
        { text: '❓ Help & Commands', callback_data: 'show_help' }
      ]
    ]
  };
  
  await ctx.reply(welcomeMessage, { reply_markup: mainKeyboard });
});

// Handle main menu callbacks
bot.action('content_movies', async (ctx) => {
  const message = `🎬 Choose your favorite movie genre:`;
  
  const genreKeyboard = {
    inline_keyboard: [
      [
        { text: '🎬 Action', callback_data: 'genre_action' },
        { text: '🚀 Adventure', callback_data: 'genre_adventure' },
        { text: '🎨 Animation', callback_data: 'genre_animation' }
      ],
      [
        { text: '😂 Comedy', callback_data: 'genre_comedy' },
        { text: '🔍 Crime', callback_data: 'genre_crime' },
        { text: '📚 Documentary', callback_data: 'genre_documentary' }
      ],
      [
        { text: '💔 Drama', callback_data: 'genre_drama' },
        { text: '👨‍👩‍👧‍👦 Family', callback_data: 'genre_family' },
        { text: '🧙‍♂️ Fantasy', callback_data: 'genre_fantasy' }
      ],
      [
        { text: '📖 History', callback_data: 'genre_history' },
        { text: '👻 Horror', callback_data: 'genre_horror' },
        { text: '🎵 Music', callback_data: 'genre_music' }
      ],
      [
        { text: '🔍 Mystery', callback_data: 'genre_mystery' },
        { text: '💕 Romance', callback_data: 'genre_romance' },
        { text: '🚀 Sci-Fi', callback_data: 'genre_sci-fi' }
      ],
      [
        { text: '🎭 Thriller', callback_data: 'genre_thriller' },
        { text: '⚔️ War', callback_data: 'genre_war' },
        { text: '🤠 Western', callback_data: 'genre_western' }
      ],
      [
        { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
      ]
    ]
  };
  
  await ctx.editMessageText(message, { reply_markup: genreKeyboard });
});

bot.action('content_series', async (ctx) => {
  const message = `📺 Choose your favorite TV series genre:`;
  
  const genreKeyboard = {
    inline_keyboard: [
      [
        { text: '🎬 Action', callback_data: 'series_genre_action' },
        { text: '🚀 Adventure', callback_data: 'series_genre_adventure' },
        { text: '🎨 Animation', callback_data: 'series_genre_animation' }
      ],
      [
        { text: '😂 Comedy', callback_data: 'series_genre_comedy' },
        { text: '🔍 Crime', callback_data: 'series_genre_crime' },
        { text: '📚 Documentary', callback_data: 'series_genre_documentary' }
      ],
      [
        { text: '💔 Drama', callback_data: 'series_genre_drama' },
        { text: '👨‍👩‍👧‍👦 Family', callback_data: 'series_genre_family' },
        { text: '🧙‍♂️ Fantasy', callback_data: 'series_genre_fantasy' }
      ],
      [
        { text: '📖 History', callback_data: 'series_genre_history' },
        { text: '👻 Horror', callback_data: 'series_genre_horror' },
        { text: '🎵 Music', callback_data: 'series_genre_music' }
      ],
      [
        { text: '🔍 Mystery', callback_data: 'series_genre_mystery' },
        { text: '💕 Romance', callback_data: 'series_genre_romance' },
        { text: '🚀 Sci-Fi', callback_data: 'series_genre_sci-fi' }
      ],
      [
        { text: '🎭 Thriller', callback_data: 'series_genre_thriller' },
        { text: '⚔️ War', callback_data: 'series_genre_war' },
        { text: '🤠 Western', callback_data: 'series_genre_western' }
      ],
      [
        { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }
      ]
    ]
  };
  
  await ctx.editMessageText(message, { reply_markup: genreKeyboard });
});

bot.action('trending_now', async (ctx) => {
  try {
    await ctx.answerCbQuery('Loading trending content...');
    
    const trendingMovies = await tmdbScraper.getTrendingMovies();
    
    if (trendingMovies.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t fetch trending movies right now. Please try again later.');
    }
    
    await ctx.reply(`🔥 Trending Movies Right Now`);
    
    // Send each trending movie with its poster
    for (let i = 0; i < trendingMovies.length; i++) {
      const movie = trendingMovies[i];
      const rating = movie.rating !== 'N/A' ? `⭐ ${movie.rating}` : '⭐ No rating yet';
      const movieMessage = `${i + 1}. **${movie.title}** (${movie.year})\n${rating}\n📝 ${movie.plot}`;
      
      // Create inline keyboard with video link if available
      const keyboard = [];
      if (movie.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: movie.videoUrl }]);
      }
      
      const replyOptions = {
        caption: movieMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
      };
      
      // Send movie with poster if available
      if (movie.poster && movie.poster !== '') {
        try {
          await ctx.replyWithPhoto(movie.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(movieMessage);
        }
      } else {
        await ctx.reply(movieMessage);
      }
    }
    
    await ctx.reply(`💡 Use /today for new releases or /subscribe <genre> for personalized updates!`);
    
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    ctx.reply('❌ Sorry, there was an error fetching trending movies. Please try again later.');
  }
});

bot.action('today_releases', async (ctx) => {
  try {
    await ctx.answerCbQuery('Loading today\'s releases...');
    
    // Get user's subscription if they have one
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (!user) {
      const setupMessage = `🎬 Welcome! First, let's set up your preferences.

Use /start to select your favorite genre, then come back here for personalized recommendations!

Or use /trending to see what's popular right now.`;
      return await ctx.reply(setupMessage);
    }
    
    let message = `🎬 Today's Movie Recommendations\n\n`;
    
    // Show personalized recommendations based on user's genre
    const releases = await fetchNewReleases('movie', user.genre);
    
    if (releases.length === 0) {
      message += `📅 No new ${user.genre} movies released today.\n\n`;
    } else {
      message += `🎭 Your Genre: ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)}\n\n`;
      
      // Send each movie with its poster
      for (let i = 0; i < releases.length; i++) {
        const item = releases[i];
        const rating = item.vote_average ? `⭐ ${item.vote_average}/10` : '⭐ No rating yet';
        const movieMessage = `${i + 1}. **${item.title}** (${item.release_date})\n${rating}\n📝 ${item.overview.slice(0, 120)}...`;
        
        // Create inline keyboard with video link if available
        const keyboard = [];
        if (item.videoUrl) {
          keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
        }
        
        const replyOptions = {
          caption: movieMessage,
          reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
        };
        
        // Send movie with poster if available
        if (item.poster_path && item.poster_path !== '') {
          try {
            await ctx.replyWithPhoto(item.poster_path, replyOptions);
          } catch (error) {
            // If image fails, send text only
            await ctx.reply(movieMessage);
          }
        } else {
          await ctx.reply(movieMessage);
        }
      }
    }
    
    // Show general releases as well
    const generalReleases = await fetchNewReleases('movie');
    
    if (generalReleases.length > 0) {
      await ctx.reply(`🌍 General Releases Today:`);
      
      // Send each general movie with its poster
      for (let i = 0; i < Math.min(3, generalReleases.length); i++) {
        const item = generalReleases[i];
        const rating = item.vote_average ? `⭐ ${item.vote_average}/10` : '⭐ No rating yet';
        const movieMessage = `${i + 1}. **${item.title}** (${item.release_date})\n${rating}\n📝 ${item.overview.slice(0, 100)}...`;
        
        // Create inline keyboard with video link if available
        const keyboard = [];
        if (item.videoUrl) {
          keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
        }
        
        const replyOptions = {
          caption: movieMessage,
          reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
        };
        
        // Send movie with poster if available
        if (item.poster_path && item.poster_path !== '') {
          try {
            await ctx.replyWithPhoto(item.poster_path, replyOptions);
          } catch (error) {
            // If image fails, send text only
            await ctx.reply(movieMessage);
          }
        } else {
          await ctx.reply(movieMessage);
        }
      }
    }
    
    await ctx.reply(`💡 Use /unsubscribe to change your genre preference!`);
    
  } catch (error) {
    console.error('Error fetching today\'s movies:', error);
    ctx.reply('❌ Sorry, there was an error fetching today\'s movies. Please try again later.');
  }
});

bot.action('show_help', async (ctx) => {
  const helpMessage = `📋 **Available Commands:**

**Main Commands:**
/start - Show main menu
/help - Show this help message
/status - Check your subscription

**Content Discovery:**
/today - Get today's movie recommendations
/trending - Show trending movies and series
/genres - List all available genres

**Subscription Management:**
/subscribe <genre> - Subscribe to daily updates
/unsubscribe - Stop receiving notifications

**💡 Tips:**
• Use /genres to see all available options
• You can subscribe to both movies and TV series
• Daily updates are sent at midnight
• Use /unsubscribe anytime to stop notifications

**Example:** /subscribe comedy`;
  
  await ctx.editMessageText(helpMessage, { 
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }]
      ]
    }
  });
});

bot.action('back_to_main', async (ctx) => {
  try {
    const welcomeMessage = `🎬 Welcome to Daily Movie & TV Series Bot! 🎬

I'll send you daily recommendations for movies and TV shows based on your favorite genres!

What would you like to explore?`;

    const mainKeyboard = {
      inline_keyboard: [
        [
          { text: '🎬 Movies', callback_data: 'content_movies' },
          { text: '📺 TV Series', callback_data: 'content_series' }
        ],
        [
          { text: '🔥 Trending Now', callback_data: 'trending_now' },
          { text: '📅 Today\'s Releases', callback_data: 'today_releases' }
        ],
        [
          { text: '❓ Help & Commands', callback_data: 'show_help' }
        ]
      ]
    };
    
    await ctx.editMessageText(welcomeMessage, { reply_markup: mainKeyboard });
  } catch (error) {
    // If edit fails, send a new message instead
    console.log('Edit failed, sending new message instead');
    const welcomeMessage = `🎬 Welcome to Daily Movie & TV Series Bot! 🎬

I'll send you daily recommendations for movies and TV shows based on your favorite genres!

What would you like to explore?`;

    const mainKeyboard = {
      inline_keyboard: [
        [
          { text: '🎬 Movies', callback_data: 'content_movies' },
          { text: '📺 TV Series', callback_data: 'content_series' }
        ],
        [
          { text: '🔥 Trending Now', callback_data: 'trending_now' },
          { text: '📅 Today\'s Releases', callback_data: 'today_releases' }
        ],
        [
          { text: '❓ Help & Commands', callback_data: 'show_help' }
        ]
      ]
    };
    
    await ctx.reply(welcomeMessage, { reply_markup: mainKeyboard });
  }
});

// Handle genre selection callback
bot.action(/^genre_(.+)$/, async (ctx) => {
  const genre = ctx.match[1];
  
  try {
    // Save user's genre preference
    await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: { 
        genre: genre,
        contentType: 'movie'
      },
      create: { 
        telegramId: ctx.from.id.toString(),
        genre: genre,
        contentType: 'movie'
      }
    });
    
    const genreName = genre.charAt(0).toUpperCase() + genre.slice(1);
    const successMessage = `✅ Perfect! You've selected **${genreName}** movies!

🎬 I'll send you daily ${genreName} movie recommendations at midnight.

📋 Available Commands:
/today - Get today's movie recommendations
/trending - Show trending movies right now
/status - Check your subscription
/unsubscribe - Stop notifications

You're all set! Use /today to get your first movie recommendations! 🍿`;

    await ctx.answerCbQuery(`Selected ${genreName} movies!`);
    await ctx.editMessageText(successMessage);
    
  } catch (error) {
    console.error('Error saving genre preference:', error);
    await ctx.answerCbQuery('❌ Sorry, there was an error saving your preference. Please try again.');
  }
});

// Handle TV series genre selection callback
bot.action(/^series_genre_(.+)$/, async (ctx) => {
  const genre = ctx.match[1];
  
  try {
    // Save user's TV series genre preference
    await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: { 
        genre: genre,
        contentType: 'series'
      },
      create: { 
        telegramId: ctx.from.id.toString(),
        genre: genre,
        contentType: 'series'
      }
    });

    const genreName = genre.charAt(0).toUpperCase() + genre.slice(1);
    const successMessage = `✅ Perfect! You're now subscribed to ${genreName} TV series updates!

**What you'll get:**
• Daily TV series recommendations in your favorite genre
• Trending series updates
• New releases and popular shows

**Available Commands:**
/today - Get today's series recommendations
/trending - Show trending series
/status - Check your subscription
/unsubscribe - Stop notifications

You're all set! Use /today to get your first series recommendations! 📺`;

    await ctx.answerCbQuery(`Selected ${genreName} TV series!`);
    await ctx.editMessageText(successMessage);
    
  } catch (error) {
    console.error('Error saving TV series genre preference:', error);
    await ctx.answerCbQuery('❌ Sorry, there was an error saving your preference. Please try again.');
  }
});


// Command: /help - Show all available commands
bot.command('help', (ctx) => {
  const helpMessage = `🤖 Daily Movie & TV Bot Commands:

/start - Welcome message and setup
/help - Show this help message
/today - Get today's movie recommendations
/trending - Show trending movies right now
/genres - List all available genres
/subscribe <genre> - Subscribe to daily updates for a genre
/unsubscribe - Stop receiving notifications
/status - Check your current subscription

💡 Tips:
• Use /genres to see all available options
• You can only subscribe to one genre at a time
• Daily updates are sent at midnight
• Use /unsubscribe anytime to stop notifications

Example: /subscribe comedy`;

  ctx.reply(helpMessage);
});

// Command: /genres - List available genres
bot.command('genres', (ctx) => {
  const genreList = Object.keys(GENRES).map(genre => 
    `• ${genre.charAt(0).toUpperCase() + genre.slice(1)}`
  ).join('\n');
  
  const message = `🎭 Available Genres:\n\n${genreList}\n\nUse /subscribe <genre> to get daily updates!`;
  ctx.reply(message);
});

// Command: /subscribe genre - Save user preference
bot.command('subscribe', async (ctx) => {
  const genre = ctx.message.text.split(' ')[1]?.toLowerCase();
  
  if (!genre) {
    return ctx.reply('❌ Please specify a genre!\n\nExample: /subscribe action\n\nUse /genres to see all available options.');
  }
  
  if (!GENRES[genre]) {
    return ctx.reply(`❌ Genre "${genre}" not found!\n\nUse /genres to see all available options.`);
  }
  
  try {
    await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: { genre },
      create: { telegramId: ctx.from.id.toString(), genre }
    });
    
    ctx.reply(`✅ Successfully subscribed to ${genre.charAt(0).toUpperCase() + genre.slice(1)} movies!\n\nYou'll receive daily updates at midnight. Use /status to check your subscription.`);
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Sorry, there was an error saving your preference. Please try again.');
  }
});

// Command: /unsubscribe - Remove user subscription
bot.command('unsubscribe', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (!user) {
      return ctx.reply('❌ You\'re not currently subscribed to any genre.');
    }
    
    await prisma.user.delete({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    // Show success message and return to main menu
    await ctx.reply(`✅ Successfully unsubscribed from ${user.genre} movie updates!`);
    
    // Return to main menu with genre selection
    const welcomeMessage = `🎬 Welcome to Movie Bot!\n\nI'll help you discover amazing movies and TV shows. Let's get started by selecting your favorite genre:`;
    
    const genreKeyboard = {
      inline_keyboard: [
        [
          { text: '🎬 Action', callback_data: 'genre_action' },
          { text: '🏃 Adventure', callback_data: 'genre_adventure' },
          { text: '🎭 Drama', callback_data: 'genre_drama' }
        ],
        [
          { text: '😂 Comedy', callback_data: 'genre_comedy' },
          { text: '🔍 Crime', callback_data: 'genre_crime' },
          { text: '👻 Horror', callback_data: 'genre_horror' }
        ],
        [
          { text: '💕 Romance', callback_data: 'genre_romance' },
          { text: '🚀 Sci-Fi', callback_data: 'genre_science fiction' },
          { text: '🎨 Animation', callback_data: 'genre_animation' }
        ],
        [
          { text: '👨‍👩‍👧‍👦 Family', callback_data: 'genre_family' },
          { text: '🎪 Fantasy', callback_data: 'genre_fantasy' },
          { text: '📚 Documentary', callback_data: 'genre_documentary' }
        ],
        [
          { text: '🎵 Music', callback_data: 'genre_music' },
          { text: '🔍 Mystery', callback_data: 'genre_mystery' },
          { text: '😰 Thriller', callback_data: 'genre_thriller' }
        ],
        [
          { text: '⚔️ War', callback_data: 'genre_war' },
          { text: '🤠 Western', callback_data: 'genre_western' }
        ]
      ]
    };
    
    await ctx.reply(welcomeMessage, { reply_markup: genreKeyboard });
    
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Sorry, there was an error. Please try again.');
  }
});

// Command: /status - Check current subscription
bot.command('status', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    if (!user) {
      return ctx.reply('❌ You\'re not currently subscribed to any genre.\n\nUse /subscribe <genre> to get daily movie updates!');
    }
    
    ctx.reply(`✅ You're subscribed to: ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)} movies\n\nYou'll receive daily updates at midnight. Use /unsubscribe to stop notifications.`);
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('❌ Sorry, there was an error checking your status. Please try again.');
  }
});

// Command: /today - Show today's movie recommendations
bot.command('today', async (ctx) => {
  try {
    // Get user's subscription if they have one
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() }
    });
    
    // If user hasn't selected a genre, guide them to do so
    if (!user) {
      const setupMessage = `🎬 Welcome to Daily Movie Bot!

It looks like you haven't selected your favorite movie genre yet. Let's set that up first!

Please use /start to select your preferred genre, or use /subscribe <genre> to subscribe directly.

Example: /subscribe action

This will help me send you personalized movie recommendations! 🍿`;
      
      return await ctx.reply(setupMessage);
    }
    
    let message = `🎬 Today's Movie Recommendations\n\n`;
    
    // Show personalized recommendations based on user's genre
    const releases = await fetchNewReleases('movie', user.genre);
    
    if (releases.length === 0) {
      message += `📅 No new ${user.genre} movies released today.\n\n`;
    } else {
      message += `🎭 Your Genre: ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)}\n\n`;
      
      // Send each movie with its poster
      for (let i = 0; i < releases.length; i++) {
        const item = releases[i];
        const rating = item.vote_average ? `⭐ ${item.vote_average}/10` : '⭐ No rating yet';
        const movieMessage = `${i + 1}. **${item.title}** (${item.release_date})\n${rating}\n📝 ${item.overview.slice(0, 120)}...`;
        
        // Create inline keyboard with video link if available
        const keyboard = [];
        if (item.videoUrl) {
          keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
        }
        
        const replyOptions = {
          caption: movieMessage,
          reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
        };
        
        // Send movie with poster if available
        if (item.poster_path && item.poster_path !== '') {
          try {
            await ctx.replyWithPhoto(item.poster_path, replyOptions);
          } catch (error) {
            // If image fails, send text only
            await ctx.reply(movieMessage);
          }
        } else {
          await ctx.reply(movieMessage);
        }
      }
    }
    
    // Show general releases as well
    const generalReleases = await fetchNewReleases('movie');
    
    if (generalReleases.length > 0) {
      await ctx.reply(`🌍 General Releases Today:`);
      
      // Send each general movie with its poster
      for (let i = 0; i < Math.min(3, generalReleases.length); i++) {
        const item = generalReleases[i];
        const rating = item.vote_average ? `⭐ ${item.vote_average}/10` : '⭐ No rating yet';
        const movieMessage = `${i + 1}. **${item.title}** (${item.release_date})\n${rating}\n📝 ${item.overview.slice(0, 100)}...`;
        
        // Create inline keyboard with video link if available
        const keyboard = [];
        if (item.videoUrl) {
          keyboard.push([{ text: '🎬 Watch Trailer', url: item.videoUrl }]);
        }
        
        const replyOptions = {
          caption: movieMessage,
          reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
        };
        
        // Send movie with poster if available
        if (item.poster_path && item.poster_path !== '') {
          try {
            await ctx.replyWithPhoto(item.poster_path, replyOptions);
          } catch (error) {
            // If image fails, send text only
            await ctx.reply(movieMessage);
          }
        } else {
          await ctx.reply(movieMessage);
        }
      }
    }
    
    await ctx.reply(`💡 Use /unsubscribe to change your genre preference!`);
    
  } catch (error) {
    console.error('Error fetching today\'s movies:', error);
    ctx.reply('❌ Sorry, there was an error fetching today\'s movies. Please try again later.');
  }
});

// Command: /trending - Show trending movies
bot.command('trending', async (ctx) => {
  try {
    const trendingMovies = await tmdbScraper.getTrendingMovies();
    
    if (trendingMovies.length === 0) {
      return ctx.reply('❌ Sorry, couldn\'t fetch trending movies right now. Please try again later.');
    }
    
    await ctx.reply(`🔥 Trending Movies Right Now`);
    
    // Send each trending movie with its poster
    for (let i = 0; i < trendingMovies.length; i++) {
      const movie = trendingMovies[i];
      const rating = movie.rating !== 'N/A' ? `⭐ ${movie.rating}` : '⭐ No rating yet';
      const movieMessage = `${i + 1}. **${movie.title}** (${movie.year})\n${rating}\n📝 ${movie.plot}`;
      
      // Create inline keyboard with video link if available
      const keyboard = [];
      if (movie.videoUrl) {
        keyboard.push([{ text: '🎬 Watch Trailer', url: movie.videoUrl }]);
      }
      
      const replyOptions = {
        caption: movieMessage,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
      };
      
      // Send movie with poster if available
      if (movie.poster && movie.poster !== '') {
        try {
          await ctx.replyWithPhoto(movie.poster, replyOptions);
        } catch (error) {
          // If image fails, send text only
          await ctx.reply(movieMessage);
        }
      } else {
        await ctx.reply(movieMessage);
      }
    }
    
    await ctx.reply(`💡 Use /today for new releases or /subscribe <genre> for personalized updates!`);
    
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    ctx.reply('❌ Sorry, there was an error fetching trending movies. Please try again later.');
  }
});

// Fetch new movies/TV series using TMDB API
async function fetchNewReleases(type = 'movie', genreName = '') {
  try {
    console.log(`Fetching ${genreName || 'general'} ${type} using TMDB API...`);
    
    let content = [];
    
    if (type === 'series') {
      if (genreName && genreName !== '') {
        // Get TV series by specific genre
        content = await tmdbScraper.getTVSeriesByGenreName(genreName);
      } else {
        // Get popular TV series for general recommendations
        content = await tmdbScraper.getPopularTVSeries();
      }
    } else {
      if (genreName && genreName !== '') {
        // Get movies by specific genre
        content = await tmdbScraper.getMoviesByGenreName(genreName);
      } else {
        // Get popular movies for general recommendations
        content = await tmdbScraper.getPopularMovies();
      }
      
      // If no movies found, try new releases
      if (content.length === 0) {
        content = await tmdbScraper.getNewReleases();
      }
    }
    
    // Format content to match expected structure
    return content.map(item => ({
      title: item.title,
      release_date: item.year || item.first_air_date,
      vote_average: item.rating === 'N/A' ? 0 : parseFloat(item.rating) || 0,
      overview: item.plot,
      poster_path: item.poster,
      source: item.source,
      videoUrl: item.videoUrl
    }));
  } catch (error) {
    console.error(`Error fetching ${type} from TMDB:`, error);
    return [];
  }
}

// Daily cron job to post to channel (runs at midnight)
cron.schedule('0 0 * * *', async () => {
  try {
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      const releases = await fetchNewReleases('movie', user.genre);
      
      if (releases.length === 0) {
        await bot.telegram.sendMessage(user.telegramId, 
          `🎬 Daily ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)} Movie Updates\n\nNo new releases today, but check back tomorrow! 🍿`);
        continue;
      }
      
      await bot.telegram.sendMessage(user.telegramId, `🎬 Daily ${user.genre.charAt(0).toUpperCase() + user.genre.slice(1)} Movie Updates`);
      
      // Send each movie with its poster
      for (let i = 0; i < releases.length; i++) {
        const item = releases[i];
        const rating = item.vote_average ? `⭐ ${item.vote_average}/10` : '⭐ No rating yet';
        const movieMessage = `${i + 1}. **${item.title}** (${item.release_date})\n${rating}\n📝 ${item.overview.slice(0, 120)}...`;
        
        // Send movie with poster if available
        if (item.poster_path && item.poster_path !== '') {
          try {
            await bot.telegram.sendPhoto(user.telegramId, item.poster_path, { caption: movieMessage });
          } catch (error) {
            // If image fails, send text only
            await bot.telegram.sendMessage(user.telegramId, movieMessage);
          }
        } else {
          await bot.telegram.sendMessage(user.telegramId, movieMessage);
        }
      }
      
      await bot.telegram.sendMessage(user.telegramId, `💡 Use /unsubscribe to stop these updates`);
    }
    
    // Post to channel (general, no genre) if CHANNEL_ID is set
    if (CHANNEL_ID) {
      const generalReleases = await fetchNewReleases('movie');
      
      if (generalReleases.length > 0) {
        await bot.telegram.sendMessage(CHANNEL_ID, `🎬 Daily Movie Updates`);
        
        // Send each movie with its poster
        for (let i = 0; i < generalReleases.length; i++) {
          const item = generalReleases[i];
          const rating = item.vote_average ? `⭐ ${item.vote_average}/10` : '⭐ No rating yet';
          const movieMessage = `${i + 1}. **${item.title}** (${item.release_date})\n${rating}\n📝 ${item.overview.slice(0, 120)}...`;
          
          // Send movie with poster if available
          if (item.poster_path && item.poster_path !== '') {
            try {
              await bot.telegram.sendPhoto(CHANNEL_ID, item.poster_path, { caption: movieMessage });
            } catch (error) {
              // If image fails, send text only
              await bot.telegram.sendMessage(CHANNEL_ID, movieMessage);
            }
          } else {
            await bot.telegram.sendMessage(CHANNEL_ID, movieMessage);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in daily cron job:', error);
  }
});

// Webhook setup for Vercel (export as handler)
module.exports = (req, res) => {
  if (req.method === 'POST') {
    bot.handleUpdate(req.body, res);
  } else {
    res.status(200).send('OK');
  }
};

// Local testing: 
if (process.env.NODE_ENV !== 'production') {
  bot.launch();
  console.log('Bot started in polling mode');
}