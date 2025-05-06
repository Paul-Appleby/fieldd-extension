document.addEventListener('DOMContentLoaded', function() {
    const calculateButton = document.getElementById('calculateDriveTimes');
    const clearButton = document.getElementById('clearDriveTimes');
    const statusDiv = document.getElementById('status');

    calculateButton.addEventListener('click', async () => {
        try {
            statusDiv.textContent = 'Calculating drive times...';
            
            // Get the current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Scrape addresses from the page
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeAddresses' });
            
            if (response && response.addresses && response.addresses.length > 0) {
                // Calculate drive times between consecutive addresses
                const driveTimes = [];
                for (let i = 0; i < response.addresses.length - 1; i++) {
                    const origin = response.addresses[i];
                    const destination = response.addresses[i + 1];
                    
                    try {
                        const result = await calculateDriveTime(origin, destination);
                        if (result) {
                            driveTimes.push({
                                address: destination,
                                duration: result.duration,
                                distance: result.distance
                            });
                        }
                    } catch (error) {
                        console.error('Error calculating drive time:', error);
                    }
                }
                
                // Send drive times back to content script
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'appendDriveTimes',
                    driveTimes: driveTimes
                });
                
                statusDiv.textContent = 'Drive times calculated successfully!';
            } else {
                statusDiv.textContent = 'No addresses found on the page.';
            }
        } catch (error) {
            console.error('Error:', error);
            statusDiv.textContent = 'Error: ' + error.message;
        }
    });

    clearButton.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'clearDriveTimes' });
            statusDiv.textContent = 'Drive times cleared!';
        } catch (error) {
            console.error('Error:', error);
            statusDiv.textContent = 'Error: ' + error.message;
        }
    });
});

async function calculateDriveTime(origin, destination) {
    try {
        const response = await fetch('https://fieldd-api.vercel.app/api/calculateDriveTime', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ origin, destination })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
            const element = data.rows[0].elements[0];
            if (element.status === 'OK') {
                return {
                    duration: element.duration.text,
                    distance: element.distance.text
                };
            }
        }
        
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Error calculating drive time:', error);
        throw error;
    }
}
