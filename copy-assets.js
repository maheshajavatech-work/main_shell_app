const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Create public/assets directory if it doesn't exist
if (!fs.existsSync('public/assets')) {
  fs.mkdirSync('public/assets');
}

// Copy manifest files from src/assets to public/assets
const srcAssetsDir = path.join(__dirname, 'src', 'assets');
const publicAssetsDir = path.join(__dirname, 'public', 'assets');

// Copy local manifest
fs.copyFileSync(
  path.join(srcAssetsDir, 'mf.manifest.local.json'),
  path.join(publicAssetsDir, 'mf.manifest.local.json')
);

// Copy prod manifest if it exists
if (fs.existsSync(path.join(srcAssetsDir, 'mf.manifest.prod.json'))) {
  fs.copyFileSync(
    path.join(srcAssetsDir, 'mf.manifest.prod.json'),
    path.join(publicAssetsDir, 'mf.manifest.prod.json')
  );
}

console.log('Manifest files copied to public/assets directory');
