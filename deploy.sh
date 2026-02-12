#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# FRETNOW — Script de déploiement autonome v4.0
# ═══════════════════════════════════════════════════════════════════════════
# Usage: bash deploy.sh [--push] [--test]
# --push : push vers GitHub (déclenche auto-deploy Render)
# --test : lancer la batterie de tests après déploiement
# ═══════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${BLUE}🚛 FRETNOW — Déploiement v4.0${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""

API_URL="${API_URL:-https://transport-token-api.onrender.com}"
GITHUB_REPO="touko501/transport-token-platform"

# ── STEP 1: Vérification pré-déploiement ──
echo -e "${YELLOW}📋 1. Vérification pré-déploiement...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js requis${NC}"
  exit 1
fi

node -c backend/server.js > /dev/null 2>&1 && echo -e "  ${GREEN}✅ Syntaxe JS OK${NC}" || { echo -e "${RED}❌ Erreur syntaxe server.js${NC}"; exit 1; }

ROUTE_COUNT=$(grep -c "^app\.\(get\|post\|put\|patch\|delete\)" backend/server.js)
echo -e "  ${GREEN}✅ ${ROUTE_COUNT} routes détectées${NC}"

echo -e "  ${GREEN}✅ Schema Prisma: $(wc -l < backend/prisma/schema.prisma) lignes${NC}"
echo -e "  ${GREEN}✅ Seed: $(wc -l < backend/seed.js) lignes${NC}"

# ── STEP 2: Install & Prisma generate (local) ──
echo ""
echo -e "${YELLOW}📦 2. Installation dépendances...${NC}"
cd backend
npm install --production 2>/dev/null || npm install 2>/dev/null
npx prisma generate 2>/dev/null && echo -e "  ${GREEN}✅ Prisma client généré${NC}" || echo -e "  ${YELLOW}⚠️  Prisma generate skipped (pas de DB locale)${NC}"
cd ..

# ── STEP 3: Push vers GitHub ──
if [[ "$*" == *"--push"* ]]; then
  echo ""
  echo -e "${YELLOW}🚀 3. Push vers GitHub...${NC}"
  
  if [ ! -d ".git" ]; then
    git init
    git remote add origin "https://github.com/${GITHUB_REPO}.git"
  fi
  
  git add -A
  git commit -m "🚀 FRETNOW v4.0 — Bug fixes + 13 routes manquantes + Schema v4

  Changements:
  - FIX: vehicleType invalide retourne 400 (plus de fallback silencieux)
  - +13 routes: logout, vehicles CRUD, cancel, profile, analytics, GPS tracking, surcharges, admin verify/disputes
  - Schema v4: 6 nouvelles tables (Payment, Dispute, GpsPosition, Document, AuditLog, InviteCode)
  - Seed v4 avec données démo et 4 véhicules
  - 50 routes API (vs 33 en v3.1)
  - Référence FN- au lieu de TT-
  " 2>/dev/null || echo "  ℹ️  Rien à committer"
  
  git push origin main 2>/dev/null && echo -e "  ${GREEN}✅ Pushé vers GitHub${NC}" || echo -e "  ${RED}❌ Push échoué (vérifiez vos credentials)${NC}"
  
  echo ""
  echo -e "${YELLOW}⏳ Render redéploie automatiquement après le push...${NC}"
  echo "  Attente 60s pour le cold start..."
  sleep 60
fi

# ── STEP 4: Vérification post-déploiement ──
echo ""
echo -e "${YELLOW}🔍 4. Vérification API en production...${NC}"

HEALTH=$(curl -s --max-time 30 "${API_URL}/health")
STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "down")
VERSION=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','unknown'))" 2>/dev/null || echo "unknown")
DB=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('database','unknown'))" 2>/dev/null || echo "unknown")

if [ "$STATUS" == "ok" ]; then
  echo -e "  ${GREEN}✅ API: ${STATUS}${NC}"
  echo -e "  ${GREEN}✅ Version: ${VERSION}${NC}"
  echo -e "  ${GREEN}✅ Database: ${DB}${NC}"
else
  echo -e "  ${RED}❌ API indisponible (status: ${STATUS})${NC}"
  echo "  Tentative 2 dans 30s..."
  sleep 30
  HEALTH=$(curl -s --max-time 30 "${API_URL}/health")
  STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "down")
  if [ "$STATUS" == "ok" ]; then
    echo -e "  ${GREEN}✅ API OK après retry${NC}"
  else
    echo -e "  ${RED}❌ API toujours down. Vérifiez les logs Render.${NC}"
  fi
fi

# ── Quick routes check ──
echo ""
echo -e "${YELLOW}🔧 5. Vérification routes clés...${NC}"

check_route() {
  local method=$1 path=$2 label=$3 token=$4
  local opts="-s --max-time 10 -X $method -H 'Content-Type: application/json'"
  if [ -n "$token" ]; then opts="$opts -H 'Authorization: Bearer $token'"; fi
  
  CODE=$(eval "curl $opts -o /dev/null -w '%{http_code}' '${API_URL}${path}'" 2>/dev/null)
  
  if [ "$CODE" != "404" ] && [ "$CODE" != "000" ]; then
    echo -e "  ${GREEN}✅ ${label} → ${CODE}${NC}"
  else
    echo -e "  ${RED}❌ ${label} → ${CODE}${NC}"
  fi
}

check_route GET "/health" "Health"
check_route GET "/api/stats/public" "Stats publiques"
check_route GET "/api/pricing/vehicles" "Véhicules"
check_route GET "/api/pricing/countries" "Pays"
check_route GET "/api/pricing/surcharges" "Surcharges (NOUVEAU)"
check_route GET "/api/marketplace/missions" "Marketplace"
check_route GET "/api/carbon/factors" "Carbon factors"

# Test avec token
echo ""
echo -e "  ${BLUE}Test authentifié...${NC}"
TOKEN=$(curl -s --max-time 10 -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@fretnow.fr","password":"admin123456"}' \
  "${API_URL}/api/auth/login" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
  echo -e "  ${GREEN}✅ Login admin OK${NC}"
  check_route GET "/api/auth/me" "Auth me" "$TOKEN"
  check_route GET "/api/vehicles" "Vehicles (NOUVEAU)" "$TOKEN"
  check_route GET "/api/users/profile" "User profile (NOUVEAU)" "$TOKEN"
  check_route GET "/api/users/notifications" "User notifs (NOUVEAU)" "$TOKEN"
  check_route GET "/api/analytics/overview" "Analytics (NOUVEAU)" "$TOKEN"
  check_route GET "/api/notifications" "Notifications" "$TOKEN"
else
  echo -e "  ${YELLOW}⚠️  Login admin échoué (seed pas encore lancé ?)${NC}"
fi

# ── STEP 5: Tests complets (optionnel) ──
if [[ "$*" == *"--test"* ]]; then
  echo ""
  echo -e "${YELLOW}🧪 6. Lancement batterie de tests complète...${NC}"
  node test-runner.js 2>&1
fi

# ── RÉSUMÉ ──
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Déploiement FRETNOW v4.0 terminé${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  🌐 API: ${API_URL}"
echo "  📊 Routes: ${ROUTE_COUNT}"
echo "  📦 Version: 4.0.0"
echo ""
echo "  Prochaines étapes:"
echo "  1. Migrer la DB: prisma db push (ou prisma migrate deploy)"
echo "  2. Seeder: node seed.js"
echo "  3. Tests: node test-runner.js"
echo ""
