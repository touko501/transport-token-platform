# 🚛 Transport Token Platform

> La première plateforme de transport routier européenne avec tarification CNR transparente, paiement sécurisé blockchain et tracking temps réel.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![License](https://img.shields.io/badge/license-Proprietary-blue)
![Node](https://img.shields.io/badge/node-20+-green)

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Configuration](#configuration)
- [Accès aux services](#accès-aux-services)
- [API Documentation](#api-documentation)
- [Comptes de test](#comptes-de-test)

---

## 🎯 Vue d'ensemble

**Transport Token** est une plateforme SaaS B2B de mise en relation expéditeurs/transporteurs couvrant 29 pays européens.

### Fonctionnalités clés

- ✅ **Tarification CNR** - Trinôme officiel français (CK×km + CC×h + CJ×j)
- ✅ **29 pays européens** - Couverture UE + Suisse/UK avec TVA/péages
- ✅ **Commission unique 10%** - Transparence totale
- ✅ **Tracking temps réel** - WebSocket GPS live
- ✅ **Paiement sécurisé** - Escrow + Blockchain ready
- ✅ **TT Score** - Indice écologique propriétaire

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UTILISATEURS                                │
│  🌐 Client (3000)  │  🚛 Transporteur  │  👨‍💼 Admin (3001)  │  📊 Metabase │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   🚀 API Backend      │
                    │   Node.js + Express   │
                    │      (port 4000)      │
                    └───────────┬───────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
    ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
    │  🗄️ PostgreSQL │   │  ⚡ Redis      │   │  📁 S3/MinIO  │
    │   (port 5432) │   │  (port 6379)  │   │   (stockage)  │
    └───────────────┘   └───────────────┘   └───────────────┘
```

### Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js 20 + Express + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 |
| Frontend | Next.js 14 + TailwindCSS |
| Admin | Next.js 14 + TailwindCSS |
| Analytics | Metabase |
| Conteneurs | Docker + Docker Compose |

---

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Node.js 20+ (pour développement local)
- Git

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/transtek/transport-token-platform.git
cd transport-token-platform

# 2. Copier la configuration
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Démarrer avec Docker
cd docker
docker-compose up -d

# 4. Initialiser la base de données
docker exec tt-backend npx prisma db push
docker exec tt-backend npx prisma db seed
```

### Développement local (sans Docker)

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev

# Admin (nouveau terminal)
cd admin
npm install
npm run dev
```

---

## ⚙️ Configuration

### Variables d'environnement principales

```env
# Database
POSTGRES_USER=transporttoken
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=transporttoken
DATABASE_URL=postgresql://...

# Redis
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe (Paiements)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000
```

---

## 🌐 Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend Client** | http://localhost:3000 | Interface client/transporteur |
| **Admin Panel** | http://localhost:3001 | Backoffice administration |
| **API Backend** | http://localhost:4000 | REST API |
| **Metabase** | http://localhost:3003 | Analytics & BI |
| **Adminer** | http://localhost:8080 | Gestion base de données |

---

## 📚 API Documentation

### Authentification

```bash
# Login
POST /api/auth/login
{
  "email": "client@demo.com",
  "password": "Client123!"
}

# Register
POST /api/auth/register
{
  "email": "new@user.com",
  "password": "Password123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "CLIENT",
  "company": {
    "name": "Ma Société",
    "siret": "12345678901234"
  }
}
```

### Missions

```bash
# Calculer un devis
POST /api/missions/quote
{
  "pickupLat": 48.8566,
  "pickupLon": 2.3522,
  "pickupCountry": "FR",
  "deliveryLat": 45.7640,
  "deliveryLon": 4.8357,
  "deliveryCountry": "FR",
  "vehicleType": "FOURGON_20M3",
  "weightKg": 1000,
  "isUrgent": false
}

# Créer une mission
POST /api/missions
Authorization: Bearer <token>
{
  "pickupAddress": "15 Rue de la Paix",
  "pickupCity": "Paris",
  ...
}

# Liste des missions
GET /api/missions
Authorization: Bearer <token>
```

### Tarification CNR

```bash
# Configurations véhicules (16 types)
GET /api/pricing/vehicles

# Configurations pays (29 pays)
GET /api/pricing/countries

# Majorations disponibles
GET /api/pricing/surcharges
```

---

## 👤 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@transport-token.com | Admin123! |
| **Client** | client@demo.com | Client123! |
| **Transporteur** | transporteur@demo.com | Transport123! |

---

## 📊 Modèle économique

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALCUL PRIX MISSION                          │
├─────────────────────────────────────────────────────────────────┤
│  Base = CK × km + CC × heures + CJ × jours  (Trinôme CNR)      │
│  + Péages (moyenne pays départ/arrivée × distance)              │
│  + Majorations (urgent +50%, weekend +35%, nuit +20%, etc.)    │
│  - Réduction éco (HVO -15%, électrique -30%)                   │
│  + Commission plateforme = 10%                                  │
│  + TVA pays destination                                         │
│  ═══════════════════════════════════                           │
│  = PRIX TTC                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Développement

### Structure du projet

```
transport-token-platform/
├── backend/              # API Node.js
│   ├── prisma/          # Schéma BDD
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middlewares/
│   └── Dockerfile
├── frontend/            # Next.js Client
│   ├── src/app/
│   └── Dockerfile
├── admin/               # Next.js Admin
│   └── src/app/
├── docker/
│   └── docker-compose.yml
└── README.md
```

### Commandes utiles

```bash
# Logs
docker-compose logs -f backend

# Reset base de données
docker exec tt-backend npx prisma db push --force-reset
docker exec tt-backend npx prisma db seed

# Accès PostgreSQL
docker exec -it tt-postgres psql -U transporttoken

# Rebuild
docker-compose build --no-cache backend
```

---

## 📞 Support

- **Email**: support@transport-token.com
- **Documentation**: https://docs.transport-token.com
- **API Status**: https://status.transport-token.com

---

## 📜 Licence

© 2025 Transport Token by TRANSTEK. Tous droits réservés.

---

<p align="center">
  <strong>🚛 Transport Token</strong><br>
  <em>La plateforme de transport nouvelle génération</em>
</p>
