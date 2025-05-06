# Fieldd API

Backend API for the Fieldd Chrome Extension, handling drive time calculations and weather data.

## Features
- Drive time calculations using Google Maps API
- Weather information using OpenWeather API
- Serverless deployment on Vercel

## Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create `.env` file
   - Add required API keys:
     ```
     GOOGLE_MAPS_API_KEY=your_key_here
     OPENWEATHER_API_KEY=your_key_here
     ```

3. Run locally:
   ```bash
   npm run dev
   ```

## Deployment
Deploy to Vercel:
```bash
npm run deploy
```

## API Endpoints
- `POST /api/calculateDriveTime`: Calculate drive time between two locations
- `GET /api/weather`: Get weather information for a location 