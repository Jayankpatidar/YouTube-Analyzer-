// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const {
  getChannelData,
  getChannelIdFromUsername,
} = require('../controllers/channelController');

const {
  getStackedBarChartData,
  getFunnelChartData,
  getUploadTimeHistData,
  getEngagementRatioChartData,
  getTimeDuration,
  getReachData
} = require('../controllers/chartController');

const {
  getRecommendationData
} = require('../controllers/recommend');


// Channel Routes
router.get('/channels/:channelId', getChannelData);
router.get('/channels/username/:username', getChannelIdFromUsername);


// Chart Routes
router.get('/charts/stacked-bar', getStackedBarChartData);
router.get('/charts/funnel', getFunnelChartData);
router.get('/charts/upload-time-hist', getUploadTimeHistData);
router.get('/charts/engagement-ratio', getEngagementRatioChartData);
router.get('/charts/time-duration', getTimeDuration);
router.get('/charts/reach', getReachData);

// Recommend Routes
router.get('/recommendation/:channelId', getRecommendationData);

module.exports = router;