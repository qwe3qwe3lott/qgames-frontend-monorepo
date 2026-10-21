# syntax=docker/dockerfile:1.7
# Общий multi-stage образ для всех приложений: приложение задаётся аргументом APP (portal | admin | landing),
# каталог статики — аргументом OUT (dist у Rsbuild, out у статического экспорта Next).
# Контекст сборки — корень репозитория, потому что приложения зависят от packages/*.
# Переменные PUBLIC_* / NEXT_PUBLIC_* берутся из apps/${APP}/.env и вшиваются в бандл при сборке:
# смена значения — пересборка образа.

FROM node:24-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1 \
    NEXT_TELEMETRY_DISABLED=1
# pnpm нужной версии (packageManager в package.json) ставит corepack.
RUN corepack enable
WORKDIR /workspace

# Зависимости скачиваются только по lockfile: слой не пересобирается, пока не менялись зависимости.
# sharing=locked: compose собирает образы параллельно, а общий store pnpm нельзя использовать одновременно.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm fetch --store-dir /pnpm/store

COPY . .
ARG APP
ARG OUT

RUN test -n "${APP}" && test -n "${OUT}" \
    || { echo "Не заданы аргументы сборки APP и OUT" >&2; exit 1; }
# Без .env Rsbuild-приложения соберутся, но упадут в браузере на проверке env (src/shared/config/env.ts).
RUN test -f "apps/${APP}/.env" \
    || { echo "Нет apps/${APP}/.env: скопируйте apps/${APP}/.env.example в apps/${APP}/.env и пересоберите образ" >&2; exit 1; }

RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --offline --store-dir /pnpm/store
RUN pnpm turbo run build --filter="@qgames/${APP}"

# nginx-unprivileged: процесс работает от пользователя nginx (uid 101) и слушает 8080.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
ARG APP
ARG OUT
# Конфиг nginx: spa.conf (portal, admin) или landing.conf.
ARG NGINX_CONF
# Без аргумента COPY ниже скопировал бы весь docker/nginx/ в app.conf, и nginx упал бы при старте.
RUN test -n "${NGINX_CONF}" \
    || { echo "Не задан аргумент сборки NGINX_CONF" >&2; exit 1; }
# Убираем дефолтные конфиг и страницы образа nginx. Каталог статики принадлежит root, поэтому root — только на этот шаг.
USER root
RUN rm /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*
USER nginx
# Файлы копируются от root и доступны nginx только на чтение.
COPY --chmod=644 docker/nginx/${NGINX_CONF} /etc/nginx/conf.d/app.conf
COPY --from=build /workspace/apps/${APP}/${OUT} /usr/share/nginx/html
