# 🚀 Vercel Deployment Guide

## **Prerequisites**

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code should be in a GitHub repository
3. **Environment Variables** - Set up the following in Vercel

## **Environment Variables**

Set these in your Vercel project settings:

```
BOT_TOKEN=your_telegram_bot_token
TMDB_API_KEY=your_tmdb_api_key
DATABASE_URL=your_postgresql_connection_string
CHANNEL_ID=@your_channel_username (optional)
WEBHOOK_URL=https://your-app.vercel.app/api/index
```

## **Deployment Steps**

### **1. Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Node.js project

### **2. Configure Environment Variables**
1. In your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add all the required environment variables listed above

### **3. Deploy**
1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Note your deployment URL (e.g., `https://your-app.vercel.app`)

### **4. Set Webhook URL**
After deployment, visit:
```
https://your-app.vercel.app/api/index?setWebhook=true
```

This will automatically set the webhook URL with Telegram.

### **5. Test the Bot**
1. Send `/start` to your bot
2. Test all functionality
3. Check Vercel function logs for any errors

## **File Structure for Vercel**

```
/
├── api/
│   ├── index.js          # Main bot handler (webhook endpoint)
│   └── cron.js           # Daily cron job
├── lib/
│   ├── tmdb-scraper.js   # TMDB API integration
│   └── error-handler.js  # Error handling utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies
```

## **Vercel Configuration**

The `vercel.json` file configures:
- **Function timeout**: 30 seconds
- **Cron job**: Runs daily at midnight UTC
- **Webhook endpoint**: `/api/index`

## **Monitoring**

### **Function Logs**
- Go to Vercel Dashboard → Functions
- Click on your function to see logs
- Monitor for errors and performance

### **Cron Job Monitoring**
- Check Vercel Dashboard → Cron Jobs
- Verify daily execution
- Monitor for failures

## **Troubleshooting**

### **Common Issues**

1. **Webhook not working**
   - Check if webhook URL is set correctly
   - Verify BOT_TOKEN is correct
   - Check function logs for errors

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check if database is accessible from Vercel
   - Run `npx prisma db push` if needed

3. **Cron job not running**
   - Check Vercel Cron Jobs section
   - Verify cron schedule in vercel.json
   - Check function logs for errors

4. **API rate limits**
   - TMDB API has rate limits
   - Check error logs for 429 errors
   - Consider implementing caching

### **Debug Commands**

```bash
# Check webhook status
curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo

# Test webhook endpoint
curl -X POST https://your-app.vercel.app/api/index \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"message_id": 1, "from": {"id": 123}, "chat": {"id": 123}, "text": "/start"}}'
```

## **Production Checklist**

- [ ] Environment variables set
- [ ] Database connected and migrated
- [ ] Webhook URL set with Telegram
- [ ] Bot responds to /start command
- [ ] All features working (trending, today, genres, etc.)
- [ ] Cron job scheduled and working
- [ ] Error handling working
- [ ] Monitoring set up

## **Performance Optimization**

1. **Database Connection Pooling**
   - Prisma handles this automatically
   - Monitor connection usage

2. **API Rate Limiting**
   - Implement caching for TMDB API calls
   - Use retry logic for failed requests

3. **Function Cold Starts**
   - Keep functions warm with health checks
   - Optimize bundle size

## **Security**

1. **Environment Variables**
   - Never commit .env files
   - Use Vercel's environment variable system

2. **API Keys**
   - Rotate keys regularly
   - Monitor usage and limits

3. **Database**
   - Use connection pooling
   - Monitor for unusual activity

## **Backup & Recovery**

1. **Database Backups**
   - Set up automated backups
   - Test recovery procedures

2. **Code Backups**
   - Use Git for version control
   - Tag releases for easy rollback

## **Scaling**

1. **User Growth**
   - Monitor database performance
   - Consider read replicas

2. **API Limits**
   - Implement caching
   - Consider multiple API keys

3. **Function Limits**
   - Monitor execution time
   - Optimize code for performance
