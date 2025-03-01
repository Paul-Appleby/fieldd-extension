document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const addressInput = document.getElementById('address');

    submitButton.addEventListener('click', function() {
        const address = addressInput.value;
        console.log('Address submitted:', address); // Add this line for debugging

        // Function to calculate drive times using Google Maps Distance Matrix API via Vercel server
        function calculateDriveTimes(submittedAddress, scrapedAddresses) {
            const origins = [submittedAddress];
            const destinations = scrapedAddresses;

            const url = `https://maps-rhx66bk1w-pauls-projects-8817cc1b.vercel.app/api/distancematrix?origins=${encodeURIComponent(origins.join('|'))}&destinations=${encodeURIComponent(destinations.join('|'))}`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log('Drive times data:', data);
                    const driveTimes = data.rows[0].elements.map((element, index) => ({
                        address: scrapedAddresses[index],
                        duration: element.duration.text,
                        distance: element.distance.text
                    }));
                    console.log('Drive times:', driveTimes);
                    displayDriveTimes(driveTimes);
                })
                .catch(error => {
                    console.error('Error calculating drive times:', error);
                    document.getElementById('result').textContent = 'Error calculating drive times';
                });
        }

        // Function to display drive times
        function displayDriveTimes(driveTimes) {
            const resultElement = document.getElementById('result');
            resultElement.textContent = 'Drive times:\n' + driveTimes.map(dt => `${dt.address}: ${dt.duration} (${dt.distance})`).join('\n');
        }

        // Automatically scrape addresses after submission
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            console.log('Sending message to content script to scrape addresses');
            chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeAddresses' }, function(response) {
                if (response && response.addresses) {
                    console.log('Addresses scraped:', response.addresses);
                    calculateDriveTimes(address, response.addresses);
                } else {
                    console.error('Error scraping addresses');
                    document.getElementById('result').textContent = 'Error scraping addresses';
                }
            });
        });
    });
});