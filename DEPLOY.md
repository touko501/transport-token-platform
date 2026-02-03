# 🚀 GUIDE DE DÉPLOIEMENT - TRANSPORT TOKEN

## Option 1: Railway (Recommandé - Backend + DB)

### Étape 1: Créer un compte Railway
1. Aller sur https://railway.app
2. Se connecter avec GitHub

### Étape 2: Déployer le Backend

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Créer un nouveau projet
railway init

# Ajouter PostgreSQL
railway add --plugin postgresql

# Déployer le backend
cd backend
railway up
```

**Variables d'environnement à configurer sur Railway:**
```
DATABASE_URL=<fourni automatiquement par Railway>
JWT_SECRET=transport-token-super-secret-key-2025
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://transport-token.vercel.app
```

### Étape 3: Initialiser la base de données

```bash
# Dans Railway Dashboard > Backend > Settings > Deploy
# Ajouter cette commande de build:
npx prisma generate && npx prisma db push && node seed.js
```

---

## Option 2: Vercel (Frontend)

### Étape 1: Créer un compte Vercel
1. Aller sur https://vercel.com
2. Se connecter avec GitHub

### Étape 2: Déployer le Frontend

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
cd frontend
vercel
```

**Variables d'environnement à configurer sur Vercel:**
```
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app
```

---

## Option 3: Render.com (Alternative gratuite)

### Backend
1. Aller sur https://render.com
2. New > Web Service
3. Connecter le repo GitHub
4. Sélectionner le dossier `backend`
5. Build Command: `npm install && npx prisma generate`
6. Start Command: `node server.js`

### Base de données
1. New > PostgreSQL
2. Copier l'URL de connexion
3. L'ajouter dans les variables du backend

### Frontend
1. New > Static Site
2. Sélectionner le dossier `frontend`
3. Build Command: `npm run build`
4. Publish Directory: `.next`

---

## Option 4: Fly.io

```bash
# Installer Fly CLI
curl -L https://fly.io/install.sh | sh

# Se connecter
fly auth login

# Créer l'app backend
cd backend
fly launch --name transport-token-api

# Créer la DB PostgreSQL
fly postgres create --name transport-token-db
fly postgres attach transport-token-db

# Déployer
fly deploy
```

---

## 🔧 Configuration Production

### Variables d'environnement Backend

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql://...` | URL PostgreSQL |
| `JWT_SECRET` | `min-32-caracteres` | Secret JWT |
| `NODE_ENV` | `production` | Environnement |
| `PORT` | `4000` | Port du serveur |
| `FRONTEND_URL` | `https://...` | URL frontend (CORS) |

### Variables d'environnement Frontend

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api...` | URL de l'API |

---

## 📋 Checklist de déploiement

### Backend
- [ ] PostgreSQL créé et connecté
- [ ] Variables d'environnement configurées
- [ ] `prisma db push` exécuté
- [ ] `node seed.js` exécuté
- [ ] Endpoint `/health` répond OK

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` configurée
- [ ] Build réussi
- [ ] Connexion à l'API fonctionnelle

### Tests post-déploiement
- [ ] Login fonctionne
- [ ] Création de mission fonctionne
- [ ] Calcul de prix fonctionne

---

## 🌐 URLs après déploiement

| Service | URL |
|---------|-----|
| API Backend | `https://transport-token-api.railway.app` |
| Frontend | `https://transport-token.vercel.app` |
| Health Check | `https://transport-token-api.railway.app/health` |

---

## 🆘 Dépannage

### Erreur Prisma
```bash
npx prisma generate
npx prisma db push --force-reset
```

### Erreur CORS
Vérifier que `FRONTEND_URL` est correctement configurée dans le backend.

### Erreur de connexion DB
Vérifier que `DATABASE_URL` est au format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

---

## 💰 Coûts estimés

| Plateforme | Gratuit | Payant |
|------------|---------|--------|
| Railway | 500h/mois | 5$/mois |
| Vercel | Illimité (hobby) | 20$/mois |
| Render | 750h/mois | 7$/mois |
| Fly.io | 3 VMs gratuites | 5$/mois |

**Recommandation:** Railway (backend) + Vercel (frontend) = 100% gratuit pour commencer!
