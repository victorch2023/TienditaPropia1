# Culqi sandbox (pruebas) — Mi Tiendita

Guía para cobrar con tarjeta **solo en modo test** (`pk_test_` / `sk_test_`).  
No uses `pk_live_` / `sk_live_` hasta validar el flujo completo.

Referencia oficial de tarjetas:  
https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba/

Panel Culqi (llaves): inicia sesión en [Culqi](https://culqi.com) → **CulqiPanel → Desarrollo → API Keys** (o “Llaves de integración”).

---

## Checklist rápido

- [ ] Cuenta Culqi creada y comercio en **Integración / pruebas**
- [ ] Copiar `pk_test_…` → `VITE_CULQI_PUBLIC_KEY` en `.env` (local) y secret de GitHub Actions
- [ ] Copiar `sk_test_…` → **solo** Firebase secret `CULQI_SECRET_KEY` (nunca en el frontend ni en git)
- [ ] `VITE_FUNCTIONS_URL=https://us-central1-tiendita-propia.cloudfunctions.net`
- [ ] Plan Firebase **Blaze** (Cloud Functions)
- [ ] `firebase functions:secrets:set CULQI_SECRET_KEY`
- [ ] `firebase deploy --only functions:culqiCharge`
- [ ] Reiniciar Vite / redeploy Pages con las vars VITE_
- [ ] Admin → Configuración → activar **Culqi** en la tienda de prueba → Guardar
- [ ] Checkout → “Pagar con tarjeta” → tarjeta de prueba exitosa
- [ ] Verificar cargo en CulqiPanel (ambiente **pruebas**) y pedido `pagado` en Admin

---

## 1. Obtener llaves de prueba

1. Regístrate / inicia sesión en Culqi.
2. Entra al **panel de integración (pruebas)**, no producción.
3. Copia:
   - **Llave pública:** `pk_test_…`
   - **Llave secreta:** `sk_test_…` (no la compartas ni la subas a git)

---

## 2. Frontend (`.env` local)

Copia/edita `.env` (está en `.gitignore`):

```bash
# Solo la PÚBLICA en el cliente
VITE_CULQI_PUBLIC_KEY=pk_test_PEGA_AQUI

# Tras el deploy de functions (proyecto tiendita-propia)
VITE_FUNCTIONS_URL=https://us-central1-tiendita-propia.cloudfunctions.net
```

Reinicia el servidor Vite (`npm run dev`).

### GitHub Actions (Pages)

En el repo → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|--------|
| `VITE_CULQI_PUBLIC_KEY` | `pk_test_…` |
| `VITE_FUNCTIONS_URL` | `https://us-central1-tiendita-propia.cloudfunctions.net` |

Con `gh` (si lo tienes):

```bash
gh secret set VITE_CULQI_PUBLIC_KEY --body "pk_test_…"
gh secret set VITE_FUNCTIONS_URL --body "https://us-central1-tiendita-propia.cloudfunctions.net"
```

---

## 3. Backend (Firebase secret + deploy)

Proyecto: `tiendita-propia`. Requiere plan **Blaze**.  
Runtime de Functions: **Node.js 22** (`functions/package.json` → `engines.node`).

```bash
# Interactivo (pega sk_test_ cuando lo pida; no queda en historial del shell si usas el prompt)
firebase use tiendita-propia
firebase functions:secrets:set CULQI_SECRET_KEY

cd functions && npm install && npm run build && cd ..
firebase deploy --only functions:culqiCharge
# o todas: firebase deploy --only functions
```

Alternativa no interactiva (la key no debe quedar en logs/commits):

```bash
printf '%s' 'sk_test_PEGA_AQUI' | firebase functions:secrets:set CULQI_SECRET_KEY
```

Verifica la URL:

```text
https://us-central1-tiendita-propia.cloudfunctions.net/culqiCharge
```

CORS ya está habilitado en la function (`cors: true`).

---

## 4. Activar el switch en Admin

1. Abre `/s/{tienda}/admin/config` (ej. `piyukis` o la tienda de prueba).
2. Marca **Activar pasarela externa (Culqi)**.
3. Guarda.

Por defecto `culqiEnabled` sigue en `false` en seeds — no se activa en producción automáticamente.  
Yape / Plin / transferencia no se desactivan.

---

## 5. Probar el primer cobro test

1. Añade un producto al carrito (total ≥ S/ 1.00).
2. Checkout → envío + fiscal → en pago, usa **Pagar con tarjeta (Culqi)**.
3. En el modal Culqi usa una tarjeta de **compra exitosa** (docs oficiales):

| Marca | Número | Mes/Año | CVV |
|-------|--------|---------|-----|
| Visa | 4111 1111 1111 1111 | 09/30 | 123 |
| Visa crédito | 4111 1111 1010 1113 | 09/30 | 123 |
| Mastercard | 5111 1111 1111 1118 | 12/30 | 039 |
| Amex | 3712 1212 1212 122 | 12/30 | 2841 |

Email de prueba válido (ej. el del formulario de envío).  
Para 3DS en primera integración Culqi recomienda `review@culqi.com` + tarjetas 3DS de su tabla oficial.

4. Resultado esperado:
   - Pedido pasa a `pagado` con `payment.method = culqi`
   - Stock descontado
   - Cargo visible en CulqiPanel → **pruebas**

---

## Arquitectura (montos)

- En la app los precios/totales están en **céntimos** (entero: S/ 10.50 → `1050`).
- Checkout.js y `POST /v2/charges` usan el mismo entero en céntimos.
- Script cliente: `https://js.culqi.com/checkout-js` en `index.html`.
- El cargo real se crea solo en Cloud Function `culqiCharge` con `sk_test_` / `sk_live_`.

---

## Errores frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| Mensaje “Falta VITE_CULQI_PUBLIC_KEY” | `.env` sin `pk_test_` o Vite sin reiniciar |
| 404 en `/culqiCharge` | Function no desplegada o `VITE_FUNCTIONS_URL` incorrecta |
| `In non-interactive mode but have no value for the secret: CULQI_SECRET_KEY` | Corre `firebase functions:secrets:set CULQI_SECRET_KEY` con `sk_test_…` **antes** del deploy |
| `Runtime Node.js 20 was decommissioned` | Usa Node 22 en `functions/package.json` (ya actualizado en este repo) |
| Error de secret / sk_ | No corriste `functions:secrets:set` o usaste `pk_` por error |
| Cargo no aparece en panel | Estás en panel **producción** o usaste tarjeta no de prueba |
| Monto no coincide | Total del pedido vs amount enviado (ambos deben ser céntimos) |

---

## Seguridad

- **Nunca** commits de `sk_test_` / `sk_live_`.
- `.env` y `.env.local` están en `.gitignore`.
- Solo `pk_test_` / `pk_live_` van al frontend / GitHub Actions secrets públicos de build.
