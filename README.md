# Antminer Dashboard 🔧⚡

Dashboard moderne et sécurisé pour surveiller votre Antminer en temps réel.

## ✨ Fonctionnalités

- 🔒 **Ultra-sécurisé** : Authentification Digest pour les appels API
- ⚡ **Temps réel** : Actualisation automatique toutes les 10 secondes
- 🎨 **Interface moderne** : Design élégant avec Tailwind CSS
- 🚀 **Performance** : Construit avec Next.js 15, Bun et tRPC
- 📊 **Visualisation complète** : Affichage des données système de l'Antminer

## 🔧 Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **Bun** : Runtime JavaScript ultra-rapide
- **tRPC** : API type-safe
- **Tailwind CSS** : Framework CSS utility-first
- **TypeScript** : Typage statique
- **React Query** : Gestion d'état et cache
- **Lucide React** : Icônes modernes

## 🚀 Installation

1. **Cloner le projet** (si ce n'est pas déjà fait)

```bash
cd /root/Dev/noext/antminer
```

2. **Installer les dépendances**

```bash
bun install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Antminer API Configuration
ANTMINER_HOST=http://192.168.xxx.xxx
ANTMINER_USERNAME=YOUR_USER
ANTMINER_PASSWORD=YOUR_PASSWORD

# Security - Change this to a random string in production
# Generate with: openssl rand -base64 32
API_SECRET_KEY=change_this_to_a_random_secret_key_in_production
```

⚠️ **IMPORTANT** : Remplacez `votre_mot_de_passe_ici` par le vrai mot de passe de votre Antminer.

4. **Générer une clé secrète sécurisée**

```bash
openssl rand -base64 32
```

Copiez le résultat dans `API_SECRET_KEY` dans votre `.env`.

## 🏃 Lancer le projet

### Mode développement

```bash
bun dev
```

Le dashboard sera accessible sur [http://localhost:3000](http://localhost:3000)

### Mode production

```bash
# Build
bun run build

# Start
bun start
```

## 🔒 Sécurité

Ce projet implémente plusieurs couches de sécurité :

### 1. Authentification Digest
- Utilise l'authentification Digest HTTP (plus sécurisée que Basic Auth)
- Le mot de passe n'est jamais envoyé en clair
- Protection contre les attaques replay

### 2. Variables d'environnement
- Toutes les credentials sont stockées dans `.env`
- Le fichier `.env` est ignoré par Git (ne sera jamais commité)
- Utilisez `.env.example` comme template

### 3. API sécurisée côté serveur
- Les appels à l'Antminer se font **uniquement** côté serveur
- Jamais d'exposition des credentials au client
- tRPC fournit une couche type-safe

### 4. Bonnes pratiques
- **NE JAMAIS** commiter le fichier `.env`
- **NE JAMAIS** exposer vos credentials
- Changez la clé `API_SECRET_KEY` en production
- Utilisez HTTPS en production (reverse proxy comme Nginx)

## 📁 Structure du projet

```
antminer/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── trpc/            # tRPC API endpoints
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Page dashboard
│   └── providers.tsx        # React Query & tRPC providers
├── lib/                     # Librairies utilitaires
│   ├── antminer-client.ts   # Client API Antminer
│   ├── digest-auth.ts       # Authentification Digest
│   ├── trpc.ts              # Configuration tRPC serveur
│   └── trpc-client.ts       # Configuration tRPC client
├── server/
│   └── routers/             # Routes tRPC
│       ├── _app.ts          # Router principal
│       └── antminer.ts      # Endpoints Antminer
├── .env                     # Variables d'environnement (à créer)
└── README.md
```

## 🎨 Personnalisation

### Changer l'intervalle de rafraîchissement

Dans `app/page.tsx`, modifiez la valeur `refetchInterval` :

```typescript
const { data: systemInfo } = trpc.antminer.getSystemInfo.useQuery(
  undefined,
  {
    refetchInterval: 10000, // 10 secondes (en millisecondes)
  }
);
```

### Ajouter de nouveaux endpoints

1. Ajoutez une méthode dans `lib/antminer-client.ts`
2. Créez un nouveau endpoint dans `server/routers/antminer.ts`
3. Utilisez-le dans vos composants avec `trpc.antminer.yourEndpoint.useQuery()`

## 🐛 Dépannage

### Erreur "Missing required environment variables"
- Vérifiez que le fichier `.env` existe
- Vérifiez que toutes les variables sont définies

### Erreur de connexion à l'Antminer
- Vérifiez que l'IP de l'Antminer est correcte
- Vérifiez que l'Antminer est accessible sur le réseau
- Vérifiez le nom d'utilisateur et le mot de passe

### Le dashboard ne se rafraîchit pas
- Vérifiez que `refetchInterval` est défini
- Ouvrez la console du navigateur pour voir les erreurs

## 📝 License

MIT

## 🙏 Crédits

Dashboard créé avec Next.js, tRPC, Tailwind CSS et beaucoup de ❤️
