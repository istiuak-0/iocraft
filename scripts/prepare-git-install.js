const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isGitRepo = fs.existsSync(path.join(__dirname, '..', '.git'));

if (isGitRepo) {
  console.log('Development mode - skipping prepare');
  process.exit(0);
}

try {
  execSync('npm install', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  execSync('npm run core:build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'packages', 'core', 'package.json'), 'utf8')
  );
  packageJson.name = 'vuedi';

  const distSource = path.join(__dirname, '..', 'packages', 'core', 'dist');
  const distDest = path.join(__dirname, '..', 'dist');

  if (fs.existsSync(distSource)) {
    fs.cpSync(distSource, distDest, { recursive: true });
  }

  fs.writeFileSync(path.join(__dirname, '..', 'package.json'), JSON.stringify(packageJson, null, 2));

  console.log('Build complete - vuedi ready for use');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
