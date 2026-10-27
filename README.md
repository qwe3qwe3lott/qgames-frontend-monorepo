# qgames-frontend

Фронтенд игрового портала qgames: монорепозиторий на pnpm + Turborepo.

| Приложение    | Что это                                         | Порт |
| ------------- | ----------------------------------------------- | ---- |
| `apps/portal` | Игровой портал (CSR, Rsbuild + TanStack Router) | 3000 |
| `apps/admin`  | Админка (CSR, Rsbuild + TanStack Router)        | 3001 |

Общие пакеты: `packages/ui` (shadcn/ui + Tailwind), `packages/api` (клиенты групп API `portal` и `admin` бэкенда из OpenAPI, Orval), `packages/config` (TypeScript, ESLint, Stylelint, Prettier), `packages/game-ui` (общий игровой UI), `packages/games/*` (модули игр, каждая — отдельный чанк).

## Подготовка

Нужны Node.js 24 (`.nvmrc`) и pnpm 12 (`npm i -g pnpm@12`).

В `apps/portal` и `apps/admin` создать файл `.env` по образцу `.env.example` из той же папки.

Бэкенд (`qgames-backend-monorepo`) поднимается отдельно, в своём репозитории.

Установка зависимойстей:
```bash
pnpm install
```

## Запуск в dev-режиме

```bash
pnpm dev            # portal :3000, admin :3001
```

## Запуск в Docker

```bash
docker compose up --build -d --wait   # portal :3000, admin :3001
```

## Архитектура и решения

Описание всей системы (бэкенд и фронтенд) лежит в репозитории воркспейса, в папке [`adr/`](https://github.com/qwe3qwe3lott/qgames-workspace/tree/master/adr) (локально — `../qgames-workspace/adr`): архитектурные решения (ADR), диаграммы C4 и схема БД (ERD). Начинать с `adr/README.md`.

Правила написания кода — в [CLAUDE.md](CLAUDE.md).
