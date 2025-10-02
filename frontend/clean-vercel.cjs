const fs = require('fs');
const path = require('path');

// Function to delete all files in a directory with a specific extension
function deleteFilesWithExtension(dir, extension) {
  try {
    // Make sure the directory exists
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} doesn't exist. Skipping.`);
      return;
    }
    
    const files = fs.readdirSync(dir);
    
    // Filter files with the specified extension
    const filesToDelete = files.filter(file => file.endsWith(extension));
    
    // Delete each file
    filesToDelete.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting ${filePath}: ${error.message}`);
      }
    });
    
    console.log(`Deleted ${filesToDelete.length} ${extension} files from ${dir}`);
  } catch (error) {
    console.error(`Error processing directory ${dir}: ${error.message}`);
  }
}

// Paths to clean
const assetsDir = path.resolve(__dirname, '../.vercel/output/static/assets');

// Try to clean the .vercel build output directory (if it exists)
try {
  if (fs.existsSync(assetsDir)) {
    console.log('Cleaning old assets from .vercel/output directory...');
    deleteFilesWithExtension(assetsDir, '.js');
    deleteFilesWithExtension(assetsDir, '.css');
    console.log('✅ Vercel output cleaned successfully');
  } else {
    console.log('No .vercel/output directory found. Skipping cleaning.');
  }
} catch (error) {
  console.error('Error during cleaning:', error);
}

console.log('✅ Clean build ready for deployment');