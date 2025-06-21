chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'calculateDriveTime') {
        const API_ENDPOINT = "https://fieldd-extension.vercel.app/api/route";
        console.log('Making API call to:', API_ENDPOINT);
        
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: request.origin,
                destinations: [request.destination]  // Send as array to match route API format
            })
        })
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Raw API response data:', data);
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                console.log('First result:', result);
                const formattedResponse = {
                success: true,
                    data: {
                        duration: result.duration,
                        distance: result.distance
                    }
                };
                console.log('Sending formatted response:', formattedResponse);
                sendResponse(formattedResponse);
            } else {
                console.error('No results in response:', data);
                throw new Error('No results in response');
            }
        })
        .catch(error => {
            console.error('API call failed:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        });
        
        return true; // Required for async response
    }
    if (request.action === 'ping') {
        console.log('Ping received');
        sendResponse({ success: true });
        return true;
    }
});