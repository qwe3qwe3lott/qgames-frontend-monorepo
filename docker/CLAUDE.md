# Docker и nginx: правила

Вложенный CLAUDE.md: дополняет корневой `CLAUDE.md` (§10) для `docker/`, nginx, CSP и `docker-compose.yml`. Устройство образа `web` (server-блоки, proxy, SSE, лимит памяти) — `adr/c4/deployment.md`, заголовки и CSP с обоснованием — `adr/system/reverse-proxy.md` (`adr/` — `../qgames-workspace/adr` от корня репозитория).

- Конфиг nginx — шаблон `docker/nginx/web.conf.template` (envsubst при старте: `HTTPS_LISTEN`/`HTTP_LISTEN`, `PORTAL_SERVER_NAME`/`ADMIN_SERVER_NAME`, `API_UPSTREAM`, `API_UPSTREAM_RESOLVE`, `HSTS`) и сниппеты `api-proxy.conf`, `spa.conf`; `nginx.conf` — конфиг базового образа с поднятым `worker_connections`. Строку `server` upstream собирает `docker/nginx/18-api-upstream.envsh`: в проде (`API_UPSTREAM_RESOLVE=true`) — имя с `resolve` через DNS Docker, локально — только IPv4-адрес `host.docker.internal`.
- Прод — `deploy/compose.yml` (сеть `qgames` с бэкендом, сертификаты Let's Encrypt и webroot `/var/www/acme` с хоста, HSTS), выкатка — `.github/workflows/deploy.yml` по push в ветку `deploy`. Сервер и TLS — `adr/system/hosting.md`.
- Оба сайта — на одном HTTPS-порту (8443 в контейнере, 443 снаружи) и различаются `server_name`; HTTP-порт — только редирект на HTTPS и `/healthz` для healthcheck. Сертификат на оба имени — том `/etc/nginx/certs` (`cert.pem`, `key.pem`; локально — mkcert из `docker/certs/`), в образ не входит; `docker/certs` и `.env` корня исключены в `.dockerignore`. Имена в compose — из `LOCAL_DOMAIN` (`.env` корня).
- Заголовки ставятся на уровне server с `always` (`add_header_inherit merge`). Дубли заголовков от Spring скрываются `proxy_hide_header`. Новый внешний источник скриптов, стилей или фреймов требует правки CSP, по согласованию.
- Образ собирается на `node:<версия>-alpine`, мажор совпадает с `.nvmrc`, обновляются вместе.
- `PUBLIC_*` вшиваются при сборке из `apps/<app>/.env`. Если файла нет при наличии `.env.example`, сборка падает. После правки `.env` — `--build`.
- Бэкенд в этот compose не входит.
