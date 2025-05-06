const fs = require('fs');
const path = require('path');

// Function to copy file
function copyFile(source, target) {
    try {
        fs.copyFileSync(source, target);
        console.log(`Copied ${source} to ${target}`);
    } catch (err) {
        console.error(`Error copying ${source}: ${err}`);
    }
}

// Chrome Extension Files
const extensionFiles = [
    { src: 'manifest.json', dest: 'fieldd-extension/manifest.json' },
    { src: 'src/background.js', dest: 'fieldd-extension/src/background.js' },
    { src: 'src/content.js', dest: 'fieldd-extension/src/content.js' },
    { src: 'src/popup/popup.html', dest: 'fieldd-extension/src/popup/popup.html' },
    { src: 'icons/icon16.png', dest: 'fieldd-extension/icons/icon16.png' },
    { src: 'icons/icon32.png', dest: 'fieldd-extension/icons/icon32.png' },
    { src: 'icons/icon48.png', dest: 'fieldd-extension/icons/icon48.png' },
    { src: 'icons/icon128.png', dest: 'fieldd-extension/icons/icon128.png' }
];

// Vercel API Files
const apiFiles = [
    { src: 'api/route.js', dest: 'fieldd-api/api/route.js' },
    { src: 'vercel.json', dest: 'fieldd-api/vercel.json' },
    { src: 'package.json', dest: 'fieldd-api/package.json' }
];

// Create directories if they don't exist
['fieldd-extension/src/popup', 'fieldd-extension/icons', 'fieldd-api/api'].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Copy files
console.log('Copying Chrome Extension files...');
extensionFiles.forEach(file => copyFile(file.src, file.dest));

console.log('\nCopying Vercel API files...');
apiFiles.forEach(file => copyFile(file.src, file.dest));

console.log('\nOrganization complete!'); 