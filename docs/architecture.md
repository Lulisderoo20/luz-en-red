# Arquitectura de Luz en Red

## Decisión principal

Se eligió una SPA con React + Vite + TypeScript y Supabase porque el producto necesita:

- velocidad real de desarrollo
- UX mobile-first
- despliegue estático barato
- autenticación segura
- modelo de datos relacional
- reglas de acceso finas para comunidad, reportes, bloqueos y contenido sensible

## Capas

### Presentación

- Rutas protegidas y públicas
- Layout móvil con top bar y bottom navigation
- Componentes reutilizables para tarjetas, listas, estados vacíos y formularios

### Dominio

- `auth`
- `onboarding`
- `feed`
- `prayers`
- `groups`
- `profile`
- `search`
- `notifications`
- `settings`
- `admin`
- `devotionals`

### Datos

- `BackendAdapter` como frontera de acceso a datos
- `SupabaseAdapter` para entorno real
- `DemoAdapter` para correr el MVP sin backend

## Flujo de acceso

1. La app detecta si existen las credenciales de Supabase.
2. Si existen, usa autenticación real y datos persistentes.
3. Si no existen, usa un backend local sembrado con datos demo.
4. El onboarding marca el perfil como completo.
5. Las rutas protegidas exigen sesión y perfil listo.

## Seguridad

- validación de formularios en cliente
- validación y RLS en backend
- reporte de contenido y usuarias
- estructura de bloqueo entre usuarias
- roles `member`, `moderator`, `admin`
- privacidad para pedidos de oración públicos o de grupo

## Escalabilidad

- posibilidad futura de agregar:
  - Edge Functions para moderación avanzada
  - push notifications
  - mensajería en tiempo real
  - panel admin más profundo
  - búsqueda full-text en Postgres
  - analítica de engagement espiritual

## Modelo de datos resumido

### `profiles`

- `id`
- `email`
- `display_name`
- `username`
- `avatar_url`
- `bio`
- `denomination`
- `church_name`
- `location`
- `favorite_verse`
- `interests`
- `role`
- `is_onboarding_complete`
- `created_at`

### `posts`

- `id`
- `author_id`
- `group_id`
- `type`
- `content`
- `image_url`
- `bible_verse`
- `category`
- `is_private`
- `created_at`

### `prayer_requests`

- `id`
- `author_id`
- `group_id`
- `title`
- `description`
- `visibility`
- `status`
- `support_count`
- `created_at`

### `groups`

- `id`
- `slug`
- `name`
- `description`
- `cover_image_url`
- `is_private`
- `interest_tag`
- `created_by`

### `notifications`

- `id`
- `recipient_id`
- `actor_id`
- `type`
- `entity_type`
- `entity_id`
- `message`
- `is_read`
- `created_at`

## Búsqueda MVP

La búsqueda inicial se resuelve desde agregados tipados del adaptador para:

- perfiles
- grupos
- posts
- pedidos de oración
- etiquetas espirituales

En producción puede migrarse a `tsvector`, trigram search o Algolia/Meilisearch si el volumen crece.
