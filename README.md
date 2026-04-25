# DRIZZT DESIGN · CRM

CRM premium bilingüe (ES/EN) para DRIZZT DESIGN. Built with Next.js 14, Supabase y Tailwind.

## Características

- **Auth completa** (email + password) con middleware de rutas protegidas.
- **10+ vistas funcionales**: Inicio, Pipeline Kanban, Contactos, Empresas, Actividades, Dashboard, Tareas, Plantillas, Propuestas, Scoring, Automatizaciones, Implementación.
- **Pipeline Kanban** con drag & drop (@dnd-kit) y optimistic updates.
- **LeadDrawer** con tabs: resumen, conversación, problemas, notas. Composer con WhatsApp / Email / Instagram / Nota.
- **Base de datos normalizada**: `companies`, `contacts`, `deals`, `tasks`, `timeline_events`, `templates`, `automations`, `scoring_rules`, `proposals`.
- **Row Level Security** — single-tenant por `owner_id = auth.uid()`. Cada usuario ve solo sus datos.
- **Realtime** — Dashboard y Pipeline se actualizan al vuelo cuando cambian datos.
- **Onboarding automático**: al registrarte se auto-seedean 19 plantillas, 10 automatizaciones y 8 reglas de scoring.
- **Seed de ejemplo** — botón "Cargar datos de ejemplo" pobla 16 leads con timeline y tareas, en 1 click.
- **Bilingüe ES/EN** conmutable en vivo.
- **Tema oscuro** tipo Linear/Vercel, densidades `compact | regular | cozy`, acento personalizable.
- **Atajos**: ⌘K busca global, Esc cierra el drawer.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS 3
- **Supabase** (Postgres + Auth + Realtime) con RLS
- **@supabase/ssr** para auth con cookies
- **@tanstack/react-query** para cache + invalidación + optimistic updates
- **@dnd-kit** para el drag & drop del Kanban
- **Zustand** para UI state
- **Radix UI** primitivos (Dialog, Dropdown, Tooltip, Popover)
- **lucide-react** para iconos

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 y regístrate con tu email.

El proyecto Supabase ya está configurado en `.env.local`. Email confirmation está desactivada (`mailer_autoconfirm: true`) para que el signup sea inmediato.

## Cargar datos de ejemplo

Tras registrarte, haz click en el engranaje (abajo a la izquierda) → **"Cargar datos de ejemplo"**, o en la portada de Inicio si la base está vacía. Se cargan 16 leads bilingües con pipeline, timeline, tareas, etc.

## Deploy en Netlify / Vercel

**Vercel** (recomendado para Next.js): `vercel` y listo. Variables de entorno:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Netlify**: instala `@netlify/plugin-nextjs` y conecta el repo.

Antes de producción, recuerda:
- Desactivar `mailer_autoconfirm` si quieres confirmación de email real.
- Rotar el `SUPABASE_ACCESS_TOKEN` si lo expusiste.
- Configurar `site_url` en Supabase al dominio real.

## Base de datos

Las migraciones están en `supabase/migrations/`:

- `0001_init.sql` — tablas, enums, índices, RLS, realtime publication.
- `0002_user_onboarding.sql` — seed por usuario nuevo (plantillas, automatizaciones, reglas de scoring).
- `0003_seed_rpc.sql` — RPC `seed_demo_data()` para cargar leads de ejemplo.

Ya aplicadas al proyecto vía Management API (no hace falta volver a correrlas).

## Estructura

```
src/
├── app/
│   ├── (auth)/            login, signup
│   ├── (app)/             layout + 12 rutas protegidas
│   ├── auth/signout/      route handler
│   ├── layout.tsx         root (Inter + JetBrains Mono)
│   ├── providers.tsx      React Query + tweaks effect
│   └── globals.css        tokens + base CSS
├── components/
│   ├── layout/            Sidebar, Topbar, TweaksPanel, Toast, SeedCTA
│   ├── kanban/            KanbanBoard, KanbanColumn, LeadCard
│   ├── lead/              LeadDrawer, TimelineList, Composer
│   └── icons/             BrandIcons (Instagram/LinkedIn SVGs)
├── lib/
│   ├── supabase/          client + server + middleware + types
│   ├── queries/           hooks TanStack Query
│   ├── domain.ts          stage/temp/source metadata + pipeline totals
│   ├── format.ts          fmtEuro, fmtDate, mailtoLink, whatsappLink
│   ├── cn.ts              class merger
│   ├── i18n.ts            strings ES/EN
│   └── useT.ts            hook t()
├── store/                 Zustand (ui + tweaks)
└── middleware.ts          redirects no-auth → /login
```

## Smoke test

`node scripts/full-debug.mjs` — crea 2 usuarios temporales, verifica RLS multi-tenant, mutations, cleanup. Requiere email real (e.g. `@gmail.com`).

## Seguridad

**Importante**: el `SUPABASE_ACCESS_TOKEN` nunca se almacena en archivos. Solo se usó en memoria para aplicar migraciones vía Management API. Rótalo en https://supabase.com/dashboard/account/tokens si lo pegaste en cualquier sitio inseguro.
