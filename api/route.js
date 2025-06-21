const axios = require('axios');

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destinations } = req.body;
    
    // Handle both single destination and array of destinations
    const destinationsArray = Array.isArray(destinations) ? destinations : [destinations];
    
    if (!origin || !destinationsArray.length) {
      return res.status(400).json({ error: 'Origin and at least one destination are required' });
    }

    // Build destinations string for API
    const destinationsStr = destinationsArray.map(dest => encodeURIComponent(dest)).join('|');

    console.log('Making Distance Matrix API call for:', {
      origin,
      destinationsCount: destinationsArray.length
    });

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${destinationsStr}&units=imperial&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status !== 'OK') {
      console.error('Distance Matrix API error:', response.data);
      return res.status(400).json({ error: 'Could not calculate distances' });
    }

    // Process results
    const results = response.data.rows[0].elements.map((element, index) => {
      if (element.status === 'OK') {
        return {
          address: destinationsArray[index],
          duration: element.duration.text,
          distance: element.distance.text
        };
      }
      console.warn(`Failed to calculate distance for ${destinationsArray[index]}: ${element.status}`);
      return null;
    }).filter(result => result !== null);

    console.log(`Successfully calculated ${results.length} out of ${destinationsArray.length} distances`);

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error calculating distances:', error);
    res.status(500).json({ error: 'Failed to calculate distances' });
  }
}; 