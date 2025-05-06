export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { origin, destinations } = req.body;
        
        if (!origin || !destinations || !Array.isArray(destinations)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        if (!MAPS_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destinations.join('|'))}&key=${MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error calculating route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 