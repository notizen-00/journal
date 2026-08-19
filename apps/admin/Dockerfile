# syntax=docker/dockerfile:1
FROM node:24.19-slim AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web-builder/package.json apps/web-builder/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @journal/admin build
RUN pnpm deploy --filter=@journal/admin --prod /out/admin

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/admin ./
COPY --from=build /repo/apps/admin/build ./build
EXPOSE 3000
CMD ["node", "build/index.js"]
