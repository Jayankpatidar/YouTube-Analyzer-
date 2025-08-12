let currentChannelId = '';
const chartInstances = {};
const API_BASE_URL = (() => {
    // Auto-detect environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000'; // Development
    }
    return 'https://yt-analyzer-api.onrender.com'; // Production
})();


function showChartError(chartElementId, message) {
    const container = document.getElementById(chartElementId).parentElement;
    container.innerHTML = `
        <div class="chart-error">
            <p>Chart Loading Failed</p>
            <p class="error-message">${message}</p>
        </div>
    `;
}

// Function to initialize the dashboard
async function initDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    currentChannelId = urlParams.get('channelId') ;

    
    showSection('stats');
    await loadChannelData(currentChannelId);
}

// Function to load channel data
async function loadChannelData(channelId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/channels/${channelId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data)
        document.getElementById('channelTitle').textContent = data.title;
        document.getElementById('channelHandle').textContent = data.handle;
        document.getElementById('subscriberCount').textContent = formatNumber(data.statistics.subscriberCount);
        document.getElementById('viewCount').textContent = formatNumber(data.statistics.viewCount);
        document.getElementById('videoCount').textContent = formatNumber(data.statistics.videoCount);
        document.getElementById('publishedAt').textContent = new Date(data.publishedAt).toLocaleDateString();


        const statsContent = `
          <p>Subscribers: ${formatNumber(data.statistics.subscriberCount)}</p>
          <p>Views: ${formatNumber(data.statistics.viewCount)}</p>
          <p>Uploads: ${formatNumber(data.statistics.videoCount)}</p>
        `;
        document.getElementById('channelStatsContent').innerHTML = statsContent;

    } catch (error) {
        console.error('Error loading channel data:', error);
    }
}

// Function to load all charts
async function loadAllCharts() {
    await loadStackedBarChart();
    await loadEngagementRatioChart();
    await loadFunnelChart();
    await loadUploadTimeHist();
    await loadTimeDurationChart();
    
}

// Function to fetch recommendation data from MongoDB (Node.js API)
// 1. Fetch Data Function
async function fetchRecommendationData(channelId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/recommendation/${channelId}`);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// 2. Show Recommendation Function
async function showRecommendation(channelId) {
    const data = await fetchRecommendationData(channelId);
    console.log(data);
    if (data) {
        document.getElementById("best-upload-time").textContent = `Best time: ${data.bestUploadTime}`;
        document.getElementById("best-duration").textContent = `Best duration: ${data.bestDuration}`;
    } else {
        document.getElementById("best-upload-time").textContent = 'No data found';
        document.getElementById("best-duration").textContent = 'No data found';
    }
}

// 3. Section Handler Function
async function showSection(id) {
    // Hide all sections
    ["stats", "analysis", "recommend", "highperform"].forEach(sec => {
        document.getElementById(sec).classList.add("hidden");
    });

    // Show target section
    document.getElementById(id).classList.remove("hidden");

    // Async section handlers
    try {

        if (id === 'analysis') await loadAllCharts();
        if (id === 'recommend') await showRecommendation(currentChannelId);
        if (id === 'highperform') await loadReachChart();

    } catch (error) {
        console.error(`Section ${id} error:`, error);
    }
}


// Helper function to format large numbers
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Chart loading functions

async function loadStackedBarChart() {
    try {
        // Clear previous chart if exists
        if (chartInstances.stackedBarChart) {
            chartInstances.stackedBarChart.destroy();
        }

        // // Show loading state
        // document.getElementById('chartLoading').style.display = 'flex';

        // Fetch data
        const response = await fetch(`${API_BASE_URL}/api/charts/stacked-bar?channelId=${currentChannelId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const chartData = await response.json();

        // Create chart
        const ctx = document.getElementById('stackedBarChart').getContext('2d');
        chartInstances.stackedBarChart = new Chart(ctx, {
            type: 'bar',
            data: chartData.data || chartData, // Handles both full config and data-only responses
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Videos'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading stacked bar chart:', error);
    }
}

async function loadEngagementRatioChart() {
    try {
        if (chartInstances.engagementRatioChart) {
            chartInstances.engagementRatioChart.destroy();
        }

        const response = await fetch(`${API_BASE_URL}/api/charts/engagement-ratio?channelId=${currentChannelId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const chartConfig = await response.json();

        if (chartConfig.error) {
            throw new Error(chartConfig.error);
        }

        const ctx = document.getElementById('engagementRatioChart').getContext('2d');
        chartInstances.engagementRatioChart = new Chart(ctx, chartConfig);

    } catch (error) {
        console.error('Error loading engagement ratio chart:', error);
        // Optionally, display error message to user here
    }
}

async function loadFunnelChart() {
    try {
        // Clear previous plot if exists
        const container = document.getElementById('funnelChart');
        container.innerHTML = '';

        const response = await fetch(`${API_BASE_URL}/api/charts/funnel?channelId=${currentChannelId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        // Plotly expects data and layout in specific format
        Plotly.newPlot(
            'funnelChart',
            responseData.data,
            responseData.layout,
            { responsive: true }
        );

    } catch (error) {
        console.error('Error loading funnel chart:', error);
        showChartError('funnelChart', error.message);
    }
}



async function loadUploadTimeHist() {
    try {
        if (chartInstances.uploadTimeHist) {
            chartInstances.uploadTimeHist.destroy();
        }

        const response = await fetch(`${API_BASE_URL}/api/charts/upload-time-hist?channelId=${currentChannelId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const responseData = await response.json();

        // Convert object to sorted array of time intervals
        const timeData = Object.entries(responseData.views_by_interval)
            .sort((a, b) => {
                // Custom sorting to maintain time sequence
                const order = [
                    '12AM - 4AM', '4AM - 8AM', '8AM - 12PM',
                    '12PM - 4PM', '4PM - 8PM', '8PM - 12AM'
                ];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
            });

        const timeLabels = timeData.map(([label]) => label);
        const viewData = timeData.map(([, value]) => value);

        const chartConfig = {
            type: 'bar',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'Average Views',
                    data: viewData,
                    backgroundColor: timeLabels.map(label =>
                        label === responseData.recommended_upload_time ?
                            'rgba(255, 99, 132, 0.7)' : // Highlight recommended time
                            'rgba(54, 162, 235, 0.5)'
                    ),
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y.toLocaleString('en-IN');
                                return `${label}: ₹${value} views`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Upload Time Intervals'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Average Views'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('en-IN')
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        };

        const ctx = document.getElementById('uploadTimeHist').getContext('2d');
        chartInstances.uploadTimeHist = new Chart(ctx, chartConfig);

    } catch (error) {
        console.error('Error loading upload time histogram:', error);
        showChartError('uploadTimeHist', error.message);
    }
}

async function loadTimeDurationChart() {
    try {
        if (chartInstances.timeDurationChart) {
            chartInstances.timeDurationChart.destroy();
        }

        const response = await fetch(`${API_BASE_URL}/api/charts/time-duration?channelId=${currentChannelId}`);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const responseData = await response.json();

        // Transform the data for Chart.js
        const durationLabels = Object.keys(responseData.duration_distribution);
        const durationData = Object.values(responseData.duration_distribution);
        const viewsData = Object.values(responseData.views_per_duration);

        const chartConfig = {
            type: 'bar',
            data: {
                labels: durationLabels,
                datasets: [{
                    label: 'Video Count by Duration',
                    data: durationData,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    yAxisID: 'y-count'
                }, {
                    label: 'Views by Duration',
                    data: viewsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    yAxisID: 'y-views'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Video Duration Categories'
                        }
                    },
                    'y-count': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Videos'
                        },
                        beginAtZero: true
                    },
                    'y-views': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Total Views',
                        },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y.toLocaleString();
                                const duration = context.label;
                                const count = responseData.duration_distribution[duration];
                                const views = responseData.views_per_duration[duration];

                                if (context.datasetIndex === 0) {
                                    return `${label}: ${count} videos`;
                                }
                                return `${label}: ${views.toLocaleString()} views`;
                            }
                        }
                    }
                }
            }
        };

        const ctx = document.getElementById('timeDurationChart').getContext('2d');
        chartInstances.timeDurationChart = new Chart(ctx, chartConfig);

    } catch (error) {
        console.error('Error loading time duration chart:', error);
        showChartError('timeDurationChart', error.message);
    }
}

async function loadReachChart() {
    try {
        // Clear previous chart
        if (chartInstances.reachChart) {
            chartInstances.reachChart.destroy();
        }

        // Fetch data
        const response = await fetch(`${API_BASE_URL}/api/charts/reach?channelId=${currentChannelId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const chartConfig = await response.json();

        // Make sure the chart configuration has all required properties
        if (!chartConfig || !chartConfig.data || !chartConfig.data.datasets) {
            throw new Error("Invalid chart configuration received from API");
        }

        // Extract metrics data
        const metricsData = {
            views: chartConfig.data.datasets[0].data[0] || 0,
            likes: chartConfig.data.datasets[0].data[1] || 0,
            comments: chartConfig.data.datasets[0].data[2] || 0,
            reachPercentage: chartConfig.data.datasets[0].data[3] || 0
        };

        // Update the video metrics section
        const metricsElement = document.getElementById('videoMetricsSection');
        if (metricsElement) {
            metricsElement.innerHTML = `
                <div class="bg-gray-50 p-4 rounded-lg mt-4">
                    <p class="mb-2"><span class="font-medium">Total Views:</span> ${metricsData.views.toLocaleString()}</p>
                    <p class="mb-2"><span class="font-medium">Total Likes:</span> ${metricsData.likes.toLocaleString()}</p>
                    <p class="mb-2"><span class="font-medium">Total Comments:</span> ${metricsData.comments.toLocaleString()}</p>
                    <p><span class="font-medium">Reach Percentage:</span> ${metricsData.reachPercentage.toFixed(2)}%</p>
                </div>
            `;
        }

        // Create chart with the API-provided configuration
        const ctx = document.getElementById('reachChart').getContext('2d');

        // Parse function strings into actual functions
        if (chartConfig.options && chartConfig.options.plugins && chartConfig.options.plugins.tooltip &&
            chartConfig.options.plugins.tooltip.callbacks &&
            typeof chartConfig.options.plugins.tooltip.callbacks.label === 'string') {
            // Convert string function to actual function
            chartConfig.options.plugins.tooltip.callbacks.label =
                new Function('context', chartConfig.options.plugins.tooltip.callbacks.label
                    .replace('function(context) {', '')
                    .replace(/}$/, ''));
        }

        // Parse y-axis ticks callback if it exists as a string
        if (chartConfig.options && chartConfig.options.scales && chartConfig.options.scales.y &&
            chartConfig.options.scales.y.ticks &&
            typeof chartConfig.options.scales.y.ticks.callback === 'string') {
            // Convert string function to actual function
            chartConfig.options.scales.y.ticks.callback =
                new Function('value', chartConfig.options.scales.y.ticks.callback
                    .replace('function(value) {', '')
                    .replace(/}$/, ''));
        }

        chartInstances.reachChart = new Chart(ctx, chartConfig);

    } catch (error) {
        console.error('Error loading reach chart:', error);
        showChartError('reachChart', error.message);
    }
}
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
