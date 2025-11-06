# Contribcit - Landing Page

Landing page marketing haut de gamme pour Contribcit, plateforme de contribution citoyenne pour les mairies et collectivités.

## 🚀 Technologies

- **Next.js 16** (App Router) avec **TypeScript**
- **Design System de l'État (DSFR)** via `@codegouvfr/react-dsfr`
- **Framer Motion** pour les animations discrètes
- **Zod** pour la validation des formulaires
- **Tailwind CSS** pour les styles personnalisés

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Démarrer le serveur de production
npm start
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000).

## 🎨 Configuration DSFR

Le Design System de l'État est déjà configuré dans `app/layout.tsx` et `app/globals.css`. Les composants DSFR sont disponibles via `@codegouvfr/react-dsfr`.

## 📝 Variables d'environnement

Créez un fichier `.env.local` à partir de `.env.example` :

```bash
BASE_URL=https://contribcit.fr
```

## 🧩 Structure du projet

```
app/
  layout.tsx          # Layout principal avec DSFR
  page.tsx            # Landing page
  globals.css         # Styles globaux DSFR
  confidentialite/    # Page politique de confidentialité
components/
  Hero.tsx            # Section hero
  Marquee.tsx         # Bandeau de confiance
  Feature.tsx         # Carte de fonctionnalité
  HowItWorks.tsx      # Section "Comment ça marche"
  Kpis.tsx            # Indicateurs clés
  MapTeaser.tsx       # Aperçu de la cartographie
  QrDemo.tsx          # Démonstration QR code
  Testimonials.tsx    # Témoignages
  Faq.tsx             # FAQ
  ContactCta.tsx      # Formulaire de contact
lib/
  seo.ts              # Métadonnées SEO
  contact.ts          # Validation formulaire contact
public/
  illustrations/      # SVG illustrations
```

## ✏️ Modifier le contenu

### Hero

Le contenu du Hero se trouve dans `components/Hero.tsx`. Les taglines alternatives sont disponibles en commentaires.

### Fonctionnalités

Les fonctionnalités sont définies dans `app/page.tsx` dans le tableau `features`. Modifiez les titres, descriptions et icônes DSFR selon vos besoins.

### KPIs

Les KPIs sont définis dans `app/page.tsx` dans le tableau `kpis`. Vous pouvez modifier les valeurs, labels et descriptions.

### FAQ

Les questions/réponses sont définies dans `app/page.tsx` dans le tableau `faqItems`. Ajoutez, modifiez ou supprimez des entrées selon vos besoins.

### Témoignages

Les témoignages sont définis dans `app/page.tsx` dans le tableau `testimonials`. Modifiez les noms, fonctions, communes et textes.

## 🍪 Cookies et Analytics

Le site utilise la bannière de cookies DSFR. Pour configurer Matomo ou un autre service d'analyse :

1. Modifiez `app/layout.tsx` dans le composant `ConsentBanner`
2. Ajoutez le script d'analyse après le consentement dans un composant client

## 🔍 SEO

Les métadonnées SEO sont configurées dans `lib/seo.ts` et utilisées dans `app/layout.tsx`. Le JSON-LD est injecté automatiquement.

## ♿ Accessibilité

Le site respecte les standards d'accessibilité DSFR (AA minimum) :
- Navigation clavier
- ARIA roles et labels
- Contrastes conformes
- Focus visible

## 📄 Licence

Ce projet est privé.
