const axios = require('axios');
require('dotenv').config();

async function setWebhook() {
  const botToken = process.env.BOT_TOKEN;
  const webhookUrl = 'https://telegram-a7rsdrw97-vadimkus-projects.vercel.app/api';
  
  if (!botToken) {
    console.error('❌ BOT_TOKEN not found in environment variables');
    return;
  }
  
  try {
    console.log('🔗 Setting webhook URL:', webhookUrl);
    
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      url: webhookUrl
    });
    
    if (response.data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('📱 Your bot is now live on Vercel!');
    } else {
      console.error('❌ Failed to set webhook:', response.data.description);
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setWebhook();
