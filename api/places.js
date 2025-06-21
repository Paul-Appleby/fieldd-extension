const { Client } = require('@googlemaps/google-maps-services-js');

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { input } = req.body;

    if (!input) {
        return res.status(400).json({ error: 'Input is required' });
    }

    // Check if API key exists
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key is missing');
        return res.status(500).json({ 
            error: 'Server configuration error',
            details: 'API key is missing'
        });
    }

    const client = new Client({});

    try {
        console.log('Fetching suggestions for:', input);
        console.log('Using API key:', process.env.GOOGLE_MAPS_API_KEY.substring(0, 5) + '...');

        const response = await client.placeAutocomplete({
            params: {
                input: input,
                key: process.env.GOOGLE_MAPS_API_KEY,
                types: 'address',
                components: ['country:us']
            }
        });

        console.log('Places API response status:', response.status);
        console.log('Places API response data:', JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.predictions) {
            throw new Error('Invalid response format from Places API');
        }

        const suggestions = response.data.predictions.map(prediction => ({
            address: prediction.description,
            placeId: prediction.place_id
        }));

        res.status(200).json({ suggestions });
    } catch (error) {
        console.error('Places API error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            stack: error.stack
        });
        
        res.status(500).json({ 
            error: 'Failed to fetch address suggestions',
            details: error.message,
            code: error.code,
            status: error.status
        });
    }
} 