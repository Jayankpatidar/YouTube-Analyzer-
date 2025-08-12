const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  publishedAt: Date,
  thumbnails: Object,
  duration: String,
  statistics: {
    viewCount: Number,
    likeCount: Number,
    commentCount: Number
  },
  contentDetails: {
    dimension: String,
    definition: String,
    caption: String
  },
  topicDetails: {
    topicCategories: [String]
  }
}, { timestamps: true });

const channelSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  publishedAt: Date,
  thumbnails: Object,
  statistics: {
    viewCount: Number,
    subscriberCount: Number,
    videoCount: Number
  },
  videos: [videoSchema],
  lastUpdated: Date
}, { timestamps: true });

module.exports = mongoose.model('Channel', channelSchema);