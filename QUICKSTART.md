# 🚀 Démarrage rapide

## ⚠️ Configuration immédiate requise

### 1. Configurer les identifiants

Ouvrez le fichier `.env` et remplacez les valeurs par défaut :

```bash
# Éditez avec votre éditeur préféré
nano .env
# ou
vim .env
# ou ouvrez-le dans votre IDE
```

**Remplacez :**

```env
ANTMINER_HOST=http://192.168.100.220        # ← Votre IP Antminer
ANTMINER_USERNAME=root                       # ← Généralement 'root'
ANTMINER_PASSWORD=your_password_here         # ← VOTRE MOT DE PASSE ICI !
```

### 2. Lancer l'application

```bash
bun dev
```

### 3. Ouvrir le dashboard

Ouvrez votre navigateur : [http://localhost:3000](http://localhost:3000)

---

## 🔍 Vérification de la connexion

Si vous voyez une erreur 401, vérifiez :

1. ✅ Le mot de passe dans `.env` est correct
2. ✅ L'IP de l'Antminer est accessible (testez avec `ping 192.168.100.220`)
3. ✅ Le nom d'utilisateur est correct (généralement `root`)
4. ✅ L'Antminer est allumé et connecté au réseau

### Test de connectivité

```bash
# Test ping
ping 192.168.100.220

# Test HTTP (devrait répondre 401)
curl -I http://192.168.100.220/cgi-bin/get_system_info.cgi
```

---

## 📊 Console de debug

Quand vous lancez `bun dev`, vous verrez des logs détaillés :

```
[DIGEST AUTH] Starting authenticated fetch to: http://...
[DIGEST AUTH] Initial response status: 401
[DIGEST AUTH] Parsed WWW-Authenticate: { realm: '...', nonce: '...' }
[DIGEST AUTH] Generating auth header with params: ...
[DIGEST AUTH] Authenticated response status: 200  ← Succès !
```

Si vous voyez `status: 401` deux fois, le mot de passe est incorrect.

---

## 🎯 Checklist rapide

- [ ] Fichier `.env` créé
- [ ] Mot de passe Antminer configuré
- [ ] IP Antminer correcte
- [ ] Antminer accessible sur le réseau
- [ ] Application lancée avec `bun dev`
- [ ] Dashboard ouvert sur http://localhost:3000

---

## 💡 Problèmes courants

### "Error: Missing required environment variables"

→ Le fichier `.env` n'existe pas ou est mal configuré

**Solution :** Vérifiez que le fichier existe et contient toutes les variables

### "Error: HTTP error! status: 401"

→ Identifiants incorrects

**Solution :** Vérifiez le mot de passe dans `.env`

### "ECONNREFUSED" ou "Network error"

→ L'Antminer n'est pas accessible

**Solution :** 
- Vérifiez l'IP avec `ping`
- Vérifiez que l'Antminer est sur le même réseau
- Vérifiez le pare-feu

---

## 🎉 Tout fonctionne ?

Vous devriez voir :

- ✅ Statut "Connecté à l'Antminer" en vert
- ✅ Données système affichées
- ✅ Actualisation automatique toutes les 10 secondes

**Enjoy your dashboard! 🚀**

