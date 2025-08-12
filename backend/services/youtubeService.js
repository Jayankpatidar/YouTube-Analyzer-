const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

exports.fetchChannelData = async (channelId) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels`,
      {
        params: {
          part: 'snippet,statistics',
          id: channelId,
          key: YOUTUBE_API_KEY
        }
      }
    );

    const item = response.data.items[0];
    return {
      channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      statistics: {
        viewCount: item.statistics.viewCount,
        subscriberCount: item.statistics.subscriberCount,
        videoCount: item.statistics.videoCount
      }
    };
  } catch (error) {
    console.error('Error fetching channel data:', error);
    throw error;
  }
};

exports.fetchVideosData = async (channelId) => {
  try {
    // First get all video IDs
    const searchResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          part: 'snippet',
          channelId,
          maxResults: 25,
          order: 'date',
          type: 'video',
          key: YOUTUBE_API_KEY
        }
      }
    );

    const videoIds = searchResponse.data.items.map(item => item.id.videoId);

    // Then get detailed video statistics, tags, and content rating
    const videosResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY
        }
      }
    );

    return videosResponse.data.items.map(item => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      tags: item.snippet.tags || ['motivation'], // Adding tags with fallback
      duration: item.contentDetails.duration,
      contentRating: item.contentDetails.contentRating || {}, // Adding content rating with fallback
      statistics: {
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount,
        commentCount: item.statistics.commentCount
      }
    }));
  } catch (error) {
    console.error('Error fetching videos data:', error);
    throw error;
  }
};
