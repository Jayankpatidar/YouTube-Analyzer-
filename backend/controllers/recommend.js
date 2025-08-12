const express = require('express');
const Recommendation = require('../models/recommendation');

exports.getRecommendationData = async (req, res) => {
    const { channelId } = req.params;

    try {
        console.log(`Fetching recommendation for channelId: ${channelId}`); // Log channelId
        const recomd = await Recommendation.findOne({ channelId });

        // console.log("Database query result:", recomd); // Log the query result

        if (!recomd) {
            console.log("No recommendation found for channelId:", channelId); // Log if not found
            return res.status(404).json({ message: "Recommendation not found" });
        }

        const responseData = {
            bestUploadTime: recomd.bestUploadTime,
            bestDuration: recomd.bestDuration
        };

        console.log("Sending response:", responseData); // Log the final response
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching recommendation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};