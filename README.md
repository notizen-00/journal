# Journal Publisher

Monorepo for a Journal Publisher platform that separates OJS editorial workflows from a
static public frontend, per `PRD — Journal Static Frontend & OAI.md`. OJS stays the system
of record for submission/review/editorial/DOI; this platform owns homepage, pages, menus,
theme, rich content, OAI harvesting, and static site generation/deployment. Visitors never
hit OJS, the API, or a database directly — they only ever see pre-built static files.

```
OJS --OAI-PMH--> [worker: OAI harvest] --> Postgres --> [worker: static build]
                                                              |
                                                              v
                                              releases/<journal>/<buildId> --activate--> current
                                                              |
                                                              v
                                                        nginx / MinIO / CDN --> Public User

Admin (SvelteKit) --HTTP+JWT--> API (NestJS) --BullMQ jobs--> worker
```

## Repo structure

```
apps/
  api/          NestJS — Journals, Pages (+versioning/publish), Menus, Media (MinIO),
                Themes, Articles/Issues (read), Sync (triggers OAI harvest), Builds,
                Deployments, Auth (JWT), and a build-time-only public data feed
  worker/       BullMQ processors — OAI-PMH harvester (Dublin Core, incremental,
                resumptionToken) and static-build (runs web-builder, atomic release swap)
  admin/        SvelteKit CMS dashboard — journals, pages with a Tiptap rich editor,
                menus, media, theme settings, OAI sync, builds/rollback
  web-builder/  SvelteKit (adapter-static) — renders the public site for one journal at
                build time: block renderer, 3 theme presets, article/issue mirrors
packages/
  database/     Prisma schema (all tables from PRD §35), migrations, seed script
  shared-types/ Shared TypeScript types (NormalizedArticle, Block, build job payloads)
infra/
  nginx/        Reverse proxy — "/" serves the static release, "/admin/" and "/api/" proxy
docker-compose.yml   postgres, redis, minio, migrate, seed, api, worker, admin, nginx
```

## Prerequisites

- [Docker](https://www.docker.com/) with Compose v2 (`docker compose version`)
- Node.js 20+ and [pnpm](https://pnpm.io/) 9+ if you want to run apps outside Docker

## Quick start

```bash
cp .env.example .env
# edit .env: at minimum change JWT_SECRET, INTERNAL_API_TOKEN, SEED_ADMIN_PASSWORD,
# POSTGRES_PASSWORD and MINIO_ROOT_PASSWORD before you touch production data.

docker compose up --build
```

First run builds every image, applies Prisma migrations (`migrate` service), seeds the
three theme presets plus an admin user (`seed` service), then starts api/worker/admin/nginx.

| Service              | URL                              |
| -------------------- | --------------------------------- |
| Public site           | http://localhost:8080             |
| Admin dashboard        | http://localhost:8080/admin        |
| API + Swagger docs      | http://localhost:3000/docs          |
| MinIO console          | http://localhost:9001              |

Log into the admin dashboard with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.

To see a journal on the public site: create a journal in the admin (with its OJS URL +
OAI endpoint), run **Sync Now** under its OAI Sync tab to harvest articles, then **Build
now** under its Builds tab. Set `DEFAULT_JOURNAL_ID` in `.env` to that journal's id and
restart `nginx` so `/` serves it.

## Local development (without full Docker)

Only infra needs containers; the apps can run natively against them:

```bash
docker compose up -d postgres redis minio minio-init
pnpm install
pnpm db:migrate     # first time only — creates/updates the schema
pnpm db:seed

pnpm --filter @journal/api dev       # http://localhost:3000
pnpm --filter @journal/admin dev     # http://localhost:5174
pnpm --filter @journal/worker dev
```

`web-builder` has no long-running dev server in production use — the worker invokes
`pnpm --filter @journal/web-builder build` per build job. To iterate on themes/blocks
locally, run that build command directly with `JOURNAL_ID`, `API_BASE_URL`, and
`INTERNAL_API_TOKEN` set, pointing at a running api.

## Common scripts

| Command | Effect |
| --- | --- |
| `pnpm dev` | `turbo run dev` across all apps |
| `pnpm build` | `turbo run build` across all apps/packages |
| `pnpm typecheck` | Type-check everything |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:migrate` | Create/apply a dev migration (needs a running Postgres) |
| `pnpm db:deploy` | Apply committed migrations (what `docker compose` runs) |
| `pnpm db:seed` | Re-run the seed script (idempotent) |

## Known limitations

- The page editor supports one rich-text block per page today, not the full multi-block
  drag-and-drop builder from PRD §13 — enough to satisfy the MVP acceptance criteria
  (draft/preview/publish with a rich editor), but block picking isn't a visual builder yet.
- OAI Dublin Core parsing (`apps/worker/src/oai/normalize.ts`) uses heuristics (e.g.
  guessing volume/issue from `dc:source`, "Last, First" author names) that should be
  validated against your actual OJS instance's OAI-PMH feed — formats vary slightly
  between OJS versions/configurations.
- Admin has no dedicated Articles/Issues browsing tab yet; that data is reachable via the
  API/Swagger docs (`/journals/:id/articles`, `/journals/:id/issues`) in the meantime.
- Multi-domain routing (PRD §28) is a documented pattern in
  `infra/nginx/templates/default.conf.template`, not yet generated per journal — add a
  `server_name` block per domain when you have journals to route.
