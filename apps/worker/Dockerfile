# syntax=docker/dockerfile:1
# The worker needs the whole monorepo (not just its own package) because it
# shells out to `pnpm --filter @journal/web-builder build` to run the static
# builder as part of processing a static-build job (PRD §16, §18).
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/web-builder/package.json apps/web-builder/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @journal/database build
RUN pnpm --filter @journal/worker build

ENV NODE_ENV=production
ENV REPO_ROOT=/repo
CMD ["node", "apps/worker/dist/main.js"]
