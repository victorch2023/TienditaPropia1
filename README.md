# Mi Tiendita — Tienda Virtual Perú

Tienda virtual completa desplegada en **GitHub Pages** con backend **Firebase** (Firestore, Auth, Cloud Functions). **Imágenes vía Google Drive** (carpeta pública + URLs en Firestore) — no requiere Firebase Storage ni plan Blaze. Pagos por defecto vía **Yape, Plin y transferencias bancarias**; pasarela **Culqi** opcional para el futuro. Envíos solo en **Lima Metropolitana** (43 distritos).

**URL de producción:** `https://<tu-usuario>.github.io/TienditaPropia1/`

---

## Lo que el asistente ya configuró

- App React + Vite + Tailwind con tienda, carrito, checkout y panel admin
- **Modo demo**: sin `.env` o con valores de ejemplo, la app muestra productos/categorías mock
- Script `npm run setup-check` — verifica Node, npm y variables de entorno
- Script `npm run seed` + `scripts/seed-data.json` — datos iniciales para Firestore
- `firebase.json`, reglas Firestore/Storage, índices y `.firebaserc.example`
- Cloud Functions (Culqi + facturación stub), workflow GitHub Pages
- Página 404, favicon, meta tags y `.env.example` comentado en español

---

## Lo que DEBES hacer tú

| Paso | Acción |
|------|--------|
| 1 | Instalar **Node.js 20+** desde [nodejs.org](https://nodejs.org) |
| 2 | `npm install` en la raíz del proyecto |
| 3 | Crear proyecto en [Firebase Console](https://console.firebase.google.com) (Auth, Firestore) |
| 4 | `cp .env.example .env` y pegar tus credenciales Firebase |
| 5 | `cp .firebaserc.example .firebaserc` y poner tu `projectId` |
| 6 | `firebase login` y `firebase deploy --only firestore:rules,firestore:indexes` |
| 7 | Crear carpeta pública en Google Drive para imágenes de productos (ver sección abajo) |
| 8 | (Opcional) `GOOGLE_APPLICATION_CREDENTIALS=... npm run seed` para productos de ejemplo |
| 9 | Registrarte en `/cuenta` y cambiar `role` a `admin` en Firestore `users/{uid}` |
| 10 | Configurar Yape/Plin/cuenta bancaria en `/admin/config` |
| 11 | (Opcional futuro) Cuenta Culqi, desplegar functions, activar pasarela en admin |
| 12 | Habilitar GitHub Pages (Actions) y agregar secrets `VITE_*` en el repo |

**Vista previa sin Firebase:** `npm run dev` → [http://localhost:5173/TienditaPropia1/](http://localhost:5173/TienditaPropia1/)

**Verificar entorno:** `npm run setup-check`

---

## Carpeta de imágenes del proyecto

Carpeta compartida en Google Drive: [**Shared Tiendita Images**](https://drive.google.com/drive/folders/1D3Vir25MPJVJTKe3Zq6vtBblN22x6tgh?usp=sharing)

Sube ahí las fotos de productos. **No pegues el enlace de la carpeta** en el campo imagen de un producto (no funciona en `<img>`). Abre cada archivo → Compartir → copia el enlace del archivo y conviértelo con **Drive → directo** en el panel admin.

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
4. **Storage no es obligatorio** — las imágenes se hospedan en Google Drive (ver sección 1.1)
5. En Configuración del proyecto → Tus apps → Web, copia la config
6. Copia `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

7. Despliega reglas de seguridad:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 1.1 Imágenes con Google Drive (sin Firebase Storage)

Con el plan **Spark** (gratis) no necesitas subir archivos a Firebase. Usa una carpeta pública de Google Drive:

1. Crea una carpeta en [Google Drive](https://drive.google.com) (ej. `Mi Tiendita - Imágenes`).
2. Clic derecho → **Compartir** → **Cualquier persona con el enlace** → rol **Lector**.
3. Sube las fotos de tus productos a esa carpeta.
4. Abre cada imagen → **Compartir** → copia el enlace (formato `https://drive.google.com/file/d/ID/view...`).
5. En el panel admin → **Productos**, pega el enlace en el campo de imagen.
6. Usa el botón **Drive → directo** para convertir el enlace compartido a URL de visualización.
7. La URL se guarda en Firestore (`images: string[]`). La tienda la muestra automáticamente.

También puedes usar otros servicios (imgbb, Cloudinary, etc.) pegando la URL directa de la imagen.

**Comprobantes de pago:** el cliente puede indicar número de operación y, opcionalmente, pegar un enlace de Drive con la captura del pago (misma lógica que las imágenes de producto).

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
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_CULQI_PUBLIC_KEY` (solo si activas Culqi)
   - `VITE_FUNCTIONS_URL` (solo si activas Culqi)
3. Push a `main` → el workflow `.github/workflows/deploy.yml` despliega automáticamente

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
