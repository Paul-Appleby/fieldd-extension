chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'calculateDriveTime') {
        const API_ENDPOINT = "https://fieldd-api.vercel.app/api/calculateDriveTime";
        console.log('Making API call to:', API_ENDPOINT);
        
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: request.origin,
                destination: request.destination
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
            console.log('API response data:', data);
            sendResponse({
                success: true,
                data: data
            });
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