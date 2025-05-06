const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Read the zip file
const zip = new AdmZip('fieldd-extension.zip');

// Get all entries
const zipEntries = zip.getEntries();

console.log('Package Contents:');
console.log('----------------');

// List all files
zipEntries.forEach(entry => {
    if (!entry.isDirectory) {
        console.log(entry.entryName);
    }
});

// Check for required files
const requiredFiles = [
    'manifest.json',
    'src/background.js',
    'src/content.js',
    'src/popup/popup.html',
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'icons/icon128.png'
];

console.log('\nChecking Required Files:');
console.log('----------------------');

requiredFiles.forEach(file => {
    const exists = zipEntries.some(entry => entry.entryName === file);
    console.log(`${file}: ${exists ? '✓' : '✗'}`);
}); 