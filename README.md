# 🇫🇷 Contribcit

> Plateforme DSFR de participation citoyenne et de pilotage pour les communes françaises.

Contribcit est une application Next.js qui combine :

- un portail citoyen pour déclarer des alertes ou suggérer des améliorations,
- un cockpit DSFR pour les agents municipaux,
- un socle API et data gouverné par Prisma (MongoDB).

La mission : fluidifier la boucle de contribution entre habitants et collectivités, sur une interface 100 % nation branding République française.

---

## Sommaire

- [🌟 Vision & positionnement](#-vision--positionnement)
- [🏛️ Surfaces produit](#️-surfaces-produit)
- [🧱 Architecture applicative](#-architecture-applicative)
- [🧭 Parcours principaux](#-parcours-principaux)
- [🛠️ Stack & outils](#️-stack--outils)
- [🚀 Prise en main rapide](#-prise-en-main-rapide)
- [🔐 Variables d'environnement](#-variables-denvironnement)
- [📦 Scripts utiles](#-scripts-utiles)
- [🎨 Design System République Française](#-design-system-république-française)
- [📊 Modèle de données](#-modèle-de-données)
- [✅ Qualité & sécurité](#-qualité--sécurité)
- [🤝 Contribuer](#-contribuer)
- [📄 Licence](#-licence)

---

## 🌟 Vision & positionnement

- **Public cible** : cabinets de maires, directions de la relation usagers, services techniques.
- **Proposition de valeur** : centraliser les remontées terrain (alertes, suggestions) et piloter leur traitement depuis une interface DSFR familière.
- **Piliers** :
  - Transparence citoyenne
  - Réactivité des services municipaux
  - Conformité RGAA & identité visuelle État

---

## 🏛️ Surfaces produit

- **Portail public (`/`)**

  - Landing inspirée communication d'État.

- Tunnel citoyen (`/contrib/[communeSlug]`) pour soumettre alertes et suggestions avec cartes Leaflet et upload Cloudinary.

  - Pages éditoriales : confidentialité, FAQ, suivi des bugs publiquement.

- **Back-office DSFR (`/admin`)**

  - Authentification interne, journalisation des connexions.
  - Gestion des communes, agents municipaux, responsables de compte.
  - Suivi des contributions par statut (ouvert / clos) et historique d'audit.
  - Pilotage des retours produit et bug reports.

- **API `/app/api/*`**
  - Endpoints REST sécurisés pour l’admin (communes, contributions, town employees, profils).
  - Services publics (BAN/OSM) encapsulés pour la recherche d’adresses.
  - Soumission publique des bug reports avec captcha et Cloudinary.

---

## 🧱 Architecture applicative

- **Next.js 16 – App Router** : rendu mixte (SSR/ISR) avec composants server/client.
- **Modules fonctionnels** :
  - `app/` : routes publiques, admin, API.
  - `components/` : bibliothèque DSFR + composants métier (tableaux, dashboards, formulaires).
  - `lib/` : accès aux services (Prisma, Cloudinary, session HMAC, stats).
  - `prisma/` : schéma MongoDB + enums métier (rôles, statuts, typologies).
  - `scripts/` : utilitaires CLI (admin bootstrap, copie DSFR).
- **Gestion de session** : cookies signés HMAC maison (`lib/session.ts`) avec 6 h de validité.
- **Data** : MongoDB via Prisma 6 (types générés au build postinstall).
- **Stockage assets** : Cloudinary (images de contributions, captures bug reports).

---

## 🧭 Parcours principaux

### Contribution citoyenne

1. Sélection de la commune par lien direct ou annuaire.
2. Formulaire guidé DSFR avec catégories, localisation (BAN/OSM), photo optionnelle.
3. Création `Contribution` (statut `OPEN`) et upload Cloudinary + stockage métadonnées.
4. Agents municipaux reçoivent la notification et peuvent clôturer avec note + pièce jointe.

### Gestion communale

1. Authentification agent (role `ADMIN` ou `ACCOUNT_MANAGER`).
2. Tableau de bord : contributions, statistiques, activités récentes.
3. Attribution des agents à une commune, historisation via `CityAuditLog`.
4. Clôture contribution → journalisation + KPI mis à jour.

### Retours produit

1. Collecte publique via `/bug` (captcha).
2. Traitement interne (qualifier, prioriser, marquer déployé).
3. Desk DSFR `AdminBugReportsDashboard` pour le suivi.

---

## 🛠️ Stack & outils

- **Cadre** : Next.js 16 · React 19 · TypeScript 5.
- **Design** : `@codegouvfr/react-dsfr`, Tailwind CSS 4 (overrides maîtrisés), animations Framer Motion.
- **Data** : Prisma 6, MongoDB (enums métiers pour rôles, statuts, typologies).
- **Géolocalisation** : Leaflet + recherche BAN / OSM (User-Agent configurable).
- **Media** : Cloudinary SDK pour upload sécurisé.
- **Validation** : Zod pour schémas formulaires côté client/server.
- **Qualité** : ESLint 9 + config Next, Husky + Commitlint + Commitizen.

---

## 🚀 Prise en main rapide

```bash
# Installer les dépendances
npm install

# Copier le DSFR dans /public (postinstall le fait automatiquement)
npm run postinstall

# Lancer le serveur de développement
npm run dev

# Build & start en mode production
npm run build
npm start
```

L’interface est disponible sur `http://localhost:3000`.  
L’admin est accessible via `/admin` (pensez à créer un compte, cf. scripts ci-dessous).

---

## 🔐 Variables d'environnement

### Configuration Brevo (emails transactionnels)

Pour activer l'envoi d'emails de notification, vous devez configurer Brevo :

1. **Créer un compte Brevo** : https://www.brevo.com/fr/
2. **Obtenir votre clé API** :
   - Connectez-vous à votre compte Brevo
   - Allez dans **Paramètres** → **Clés API** (https://app.brevo.com/settings/keys/api)
   - Créez une nouvelle clé API ou utilisez une clé existante
   - Copiez la clé API (format : `xkeysib-...`)
3. **Configurer l'expéditeur** :
   - Allez dans **Paramètres** → **Expéditeurs** (https://app.brevo.com/settings/senders)
   - Ajoutez et vérifiez votre domaine ou utilisez une adresse email vérifiée
   - Mettez à jour l'adresse `sender.email` dans `lib/email.ts` si nécessaire
4. **Ajouter la variable d'environnement** :
   ```bash
   BREVO_API_KEY=xkeysib-votre-cle-api-ici
   ```

**Note** : Sans `BREVO_API_KEY`, l'envoi d'emails sera désactivé mais l'application continuera de fonctionner normalement.

## 🔐 Variables d'environnement

| Variable                         | Obligatoire  | Description                                     | Exemple                          |
| -------------------------------- | ------------ | ----------------------------------------------- | -------------------------------- |
| `DATABASE_URL`                   | ✅           | Chaîne de connexion MongoDB pour Prisma         | `mongodb+srv://`…                |
| `SESSION_SECRET`                 | ✅           | Clé HMAC pour signer les cookies session        | `super-secret-64`                |
| `BASE_URL`                       | ✅           | URL publique utilisée pour SEO & liens          | `https://contribcit.fr`          |
| `NEXT_PUBLIC_COMMUNE_PORTAL_URL` | ➖           | URL externe vers portail communes               | `https://communes.contribcit.fr` |
| `BAN_USER_AGENT`                 | ➖           | User-Agent pour requêtes Base Adresse Nationale | `Contribcit/1.0 (+contact@...)`  |
| `OSM_USER_AGENT`                 | ➖           | User-Agent pour requêtes OpenStreetMap          | `Contribcit/1.0 (+contact@...)`  |
| `CLOUDINARY_CLOUD_NAME`          | ✅ si upload | Espace Cloudinary                               | `contribcit`                     |
| `CLOUDINARY_API_KEY`             | ✅ si upload | Clef API Cloudinary                             | `1234567890`                     |
| `CLOUDINARY_API_SECRET`          | ✅ si upload | Secret API Cloudinary                           | `abcDEFghiJKL`                   |
| `BREVO_API_KEY`                  | ➖           | Clé API Brevo pour l'envoi d'emails transactionnels | `xkeysib-...`                    |
| `NEXT_PUBLIC_BASE_URL`           | ➖           | URL de base pour les liens dans les emails      | `https://contribcit.fr`          |

👉 Créez un fichier `.env.local` à la racine et redémarrez `npm run dev` après toute modification.

---

## 📦 Scripts utiles

| Commande               | Rôle                                           |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Lance Next.js en mode développement.           |
| `npm run build`        | Copie le DSFR puis build production.           |
| `npm start`            | Démarre le serveur production local.           |
| `npm run lint`         | Vérifie la qualité de code avec ESLint.        |
| `npm run commit`       | Lance l’assistant Commitizen (conventionnel).  |
| `npm run admin:create` | Crée ou met à jour un compte admin interactif. |

Le script `postinstall` copie automatiquement les assets DSFR (`scripts/copy-dsfr.js`) et génère le client Prisma.

---

## 🎨 Design System République Française

- DSFR importé depuis `@codegouvfr/react-dsfr` et `@gouvfr/dsfr`.
- Copie locale des assets (`public/dsfr/dsfr`) pour servir le CSS/JS officiel.
- `app/layout.tsx` pose le socle identitaire : palette Marianne, `DsfrProviderClient`, bannière de consentement.
- Composants DSFR encapsulés dans `components/*` pour respecter la charte tout en gardant la personnalisation (Tailwind pour micro-ajustements).
- Pages & formulaires structurés avec les squelettes officiels (cartes, onglets, tuiles, steps).

---

## 📊 Modèle de données

- **`User`** : agents, managers, town employees. Gestion des rôles via enum `Role`.
- **`Commune`** : métadonnées OpenStreetMap (bbox, lat/lon, OSM id) + visibilité.
- **`Contribution`** : alertes & suggestions (type, statut, localisation, pièces jointes).
- **`CityAuditLog`** : traçabilité des actions communes (création, mise à jour).
- **`BugReport`** : retours produit publics avec statut Kanban DSFR.
- **`UserLoginLog`** : historisation des connexions (IP, user-agent).

Le schéma est défini dans `prisma/schema.prisma` et compilé via `npx prisma generate`.

---

## ✅ Qualité & sécurité

- Validation des commits via Husky + Commitlint (`commit-msg` hook).
- ESLint + TypeScript strict pour éviter les régressions.
- Sessions chiffrées (HMAC SHA-256) avec durée de vie limitée et cookie `httpOnly`.
- Upload Cloudinary sécurisé (publicId stocké pour suppression).
- Requêtes externes (BAN/OSM) avec User-Agent configurable pour conformité.
- Accessibilité RGAA : composants DSFR, contrastes, navigation clavier, focus visibles.

---

## 🤝 Contribuer

1. Créez une branche décrivant votre sujet.
2. Assurez-vous que `npm run lint` passe.
3. Documentez les nouvelles variables d’environnement ou scripts.
4. Faites un commit conventionnel via `npm run commit`.
5. Ouvrez une Pull Request en décrivant le périmètre et les tests.

Suggestions d’améliorations bienvenues : parcours usagers, métriques, automatisation des imports OSM/BAN.

---

## 📄 Licence

Projet privé – droits réservés Contribcit. Toute réutilisation nécessite accord préalable.
