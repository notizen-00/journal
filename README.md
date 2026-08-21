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

## Iterating without rebuilding everything

Rebuilding an image is the slow path: even a fully cached `docker compose build admin`
costs ~3 minutes, because the whole image still has to be exported. Don't rebuild to
iterate — rebuild only to ship.

**While editing — no Docker rebuild at all.** Keep infra in containers and run the app
you're changing natively, with hot reload:

```bash
pnpm infra:up                      # postgres, redis, minio, api
docker compose stop admin          # free port 5174 for the dev server
pnpm --filter @journal/admin dev   # http://localhost:5174, HMR, ready in ~1s
```

**When you want it in the container — one service only.** `docker compose up -d --build admin`
also rebuilds and restarts everything `admin` depends on; `--no-deps` is what keeps it to
one service (~18s once the image is built):

```bash
pnpm deploy:admin    # build admin + restart just that container
```

Note that `docker compose exec admin pnpm build` does **not** work: the runtime image is a
minimal production stage (`node:20-alpine`, prod deps + `build/` only). It has no source,
no Vite, and no dev dependencies — and the source is baked in at image-build time, so
editing files on the host would not be visible inside it anyway.

Which service to redeploy for a given change:

| You changed | Redeploy |
| --- | --- |
| `apps/admin` | `pnpm deploy:admin` |
| `apps/api` | `pnpm deploy:api` |
| `apps/worker` **or `apps/web-builder`** | `pnpm deploy:worker` |
| `infra/nginx` | `pnpm deploy:nginx` |

`web-builder` has no container of its own — the worker image bakes the whole repo at
`/repo` and shells out to it per build job. So a theme or block change reaches the public
site only after `pnpm deploy:worker`, followed by a new build for the journal.

Rebuild cost depends on what you touched: editing source re-runs only the last layers,
but changing any `package.json` or `pnpm-lock.yaml` invalidates the cached
`pnpm install` layer and makes the build much slower.

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
| `pnpm infra:up` | Start only postgres/redis/minio/api, for running an app natively |
| `pnpm infra:down` | Stop those infra containers |
| `pnpm deploy:admin` | Rebuild + restart **only** the admin container |
| `pnpm deploy:api` | Rebuild + restart **only** the api container |
| `pnpm deploy:worker` | Rebuild + restart **only** the worker (also ships `web-builder`) |
| `pnpm deploy:nginx` | Rebuild + restart **only** nginx |

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
