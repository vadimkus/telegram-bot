# Daily Movie & TV Show Update Bot

A Telegram bot that sends daily movie and TV show updates based on user genre preferences. Built with [Telegraf](https://telegraf.js.org/) and deployed on Vercel.

## Features

- 🎬 **Daily Movie Updates** - Personalized movie recommendations
- 🎭 **Genre-based Subscriptions** - Users can subscribe to specific genres
- 📺 **TMDB Integration** - Real-time movie data from The Movie Database
- 📱 **Telegram Channel Support** - Post updates to channels
- ⏰ **Automated Scheduling** - Daily updates via Vercel Cron Jobs
- 🗄️ **Database Integration** - User preferences stored in PostgreSQL
- 🚀 **Serverless Deployment** - Runs on Vercel with webhook support

## Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Follow the instructions to get your bot token

### 2. Configure Environment

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your bot token:
   ```
   BOT_TOKEN=your_actual_bot_token_here
   DATABASE_URL=your_postgresql_connection_string
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

1. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

2. Push database schema:
   ```bash
   npm run db:push
   ```

### 5. Run the Bot

```bash
npm start
```

## Available Commands

- `/start` - Welcome message and instructions
- `/subscribe <genre>` - Subscribe to daily updates for a specific genre
  - Example: `/subscribe action` or `/subscribe comedy`

## Supported Genres

- action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, horror, mystery, romance, science fiction, thriller, war, western

## Database Schema

The bot uses PostgreSQL with a simple User model:

- **User** - Stores user Telegram ID and preferred genre
  - `id` - Auto-incrementing primary key
  - `telegramId` - Unique Telegram user ID
  - `genre` - User's preferred movie genre (optional)

## Development

### Scripts

- `npm start` - Start the bot
- `npm run dev` - Start with nodemon (if installed)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
telegram-bot/
├── index.js          # Main bot file
├── lib/
│   └── database.js   # Database service
├── prisma/
│   └── schema.prisma # Database schema
├── package.json      # Dependencies and scripts
├── env.example       # Environment template
└── README.md         # This file
```

## Deployment

For production deployment, consider:

1. Using webhooks instead of polling
2. Adding database integration
3. Implementing proper error handling
4. Adding logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
