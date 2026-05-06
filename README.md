# AIENC — Portal institucional

Monorepo de la plataforma pública y panel de administración de la
**Asociación de Iglesias Evangélicas del Norte de Colombia (AIENC)**.

```
apps/
├─ api/   ← Backend NestJS + Fastify + TypeORM (PostgreSQL) + Cloudinary
└─ web/   ← Frontend Next.js 16 (App Router) + TypeScript
```

---

## 🧪 Desarrollo local

### Requisitos

- Node.js 20 o 22
- PostgreSQL 14+
- Cuenta de Cloudinary (gratis)

### Pasos

1. Crear `.env` en `apps/api/` (ver `apps/api/.env.example` para la lista
   completa de variables) y poner credenciales locales.
2. En `apps/web/` crear `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3001`.
3. Instalar dependencias y arrancar:

```bash
# Terminal 1 — API
cd apps/api
npm install
npm run start:dev

# Terminal 2 — Web
cd apps/web
npm install
npm run dev
```

- Web → http://localhost:3000
- API → http://localhost:3001

La primera vez se crea el esquema automáticamente (`DB_SYNCHRONIZE=true`).
Después se puede ir a `/admin/bootstrap` para crear la cuenta ROOT.

---

## 🚀 Despliegue en producción

Recomendación gratuita / barata:

| Pieza         | Servicio         | Precio                          |
|---------------|------------------|---------------------------------|
| Frontend      | **Vercel**       | Gratis (proyectos personales)   |
| Backend       | **Railway**      | $5 USD / mes de crédito gratis  |
| Base de datos | **Neon** (Postgres serverless) | Gratis hasta 3 GB |
| Imágenes      | **Cloudinary**   | Gratis hasta 25 GB              |
| Dominio       | Cloudflare / Namecheap | ~$10 USD / año            |

### 1. Subir el código a GitHub

Crear un repo privado y empujar:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:tu-usuario/aienc.git
git push -u origin main
```

> El `.gitignore` raíz ya ignora `node_modules`, `.env`, `dist`, `.next`.

### 2. Crear la base de datos en Neon

1. Sign up en [neon.tech](https://neon.tech) (login con GitHub).
2. **New Project** → región más cercana → guarda el `DATABASE_URL` que te
   muestra (formato `postgres://user:pass@host/dbname?sslmode=require`).

### 3. Backend en Railway

1. Sign up en [railway.app](https://railway.app) (login con GitHub).
2. **New Project → Deploy from GitHub repo** → selecciona el repo.
3. Railway detecta el `Dockerfile` en `apps/api/Dockerfile`.
   - **Settings → Source → Root Directory:** `apps/api`
4. **Variables → Raw editor**, pega esto y completa los valores:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://...neon.tech...?sslmode=require

CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-key
CLOUDINARY_API_SECRET=tu-secret

WEB_ORIGIN=https://tu-frontend.vercel.app

ADMIN_SESSION_SECRET=<48 bytes random base64url>
ADMIN_SESSION_TTL_SECONDS=43200
ADMIN_PENDING_SESSION_TTL_SECONDS=86400
ADMIN_TRUSTED_DEVICE_TTL_SECONDS=2592000
ADMIN_ACCESS_REQUEST_TTL_SECONDS=86400
ADMIN_ACCESS_REQUEST_RETRY_COOLDOWN_SECONDS=3600

# Activar SOLO para la primera deploy:
ADMIN_BOOTSTRAP_ENABLED=true
ADMIN_BOOTSTRAP_SECRET=<48 bytes random base64url>

ADMIN_ROOT_RECOVERY_ENABLED=false
ADMIN_ROOT_RECOVERY_SECRET=

# Activar SOLO para la primera deploy (crea el esquema):
DB_SYNCHRONIZE=true
```

Generar secretos seguros:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

5. **Settings → Networking → Generate Domain** → copia la URL pública
   (`https://tu-api.up.railway.app`).

### 4. Frontend en Vercel

1. Sign up en [vercel.com](https://vercel.com) (login con GitHub).
2. **Add New… → Project →** selecciona el mismo repo.
3. **Configure Project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
4. **Environment Variables:**

```env
NEXT_PUBLIC_API_URL=https://tu-api.up.railway.app
```

5. **Deploy.** Vercel te da una URL `https://aienc-xxxx.vercel.app`.

### 5. Cerrar el círculo

Vuelve a Railway y actualiza:

```env
WEB_ORIGIN=https://aienc-xxxx.vercel.app
```

(o tu dominio propio si lo configuras). Esto es **crítico** para que el
backend acepte las peticiones desde tu frontend (CORS y CSRF).

### 6. Crear la cuenta ROOT

1. Visita `https://aienc-xxxx.vercel.app/admin/bootstrap`
2. Pega el `ADMIN_BOOTSTRAP_SECRET` que pusiste en Railway.
3. Crea usuario, contraseña y nombre.

### 7. ⚠️ Asegurar después de la primera deploy

En Railway, **cambiar dos variables** y redeploy:

```env
ADMIN_BOOTSTRAP_ENABLED=false
DB_SYNCHRONIZE=false
```

Esto:
- Desactiva la creación de cuentas ROOT por terceros.
- Deja el esquema inmutable contra cambios accidentales.

### 8. Dominio propio (opcional)

1. Comprar dominio en Cloudflare Registrar (~$10 USD/año).
2. **Vercel → Settings → Domains → Add** → te da los DNS records.
3. Pegar los CNAME en Cloudflare. SSL automático.

---

## 🔐 Variables de entorno (referencia)

### Backend (`apps/api/.env`)

| Variable | Obligatorio | Descripción |
|---|:-:|---|
| `NODE_ENV` | sí | `development` o `production` |
| `PORT` | sí | Puerto HTTP (Railway lo inyecta automáticamente) |
| `DATABASE_URL` | * | URL completa de Postgres (preferido) |
| `DB_HOST/PORT/USERNAME/PASSWORD/NAME` | * | Alternativa a `DATABASE_URL` |
| `DB_SYNCHRONIZE` | no | `true` la primera vez, después `false` |
| `CLOUDINARY_CLOUD_NAME` | sí | Nombre de cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | sí | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | sí | API secret de Cloudinary |
| `WEB_ORIGIN` | sí | Dominio del frontend (sin barra final) |
| `ADMIN_SESSION_SECRET` | sí | ≥32 chars, secreto para JWT de admin |
| `ADMIN_SESSION_TTL_SECONDS` | sí | Duración de la sesión activa |
| `ADMIN_PENDING_SESSION_TTL_SECONDS` | sí | Duración de la sesión pendiente |
| `ADMIN_TRUSTED_DEVICE_TTL_SECONDS` | sí | Duración del cookie de dispositivo |
| `ADMIN_ACCESS_REQUEST_TTL_SECONDS` | sí | Duración de la solicitud de acceso |
| `ADMIN_ACCESS_REQUEST_RETRY_COOLDOWN_SECONDS` | sí | Cooldown para reintentar |
| `ADMIN_BOOTSTRAP_ENABLED` | sí | `true` solo para crear el primer ROOT |
| `ADMIN_BOOTSTRAP_SECRET` | si bootstrap=on | ≥32 chars |
| `ADMIN_ROOT_RECOVERY_ENABLED` | sí | `true/false` para flujo break-glass |
| `ADMIN_ROOT_RECOVERY_SECRET` | si recovery=on | ≥32 chars |

`*` Uno de los dos: `DATABASE_URL` o el set `DB_*`.

### Frontend (`apps/web/.env.local`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API (sin barra final) |

---

## 🧠 Notas

- Las cookies del admin usan `SameSite=None; Secure` en producción para
  funcionar entre dominios distintos (Vercel ↔ Railway).
- En la primera deploy `DB_SYNCHRONIZE=true` crea el esquema automáticamente.
  Para entornos más serios usar el sistema de migraciones de TypeORM
  (`npm run migration:generate`, `migration:run`).
- El backend está protegido con Helmet, rate limiting (in-memory),
  validación de origen para CSRF, y `ParseUUIDPipe` en todos los `:id`.
- Cloudinary se usa como CDN externo — no se almacena nada en el servidor
  de la API.
