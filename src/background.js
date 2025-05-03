chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'calculateDriveTime') {
        const API_ENDPOINT = "https://your-project.vercel.app/api/calculateDriveTime";
        
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
        .then(response => response.json())
        .then(data => {
            sendResponse({
                success: true,
                data: data
            });
        })
        .catch(error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });
        
        return true; // Required for async response
    }
    if (request.action === 'ping') {
        sendResponse({ success: true });
        return true;
    }
});