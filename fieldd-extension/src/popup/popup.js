document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const addressInput = document.getElementById('address');
    const mapIframe = document.getElementById('map');
    const clearButton = document.getElementById('clearDriveTimes');
    const resultDiv = document.getElementById('result');
    
    // Vercel API endpoints - using the automatically maintained domain
    const VERCEL_API_BASE = "https://fieldd-extension-git-main-pauls-projects-8817cc1b.vercel.app";
    
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

        const MAX_ELEMENTS = 25;
        const allDriveTimes = [];
        
        for (let i = 0; i < scrapedAddresses.length; i += MAX_ELEMENTS) {
            const chunk = scrapedAddresses.slice(i, i + MAX_ELEMENTS);
            
            try {
                const response = await fetch(`${VERCEL_API_BASE}/api/route`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        origin: submittedAddress,
                        destinations: chunk
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('API response data:', data);

                if (data.status !== 'OK') {
                    console.error('API Error:', data.status);
                    resultDiv.textContent = `Error: ${data.status}`;
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

        // Get map embed URL from Vercel API
        try {
            const mapResponse = await fetch(`${VERCEL_API_BASE}/api/map-embed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: submittedAddress
                })
            });

            if (mapResponse.ok) {
                const mapData = await mapResponse.json();
                mapIframe.src = mapData.embedUrl;
            }
        } catch (error) {
            console.error('Error getting map embed:', error);
            mapIframe.style.display = 'none';
        }
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
