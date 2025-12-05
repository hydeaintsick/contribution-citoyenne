# Configuration Discord - Canal de discussion interne

Ce document explique comment configurer le canal Discord pour la messagerie interne entre admins et account managers.

## Lien du canal

Le lien actuel du canal est configuré dans `components/DiscordBanner.tsx` :
```
https://discord.com/channels/1298297654631207043/1298297654631207046
```

## Configuration du serveur Discord (gratuite)

### 1. Créer un lien d'invitation permanent

Pour permettre aux admins et account managers de rejoindre facilement le canal :

1. Ouvrez Discord et accédez à votre serveur
2. Cliquez sur le nom du serveur en haut à gauche
3. Allez dans **Paramètres du serveur** → **Invitations**
4. Cliquez sur **Créer une invitation**
5. Sélectionnez le canal spécifique (`#nom-du-canal`)
6. Configurez les paramètres :
   - **Durée** : Sélectionnez "Jamais d'expiration"
   - **Utilisations maximales** : Laissez vide (illimité) ou définissez un nombre
   - **Autoriser les membres temporaires** : Désactivez si vous voulez que les membres acceptent les règles avant d'accéder
7. Cliquez sur **Créer une invitation**
8. Copiez le lien d'invitation

**Note** : Si vous avez déjà un lien d'invitation permanent, vous pouvez l'utiliser directement. Le lien du canal dans le code pointe directement vers le canal spécifique.

### 2. Configurer les permissions du canal

Pour limiter l'accès au canal aux admins et account managers uniquement :

1. Faites un clic droit sur le canal Discord
2. Sélectionnez **Modifier le canal**
3. Allez dans l'onglet **Permissions**
4. Supprimez la permission **Voir le canal** pour le rôle **@everyone**
5. Ajoutez la permission **Voir le canal** uniquement pour :
   - Les rôles spécifiques (Admin, Account Manager)
   - Ou les membres individuels si vous n'utilisez pas de rôles

**Alternative avec rôles** :
1. Créez des rôles "Admin" et "Account Manager" dans les paramètres du serveur
2. Assignez ces rôles aux membres concernés
3. Configurez les permissions du canal pour ces rôles uniquement

### 3. Personnaliser le canal

Pour améliorer l'expérience de discussion :

1. **Description du canal** :
   - Clic droit sur le canal → **Modifier le canal**
   - Ajoutez une description : "Canal de discussion interne pour les admins et account managers de Contribcit"

2. **Épingler des messages importants** :
   - Clic droit sur un message → **Épingler le message**
   - Utile pour les règles, procédures, ou informations importantes

3. **Notifications** :
   - Clic droit sur le canal → **Paramètres de notification**
   - Configurez selon vos préférences (tous les messages, seulement les mentions, etc.)

4. **Threads** :
   - Utilisez les threads pour organiser les discussions par sujet
   - Clic droit sur un message → **Créer un fil**

## Mise à jour du lien dans le code

Si vous changez le lien du canal Discord, mettez à jour la constante `DISCORD_CHANNEL_URL` dans le fichier `components/DiscordBanner.tsx` :

```typescript
const DISCORD_CHANNEL_URL = "https://discord.com/channels/VOTRE_SERVEUR_ID/VOTRE_CANAL_ID";
```

## Accès depuis l'application

Le bandeau Discord apparaît automatiquement sur :
- Le tableau de bord admin (`/admin`) pour les utilisateurs avec le rôle ADMIN
- La vue d'ensemble (`/admin`) pour les utilisateurs avec le rôle ACCOUNT_MANAGER

Le bandeau utilise le style violet du Design System de l'État français (`fr-notice--weather-purple`) pour une intégration visuelle cohérente.

## Dépannage

### Le lien ne fonctionne pas
- Vérifiez que le lien d'invitation est toujours valide
- Vérifiez que les permissions du canal permettent l'accès
- Assurez-vous que le membre a accepté l'invitation au serveur

### Le bandeau n'apparaît pas
- Vérifiez que l'utilisateur a bien le rôle ADMIN ou ACCOUNT_MANAGER
- Vérifiez que le composant `DiscordBanner` est bien importé dans les composants concernés
- Vérifiez la console du navigateur pour d'éventuelles erreurs

