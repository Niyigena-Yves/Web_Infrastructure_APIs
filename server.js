const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let requestCount = 0;
let locationRequests = {};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        requests: requestCount,
        uptime: process.uptime()
    });
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    res.json({
        totalRequests: requestCount,
        popularLocations: Object.entries(locationRequests)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([location, count]) => ({ location, count }))
    });
});

// Weather API proxy endpoint
app.get('/api/weather', async (req, res) => {
    requestCount++;
    
    try {
        const { latitude, longitude, timezone = 'auto' } = req.query;
        
        // Validate parameters
        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'Missing required parameters: latitude and longitude' 
            });
        }
        
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ 
                error: 'Invalid latitude or longitude values' 
            });
        }
        
        if (lat < -90 || lat > 90) {
            return res.status(400).json({ 
                error: 'Latitude must be between -90 and 90 degrees' 
            });
        }
        
        if (lng < -180 || lng > 180) {
            return res.status(400).json({ 
                error: 'Longitude must be between -180 and 180 degrees' 
            });
        }
        
        // Track popular locations
        const locationKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
        locationRequests[locationKey] = (locationRequests[locationKey] || 0) + 1;
        
        // Construct API URL
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${timezone}`;
        
        console.log(`Fetching weather data for ${lat}, ${lng}`);
        
        // Fetch from Open-Meteo API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Open-Meteo API responded with status: ${response.status}`);
        }
        
        const weatherData = await response.json();
        
        if (weatherData.error) {
            throw new Error(weatherData.reason || 'API returned an error');
        }
        
        // Add server timestamp
        weatherData.server_timestamp = new Date().toISOString();
        weatherData.server_info = {
            instance: process.env.INSTANCE_NAME || 'weather-app',
            hostname: require('os').hostname()
        };
        
        res.json(weatherData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch weather data', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found', 
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weather Dashboard Server running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`Analytics available at: http://localhost:${PORT}/api/analytics`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;