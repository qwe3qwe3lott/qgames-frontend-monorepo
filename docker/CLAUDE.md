# Docker и nginx: правила

Вложенный CLAUDE.md: дополняет корневой `CLAUDE.md` (§10) для `docker/`, nginx, CSP и `docker-compose.yml`. Устройство образа `web` (server-блоки, proxy, SSE, лимит памяти) — `adr/c4/deployment.md`, заголовки и CSP с обоснованием — `adr/system/reverse-proxy.md` (`adr/` — `../qgames-workspace/adr` от корня репозитория).

- Конфиг nginx — шаблон `docker/nginx/web.conf.template` (envsubst при старте: `PORTAL_LISTEN`/`PORTAL_SERVER_NAME`, `ADMIN_LISTEN`/`ADMIN_SERVER_NAME`, `API_UPSTREAM`) и сниппеты `api-proxy.conf`, `spa.conf`. В upstream попадает только IPv4-адрес `API_UPSTREAM` (`docker/nginx/18-api-upstream-ipv4.envsh`).
- Заголовки ставятся на уровне server с `always` (`add_header_inherit merge`). Дубли заголовков от Spring скрываются `proxy_hide_header`. Новый внешний источник скриптов, стилей или фреймов требует правки CSP, по согласованию.
- Образ собирается на `node:<версия>-alpine`, мажор совпадает с `.nvmrc`, обновляются вместе.
- `PUBLIC_*` вшиваются при сборке из `apps/<app>/.env`. Если файла нет при наличии `.env.example`, сборка падает. После правки `.env` — `--build`.
- Бэкенд в этот compose не входит.
