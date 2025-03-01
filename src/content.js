console.log('Content script loaded and running');

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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received a message:', request);
    if (request.action === 'scrapeAddresses') {
        const addresses = scrapeAddresses();
        sendResponse({ addresses: addresses });
    }
    return true; // Indicate that the response is asynchronous
});