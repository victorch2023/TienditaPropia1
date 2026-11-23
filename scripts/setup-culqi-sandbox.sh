#!/usr/bin/env bash
# Guía interactiva Culqi sandbox — no inventa ni imprime secretos.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Culqi sandbox — Mi Tiendita (proyecto Firebase: tiendita-propia) ==="
echo ""
echo "Docs: docs/CULQI_SANDBOX.md"
echo "Tarjetas: https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba/"
echo ""

if [[ ! -f .env ]]; then
  echo "No hay .env — copia desde .env.example:"
  echo "  cp .env.example .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env 2>/dev/null || true
set +a

pk="${VITE_CULQI_PUBLIC_KEY:-}"
fn="${VITE_FUNCTIONS_URL:-}"

if [[ -z "$pk" || "$pk" == *xxxx* || "$pk" == *PEGA_AQUI* ]]; then
  echo "[ ] VITE_CULQI_PUBLIC_KEY — FALTA"
  echo "    Edita .env y pega: VITE_CULQI_PUBLIC_KEY=pk_test_…"
else
  echo "[x] VITE_CULQI_PUBLIC_KEY configurada (prefijo ${pk:0:8}…)"
fi

if [[ -z "$fn" || "$fn" == *tu-proyecto* ]]; then
  echo "[ ] VITE_FUNCTIONS_URL — FALTA"
  echo "    Usa: VITE_FUNCTIONS_URL=https://us-central1-tiendita-propia.cloudfunctions.net"
else
  echo "[x] VITE_FUNCTIONS_URL=$fn"
fi

echo ""
echo "Pasos restantes (tú debes pegar sk_test_ — no se puede inventar):"
echo "  1) firebase use tiendita-propia"
echo "  2) firebase functions:secrets:set CULQI_SECRET_KEY   # pega sk_test_…"
echo "  3) cd functions && npm install && npm run build && cd .."
echo "  4) firebase deploy --only functions:culqiCharge"
echo "  5) (Opcional) gh secret set VITE_CULQI_PUBLIC_KEY / VITE_FUNCTIONS_URL"
echo "  6) Admin → Configuración → activar Culqi → Guardar"
echo "  7) Checkout con Visa 4111 1111 1111 1111 | 09/30 | 123"
echo ""
echo "Para setear el secret de forma no interactiva:"
echo "  printf '%s' 'sk_test_…' | firebase functions:secrets:set CULQI_SECRET_KEY"
echo ""

if command -v firebase >/dev/null 2>&1; then
  echo "Estado secret CULQI_SECRET_KEY:"
  firebase functions:secrets:get CULQI_SECRET_KEY --project tiendita-propia 2>&1 | head -5 || true
  echo ""
  echo "Probe HTTP culqiCharge:"
  curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
    "${fn:-https://us-central1-tiendita-propia.cloudfunctions.net}/culqiCharge" || true
else
  echo "firebase CLI no está en PATH."
fi
