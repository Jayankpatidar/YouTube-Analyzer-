// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', apiRoutes);

// New route to handle username and redirect to channel endpoints
app.get('/api/channels/username/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // First get the channel ID from username
    const channelResponse = await fetch(`${req.protocol}://${req.get('host')}/api/channels/username/${username}`);
    const channelData = await channelResponse.json();
    
    if (!channelData.channelId) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Now redirect to the channel endpoint with the ID
    res.redirect(`/api/channels/${channelData.channelId}`);
    
  } catch (error) {
    console.error('Error in username route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});