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

// Short-term rate limiting (per 15 minutes)
const shortTermLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per 15 minutes (2 per minute average)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: 'rate_limit_exceeded',
        message: 'Please wait a few minutes before making more requests.',
        retryAfter: 15 * 60 // 15 minutes in seconds
    }
});

// Daily rate limiting (stays within Google's free tier)
const dailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 100, // Limit each IP to 100 requests per day (Google's free tier limit)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: 'daily_limit_reached',
        message: 'You have reached the daily limit of 100 free requests. Please try again tomorrow.',
        retryAfter: 24 * 60 * 60 // 24 hours in seconds
    }
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

        // Apply short-term rate limiting
        try {
            await shortTermLimiter(req, res);
        } catch (error) {
            console.log(`Rate limit exceeded - IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
            return res.status(429).json({
                error: 'rate_limit_exceeded',
                message: 'Please wait a few minutes before making more requests.',
                retryAfter: 15 * 60
            });
        }

        // Apply daily rate limiting
        try {
            await dailyLimiter(req, res);
        } catch (error) {
            console.log(`Daily limit reached - IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
            return res.status(429).json({ 
                error: 'daily_limit_reached',
                message: 'You have reached the daily limit of 100 free requests. Please try again tomorrow.',
                retryAfter: 24 * 60 * 60
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
            console.log(`API call made - IP: ${ip}, Usage today: ${currentUsage + 1}/100, Origin: ${origin}, Destination: ${destination}`);
            
            // Add remaining requests to response
            const remainingRequests = 100 - (currentUsage + 1);
            res.status(200).json({
                ...data,
                usage: {
                    used: currentUsage + 1,
                    remaining: remainingRequests,
                    limit: 100,
                    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                }
            });
        } catch (error) {
            console.error('API Error:', error);
            res.status(500).json({ 
                error: 'internal_server_error',
                message: 'An error occurred while calculating drive time'
            });
        }
    });
} 