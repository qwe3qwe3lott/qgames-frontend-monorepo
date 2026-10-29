# qgames-frontend

Фронтенд игрового портала qgames: монорепозиторий на pnpm + Turborepo.

| Приложение    | Что это                                         | Адрес (Docker / `pnpm dev`)                                    |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `apps/portal` | Игровой портал (CSR, Rsbuild + TanStack Router) | `https://<LOCAL_DOMAIN>` / `https://<LOCAL_DOMAIN>:3000`       |
| `apps/admin`  | Админка (CSR, Rsbuild + TanStack Router)        | `https://admin.<LOCAL_DOMAIN>` / `https://admin.<LOCAL_DOMAIN>:3001` |

Общие пакеты: `packages/ui` (shadcn/ui + Tailwind), `packages/api` (клиенты групп API `portal` и `admin` бэкенда из OpenAPI, Orval), `packages/config` (TypeScript, ESLint, Stylelint, Prettier), `packages/game-ui` (общий игровой UI), `packages/games/*` (модули игр, каждая — отдельный чанк).

## Подготовка

Нужны Node.js 24 (`.nvmrc`) и pnpm 12 (`npm i -g pnpm@12`).

В корне, в `apps/portal` и в `apps/admin` создать файл `.env` по образцу `.env.example` из той же папки.

Бэкенд (`qgames-backend-monorepo`) поднимается отдельно, в своём репозитории.

Установка зависимостей:
```bash
pnpm install
```

### Локальный домен с HTTPS

Локально портал и админка открываются, как в проде: на HTTPS и на двух хостах одного сайта. Портал — `<LOCAL_DOMAIN>`, админка — `admin.<LOCAL_DOMAIN>`, `LOCAL_DOMAIN` задаётся в `.env` корня (по умолчанию `local.qgames.duckdns.org`). Так куки, same-site и CSRF-модель работают так же, как в проде. Один раз:

1. Записи в `hosts` (Windows — `C:\Windows\System32\drivers\etc\hosts` от администратора, Linux и macOS — `/etc/hosts` через `sudo`):
   ```
   127.0.0.1 local.qgames.duckdns.org
   127.0.0.1 admin.local.qgames.duckdns.org
   ```
2. [mkcert](https://github.com/FiloSottile/mkcert) (Windows — `choco install mkcert` или `scoop install mkcert`, macOS — `brew install mkcert`). Локальный CA ставится в систему и браузеры (на Windows — от администратора), затем выпускается сертификат на оба имени:
   ```bash
   mkcert -install
   mkdir -p docker/certs
   mkcert -cert-file docker/certs/cert.pem -key-file docker/certs/key.pem local.qgames.duckdns.org admin.local.qgames.duckdns.org
   ```
   `docker/certs/` в `.gitignore`. Его используют и nginx в Docker, и dev-сервер. На Linux ключ от mkcert получает права 0600, и nginx в контейнере (uid 101) его не прочитает: выполните `chmod 644 docker/certs/key.pem` (ключ локального CA, не прод).

Порты 80 и 443 на хосте должны быть свободны (Docker-стенд).

Вход через Google локально (необязательно, без него кнопки Google скрыты): в Google Cloud Console настроить OAuth consent screen (External, Testing, себя — в Test users) и создать OAuth client ID типа Web application с Authorized JavaScript origins `https://local.qgames.duckdns.org` и `https://local.qgames.duckdns.org:3000` (redirect URI не нужны). Google принимает только домены с публичным суффиксом, поэтому `.local` и `.localhost` не подходят. Client ID прописать в `GOOGLE_CLIENT_IDS` (`.env` бэкенда, затем `docker compose up -d`) и в `PUBLIC_GOOGLE_CLIENT_ID` (`apps/portal/.env`).

## Запуск в dev-режиме

```bash
pnpm dev            # https://<LOCAL_DOMAIN>:3000, https://admin.<LOCAL_DOMAIN>:3001
```

## Запуск в Docker

```bash
docker compose up --build -d --wait   # https://<LOCAL_DOMAIN>, https://admin.<LOCAL_DOMAIN>; http:// — редирект на https://
```

## Архитектура и решения

Описание всей системы (бэкенд и фронтенд) лежит в репозитории воркспейса, в папке [`adr/`](https://github.com/qwe3qwe3lott/qgames-workspace/tree/master/adr) (локально — `../qgames-workspace/adr`): архитектурные решения (ADR), диаграммы C4 и схема БД (ERD). Начинать с `adr/README.md`.

Правила написания кода — в [CLAUDE.md](CLAUDE.md).
