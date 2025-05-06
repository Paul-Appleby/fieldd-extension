const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Could not calculate route' });
    }

    const route = response.data.routes[0];
    const duration = route.legs[0].duration.text;
    const distance = route.legs[0].distance.text;

    res.status(200).json({
      duration,
      distance,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text
      }))
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    res.status(500).json({ error: 'Failed to calculate route' });
  }
}; 