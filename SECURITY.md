# Sécurité 🔒

Ce document détaille les mesures de sécurité implémentées dans l'application Antminer Dashboard.

## 🛡️ Mesures de sécurité implémentées

### 1. Authentification Digest HTTP

L'application utilise l'authentification **Digest** (RFC 2617) pour communiquer avec l'Antminer :

- ✅ Le mot de passe n'est **jamais** envoyé en clair
- ✅ Utilisation de hachage MD5 avec nonce, cnonce et counter
- ✅ Protection contre les attaques replay
- ✅ Plus sécurisé que l'authentification Basic

**Implémentation** : `lib/digest-auth.ts`

### 2. Variables d'environnement sécurisées

Toutes les credentials sensibles sont stockées dans des variables d'environnement :

```env
ANTMINER_HOST=http://192.168.xxx.xxx
ANTMINER_USERNAME=YOUR_USER
ANTMINER_PASSWORD=YOUR_PASSWORD
API_SECRET_KEY=A_RANDOM_KEY
```

- ✅ `.env` est dans `.gitignore` (jamais commité)
- ✅ Séparation des secrets du code
- ✅ Différents secrets par environnement (dev/prod)

### 3. Architecture sécurisée

#### API côté serveur uniquement

Les appels à l'Antminer se font **uniquement** côté serveur via tRPC :

```
Client (Browser) → tRPC → Server API → Antminer
```

- ✅ Aucune credential n'est exposée au client
- ✅ Impossible d'inspecter les headers d'authentification
- ✅ Le code d'authentification ne s'exécute que sur le serveur

#### Headers de sécurité HTTP

Le middleware Next.js (`middleware.ts`) ajoute des headers de sécurité :

```typescript
// Security headers implémentés
X-Frame-Options: SAMEORIGIN                    // Protection clickjacking
X-Content-Type-Options: nosniff                // Protection MIME sniffing
X-XSS-Protection: 1; mode=block                // Protection XSS
Strict-Transport-Security: max-age=63072000    // Force HTTPS
Content-Security-Policy: ...                   // CSP strict
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: ...                        // Désactive APIs inutiles
```

### 4. Type-safety avec TypeScript

- ✅ Tous les fichiers sont typés avec TypeScript
- ✅ Validation des données avec Zod
- ✅ tRPC fournit une sécurité de type end-to-end
- ✅ Réduction des erreurs de runtime

### 5. Dépendances à jour

Le projet utilise les dernières versions stables :

- Next.js 15+
- React 19
- tRPC 11+
- Bun (runtime moderne et sécurisé)

## 🚨 Recommandations de production

### 1. HTTPS obligatoire

**⚠️ IMPORTANT** : En production, utilisez **TOUJOURS** HTTPS.

#### Option A : Reverse Proxy (recommandé)

Utilisez Nginx ou Caddy comme reverse proxy :

**Nginx example :**

```nginx
server {
    listen 443 ssl http2;
    server_name antminer.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Caddy example (encore plus simple) :**

```caddy
antminer.example.com {
    reverse_proxy localhost:3000
}
```

#### Option B : Vercel / Cloud Provider

Déployez sur Vercel, Netlify, ou un autre provider qui gère HTTPS automatiquement.

### 2. Génération d'une clé secrète forte

Générez une clé secrète cryptographiquement sécurisée :

```bash
openssl rand -base64 32
```

Ajoutez-la dans `.env` :

```env
API_SECRET_KEY=YOUR_RANDOM_KEY
```

### 3. Restriction d'accès réseau

#### Pare-feu

Limitez l'accès à l'application :

```bash
# UFW example (Ubuntu)
sudo ufw allow from 192.168.100.0/24 to any port 3000
sudo ufw deny 3000
```

#### VPN

Pour un accès externe, utilisez un VPN (WireGuard, OpenVPN, Tailscale) plutôt que d'exposer l'app publiquement.

### 4. Monitoring et logs

Activez les logs pour surveiller les accès :

```typescript
// Dans server/routers/antminer.ts
console.log('[SECURITY] API access:', {
  timestamp: new Date().toISOString(),
  endpoint: 'getSystemInfo',
  ip: request.ip, // Ajoutez le context pour obtenir l'IP
});
```

### 5. Rate limiting

Ajoutez un rate limiter pour prévenir les abus :

```bash
bun add @upstash/ratelimit @upstash/redis
```

Ou utilisez un reverse proxy avec rate limiting (Nginx, Caddy).

### 6. Authentification utilisateur (optionnel)

Si vous voulez protéger l'accès au dashboard, ajoutez une authentification :

- **NextAuth.js** : Solution complète
- **Authentification basique** : Simple et efficace
- **Tailscale** : Authentification réseau

## 🔍 Audit de sécurité

### Checklist avant déploiement

- [ ] `.env` contient des vraies credentials (pas les exemples)
- [ ] `API_SECRET_KEY` est une clé aléatoire forte
- [ ] `.env` est dans `.gitignore`
- [ ] HTTPS est configuré (production)
- [ ] Headers de sécurité sont actifs
- [ ] Pare-feu est configuré
- [ ] Les dépendances sont à jour
- [ ] Les logs sont activés

### Tests de sécurité

```bash
# Test des headers de sécurité
curl -I https://votre-domaine.com

# Scan de vulnérabilités des dépendances
bun audit

# Test SSL (si HTTPS)
openssl s_client -connect votre-domaine.com:443
```

## 🐛 Signaler une vulnérabilité

Si vous découvrez une faille de sécurité :

1. **NE PAS** créer d'issue publique
2. Contactez les mainteneurs en privé
3. Donnez le temps de corriger avant divulgation publique

## 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [RFC 2617 - HTTP Digest Authentication](https://datatracker.ietf.org/doc/html/rfc2617)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

**Restez vigilant et gardez votre système à jour !** 🛡️

