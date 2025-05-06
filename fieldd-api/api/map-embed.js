export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        if (!MAPS_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${encodeURIComponent(address)}&zoom=14&size=400x300`;
        
        return res.status(200).json({ embedUrl });
    } catch (error) {
        console.error('Error generating map embed:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 