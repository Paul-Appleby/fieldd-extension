// Address parsing utilities
function parseAddress(text) {
    const addressMatch = text.match(/\$[^-]*- (.*)$/);
    return addressMatch ? addressMatch[1].trim() : null;
}

// Make it available to other scripts
window.addressParser = {
    parseAddress
}; 