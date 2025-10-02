const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlFilePath = path.resolve(__dirname, 'dist/index.html');
let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

// Replace template string with current timestamp
htmlContent = htmlContent.replace('<%- Date.now() %>', Date.now());

// Write the modified HTML back
fs.writeFileSync(htmlFilePath, htmlContent);

console.log('✅ Anti-cache version added to index.html');