// Basic Vercel function
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Bot is working!', 
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
