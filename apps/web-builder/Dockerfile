# syntax=docker/dockerfile:1
# Standalone build of the static builder for one journal, useful for manual
# or CI builds outside the worker's automatic pipeline. Pass JOURNAL_ID,
# API_BASE_URL and INTERNAL_API_TOKEN as build args. The worker container
# normally runs this same `pnpm --filter @journal/web-builder build` command
# itself instead of using this image (PRD §16, §18).
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web-builder/package.json apps/web-builder/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile --filter @journal/web-builder...

COPY apps/web-builder apps/web-builder
COPY packages/shared-types packages/shared-types

ARG JOURNAL_ID
ARG API_BASE_URL
ARG INTERNAL_API_TOKEN
ENV JOURNAL_ID=$JOURNAL_ID
ENV API_BASE_URL=$API_BASE_URL
ENV INTERNAL_API_TOKEN=$INTERNAL_API_TOKEN
ENV BUILD_OUT_DIR=/out

RUN pnpm --filter @journal/web-builder build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /out /usr/share/nginx/html
EXPOSE 80
