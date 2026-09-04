# TienditaPropia — Multi-tienda (Perú)

Plataforma multi-tienda desplegada en **GitHub Pages** con backend **Firebase**. Incluye **La Tiendita Chévere** (`tiendita`) y **Citroleaf** (`citroleaf`). Imágenes de producto en **Firebase Storage** (URLs en Firestore). Pagos Yape/Plin/transferencia; Culqi opcional. Envíos en **Lima Metropolitana**.

**URL de producción (multi-tienda):** `https://victorch2023.github.io/TienditaPropia1/`

**Dominio Citroleaf:** `https://www.citroleaf.com` → abre la tienda Citroleaf en `/` (sin prefijo `/s/citroleaf`).

### URLs de tiendas

| Tienda | Storefront | Admin |
|--------|------------|-------|
| Selector (solo github.io) | `/` o `/tiendas` | — |
| La Tiendita Chévere | `/s/tiendita` | `/s/tiendita/admin` |
| Citroleaf (github.io) | `/s/citroleaf` | `/s/citroleaf/admin` |
| Citroleaf (www.citroleaf.com) | `/`, `/catalogo`, … | `/admin` |

En dominio custom el Router usa basename `/`; en github.io/local usa `/TienditaPropia1`.

---

## Arquitectura multi-tienda

- Documento de config: `stores/{storeId}` (legacy `stores/config` sigue leyéndose para `tiendita`)
- `products`, `categories`, `orders` llevan `storeId`
- Carrito por tienda: `localStorage` key `cart-{storeId}`
- Routing: `/s/:storeId/*` para vitrina y admin
- Usuarios admin: `role: 'admin'` + `adminStores: ['tiendita','citroleaf']`
  - Sin `adminStores`: solo admin de `tiendita` (compatibilidad)
- Citroleaf home: estética cream/brown (Cormorant + Montserrat), independiente de tiendita
- Modo demo: ambas tiendas con catálogo mock offline

### Asignar admin de Citroleaf

En Firestore → `users/{uid}`:

```json
{
  "role": "admin",
  "adminStores": ["tiendita", "citroleaf"]
}
```

O ejecuta `npm run seed:citroleaf` (añade ambos IDs a todos los admins existentes).

### Seed

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/serviceAccountKey.json"
npm run seed              # tiendita (+ stores/tiendita)
npm run seed:citroleaf    # migra legacy + siembra Citroleaf + parchea admins
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Lo que el asistente ya configuró

- App React + Vite + Tailwind con tienda, carrito, checkout y panel admin
- **Modo demo**: sin `.env` o con valores de ejemplo, la app muestra productos/categorías mock
- Script `npm run setup-check` — verifica Node, npm y variables de entorno
- Scripts `npm run seed` / `npm run seed:citroleaf`
- `firebase.json`, reglas Firestore/Storage, índices y `.firebaserc.example`
- Cloud Functions (Culqi + facturación stub), workflow GitHub Pages
- Página 404, favicon, meta tags y `.env.example` comentado en español

---

## Lo que DEBES hacer tú

| Paso | Acción |
|------|--------|
| 1 | Instalar **Node.js 20+** desde [nodejs.org](https://nodejs.org) |
| 2 | `npm install` en la raíz del proyecto |
| 3 | Crear proyecto en [Firebase Console](https://console.firebase.google.com) (Auth, Firestore, **Storage** — plan Blaze) |
| 4 | `cp .env.example .env` y pegar tus credenciales Firebase (incluye `VITE_FIREBASE_STORAGE_BUCKET`) |
| 5 | `cp .firebaserc.example .firebaserc` y poner tu `projectId` |
| 6 | `firebase login` y `firebase deploy --only firestore:rules,firestore:indexes,storage` |
| 7 | (Opcional) `GOOGLE_APPLICATION_CREDENTIALS=... npm run seed` y `npm run seed:citroleaf` |
| 8 | Registrarte en `/s/tiendita/cuenta` y poner `role=admin` + `adminStores` |
| 9 | Configurar Yape/Plin en `/s/{storeId}/admin/config` |
| 10 | (Opcional futuro) Cuenta Culqi, desplegar functions, activar pasarela en admin |
| 11 | Habilitar GitHub Pages (Actions) y agregar secrets `VITE_*` en el repo |

**Vista previa sin Firebase:** `npm run dev` → [http://localhost:5173/TienditaPropia1/](http://localhost:5173/TienditaPropia1/)

**Verificar entorno:** `npm run setup-check`

---

## Imágenes de producto (Firebase Storage)

En el admin → **Productos** → elige archivos con el selector. Se suben a Storage bajo `stores/{storeId}/…` y la URL de descarga se guarda en Firestore (`images: string[]`) al guardar el producto. Las URLs antiguas de Drive u otros hosts siguen funcionando en el catálogo.

Requiere plan **Blaze** y Storage activado. Despliega reglas:

```bash
firebase deploy --only storage
```

---

## Características

- **Tienda cliente:** catálogo, búsqueda, ficha de producto, carrito, checkout en 3 pasos (envío, datos fiscales DNI/RUC, pago manual Yape/Plin/transferencia)
- **Panel admin:** dashboard, CRUD productos/categorías, configuración de tienda (datos de pago), gestión de pedidos y verificación de pagos
- **Precios en céntimos** con IGV 18%
- **Validación fiscal:** DNI (8 dígitos) y RUC (dígito verificador peruano)
- **Cloud Functions:** `culqiCharge` (pagos con tarjeta, opcional) y `createInvoice` (stub Nubefact)

---

## Requisitos previos

- Node.js 20+
- Cuenta [Firebase](https://console.firebase.google.com)
- (Opcional) Cuenta [Culqi](https://culqi.com) si activas pagos con tarjeta
- Repositorio en GitHub con Pages habilitado (origen: GitHub Actions)

---

## 1. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activa **Authentication** → Email/Contraseña
3. Crea base de datos **Firestore** (modo producción)
4. Activa **Storage** (requiere plan **Blaze**): Storage → Comenzar. Anota el bucket (en este proyecto: `tiendita-propia.firebasestorage.app`; proyectos viejos pueden ser `*.appspot.com`)
5. En Configuración del proyecto → Tus apps → Web, copia la config
6. Copia `.env.example` a `.env` y completa las variables. **`VITE_FIREBASE_STORAGE_BUCKET` debe ser el bucket exacto** (mismo valor en el secret de GitHub Actions):

```bash
cp .env.example .env
```

7. Despliega reglas de seguridad:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

### 1.1 Subida de imágenes (Firebase Storage)

1. En el panel admin → **Productos** → Nuevo / Editar.
2. Pulsa **Elegir imágenes** (JPG, PNG, WebP, etc.; máx. 10 MB).
3. La app sube el archivo a Storage (`stores/{storeId}/products/…` o `…/uploads/…`) y muestra vista previa + progreso.
4. Al **Guardar**, las URLs de descarga quedan en Firestore (`images: string[]`).
5. Opcional: «Pegar URL externa» si ya tienes un enlace público (Drive, imgbb, etc.).

**Comprobantes de pago:** el cliente puede indicar número de operación y, opcionalmente, pegar un enlace público con la captura del pago.

### Índices Firestore requeridos

Si Firebase lo solicita, crea estos índices compuestos:

- `products`: `active` ASC + `createdAt` DESC
- `products`: `categoryId` ASC + `active` ASC
- `orders`: `userId` ASC + `createdAt` DESC

---

## 2. Crear el primer administrador

1. Regístrate en la tienda (`/cuenta`) con el email que usarás como dueño
2. En Firebase Console → Firestore → colección `users` → documento con tu UID
3. Edita el campo `role` de `"customer"` a `"admin"`
4. Accede al panel en `/admin/login`

---

## 3. Configurar pagos

### Pagos manuales (por defecto)

1. Accede al panel admin → **Configuración**
2. Completa números de **Yape**, **Plin** y datos de **transferencia bancaria** (banco, cuenta, CCI)
3. Los clientes eligen método de pago en checkout, indican número de operación y pueden pegar un enlace al comprobante (Drive); el pedido queda en `pendiente_pago`
4. En **Pedidos**, confirma el pago recibido para pasar a `pagado`

### Pasarela Culqi (opcional — futuro)

1. En admin, activa **"Activar pasarela externa (Culqi)"**
2. Crea cuenta en [culqi.com](https://culqi.com) y obtén llaves de prueba
3. Agrega a `.env`: `VITE_CULQI_PUBLIC_KEY=pk_test_...`
4. Para pagos reales necesitas **Firebase Blaze** (plan de pago por uso)

#### Desplegar Cloud Functions (solo si usas Culqi)

```bash
cd functions
npm install
cd ..
firebase functions:secrets:set CULQI_SECRET_KEY
# Ingresa tu sk_test_... o sk_live_...
firebase deploy --only functions
```

Copia la URL de functions a `VITE_FUNCTIONS_URL` en `.env` y en los secrets de GitHub.

---

## 4. Desarrollo local

```bash
npm install
npm run setup-check   # opcional: verifica requisitos
npm run dev
```

Abre `http://localhost:5173/TienditaPropia1/`

**Modo demo:** si no tienes `.env`, la app arranca con datos de ejemplo (catálogo, carrito, panel admin de solo lectura). Pagos manuales simulados; auth y persistencia requieren Firebase.

---

## 5. Despliegue en GitHub Pages

1. En el repositorio → Settings → Pages → Source: **GitHub Actions**
2. Agrega estos **Secrets** en Settings → Secrets and variables → Actions:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET` → valor exacto: `tiendita-propia.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_CULQI_PUBLIC_KEY` (solo si activas Culqi)
   - `VITE_FUNCTIONS_URL` (solo si activas Culqi)
3. Push a `main` → el workflow `.github/workflows/deploy.yml` despliega automáticamente

### 5.1 Dominio custom Citroleaf (GoDaddy + GitHub Pages)

El repo incluye `public/CNAME` con `www.citroleaf.com` para que el archivo CNAME viaje en cada build del artifact de Pages.

#### A) GitHub → Settings → Pages

1. **Custom domain:** escribe `www.citroleaf.com` y guarda
2. Espera a que GitHub verifique el DNS (puede tardar minutos u horas)
3. Activa **Enforce HTTPS** cuando esté disponible
4. (Opcional) Si quieres que `citroleaf.com` (apex) también funcione, GitHub mostrará instrucciones A/ALIAS; el código ya mapea ambos hosts a la tienda `citroleaf`

#### B) GoDaddy → DNS del dominio `citroleaf.com`

En la zona DNS (no en “Forwarding” si puedes evitarlo; preferible DNS records):

| Tipo | Nombre | Valor | Notas |
|------|--------|-------|-------|
| CNAME | `www` | `victorch2023.github.io` | Obligatorio para `www.citroleaf.com` |
| A | `@` | `185.199.108.153` | Apex → GitHub Pages (opcional) |
| A | `@` | `185.199.109.153` | |
| A | `@` | `185.199.110.153` | |
| A | `@` | `185.199.111.153` | |

- Quita CNAME/A viejos que apunten a parking de GoDaddy si entran en conflicto.
- TTL: 600 o el default.
- No uses “Domain Forwarding” a github.io si ya configuraste CNAME/A: el forwarding suele romper HTTPS y rutas.

IPs A actuales de GitHub Pages: [docs.github.com — Configuring an apex domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain).

#### C) Firebase Auth — Authorized domains

En [Firebase Console](https://console.firebase.google.com) → Authentication → Settings → **Authorized domains**, agrega:

- `www.citroleaf.com`
- `citroleaf.com`

Sin esto, login/registro fallan en el dominio custom (el dominio github.io ya suele estar autorizado).

#### D) Comprobar

1. `https://www.citroleaf.com/` → home Citroleaf
2. `https://www.citroleaf.com/catalogo` → catálogo
3. `https://www.citroleaf.com/admin/login` → admin
4. `https://www.citroleaf.com/s/citroleaf/catalogo` → redirige a `/catalogo`
5. github.io sigue con selector + `/s/:storeId` (si GitHub no redirige todo el sitio al custom domain)

> Nota: al poner un custom domain en un *project site*, GitHub puede redirigir `*.github.io/TienditaPropia1/` hacia el dominio custom. Si necesitas el selector multi-tienda en github.io y Citroleaf en su dominio a la vez, confirma en Pages que el redirect del dominio por defecto se comporta como quieres.

---

## 6. Facturación electrónica (futuro — Nubefact)

La función `createInvoice` es un **stub** que simula la emisión. Para conectar Nubefact:

1. Contrata plan en [nubefact.com](https://nubefact.com)
2. Configura `NUBEFACT_TOKEN` en Secret Manager
3. Edita `functions/src/createInvoice.ts` siguiendo los comentarios en el código
4. Redespliega functions

---

## Estructura del proyecto

```
TienditaPropia1/
├── .github/workflows/deploy.yml
├── scripts/
│   ├── setup-check.sh
│   ├── seed-data.json
│   └── seed-firestore.mjs
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── functions/src/
│   ├── culqiCharge.ts
│   └── createInvoice.ts
├── src/
│   ├── pages/store/     # Tienda cliente
│   ├── pages/admin/     # Panel dueño
│   ├── services/        # Firebase, Culqi, pedidos
│   ├── hooks/
│   ├── types/
│   ├── utils/           # dinero, fiscal, driveImageUrl
│   └── data/lima-distritos.ts
└── .env.example
```

---

## Flujo de pedidos

| Estado | Descripción |
|--------|-------------|
| `pendiente_pago` | Pedido creado; cliente indicó pago manual, esperando verificación del comercio |
| `pagado` | Pago confirmado por el admin (o Culqi si está activo) |
| `en_preparacion` | Preparando envío |
| `enviado` | En camino |
| `entregado` | Entregado al cliente |
| `cancelado` | Cancelado |

---

## Costos estimados

| Servicio | Costo |
|----------|-------|
| GitHub Pages | Gratis |
| Firebase Spark (Auth, Firestore) | Gratis hasta cuota |
| Firebase Blaze (Functions) | ~$0 para tienda pequeña |
| Culqi | Comisión por transacción (solo si activas pasarela) |

---

## Licencia

Proyecto privado — Mi Tiendita © 2026
