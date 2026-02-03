#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 🚛 TRANSPORT TOKEN - DÉMARRAGE COMPLET
# ═══════════════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${ORANGE}"
cat << 'EOF'
  _____                                    _     _____     _              
 |_   _| __ __ _ _ __  ___ _ __   ___  _ __| |_  |_   _|__ | | _____ _ __  
   | || '__/ _` | '_ \/ __| '_ \ / _ \| '__| __|   | |/ _ \| |/ / _ \ '_ \ 
   | || | | (_| | | | \__ \ |_) | (_) | |  | |_    | | (_) |   <  __/ | | |
   |_||_|  \__,_|_| |_|___/ .__/ \___/|_|   \__|   |_|\___/|_|\_\___|_| |_|
                          |_|                                              
EOF
echo -e "${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Fonction kill port
kill_port() {
    lsof -ti:$1 2>/dev/null | xargs -r kill -9 2>/dev/null || true
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1: Nettoyage
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}[1/4]${NC} 🧹 Nettoyage des ports..."
kill_port 4000
kill_port 3000
kill_port 3001
sleep 1
echo -e "${GREEN}     ✓ Ports libérés${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2: Base de données
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}[2/4]${NC} 📦 Vérification de la base de données..."
cd backend

if [ ! -f "prisma/dev.db" ]; then
    echo "     Génération du schéma..."
    npx prisma generate > /dev/null 2>&1
    npx prisma db push --accept-data-loss > /dev/null 2>&1
    echo "     Seeding..."
    node seed.js > /dev/null 2>&1
fi
echo -e "${GREEN}     ✓ Base de données prête${NC}"
cd ..

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3: Démarrage Backend
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}[3/4]${NC} 🚀 Démarrage du backend..."
cd backend
nohup node server.js > /tmp/tt-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre le backend
sleep 2
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}     ✓ Backend démarré (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}     ✗ Erreur backend${NC}"
    cat /tmp/tt-backend.log
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4: Démarrage Frontends
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}[4/4]${NC} 🌐 Démarrage des frontends..."

# Frontend Client
cd frontend
nohup npm run start -- -p 3000 > /tmp/tt-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Admin
cd admin
nohup npm run start -- -p 3001 > /tmp/tt-admin.log 2>&1 &
ADMIN_PID=$!
cd ..

sleep 3
echo -e "${GREEN}     ✓ Frontend Client (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}     ✓ Admin Panel (PID: $ADMIN_PID)${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${ORANGE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    🎉 PLATEFORME DÉMARRÉE !${NC}"
echo -e "${ORANGE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}📍 URLS DISPONIBLES${NC}"
echo ""
echo -e "     🌐 Frontend Client:  ${GREEN}http://localhost:3000${NC}"
echo -e "     🔧 Admin Panel:      ${GREEN}http://localhost:3001${NC}"
echo -e "     ⚙️  API Backend:      ${GREEN}http://localhost:4000${NC}"
echo -e "     ❤️  Health Check:     ${GREEN}http://localhost:4000/health${NC}"
echo ""
echo -e "  ${BLUE}👤 COMPTES DE TEST${NC}"
echo ""
echo -e "     Admin:        ${ORANGE}admin@transport-token.com${NC} / Admin123!"
echo -e "     Client:       ${ORANGE}client@demo.com${NC} / Client123!"
echo -e "     Transporteur: ${ORANGE}transporteur@demo.com${NC} / Transport123!"
echo ""
echo -e "${ORANGE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}📄 Logs:${NC} /tmp/tt-backend.log, /tmp/tt-frontend.log, /tmp/tt-admin.log"
echo ""
echo -e "  Appuyez sur ${RED}Ctrl+C${NC} pour arrêter tous les services"
echo ""

# Sauvegarder les PIDs
echo "$BACKEND_PID $FRONTEND_PID $ADMIN_PID" > /tmp/tt-pids.txt

# Trap pour cleanup
cleanup() {
    echo ""
    echo -e "${ORANGE}🛑 Arrêt des services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Services arrêtés${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Garder le script actif
wait
