# Docker, nginx и локальный вход через Google

Справочник к CLAUDE.md §10: читать, когда трогаешь `docker/`, nginx, CSP, `docker-compose.yml` или настраиваешь Google-вход локально. Устройство образа `web` (server-блоки, proxy, SSE, лимит памяти) — `../qgames-workspace/adr/c4/deployment.md`, заголовки и CSP с обоснованием — `adr/system/reverse-proxy.md`.

## Вход через Google локально

В Google Cloud Console настроить OAuth consent screen (External, Testing, себя — в Test users) и создать OAuth client ID типа Web application с Authorized JavaScript origins `http://localhost:3000` и `http://localhost` (redirect URI не нужны). Client ID прописать в `GOOGLE_CLIENT_IDS` (`.env` бэкенда, затем `docker compose up -d`) и в `PUBLIC_GOOGLE_CLIENT_ID` (`apps/portal/.env`).

## Правила

- Конфиг nginx — шаблон `docker/nginx/web.conf.template` (envsubst при старте: `PORTAL_LISTEN`/`PORTAL_SERVER_NAME`, `ADMIN_LISTEN`/`ADMIN_SERVER_NAME`, `API_UPSTREAM`) и сниппеты `api-proxy.conf`, `spa.conf`. В upstream попадает только IPv4-адрес `API_UPSTREAM` (`docker/nginx/18-api-upstream-ipv4.envsh`).
- Заголовки ставятся на уровне server с `always` (`add_header_inherit merge`). Дубли заголовков от Spring скрываются `proxy_hide_header`. Новый внешний источник скриптов, стилей или фреймов требует правки CSP, по согласованию.
- Образ собирается на `node:<версия>-alpine`, мажор совпадает с `.nvmrc`, обновляются вместе.
- `PUBLIC_*` вшиваются при сборке из `apps/<app>/.env`. Если файла нет при наличии `.env.example`, сборка падает. После правки `.env` — `--build`.
- Бэкенд в этот compose не входит.
