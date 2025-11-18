# Icônes PWA pour Contribcit

Ce dossier contient les icônes nécessaires pour la Progressive Web App (PWA).

## Fichiers requis

- `icon-192.png` : Icône 192x192 pixels (requis)
- `icon-512.png` : Icône 512x512 pixels (requis)

## Génération des icônes

### Option 1 : Utiliser l'image Marianne existante

Vous pouvez utiliser `/public/marianne.png` comme base et la redimensionner :

```bash
# Avec ImageMagick
convert marianne.png -resize 192x192 -background "#000091" -gravity center -extent 192x192 icons/icon-192.png
convert marianne.png -resize 512x512 -background "#000091" -gravity center -extent 512x512 icons/icon-512.png

# Avec Sharp (Node.js)
node -e "const sharp = require('sharp'); sharp('public/marianne.png').resize(192, 192).extend({top: 0, bottom: 0, left: 0, right: 0, background: '#000091'}).toFile('public/icons/icon-192.png');"
node -e "const sharp = require('sharp'); sharp('public/marianne.png').resize(512, 512).extend({top: 0, bottom: 0, left: 0, right: 0, background: '#000091'}).toFile('public/icons/icon-512.png');"
```

### Option 2 : Créer des icônes simples

Vous pouvez créer des icônes simples avec :
- Fond bleu République française (#000091)
- Logo ou texte "C" pour Contribcit
- Design conforme au Design System de l'État

### Option 3 : Utiliser un outil en ligne

- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## Spécifications

- Format : PNG avec transparence
- Taille : 192x192 et 512x512 pixels
- Purpose : "any maskable" (icônes adaptatives)
- Couleur de thème : #000091 (bleu République française)

## Note temporaire

En attendant la génération des icônes PNG, le fichier `icon.svg` peut servir de base.
Pour une PWA fonctionnelle, les fichiers PNG sont requis.

