# 🚛 Transport Token Platform

> Plateforme B2B de transport et logistique avec tarification CNR, tracking temps réel et tokenisation

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/touko501/transport-token-platform)

---

## 🚀 Déploiement en 1 clic

Cliquez sur le bouton ci-dessus pour déployer automatiquement :
- ✅ Base de données PostgreSQL
- ✅ API Backend (Node.js + Express + Prisma)
- ✅ Frontend Client (Next.js 14)
- ✅ Admin Panel (Next.js 14)

---

## 🏗️ Architecture

```
transport-token-platform/
├── backend/           # API Node.js + Express + Prisma
│   ├── server.js      # 900+ lignes, 20+ endpoints
│   ├── seed.js        # Données de test
│   ├── test-api.js    # 14 tests automatisés
│   └── prisma/        # Schéma PostgreSQL
├── frontend/          # Next.js 14 + TailwindCSS
│   └── src/app/       # 7 pages (dashboard, missions, tracking...)
├── admin/             # Next.js 14 (dashboard admin)
├── docker/            # Docker Compose
├── render.yaml        # Déploiement Render
└── railway.json       # Déploiement Railway
```

---

## 💰 Calcul de prix CNR

Tarification basée sur le trinôme CNR (Comité National Routier) :

```
Prix = CK × Distance + CC × Heures + CJ × Jours + Péages + Majorations - Éco
```

- **8 types de véhicules** (fourgon, semi, frigo, benne, plateau...)
- **8 pays européens** (FR, DE, IT, ES, BE, NL, AT, CH)
- **Majorations** : urgence (+50%), week-end (+35%), nuit (+20%), ADR (+25%)
- **Options éco** : HVO (-15%), électrique (-30%)
- **Commission plateforme** : 10%

### Exemple : Paris → Milan (Semi Frigo)
| | Valeur |
|---|---|
| Distance | 831 km |
| Durée | 13.9 heures |
| Prix HT | 3 259.34 € |
| Commission | 296.30 € |
| Prix TTC | 3 976.39 € |

---

## 📡 API Endpoints

### Auth
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion (JWT) |
| GET | `/api/auth/me` | Profil utilisateur |

### Missions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/missions/quote` | Calcul devis |
| GET | `/api/missions` | Liste missions |
| POST | `/api/missions` | Créer mission |
| GET | `/api/missions/:id` | Détail mission |

### Transporteur
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/transporteur/stats` | Statistiques |
| GET | `/api/transporteur/missions` | Mes missions |
| GET | `/api/transporteur/available` | Marketplace |

### Admin
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard |
| GET | `/api/admin/users` | Utilisateurs |
| GET | `/api/admin/missions` | Toutes missions |

### Autres
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tracking/:ref` | Tracking public |
| GET | `/api/pricing/vehicles` | Types véhicules |
| GET | `/api/pricing/countries` | Pays disponibles |
| GET | `/health` | Health check |

---

## 🧪 Tests

```bash
cd backend
node test-api.js
```

**14/14 tests passent ✅**

---

## 👤 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@transport-token.com | Admin123! |
| Client | client@demo.com | Client123! |
| Transporteur | transporteur@demo.com | Transport123! |

---

## 🛠️ Installation locale

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
node seed.js
node server.js        # → http://localhost:4000

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev           # → http://localhost:3000

# Admin (nouveau terminal)
cd admin
npm install
npm run dev -- -p 3001  # → http://localhost:3001
```

---

## 🐳 Docker

```bash
cd docker
docker-compose up -d
```

---

## 📄 Licence

MIT - TRANSTEK © 2025-2026
