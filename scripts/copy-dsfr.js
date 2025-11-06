#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/@gouvfr/dsfr/dist/dsfr');
const targetDir = path.join(__dirname, '../public/dsfr/dsfr');

// Créer le répertoire cible s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Fonction récursive pour copier les fichiers
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copier les fichiers
if (fs.existsSync(sourceDir)) {
  console.log('Copying DSFR files to public/dsfr/dsfr...');
  copyRecursiveSync(sourceDir, targetDir);
  console.log('DSFR files copied successfully!');
} else {
  console.error(`Source directory not found: ${sourceDir}`);
  process.exit(1);
}

