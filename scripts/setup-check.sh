#!/usr/bin/env bash
# Verifica requisitos locales para Mi Tiendita
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok=0
warn=0
fail=0

check_ok() { echo -e "${GREEN}✓${NC} $1"; ((ok++)) || true; }
check_warn() { echo -e "${YELLOW}!${NC} $1"; ((warn++)) || true; }
check_fail() { echo -e "${RED}✗${NC} $1"; ((fail++)) || true; }

echo "=== Mi Tiendita — verificación de entorno ==="
echo ""

# Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//')
  MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$MAJOR" -ge 20 ]; then
    check_ok "Node.js $NODE_VER (>= 20)"
  else
    check_warn "Node.js $NODE_VER — se recomienda 20+"
  fi
else
  check_fail "Node.js no instalado — instala desde https://nodejs.org"
fi

# npm
if command -v npm >/dev/null 2>&1; then
  check_ok "npm $(npm -v)"
else
  check_fail "npm no encontrado"
fi

# firebase-tools (opcional)
if command -v firebase >/dev/null 2>&1; then
  check_ok "firebase-tools $(firebase --version 2>/dev/null | head -1)"
else
  check_warn "firebase-tools no instalado (npm install -g firebase-tools)"
fi

# gh (opcional)
if command -v gh >/dev/null 2>&1; then
  check_ok "GitHub CLI instalado"
else
  check_warn "gh no instalado — útil para PRs y Pages"
fi

echo ""
echo "--- Archivos de configuración ---"

if [ -f ".env" ]; then
  check_ok "Archivo .env presente"
else
  check_warn "Sin .env — la app usará modo demo (cp .env.example .env)"
fi

if [ -f ".firebaserc" ]; then
  check_ok ".firebaserc presente"
else
  check_warn "Sin .firebaserc — copia .firebaserc.example y edita el project ID"
fi

if [ -d "node_modules" ]; then
  check_ok "node_modules instalado"
else
  check_warn "Ejecuta: npm install"
fi

echo ""
echo "--- Variables VITE (si existe .env) ---"

REQUIRED_VARS=(
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  VITE_CULQI_PUBLIC_KEY
  VITE_FUNCTIONS_URL
)

if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  set -a
  source .env 2>/dev/null || true
  set +a

  for var in "${REQUIRED_VARS[@]}"; do
    val="${!var:-}"
    if [ -z "$val" ] || [[ "$val" == tu_* ]] || [[ "$val" == *xxxxxxxx* ]] || [[ "$val" == *tu-proyecto* ]]; then
      check_warn "$var sin configurar o con valor de ejemplo"
    else
      check_ok "$var configurada"
    fi
  done
else
  check_warn "Modo demo activo hasta que configures .env"
fi

echo ""
echo "--- Resumen ---"
echo -e "OK: $ok | Advertencias: $warn | Errores: $fail"
echo ""

if [ "$fail" -gt 0 ]; then
  echo "Instala Node.js 20+ y ejecuta: npm install && npm run dev"
  exit 1
fi

if [ "$warn" -gt 0 ] && [ ! -f ".env" ]; then
  echo "Puedes previsualizar la tienda en modo demo: npm run dev"
fi

echo "Listo. Siguiente paso: npm run dev → http://localhost:5173/TienditaPropia1/"
exit 0
