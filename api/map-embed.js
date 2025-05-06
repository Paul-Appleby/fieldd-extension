module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${process.env.GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`;

    res.status(200).json({ embedUrl });
  } catch (error) {
    console.error('Error generating map embed:', error);
    res.status(500).json({ error: 'Failed to generate map embed' });
  }
}; z