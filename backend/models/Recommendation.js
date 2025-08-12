// models/Recommendation.js
const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    bestUploadTime: { type: String, required: true },
    bestDuration: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

recommendationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Recommendation', recommendationSchema);