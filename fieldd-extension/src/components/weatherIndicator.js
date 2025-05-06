// Weather indicator component
const weatherIndicator = {
    create(weather) {
        if (!this.shouldShowWeather(weather)) return null;

        const element = document.createElement('div');
        element.className = 'weather-indicator';
        element.innerHTML = `
            🌧️
            <div class="weather-tooltip">
                ${weather.condition}<br>
                ${weather.temp}°F<br>
                ${weather.description}
            </div>
        `;
        return element;
    },

    shouldShowWeather(weather) {
        return weather.condition.toLowerCase().includes('rain') || 
               weather.condition.toLowerCase().includes('drizzle') ||
               weather.condition.toLowerCase().includes('thunderstorm');
    }
};

window.weatherIndicator = weatherIndicator; 