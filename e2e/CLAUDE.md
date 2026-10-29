# CLAUDE.md — e2e-тесты (`e2e/`, `@qgames/e2e`)

Playwright (только Chromium) против поднятых стендов. Почему так и отвергнутые варианты — `adr/frontend/e2e-testing.md`.

## Запуск

- Стенды: бэкенд — `docker compose up --build -d --wait` в `../qgames-backend-monorepo` (профиль local: тестовые игроки, seed из заголовка), фронт — то же здесь или `pnpm dev`. Адреса — `E2E_PORTAL_URL` (по умолчанию `http://localhost:3000`), `E2E_ADMIN_URL` (`:3001`).
- Браузер: `pnpm --filter @qgames/e2e exec playwright install chromium`. Тесты: `pnpm test:e2e`, отчёт — `e2e/playwright-report/`.
- Запись ОР сценариев партий: `E2E_UPDATE_SCENARIOS=1 pnpm test:e2e`, затем проверить дифф JSON глазами.

## test-ids в компонентах

- Элемент, который нужен или может понадобиться тесту, получает `data-testid`. Рядом с компонентом лежит `<компонент>.test-ids.ts` с одной константой: `export const testIds = generateTestIds('NotFoundPage', ['homeButton'])` (`@qgames/ui/lib/test-ids`) → `{root: 'NotFoundPage', homeButton: 'notFoundPage__homeButton'}`. `root` ставится на корень компонента (во всех ветках разметки), ключи — на элементы.
- Файл test-ids импортирует только `@qgames/ui/lib/test-ids`: его читает e2e, где нет alias `@/`.
- Одинаковые элементы различаются `data-*` с устойчивым идентификатором (`data-user-id`, `data-login`, `data-game-code`, `data-room-id`, `data-role`, у клеток доски `data-x`/`data-y` в координатах партии), а не текстом: интерфейс будет переводиться. Текст в проверках — только языконезависимый (логин).
- Пакеты с компонентами открывают test-ids через `exports` `"./test-ids/*"` (`@qgames/game-ui`, `@qgames/game-<код>`); приложения — через paths `@portal/*`, `@admin/*` в `e2e/tsconfig.json`.

## Модели (`src/`)

- `src/core/` — `ComponentModel`, `PageModel`, `testBasic`, запись SSE. Модель создаётся только `Model.new(page)` (конструктор закрыт ключом модуля).
- Модель компонента — `class Header extends componentModel(testIds) {}`: на каждый ключ testIds — `Locator` (`header.gamesLink`). Модель страницы — `pageModel(testIds)` + `open(...)` с адресом страницы: `page.goto` есть только внутри `open`. Сужение по `data-*` — `this.byData(locator, {userId})`.
- Новая модель добавляется в карту приложения (`src/portal/models.ts`, `src/admin/models.ts`): из карты строятся фикстуры и модели акторов.

## Тесты (`tests/`)

- Импортируются только `testPortal` / `testAdmin` (и `@playwright/test`). Модели, `src/core`, `src/scenario`, test-ids и `page.goto` в тестах запрещены ESLint.
- Каждое действие — в `await testX.step('Предусловие: …' | 'Шаг N: …', async () => {…})`. В каждом шаге — ожидаемый результат с проверками: `await testX.expected('<ОР>', async () => { await expect(…)… })` (в отчёте — вложенный шаг «ОР: …»).
- Основной игрок портала входит до теста через API (`player`, его логин и пароль — `credentials`); гость — `testX.use({guest: true})`. Игроки стенда — `qwe3qwe1..10`, на воркер — 3 (`src/portal/players.ts`), поэтому `workers` ≤ 3 и не больше 3 пользователей в тесте. Админ — `admin`/`admin`.
- Несколько пользователей — `actors`: `actors.main()` (основной игрок на `page`), `await actors.player()` — новый контекст; у актора `login`, `id`, `page` и модели (`host.roomPage.open(…)`).

## Сценарии партий

- `tests/portal/scenarios/<игра>/*.json` + `<игра>.spec.ts`, который заводит тест на каждый файл и вызывает `scenarios.run(file)`.
- Файл: `game`, `seed` (заголовок `X-Qgames-Seed` старта), `actors` (`name`, `role`; порядок — порядок входа и места, первый создаёт комнату и начинает партию), `steps` (`title`, `actor`, `move` в формате драйвера, `expected`), `start.expected`. `expected` — кадры потока партии по имени актора: id заменены `{{<актор>.id}}`, `{{roomId}}`, `{{sessionId}}`, время (`at`, `serverTime`, `deadline`, `pausedAt`, `remainingMs`) — `$time` (`src/scenario/normalize.ts`). Руками пишутся `actors`, `seed` и ходы, `expected` — режимом записи.
- Ходы — только кликами по доске: драйвер игры в `src/scenario/drivers.ts` (`checkers`: `{path: [[x, y], …], offerDraw?}`, `{resign: true}`, `{acceptDraw: true}`; `nothing`: `{pass: true}`). Новой игре — драйвер, модель доски и test-ids доски.
- Кадры читаются из браузера каждого участника (обёртка `EventSource`, `src/core/sse-recorder.ts`): проверяется то, что получил именно он, с маскировкой.
