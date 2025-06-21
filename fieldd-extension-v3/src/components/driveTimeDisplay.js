// Drive time display component
const driveTimeDisplay = {
    create(driveTime) {
        const element = document.createElement('div');
        element.className = 'drive-time-info';
        Object.assign(element.style, {
            fontSize: '0.9em',
            padding: '4px 8px',
            marginTop: '4px',
            backgroundColor: this.getBackgroundColor(driveTime.duration),
            color: '#000',
            borderRadius: '4px',
            display: 'inline-block',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            fontWeight: '500'
        });
        element.textContent = `🚗 ${driveTime.duration} (${driveTime.distance})`;
        return element;
    },

    getBackgroundColor(duration) {
        const minutes = this.parseMinutes(duration);
        if (minutes <= 30) return '#90EE90';
        if (minutes <= 40) return '#FFD700';
        return '#FFB6C1';
    },

    parseMinutes(durationText) {
        if (durationText.includes('hour')) {
            const [hours, mins] = durationText.split('hour').map(part => 
                parseInt(part.match(/\d+/)?.[0] || '0')
            );
            return hours * 60 + mins;
        }
        return parseInt(durationText.match(/\d+/)?.[0] || '0');
    }
};

window.driveTimeDisplay = driveTimeDisplay; 