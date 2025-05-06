const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream('fieldd-extension.zip');
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
    console.log('Extension packaged successfully!');
    console.log('Total bytes: ' + archive.pointer());
});

// Handle warnings and errors
archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
    } else {
        throw err;
    }
});

archive.on('error', function(err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files and directories
const filesToInclude = [
    'manifest.json',
    'src/',
    'icons/'
];

const filesToExclude = [
    'node_modules',
    '.git',
    'package.json',
    'package-lock.json',
    'vercel.json',
    'convert_icons.js',
    'package_extension.js'
];

// Add files
filesToInclude.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
            archive.directory(filePath, file);
        } else {
            archive.file(filePath, { name: file });
        }
    }
});

// Finalize the archive
archive.finalize(); 