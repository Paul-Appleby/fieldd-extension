// Listen for the installation event
chrome.runtime.onInstalled.addListener(() => {
    console.log('Fieldd Extension installed');
});

// Example of listening for a message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received a message:', message);
    if (message.action === 'logMessage') {
        console.log('Message from content script:', message.data);
        sendResponse({ status: 'Message received' });
    }
});