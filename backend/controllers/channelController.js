const Channel = require('../models/Channel');
const { fetchChannelData, fetchVideosData } = require('../services/youtubeService');
const { google } = require('googleapis');
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});  

exports.getChannelData = async (req, res) => {
    try {
        const { channelId } = req.params;

        // Check if data exists in DB and is recent (not older than 1 day)
        const existingData = await Channel.findOne({ channelId });

        if (existingData && (new Date() - existingData.lastUpdated) < 24 * 60 * 60 * 1000) {
            return res.json(existingData);
        }

        // Fetch fresh data from YouTube API
        const channelData = await fetchChannelData(channelId);
        const videosData = await fetchVideosData(channelId);

        // Combine and save data
        const newChannelData = {
            ...channelData,
            videos: videosData,
            lastUpdated: new Date()
        };

        const updatedChannel = await Channel.findOneAndUpdate(
            { channelId },
            newChannelData,
            { new: true, upsert: true }
        );

        res.json(updatedChannel);
    } catch (error) {
        console.error('Error fetching channel data:', error);
        res.status(500).json({ error: 'Failed to fetch channel data' });
    }
};

exports.getChannelIdFromUsername = async (req, res) => {
    try {
        // Proper variable handling
        const rawUsername = req.params.username;
        const cleanedUsername = rawUsername
            .trim()
            .toLowerCase()
            .replace(/^@/, '');

        if (!cleanedUsername) {
            return res.status(400).json({ error: 'Invalid username' });
        }

        // Rest of your code remains the same...
        const response = await youtube.channels.list({
            forUsername: cleanedUsername,
            part: 'id'
        });

        if (response.data.items?.length > 0) {
            return res.json({
                channelId: response.data.items[0].id
            });
        }

        // If not found, return error immediately (no search fallback)
        return res.status(404).json({ error: 'Channel not found by username' });

    } catch (error) {
        console.error('YouTube API Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch channel ID',
            details: error.message
        });
    }
};