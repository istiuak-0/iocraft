const fs = require('fs');
const path = require('path');

// Check if .git folder exists (development mode)
const isGitRepo = fs.existsSync(path.join(__dirname, '..', '.git'));

if (isGitRepo) {
  console.log('Development mode - skipping prepare');
  process.exit(0);
}

// Copy package.json from packages/core to root
const sourcePath = path.join(__dirname, '..', 'packages', 'core', 'package.json');
const destPath = path.join(__dirname, '..', 'package.json');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log('✅ Copied package.json for git installation');
} catch (error) {
  console.error('❌ Failed to copy package.json:', error.message);
  process.exit(1);
}
