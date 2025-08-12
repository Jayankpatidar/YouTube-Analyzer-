const cron = require('node-cron');
const Channel = require('../models/Channel');
const { fetchChannelData, fetchVideosData } = require('./youtubeService');

const updateAllChannels = async () => {
  try {
    const channels = await Channel.find({});
    console.log(`Starting scheduled update for ${channels.length} channels`);
    
    for (const channel of channels) {
      try {
        const [channelData, videosData] = await Promise.all([
          fetchChannelData(channel.channelId),
          fetchVideosData(channel.channelId)
        ]);
        
        await Channel.findOneAndUpdate(
          { channelId: channel.channelId },
          { 
            ...channelData,
            videos: videosData,
            lastUpdated: new Date() 
          }
        );
        console.log(`Updated ${channel.title}`);
      } catch (err) {
        console.error(`Failed to update ${channel.title}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Scheduled job failed:', err);
  }
};

// Run every 6 hours
const startScheduler = () => {
  cron.schedule('0 */6 * * *', updateAllChannels);
  console.log('Scheduler started - will run every 6 hours');
};

module.exports = { startScheuler };