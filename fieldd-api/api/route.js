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
        return res.status(405).json({ 
            status: 'ERROR',
            error: 'Method not allowed' 
        });
    }

    try {
        const { addresses } = req.query;
        
        if (!addresses) {
            return res.status(400).json({ 
                status: 'ERROR',
                error: 'No addresses provided' 
            });
        }

        // Split addresses and validate
        const addressList = addresses.split('|');
        if (addressList.length > 25) {
            return res.status(400).json({ 
                status: 'ERROR',
                error: 'Too many addresses (max 25)' 
            });
        }

        // Make request to Google Maps API
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(addressList[0])}&destinations=${encodeURIComponent(addressList.join('|'))}&key=${GoogleMapsAPIKey}`
        );

        if (!response.ok) {
            throw new Error(`Google Maps API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate the response data
        if (!data || !data.rows || !data.rows[0] || !data.rows[0].elements) {
            throw new Error('Invalid response from Google Maps API');
        }

        return res.status(200).json({
            status: 'OK',
            rows: data.rows,
            origin_addresses: data.origin_addresses,
            destination_addresses: data.destination_addresses
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            status: 'ERROR',
            error: 'Failed to calculate drive times',
            details: error.message
        });
    }
} 