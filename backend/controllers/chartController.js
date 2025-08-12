// controllers/chartController.js
const { exec } = require('child_process');
const path = require('path');

// Utility function to execute Python scripts with channelId parameter
const executePython = (scriptPath, channelId) => {
    return new Promise((resolve, reject) => {
        const command = `python ${scriptPath} ${channelId}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing ${scriptPath}:`, error);
                return reject(error);
            }
            if (stderr) {
                console.error(`Python stderr for ${scriptPath}:`, stderr);
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                console.error(`Error parsing JSON from ${scriptPath}:`, parseError);
                reject(parseError);
            }
        });
    });
};

// Controller functions for each chart type
exports.getStackedBarChartData = async (req, res) => {
    try {
        const channelId = req.query.channelId;
        const data = await executePython(path.join(__dirname, '../models/stacked.py'), channelId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate stacked bar chart data' });
    }
};

exports.getFunnelChartData = async (req, res) => {
    try {
        const channelId = req.query.channelId;
        const data = await executePython(path.join(__dirname, '../models/funnel.py'), channelId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate funnel chart data' });
    }
};

exports.getUploadTimeHistData = async (req, res) => {
    try {
        const channelId = req.query.channelId;
        const data = await executePython(path.join(__dirname, '../models/upload_time_hist.py'), channelId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate upload time histogram data' });
    }
};

exports.getEngagementRatioChartData = async (req, res) => {
    try {
        const channelId = req.query.channelId;
        const data = await executePython(path.join(__dirname, '../models/engagement_ratio.py'), channelId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate engagement ratio chart data' });
    }
};

exports.getTimeDuration = async (req, res) => {
    try {
        const channelId = req.query.channelId;
        const data = await executePython(path.join(__dirname, '../models/time_duration.py'), channelId);
        res.json(data);
    } catch (error) {
        console.error('TimeDuration Error:', error);
        res.status(500).json({error: 'Failed to generate time duration data',
            detail: error.message 
        });
    }
};

exports.getReachData = async (req, res) => {
    try {
        const channelId = req.query.channelId;
        const data = await executePython(path.join(__dirname, '../models/reach_analysis.py'), channelId);
        res.json(data);
    } catch (error) {
        console.error('Reach Analysis Error:', error);
        res.status(500).json({error: 'Failed to generate reach analysis data',
            detail: error.message
        });
    }
};


