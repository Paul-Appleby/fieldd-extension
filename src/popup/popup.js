document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const addressInput = document.getElementById('address');
    const mapIframe = document.getElementById('map');
    const clearButton = document.getElementById('clearDriveTimes');
    const resultDiv = document.getElementById('result');
    
    // API Keys
    const MAPS_API_KEY = "AIzaSyDwm7B0m670xvfhaw4vcodel04pNIOvCJQ";

    // Initially hide the clear button
    clearButton.style.display = 'none';

    function displayDriveTimes(driveTimes) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'appendDriveTimes',
                driveTimes: driveTimes
            }, function(response) {
                console.log('Drive times appended to calendar:', response);
                clearButton.style.display = 'block';
            });
        });
    }

    async function calculateDriveTimes(submittedAddress, scrapedAddresses) {
        if (!submittedAddress || !scrapedAddresses.length) {
            console.error('Invalid address input:', submittedAddress, scrapedAddresses);
            resultDiv.textContent = 'Error: Missing address data.';
            return;
        }

        const origins = [submittedAddress];
        const MAX_ELEMENTS = 25; // Changed from 100 to 25 to ensure we don't exceed limits
        const allDriveTimes = [];
        
        for (let i = 0; i < scrapedAddresses.length; i += MAX_ELEMENTS) {
            const chunk = scrapedAddresses.slice(i, i + MAX_ELEMENTS);
            
            try {
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(origins.join('|'))}&destinations=${encodeURIComponent(chunk.join('|'))}&key=${MAPS_API_KEY}`;
                
                console.log("Fetching Distance Matrix API URL:", url);
                
                const response = await fetch(url);
                const data = await response.json();
                console.log('Full API Response:', data);

                if (data.status !== 'OK') {
                    console.error('Google API Error:', data.status, data.error_message);
                    resultDiv.textContent = `Error: ${data.status} - ${data.error_message || 'Check API key & billing'}`;
                    return;
                }

                if (!data.rows || !data.rows.length || !data.rows[0].elements) {
                    console.error('Invalid response structure:', data);
                    resultDiv.textContent = 'Error: Unexpected API response. Check console.';
                    return;
                }

                const chunkDriveTimes = data.rows[0].elements.map((element, index) => ({
                    address: chunk[index],
                    duration: element.duration?.text || 'N/A',
                    distance: element.distance?.text || 'N/A'
                }));
                
                allDriveTimes.push(...chunkDriveTimes);
                
                // Add a small delay between chunks to avoid rate limiting
                if (i + MAX_ELEMENTS < scrapedAddresses.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
            } catch (error) {
                console.error('Error calculating drive times:', error);
                resultDiv.textContent = 'Error calculating drive times';
                return;
            }
        }

        displayDriveTimes(allDriveTimes);

        const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${encodeURIComponent(submittedAddress)}&zoom=14&size=400x300`;
        mapIframe.src = embedUrl;
    }

    submitButton.addEventListener('click', function() {
        const address = addressInput.value;
        console.log('Address submitted:', address);

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            console.log('Sending message to content script to scrape addresses');
            chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeAddresses' }, function(response) {
                if (response && response.addresses) {
                    console.log('Addresses scraped:', response.addresses);
                    calculateDriveTimes(address, response.addresses);
                } else {
                    console.error('Error scraping addresses');
                    resultDiv.textContent = 'Error scraping addresses';
                }
            });
        });
    });

    clearButton.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'clearDriveTimes' 
            }, function(response) {
                if (response && response.success) {
                    const address = document.getElementById('address');
                    address.value = ''; // Clear the address input
                    clearButton.style.display = 'none'; // Hide the clear button
                }
            });
        });
    });
});
