# Telegram Bot with Telegraf

A simple Telegram bot built with [Telegraf](https://telegraf.js.org/) framework.

## Features

- 🤖 Basic command handling
- 👋 Welcome messages
- ℹ️ User information display
- 🔄 Message echoing
- 📝 Help system

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
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Bot

```bash
npm start
```

## Available Commands

- `/start` - Start the bot
- `/help` - Show help message
- `/hello` - Say hello
- `/info` - Get user information
- `/echo <text>` - Echo your message

## Development

### Scripts

- `npm start` - Start the bot
- `npm run dev` - Start with nodemon (if installed)

### Project Structure

```
telegram-bot/
├── index.js          # Main bot file
├── package.json     # Dependencies and scripts
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
