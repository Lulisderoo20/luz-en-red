# Luz en Red

Luz en Red es un MVP serio y escalable de red social para mujeres cristianas. La app prioriza paz, calidez, seguridad, oración y comunidad, con un frontend estático desplegable en GitHub Pages o Cloudflare Pages y un backend desacoplado en Supabase.

## Stack recomendado

- Frontend: React + Vite + TypeScript
- Navegación: React Router
- Backend BaaS: Supabase Auth + Postgres + Storage + RLS
- Estilo: CSS modular con design tokens propios
- Deploy: GitHub Pages y Cloudflare Pages

## Por qué este stack

- Vite es más directo que Next.js para un MVP SPA mobile-first que debe vivir en hosts estáticos.
- Supabase resuelve autenticación, base de datos relacional, storage y seguridad con RLS sin levantar API propia.
- TypeScript y una arquitectura por features ayudan a escalar sin convertir el proyecto en una demo frágil.

## Arquitectura

- `src/app`: bootstrap, providers, layout y router
- `src/features`: pantallas y lógica de negocio por dominio
- `src/components`: UI reutilizable
- `src/services/backend`: adaptadores `supabase` y `demo`
- `supabase`: esquema SQL, políticas y seed
- `docs`: decisiones de arquitectura y modelo de datos

La app funciona en dos modos:

- `supabase`: modo real, usando variables de entorno
- `demo`: fallback local con `localStorage`, para poder probar el MVP sin infraestructura

## Estructura de carpetas

```text
.
|-- .github/workflows/
|-- docs/
|-- public/
|-- src/
|   |-- app/
|   |-- components/
|   |-- features/
|   |-- hooks/
|   |-- lib/
|   |-- services/
|   |   |-- backend/
|   |   |-- seed/
|   |-- styles/
|   `-- types/
|-- supabase/
|-- .env.example
|-- index.html
|-- package.json
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
`-- vite.config.ts
```

## Modelo de datos

Entidades principales:

- `profiles`
- `follows`
- `blocks`
- `posts`
- `post_comments`
- `post_reactions`
- `saved_posts`
- `prayer_requests`
- `prayer_support`
- `prayer_comments`
- `groups`
- `group_members`
- `notifications`
- `reports`
- `devotional_content`
- `direct_message_threads`
- `direct_messages`

Ver detalle en [docs/architecture.md](./docs/architecture.md) y [supabase/schema.sql](./supabase/schema.sql).

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run check`

## Credenciales demo

Si todavía no configurás Supabase, el MVP arranca en modo demo con estas cuentas:

- `ana@luzenred.app` / `Password123!`
- `rebecca@luzenred.app` / `Password123!`
- `marta@luzenred.app` / `Password123!`

## Despliegue

### GitHub Pages

1. Crear un repo nuevo.
2. Configurar `VITE_ROUTER_MODE=hash`.
3. Configurar `VITE_BASE_PATH=/NOMBRE_DEL_REPO/` si el repo no usa dominio raíz.
4. Ejecutar el workflow incluido en `.github/workflows/deploy-gh-pages.yml`.

### Cloudflare Pages

1. Conectar el repo.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Variables:
   - `VITE_ROUTER_MODE=browser` o `hash`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_REDIRECT_URL`

## Pasos manuales finales

La base ya quedó implementada y publicada, pero hay algunos pasos que conviene que hagas vos porque dependen de permisos de tu cuenta.

### 1. Revisar el repo en GitHub

1. Abrí `https://github.com/Lulisderoo20/luz-en-red`
2. Confirmá que el branch `main` tenga el código fuente.
3. Confirmá que exista también el branch `gh-pages`.

### 2. Verificar GitHub Pages

1. Entrá a `Settings > Pages` en el repo.
2. Revisá que `Source` esté configurado como `Deploy from a branch`.
3. Revisá que el branch seleccionado sea `gh-pages` y la carpeta `/`.
4. Guardá si hiciera falta.
5. Probá la URL:
   - `https://lulisderoo20.github.io/luz-en-red/`

### 3. Subir el workflow faltante

El token que había en este entorno no tenía permiso `workflow`, por eso el repo remoto quedó sin `.github/workflows/deploy-gh-pages.yml`.

Hacé esto desde tu máquina o GitHub Desktop:

1. Abrí el repo local principal.
2. Verificá que exista el archivo `.github/workflows/deploy-gh-pages.yml`.
3. Hacé:
   - `git add .github/workflows/deploy-gh-pages.yml`
   - `git commit -m "Add GitHub Pages workflow"`
   - `git push origin main`
4. Si GitHub te pide permisos, autorizá el scope `workflow`.

### 4. Cargar secretos del workflow en GitHub

Si querés que el workflow construya contra Supabase real:

1. Entrá a `Settings > Secrets and variables > Actions`.
2. Creá estos secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_REDIRECT_URL`
3. Si todavía no tenés Supabase listo, no pasa nada:
   la app sigue funcionando en modo demo.

### 5. Verificar Cloudflare Pages

El proyecto ya fue creado y desplegado.

Probá estas URLs:

- `https://luz-en-red.pages.dev/`
- `https://4cf8b55b.luz-en-red.pages.dev`

Si querés revisarlo en el panel:

1. Entrá a Cloudflare Dashboard.
2. Abrí `Workers & Pages > luz-en-red`.
3. Verificá que el deployment de producción esté asociado al branch `main`.

### 6. Conectar Supabase real

Cuando quieras pasar del modo demo al backend real:

1. Creá un proyecto en Supabase.
2. Ejecutá `supabase/schema.sql`.
3. Ejecutá `supabase/seed.sql` si querés datos iniciales.
4. Copiá las variables a un archivo `.env` local:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
   - `VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/#/auth/callback`
5. En Supabase Auth:
   - activá Email/Password
   - activá Google cuando quieras login social
   - agregá tus redirect URLs de local, GitHub Pages y Cloudflare Pages

### 7. Redirect URLs recomendadas en Supabase

Agregá estas URLs permitidas:

- `http://localhost:5173/#/auth/callback`
- `https://lulisderoo20.github.io/luz-en-red/#/auth/callback`
- `https://luz-en-red.pages.dev/#/auth/callback`

### 8. Limpiar temporales locales

Yo generé carpetas auxiliares para publicar sin romper tu repo principal.
Si querés limpiar:

1. Borrá `.publish`
2. Borrá `.ghpages`
3. Borrá `dist` si no necesitás el build local

### 9. Si querés hacer el push final desde tu repo local principal

1. `git status`
2. `git add .`
3. `git commit -m "Finalize Luz en Red MVP"`
4. `git push origin main`

Si el remoto `origin` no está configurado en tu repo local principal:

1. `git remote add origin https://github.com/Lulisderoo20/luz-en-red.git`
2. `git push -u origin main`

## Estado del MVP

Se prioriza primero:

- auth
- onboarding
- feed
- crear post
- pedidos de oración
- perfiles
- grupos
- notificaciones simples
- configuración
- seguridad base

Mensajería y panel admin quedan implementados en forma básica o preparados para escalar.
