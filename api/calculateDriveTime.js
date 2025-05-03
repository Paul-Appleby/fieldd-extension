import { rateLimit } from 'express-rate-limit';
import cors from 'cors';

// CORS configuration
const corsMiddleware = cors({
    origin: [
        'chrome-extension://*',  // Allow Chrome extensions
        'https://admin.fieldd.co'  // Allow Fieldd admin site
    ],
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
});

// Track usage in memory (in production, use a database)
const usageTracker = new Map();

export default async function handler(req, res) {
    // Apply CORS
    corsMiddleware(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ 
                error: 'method_not_allowed',
                message: 'Only POST requests are allowed'
            });
        }

        const { origin, destination } = req.body;
        
        if (!origin || !destination) {
            return res.status(400).json({ 
                error: 'missing_parameters',
                message: 'Both origin and destination are required'
            });
        }

        // Track usage
        const today = new Date().toDateString();
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `${ip}-${today}`;
        const currentUsage = usageTracker.get(key) || 0;
        usageTracker.set(key, currentUsage + 1);

        try {
            const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${MAPS_API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            // Log usage for monitoring
            console.log(`API call made - IP: ${ip}, Usage today: ${currentUsage + 1}, Origin: ${origin}, Destination: ${destination}`);
            
            res.status(200).json(data);
        } catch (error) {
            console.error('API Error:', error);
            res.status(500).json({ 
                error: 'internal_server_error',
                message: 'An error occurred while calculating drive time'
            });
        }
    });
} 