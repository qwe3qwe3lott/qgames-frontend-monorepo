# syntax=docker/dockerfile:1.7
# Образ storybook: статика Storybook (apps/storybook) на nginx. Только для локального docker-compose.yml:
# в прод (deploy/compose.yml, образ web) не входит. Бэкенд не нужен — истории рисуют компоненты на пропсах.
# Контекст сборки — корень репозитория, потому что истории лежат в packages/*.

# Те же Node и pnpm, что у образа web (docker/app.Dockerfile): мажор — как в .nvmrc, обновлять вместе.
FROM node:24.22.1-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1 \
    STORYBOOK_DISABLE_TELEMETRY=1
RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm fetch --store-dir /pnpm/store

COPY . .

RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --offline --store-dir /pnpm/store
RUN pnpm turbo run build --filter=@qgames/storybook

# Стандартный server-блок образа (порт 8080, корень /usr/share/nginx/html) — своего конфига nginx не нужно.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
USER root
RUN rm -rf /usr/share/nginx/html/*
USER nginx
COPY --from=build /workspace/apps/storybook/dist /usr/share/nginx/html
EXPOSE 8080
