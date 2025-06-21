document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const addressInput = document.getElementById('address');
    const clearButton = document.getElementById('clearDriveTimes');
    const resultDiv = document.getElementById('result');
    const suggestionsContainer = document.getElementById('address-suggestions');
    
    // Vercel API endpoints
    const VERCEL_API_BASE = "https://fieldd-extension.vercel.app";

    // Initially hide the clear button
    clearButton.style.display = 'none';

    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to fetch address suggestions
    async function fetchSuggestions(input) {
        if (!input || input.length < 3) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        try {
            console.log('Fetching suggestions for:', input);
            const response = await fetch(`${VERCEL_API_BASE}/api/places`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input })
            });

            // Log the raw response for debugging
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(`API Error: ${errorData.error} - ${errorData.details || ''}`);
                } catch (e) {
                    throw new Error(`Server error: ${responseText}`);
                }
            }

            const data = JSON.parse(responseText);
            console.log('Received suggestions:', data);
            displaySuggestions(data.suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            resultDiv.textContent = `Error: ${error.message}`;
            suggestionsContainer.style.display = 'none';
        }
    }

    // Function to display suggestions
    function displaySuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = suggestion.address;
            div.addEventListener('click', () => {
                addressInput.value = suggestion.address;
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(div);
        });

        suggestionsContainer.style.display = 'block';
    }

    // Add input event listener with debounce
    addressInput.addEventListener('input', debounce((e) => {
        fetchSuggestions(e.target.value);
    }, 300));

    // Add enter key functionality
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            submitButton.click(); // Trigger the submit button click
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!addressInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    // Function to split array into chunks of size n
    function chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

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

        // Show loading state
        resultDiv.textContent = 'Calculating drive times...';
        
        // Split addresses into chunks of 25 (Distance Matrix API limit)
        const addressChunks = chunkArray(scrapedAddresses, 25);
        const allDriveTimes = [];
        
        // Process each chunk
        for (const chunk of addressChunks) {
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
                if (data.results) {
                    allDriveTimes.push(...data.results);
                }
            } catch (error) {
                console.error(`Error processing chunk:`, error);
            }
        }

        // Display results
        if (allDriveTimes.length > 0) {
        displayDriveTimes(allDriveTimes);
            resultDiv.textContent = ''; // Clear the result div
        } else {
            resultDiv.textContent = 'Error: No drive times could be calculated';
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
