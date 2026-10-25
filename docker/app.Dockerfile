# syntax=docker/dockerfile:1.7
# Образ web: статика portal и admin + reverse proxy /api на бэкенд, всё раздаёт nginx (docker/nginx/).
# Контекст сборки — корень репозитория, потому что приложения зависят от packages/*.
# Переменные PUBLIC_* берутся из apps/<app>/.env и вшиваются в бандл при сборке:
# смена значения — пересборка образа.

# Точная версия Node: сборки воспроизводимы. Мажор — как в .nvmrc, обновлять вместе.
FROM node:24.22.1-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1
# pnpm нужной версии (packageManager в package.json) ставит corepack.
RUN corepack enable
WORKDIR /workspace

# Зависимости скачиваются только по lockfile: слой не пересобирается, пока не менялись зависимости.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm fetch --store-dir /pnpm/store

COPY . .

# Приложение с .env.example ждёт свой .env: без него Rsbuild соберёт бандл,
# но он упадёт в браузере на проверке env (src/shared/config/env.ts).
RUN for app in portal admin; do \
      if [ -f "apps/${app}/.env.example" ] && [ ! -f "apps/${app}/.env" ]; then \
        echo "Нет apps/${app}/.env: скопируйте apps/${app}/.env.example в apps/${app}/.env и пересоберите образ" >&2; \
        exit 1; \
      fi; \
    done

RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --offline --store-dir /pnpm/store
RUN pnpm turbo run build --filter=@qgames/portal --filter=@qgames/admin

# nginx-unprivileged: процесс работает от пользователя nginx (uid 101), порты 3000 и 3001.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
# Значения по умолчанию для шаблона docker/nginx/web.conf.template (переопределяются env контейнера).
ENV PORTAL_LISTEN=3000 \
    PORTAL_SERVER_NAME=_ \
    ADMIN_LISTEN=3001 \
    ADMIN_SERVER_NAME=_ \
    API_UPSTREAM=host.docker.internal:8080
# Убираем дефолтные конфиг и страницы образа. Каталог статики принадлежит root, поэтому root — только на этот шаг.
USER root
# Каталоги шаблонов и сниппетов создаются заранее: COPY --chmod=644 выставил бы этот режим и новому каталогу.
RUN rm /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/* \
    && mkdir -p /etc/nginx/templates /etc/nginx/snippets
USER nginx
# Файлы копируются от root и доступны nginx только на чтение.
# Шаблон при старте превращается в /etc/nginx/conf.d/web.conf (envsubst в entrypoint образа).
COPY --chmod=644 docker/nginx/web.conf.template /etc/nginx/templates/web.conf.template
COPY --chmod=644 docker/nginx/api-proxy.conf docker/nginx/spa.conf /etc/nginx/snippets/
# Скрипт entrypoint: IPv4-адрес бэкенда для upstream (без exec-бита entrypoint его пропустит).
COPY --chmod=755 docker/nginx/18-api-upstream-ipv4.envsh /docker-entrypoint.d/
COPY --from=build /workspace/apps/portal/dist /usr/share/nginx/html/portal
COPY --from=build /workspace/apps/admin/dist /usr/share/nginx/html/admin
EXPOSE 3000 3001
