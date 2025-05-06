const { GoogleMapsAPIKey } = process.env;

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { addresses } = req.query;
        
        if (!addresses) {
            return res.status(400).json({ error: 'No addresses provided' });
        }

        // Split addresses and validate
        const addressList = addresses.split('|');
        if (addressList.length > 25) {
            return res.status(400).json({ error: 'Too many addresses (max 25)' });
        }

        // Make request to Google Maps API
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(addressList[0])}&destinations=${encodeURIComponent(addressList.join('|'))}&key=${GoogleMapsAPIKey}`
        );

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 