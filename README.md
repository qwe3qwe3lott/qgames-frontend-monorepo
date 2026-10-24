# qgames-frontend

Фронтенд игрового портала qgames: монорепозиторий на pnpm + Turborepo.

| Приложение    | Что это                                         | Порт |
| ------------- | ----------------------------------------------- | ---- |
| `apps/portal` | Игровой портал (CSR, Rsbuild + TanStack Router) | 3000 |
| `apps/admin`  | Админка (CSR, Rsbuild + TanStack Router)        | 3001 |

Общие пакеты: `packages/ui` (shadcn/ui + Tailwind), `packages/api` (клиенты групп API `portal` и `admin` бэкенда из OpenAPI, Orval), `packages/config` (TypeScript, ESLint, Stylelint, Prettier), `packages/game-ui` (общий игровой UI), `packages/games/*` (модули игр, каждая — отдельный чанк).

## Запуск

Нужны Node.js 24 (`.nvmrc`) и pnpm 12 (`npm i -g pnpm@12`).

```bash
pnpm install
cp apps/portal/.env.example apps/portal/.env   # и так же для admin
pnpm dev
```

Бэкенд (`qgames-backend-monorepo`) поднимается отдельно: `docker compose up --build -d --wait`.

## Запуск через Docker

Прод-сборка всех приложений, статику раздаёт nginx (без hot reload — для разработки `pnpm dev`). Нужен только Docker.

```bash
cp apps/portal/.env.example apps/portal/.env   # и так же для admin
docker compose up --build -d --wait            # portal :3000, admin :3001
docker compose down                            # остановить
```

- Переменные `PUBLIC_*` берутся из `apps/<app>/.env` и вшиваются в бандл при сборке: после правки `.env` — снова `docker compose up --build -d --wait`. Без `.env` сборка приложения падает с подсказкой.
- Внутри контейнера nginx работает не от root (`nginxinc/nginx-unprivileged`) и слушает 8080; наружу — порты 3000 и 3001. На всех ответах — заголовки `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
- Бэкенд в этот compose не входит и поднимается в своём репозитории.

## Команды

```bash
pnpm dev            # все приложения
pnpm build          # сборка
pnpm typecheck      # проверка типов
pnpm lint           # ESLint + Stylelint
pnpm format         # Prettier
pnpm api:fetch      # снять OpenAPI групп portal и admin с запущенного бэкенда (API_URL, по умолчанию http://localhost:8080; снапшоты не коммитятся)
pnpm api:generate   # сгенерировать клиент API
```

Правила разработки — в [CLAUDE.md](CLAUDE.md).
