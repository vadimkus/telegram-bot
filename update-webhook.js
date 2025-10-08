const axios = require('axios');
require('dotenv').config();

async function updateWebhook() {
  const botToken = process.env.BOT_TOKEN;
  const webhookUrl = 'https://telegram-nz6ml1u86-vadimkus-projects.vercel.app/api';
  
  if (!botToken) {
    console.error('❌ BOT_TOKEN not found in environment variables');
    return;
  }
  
  try {
    console.log('🔗 Updating webhook URL:', webhookUrl);
    
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      url: webhookUrl
    });
    
    if (response.data.ok) {
      console.log('✅ Webhook updated successfully!');
      console.log('📱 Your bot is now live on Vercel!');
    } else {
      console.error('❌ Failed to update webhook:', response.data.description);
    }
  } catch (error) {
    console.error('❌ Error updating webhook:', error.message);
  }
}

updateWebhook();
