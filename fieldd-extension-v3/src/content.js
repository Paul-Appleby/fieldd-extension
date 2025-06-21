console.log('Content script loaded and running');

let routeSummaryElement = null;

function handleClickOutside(event) {
    if (routeSummaryElement && !routeSummaryElement.contains(event.target)) {
        routeSummaryElement.remove();
        routeSummaryElement = null;
        document.removeEventListener('click', handleClickOutside);
        // Clear selections and highlights when closing
        selectedJobs = [];
        removeAllHighlights();
    }
}

function scrapeAddresses() {
    const addresses = [];
    // Use the correct class selector for addresses on the page
    document.querySelectorAll('.fc-event-title.fc-sticky').forEach(element => {
        const fullText = element.textContent.trim();
        console.log('Full text:', fullText); // Log the full text for debugging
        // Use a regular expression to extract the address part
        const addressMatch = fullText.match(/\$[^-]*- (.*)$/);
        if (addressMatch) {
            const address = addressMatch[1].trim();
            console.log('Extracted address:', address); // Log the extracted address
            addresses.push(address);
        } else {
            console.log('No address match found for:', fullText); // Log if no match is found
        }
    });
    console.log('Scraped addresses:', addresses); // Log the scraped addresses
    return addresses;
}

function appendDriveTimes(driveTimes) {
    document.querySelectorAll('.fc-event-title.fc-sticky').forEach(element => {
        const fullText = element.textContent.trim();
        const addressMatch = fullText.match(/\$[^-]*- (.*)$/);
        
        if (addressMatch) {
            const address = addressMatch[1].trim();
            const driveTime = driveTimes.find(dt => dt.address === address);
            
            if (driveTime) {
                let driveTimeElement = element.parentElement.querySelector('.drive-time-info');
                if (!driveTimeElement) {
                    driveTimeElement = document.createElement('div');
                    driveTimeElement.className = 'drive-time-info';
                }

                // Extract minutes from duration (assuming format like "35 mins" or "1 hour 5 mins")
                const durationText = driveTime.duration;
                let minutes = 0;
                if (durationText.includes('hour')) {
                    const [hours, mins] = durationText.split('hour').map(part => {
                        return parseInt(part.match(/\d+/)?.[0] || '0');
                    });
                    minutes = hours * 60 + mins;
                } else {
                    minutes = parseInt(durationText.match(/\d+/)?.[0] || '0');
                }

                // Set color based on duration
                let backgroundColor;
                let textColor = '#000';
                if (minutes <= 30) {
                    backgroundColor = '#90EE90'; // Light green
                } else if (minutes <= 40) {
                    backgroundColor = '#FFD700'; // Yellow
                } else {
                    backgroundColor = '#FFB6C1'; // Light red
                }

                // Updated styling with position and z-index
                Object.assign(driveTimeElement.style, {
                    fontSize: '0.9em',
                    padding: '4px 8px',
                    marginTop: '4px',
                    backgroundColor: backgroundColor,
                    color: textColor,
                    borderRadius: '4px',
                    display: 'inline-block',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    fontWeight: '500',
                    position: 'relative',  // Add relative positioning
                    zIndex: '9999',        // High z-index to ensure it's on top
                    pointerEvents: 'auto'  // Ensures the element remains interactive
                });

                driveTimeElement.textContent = `🚗 ${driveTime.duration} (${driveTime.distance})`;
                
                if (!element.parentElement.contains(driveTimeElement)) {
                    element.parentElement.appendChild(driveTimeElement);
                }
            }
        }
    });
}

// Add this to your existing content.js
const weatherData = new Map(); // Store weather data for each address

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received a message:', request);
    try {
    if (request.action === 'scrapeAddresses') {
        const addresses = scrapeAddresses();
        sendResponse({ addresses: addresses });
        } else if (request.action === 'appendDriveTimes') {
            appendDriveTimes(request.driveTimes);
            sendResponse({ success: true });
        } else if (request.action === 'updateWeather') {
            if (request.weather && request.address) {
                weatherData.set(request.address, request.weather);
                updateWeatherDisplay(request.address);
                sendResponse({ success: true });
            } else {
                console.error('Invalid weather data received:', request);
                sendResponse({ error: 'Invalid weather data' });
            }
        } else if (request.action === 'toggleWeather') {
            toggleWeatherDisplay(request.enabled);
            sendResponse({ success: true });
        } else if (request.action === 'clearDriveTimes') {
            clearAllDriveTimes();
            sendResponse({ success: true });
        }
    } catch (error) {
        console.error('Error in message listener:', error);
        sendResponse({ error: error.message });
    }
    return true;
});

function updateWeatherDisplay(address) {
    document.querySelectorAll('.fc-event-title.fc-sticky').forEach(element => {
        const fullText = element.textContent.trim();
        const addressMatch = fullText.match(/\$[^-]*- (.*)$/);
        
        if (addressMatch && addressMatch[1].trim() === address) {
            const weather = weatherData.get(address);
            if (weather && weather.condition) { // Check if weather data exists and has required properties
                let weatherElement = element.parentElement.querySelector('.weather-indicator');
                
                if (!weatherElement) {
                    weatherElement = document.createElement('div');
                    weatherElement.className = 'weather-indicator';
                    element.parentElement.appendChild(weatherElement);
                }

                try {
                    weatherElement.innerHTML = `
                        ${weather.icon || '🌤️'}
                        <div class="weather-tooltip">
                            ${weather.condition || 'N/A'}<br>
                            ${weather.temp ? weather.temp + '°F' : 'N/A'}<br>
                            ${weather.description || 'Weather data unavailable'}
                        </div>
                    `;
                } catch (error) {
                    console.error('Error updating weather display:', error);
                    weatherElement.innerHTML = `
                        🌤️
                        <div class="weather-tooltip">
                            Weather data unavailable
                        </div>
                    `;
                }
            } else {
                console.warn(`Invalid or missing weather data for address: ${address}`);
            }
        }
    });
}

function toggleWeatherDisplay(enabled) {
    const indicators = document.querySelectorAll('.weather-indicator');
    indicators.forEach(indicator => {
        indicator.style.display = enabled ? 'block' : 'none';
    });
}

// Replace both styleSheet declarations with this combined version
const combinedStyles = `
    /* Weather styles */
    .weather-indicator {
        position: absolute;
        right: -25px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.2em;
        animation: float 3s ease-in-out infinite;
        z-index: 10000;
        cursor: pointer;
    }

    @keyframes float {
        0% { transform: translateY(-50%) translateX(0px); }
        50% { transform: translateY(-50%) translateX(-5px); }
        100% { transform: translateY(-50%) translateX(0px); }
    }

    .weather-tooltip {
        position: absolute;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        display: none;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: 10px;
        white-space: nowrap;
    }

    .weather-indicator:hover .weather-tooltip {
        display: block;
    }

    /* Job selection styles */
    .fc-event-title.fc-sticky {
        transition: outline 0.2s ease;
        position: relative;
    }
    
    .selection-number {
        position: absolute;
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
    }

    .selection-hint {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
    }

    #selection-mode-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(33, 150, 243, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
    }

    .fc-event-title.fc-sticky:hover {
        cursor: default;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = combinedStyles;
document.head.appendChild(styleSheet);

// Add this to your existing content.js
let selectedJobs = [];
const MAX_SELECTIONS = 2;

function setupJobClickHandlers() {
    document.querySelectorAll('.fc-event-title.fc-sticky').forEach(element => {
        element.addEventListener('mouseover', function(e) {
            if (e.ctrlKey) {
                const jobElement = this;
                const fullText = jobElement.textContent.trim();
                const addressMatch = fullText.match(/\$[^-]*- (.*)$/);
                
                if (addressMatch) {
                    const address = addressMatch[1].trim();
                    handleJobSelection(jobElement, address);
                }
            }
        });
    });
}

function handleJobSelection(element, address) {
    console.log('Job selection started:', { address });
    
    // Check if job is already selected
    const isAlreadySelected = selectedJobs.some(job => job.address === address);
    if (isAlreadySelected) {
        console.log('Job already selected, ignoring');
        return;
    }

    // Reset if we already have 2 selections
    if (selectedJobs.length === MAX_SELECTIONS) {
        console.log('Max selections reached, resetting');
        selectedJobs = [];
        removeAllHighlights();
    }

    // Get the full job title to extract client name
    const fullText = element.textContent.trim();
    const clientName = extractClientName(fullText);
    console.log('Selected job:', { address, clientName });

    // Add new selection
    selectedJobs.push({ 
        element, 
        address,
        clientName
    });
    
    highlightJob(element, selectedJobs.length);
    console.log('Current selections:', selectedJobs);

    // Only calculate drive time when we have exactly 2 jobs
    if (selectedJobs.length === 2) {
        console.log('Two jobs selected, calculating drive time');
        calculateDriveTime(selectedJobs[0].address, selectedJobs[1].address);
    }
}

function extractClientName(fullText) {
    try {
        // Get the text after the first dash and trim it
        const afterFirstDash = fullText.split('-')[1];
        if (afterFirstDash) {
            // Get the first word and trim any whitespace
            const firstWord = afterFirstDash.trim().split(' ')[0];
            return firstWord || 'Unknown Client';
        }
        return 'Unknown Client';
    } catch (error) {
        console.error('Error extracting client name:', error);
        return 'Unknown Client';
    }
}

function highlightJob(element, selectionNumber) {
    const colors = ['#2196F3', '#4CAF50']; // Blue for first, Green for second
    element.style.outline = `2px solid ${colors[selectionNumber - 1]}`;
    element.style.outlineOffset = '2px';
}

function removeAllHighlights() {
    document.querySelectorAll('.fc-event-title.fc-sticky').forEach(el => {
        el.style.outline = 'none';
    });
}

function calculateDriveTime(origin, destination) {
    console.log('Calculating drive time between:', origin, destination);
    
    // Show loading state
    const driveTimeDisplay = document.querySelector('.job-to-job-drivetime');
    if (driveTimeDisplay) {
        driveTimeDisplay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="margin-bottom: 10px;">🔄 Calculating route...</div>
                <div style="font-size: 12px; color: #666;">Please wait while we fetch the route information</div>
            </div>
        `;
        }

    // Use background script to make API call
        chrome.runtime.sendMessage({
            action: 'calculateDriveTime',
            origin: origin,
            destination: destination
        }, response => {
        console.log('Raw API response in content script:', response);
            if (response && response.success) {
                const data = response.data;
            console.log('Response data:', data);
            if (data.duration && data.distance) {
                console.log('Valid response format, displaying drive time');
                displayDriveTime(data.duration, data.distance);
            } else {
                console.error('Invalid response format:', data);
                displayError('Invalid response format');
            }
        } else {
                console.error('API call failed:', response);
            displayError('Failed to calculate drive time. Please try again.');
    }
    });
}

function displayDriveTime(duration, distance) {
    if (selectedJobs.length !== 2) {
        console.log('Need exactly 2 jobs selected to display drive time');
        return;
    }

    // Remove existing summary if any
    if (routeSummaryElement) {
        routeSummaryElement.remove();
    }

    routeSummaryElement = document.createElement('div');
    routeSummaryElement.className = 'job-to-job-drivetime';
    document.body.appendChild(routeSummaryElement);

    Object.assign(routeSummaryElement.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '10000',
        fontSize: '14px',
        minWidth: '300px'
    });

    routeSummaryElement.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 15px; font-size: 16px;">🗺️ Route Summary</div>
        
        <!-- Job 1 Box -->
        <div style="
            background: #f8f9fa;
            border-left: 4px solid #2196F3;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
        ">
            <div style="color: #2196F3; font-weight: 600; font-size: 15px;">
                📍 Job 1: ${selectedJobs[0].clientName}
            </div>
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
                ${selectedJobs[0].address}
            </div>
        </div>

        <!-- Route Arrow and Time -->
        <div style="
            text-align: left;
            margin: 15px -20px;
            position: relative;
            padding: 10px 0;
            height: 100px;
            display: flex;
            align-items: center;
            overflow: visible;
        ">
            <!-- Path Container -->
            <div style="
                position: absolute;
                left: -20px;
                right: -20px;
                display: flex;
                align-items: center;
                height: 100%;
                width: calc(100% + 40px);
            ">
                <!-- Static background line -->
                <div style="
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #E3F2FD;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 100%;
                "></div>

                <!-- Animated dots container -->
                <div class="dot-container" style="
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 100%;
                    height: 2px;
                ">
                    ${[...Array(10)].map((_, i) => `
                        <div style="
                            position: absolute;
                            width: 6px;
                            height: 6px;
                            background: #2196F3;
                            border-radius: 50%;
                            left: 0;
                            top: 50%;
                            transform: translateY(-50%);
                            animation: moveDot 3s linear infinite;
                            animation-delay: ${i * 0.3}s;
                            opacity: 0.8;
                        "></div>
                    `).join('')}
                </div>
            </div>

            <!-- Drive Time Info Box -->
            <div style="
                background: #fff;
                border: 2px solid #2196F3;
                border-radius: 20px;
                padding: 8px 15px;
                margin: auto;
                position: relative;
                z-index: 1;
                font-weight: 500;
                color: #555;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <div style="font-size: 15px;">🚗 ${duration}</div>
                <div style="font-size: 12px; color: #666; margin-top: 2px;">📏 ${distance}</div>
            </div>
        </div>

        <style>
            @keyframes moveDot {
                0% {
                    left: -5%;
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    left: 105%;
                    opacity: 0;
                }
            }
        </style>

        <!-- Job 2 Box -->
        <div style="
            background: #f8f9fa;
            border-left: 4px solid #4CAF50;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
        ">
            <div style="color: #4CAF50; font-weight: 600; font-size: 15px;">
                📍 Job 2: ${selectedJobs[1].clientName}
            </div>
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
                ${selectedJobs[1].address}
            </div>
        </div>
        
        <button id="clearSelection" style="
            width: 100%;
            padding: 10px;
            border: none;
            background: #f0f0f0;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
        ">
            Clear Selection
        </button>
    `;

    // Add the animation styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes moveDot {
            0% {
                left: -5%;
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                left: 105%;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styleSheet);

    routeSummaryElement.querySelector('#clearSelection').addEventListener('click', () => {
        selectedJobs = [];
        removeAllHighlights();
        routeSummaryElement.remove();
        styleSheet.remove();
        document.removeEventListener('click', handleClickOutside);
    });

    // Add click outside listener
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100); // Small delay to prevent immediate closing
}

function displayError(message) {
    let errorDisplay = document.querySelector('.job-to-job-drivetime');
    if (!errorDisplay) {
        errorDisplay = document.createElement('div');
        errorDisplay.className = 'job-to-job-drivetime';
        document.body.appendChild(errorDisplay);
    }

    Object.assign(errorDisplay.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        zIndex: '10000',
        fontSize: '14px',
        color: '#f44336'
    });

    errorDisplay.innerHTML = `
        <div style="margin-bottom: 10px;">⚠️ ${message}</div>
        <button id="retryButton" style="width: 100%; padding: 8px; border: none; background: #f0f0f0; border-radius: 4px; cursor: pointer; margin-top: 10px;">
            Try Again
        </button>
    `;

    errorDisplay.querySelector('#retryButton').addEventListener('click', () => {
        errorDisplay.remove();
        // Clear current selections
        selectedJobs = [];
        removeAllHighlights();
        // Show selection mode indicator again
        showSelectionMode(true);
    });

    // Auto-remove error message after 5 seconds
    setTimeout(() => {
        if (errorDisplay.parentNode) {
            errorDisplay.remove();
        }
    }, 5000);
}

// Update the keydown event listener
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) {
        // Check if extension is still valid
        try {
            chrome.runtime.sendMessage({ action: 'ping' }, response => {
                if (chrome.runtime.lastError) {
                    console.log('Extension needs reload');
                    displayError('Please refresh the page to reconnect the extension.');
                } else {
                    document.body.style.cursor = 'pointer';
                    showSelectionMode(true);
                }
            });
        } catch (error) {
            displayError('Please refresh the page to reconnect the extension.');
        }
    }
});

// Update the visual feedback for ctrl key state
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) {
        document.body.style.cursor = 'pointer';
        showSelectionMode(true);
    }
});

document.addEventListener('keyup', function(e) {
    if (!e.ctrlKey) {
        document.body.style.cursor = '';
        showSelectionMode(false);
    }
});

function showSelectionMode(active) {
    let indicator = document.getElementById('selection-mode-indicator');
    if (active) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'selection-mode-indicator';
            indicator.textContent = 'Selection Mode - Hover over 2 jobs to see drive time';
            document.body.appendChild(indicator);
        }
    } else if (indicator) {
        indicator.remove();
    }
}

// Initialize
setupJobClickHandlers();

// Re-initialize on calendar updates
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            setupJobClickHandlers();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function clearAllDriveTimes() {
    document.querySelectorAll('.drive-time-info').forEach(element => {
        element.remove();
    });
}