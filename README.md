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
