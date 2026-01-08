const fs = require('fs');
const path = require('path');

const isGitRepo = fs.existsSync(path.join(__dirname, '..', '.git'));

if (isGitRepo) {
  console.log('Development mode - skipping prepare');
  process.exit(0);
}

const rootDir = path.join(__dirname, '..');
const coreDir = path.join(rootDir, 'packages', 'core');
const sourcePackageJson = path.join(coreDir, 'package.json');
const destPackageJson = path.join(rootDir, 'package.json');
const sourceDist = path.join(coreDir, 'dist');
const destDist = path.join(rootDir, 'dist');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const packageJson = JSON.parse(fs.readFileSync(sourcePackageJson, 'utf8'));
  packageJson.name = 'vuedi';
  fs.writeFileSync(destPackageJson, JSON.stringify(packageJson, null, 2));

  copyDirRecursive(sourceDist, destDist);

  console.log('Prepared for git installation:');
  console.log(`   - Copied ${sourcePackageJson} → ${destPackageJson} (renamed to "vuedi")`);
  console.log(`   - Copied ${sourceDist} → ${destDist}`);
} catch (error) {
  console.error('Failed to prepare package for git installation:', error.message);
  process.exit(1);
}
