# syntax=docker/dockerfile:1
# One-off image used by the `migrate` compose service to apply Prisma
# migrations before api/worker start (kept separate from the api runtime
# image so the pruned production image doesn't need the prisma CLI).
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile --filter @journal/database...

COPY packages/database packages/database
WORKDIR /repo/packages/database
RUN pnpm run generate

ENTRYPOINT ["pnpm", "run", "migrate:deploy"]
