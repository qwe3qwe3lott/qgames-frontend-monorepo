# CLAUDE.md — правила разработки qgames-frontend

Фронтенд игрового портала qgames: монорепозиторий с CSR-приложениями (портал, админка). Бэкенд — отдельный репозиторий `qgames-backend-monorepo`, воркспейс агентов — `qgames-workspace`. Все три репозитория лежат рядом в одной родительской папке, поэтому бэкенд доступен по относительному пути `../qgames-backend-monorepo`.

**Архитектура системы — `../qgames-workspace/adr/`** (дальше `adr/`): ADR (почему так), диаграммы C4 (из чего состоит и как связано), ERD (схема БД). Перед анализом задачи прочитать `adr/README.md` и нужные диаграммы. Этот файл — правила написания кода.

## 0. Процесс принятия решений (главное правило)

- **Архитектурные решения принимает только пользователь.** Новая библиотека, пакет, приложение, слой или сегмент FSD, способ работы с API, изменение правил линтера, сборки или структуры, способ деплоя и т.п. — сначала вопрос пользователю с вариантами и рекомендацией, затем реализация.
- Если правило здесь противоречит задаче — спросить, а не обходить молча.
- **Не замалчивать проблемы.** Если по ходу работы что-то смущает (риск безопасности, противоречие правилам или ранее сказанному, сомнительное поведение, техдолг, расхождение кода, документации и контракта бэкенда), сразу сказать пользователю и спросить, как поступить, предложив варианты. Не чинить молча и не откладывать «на потом» без согласования.
- **Бэкенд изучаем по его монорепозиторию** (`../qgames-backend-monorepo`), только чтение. Когда нужно понять, как работает бэкенд (поведение ручки, коды ошибок, валидация, куки и refresh, SSE, роли), смотреть туда, а не гадать:
  - `adr/` — архитектура всей системы и принятые решения; `CLAUDE.md` бэкенда — правила его кода;
  - `<m>/<m>-api` модулей (`user-auth`, `admin-auth`, `game`) — публичные контракты: REST-интерфейсы ручек с описаниями и кодами ошибок (`@Operation`/`@ApiResponses`), DTO, имена и пути кук;
  - `<m>/<m>` — реализация модулей (маппинг, проверки, куки, обработка ошибок), `app` — Security (две цепочки: портал и `/api/admin/**`), группы OpenAPI `portal`/`admin`, `application.yml`;
  - `docker-compose.yml` бэкенда — порты, адреса, настройки локального стенда.

  Клиент API (§5) генерируется только по OpenAPI; код бэкенда нужен для понимания поведения, а не для ручного описания типов.

- **Репозиторий бэкенда не правим.** Если фронту нужна правка бэкенда (новая ручка, поле, код ошибки), описать её пользователю — правку делает он.
- **Git:** рабочая и основная ветка — `master` (`main` не используется). Коммиты делает пользователь; без явной просьбы не коммитить и не пушить.

### Как вести этот файл

- **Здесь — «как писать код»:** разделы 1–10 — действующие правила. Правило, нужное почти в любой задаче, записывается в профильный раздел, правило одной области — во вложенный `CLAUDE.md` её папки (сейчас `packages/games/CLAUDE.md`, `docker/CLAUDE.md`, `e2e/CLAUDE.md`): Claude Code подгружает его при работе с файлами папки, корневой файл ссылается на него для смежных мест. Папки `docs/` нет.
- **«Почему» и устройство системы — в `adr/`, а не здесь.** Обоснование решения, отвергнутые варианты и последствия — в ADR (`adr/<группа>/<slug>.md`, ссылка из профильного раздела). Устройство (компоненты, маршруты, потоки) — в C4. Изменение кода, затрагивающее диаграмму или решение, обновляет `adr/` в той же задаче (правила ведения — `adr/README.md`).
- **Отвергнутые варианты** лежат в разделе «Рассмотренные варианты» своего ADR. Повторно такой вариант предлагать только с новым аргументом, и этот аргумент нужно назвать явно.
- **Журнала изменений и дат нет:** файлы описывают текущее состояние. Если решение меняется, правило переписывается на месте, ADR — тоже, а прежний вариант уходит в его «Рассмотренные варианты».
- Отложенные вопросы записываются пометкой «решить при …» в профильном разделе или в «Открытых вопросах» ADR.
- **От технологии, приложения или фичи отказались — сведения о ней удаляются целиком**, включая её ADR.

## 1. Приложения

| Приложение     | Назначение                                            | Сборка              | Рендеринг                           | Порт (dev) |
| -------------- | ----------------------------------------------------- | ------------------- | ----------------------------------- | ---------- |
| `apps/portal`  | Игровой портал: вход, профиль, комнаты, партии        | Rsbuild (Rspack)    | CSR SPA, чанки по роутам            | 3000       |
| `apps/admin`   | Админка портала                                       | Rsbuild (Rspack)    | CSR SPA, чанки по роутам            | 3001       |

- **Бэкенд — одно приложение** (`http://localhost:8080` локально), API разделён на две группы: portal → группа `portal` (`/api/**`, кроме `/api/admin/**`), admin → группа `admin` (`/api/admin/**`).
- Приложения ходят в API **того же origin**, что и страница: портал — `/api/**` своего хоста (прод — `https://qgames.duckdns.org`), админка — `/api/admin/**` своего хоста (прод — `https://admin.qgames.duckdns.org`). API админки на хосте портала закрыт (404), API портала на хосте админки — тоже. Локально — так же по HTTPS на `<LOCAL_DOMAIN>` и `admin.<LOCAL_DOMAIN>` (`.env` корня, mkcert, hosts — `README.md`), в `pnpm dev` с портами :3000 и :3001; бэкенд :8080 за прокси. На `http://localhost` не переходить: там другие правила кук и same-site.
- **Админка ходит только в группу `admin` (`/api/admin/**`), никогда в ручки портала.** Сессия — в куках `admin_access_token` (`Path=/api/admin`) / `admin_refresh_token` (`Path=/api/admin/auth`), ручки сессии — `/api/admin/auth/*`, 401 `UNAUTHENTICATED` — как у портала.
- **Маршруты и поведение страниц** (таблицы маршрутов админки и портала, реестр игр, каталог и статусы игр, авторизованная зона, вход и регистрация, настройки комнаты, присутствие, партия на странице комнаты, роли) — в **`adr/c4/3-frontend-portal.md`**: читать, когда трогаешь страницы или маршруты. В портале страницы «после входа» лежат под layout-маршрутом `routes/_authenticated.tsx`: гостю он показывает окно входа и регистрации на том же адресе, страницы `/login` нет. Новую страницу «после входа» кладём в `routes/_authenticated/`. В админке гость по-прежнему уходит на `/login?redirect=<текущий адрес>`.

## 2. Структура репозитория и пакетов

```
apps/
  portal/        CSR SPA (Rsbuild + TanStack Router)
  admin/         CSR SPA (Rsbuild + TanStack Router)
packages/
  config/        @qgames/config: tsconfig-пресеты, фабрика ESLint flat-конфига, stylelint, prettier
  ui/            @qgames/ui: компоненты shadcn/ui, общие PageLayout и WithHint, cn(), globals.css (Tailwind 4, тема)
  api/           @qgames/api: Orval-клиенты групп API `portal` и `admin` (типы, queryOptions, хуки, Zod; снапшоты OpenAPI — вход генерации, не коммитятся), fetch-mutator, errorMessage и applyFieldErrors
  game-ui/       @qgames/game-ui: общий игровой UI (аватар, список игроков, описание комнаты, ход, конец партии)
  doc-patch/     @qgames/doc-patch: общий применитель событий-патчей applyPatch (семантика DocumentPatch бэкенда) и сверка seq checkSeq — для потоков партии и комнаты
  game-core/     @qgames/game-core: чистые функции партии — applySessionEvent (поверх applyPatch), блоки core (игроки, очерёдность, часы, итог: guard isCoreState и помощники moveOptionsOf, activeTimer, playerClock), checkSessionState
  games/
    <код>/       @qgames/game-<код>: модуль конкретной игры (сейчас nothing, checkers)
e2e/             @qgames/e2e: e2e-тесты на Playwright (модели по *.testIds.ts, фикстуры, сценарии партий)
```

- **Игры** — пакеты `packages/games/<код>` (`@qgames/game-<код>`), портал подключает их только динамическим `import()`. Фронт не знает правил игры: применяет патчи сервера общим `applySessionEvent` и рисует только `moveOptions`. Зависимости пакетов игр, проверка состояния guard'ами, итог партии, ввод хода, время в доске — во вложенном **`packages/games/CLAUDE.md`** (читать и при работе с `@qgames/game-core`, `@qgames/game-ui` и доской в портале; устройство — `adr/c4/3-frontend.md`, решение — `adr/frontend/frontend-game-logic.md`): читать, когда трогаешь пакеты игр, `@qgames/game-core`, `@qgames/game-ui` или доску.
- **Менеджер пакетов — pnpm, задачи — Turborepo.** Только Node.js (версия в `.nvmrc` и `engines`), без Bun/Deno.
- **Все зависимости лежат только в корневом `node_modules`:** `nodeLinker: hoisted` в `pnpm-workspace.yaml`. В `apps/*/node_modules` и `packages/*/node_modules` pnpm кладёт только ссылки на workspace-пакеты (`@qgames/*`), `.bin` и кеши инструментов — сторонних пакетов там быть не должно. Если появился вложенный сторонний пакет, значит версия в каталоге конфликтует с транзитивной зависимостью: выбрать совместимую версию, а не мириться с дублем.
- **Одна версия каждой библиотеки на весь репозиторий:** версии задаются только в `catalog` файла `pnpm-workspace.yaml`, в `package.json` пакетов пишется `catalog:` (`catalogMode: strict` не даст поставить версию мимо каталога). Версии фиксируются точно, без `^`/`~`. Новая зависимость — по согласованию (§0), сначала в каталог.
- **Защита цепочки поставок pnpm не ослабляется:** релизы моложе `minimumReleaseAge` (по умолчанию pnpm) не ставим — берём предыдущую версию, исключения (`minimumReleaseAgeExclude`) не добавляем. Install-скрипты зависимостей запрещены (`allowBuilds: <пакет>: false`); разрешить скрипт — только по согласованию. Agent skills зависимостей выключены (`skills.dirs: []`); включать — только по согласованию.
- CLI-генераторы (shadcn и т.п.) могут сами дописывать зависимости и каталог: после запуска проверить дифф `package.json` и `pnpm-workspace.yaml`. Известный случай: шаблоны shadcn импортируют `cn` из npm-пакета `cn` и дописывают его в каталог. Импорт заменить на `@qgames/ui/lib/utils`, правки зависимостей откатить. Файлы shadcn создаёт в kebab-case — переименовать в PascalCase (`radio-group.tsx` → `RadioGroup.tsx`) и поправить импорты.
- Зависимость объявляется в `package.json` того пакета, который её импортирует (корневой `package.json` — только инструменты уровня репозитория: turbo, prettier).
- **Внутренние пакеты не собираются:** `exports` указывает на `.ts`-исходники, транспилирует их сборщик приложения. Имена — `@qgames/<пакет>`, подключение — `workspace:*`.
- Приложение зависит только от `packages/*`, никогда от другого приложения. `packages/*` не зависят от приложений. Исключение — `e2e/`: он импортирует файлы `*.testIds.ts` приложений (paths `@portal/*`, `@admin/*`), поэтому лежит не в `apps/` и не в `packages/`.
- **Пустые пакеты «на вырост» не заводим.** Пакет появляется вместе с первым содержимым и удаляется, если опустел.

## 3. Архитектура кода: Feature-Sliced Design

Код приложений раскладывается по слоям FSD (сверху вниз):

```
src/
  app/        инициализация: провайдеры, роутер, глобальные стили, env
  pages/      страницы (композиция виджетов и фич)
  widgets/    крупные самостоятельные блоки UI
  features/   пользовательские сценарии (вход, создание комнаты, ход)
  entities/   бизнес-сущности (user, room, session)
  shared/     переиспользуемое без бизнес-логики (lib, config, ui-обёртки)
```

- Импорт только из **нижележащих** слоёв. Слайсы одного слоя друг друга не импортируют (кроме `shared`, где слайсов нет).
- Снаружи слайс доступен только через публичный `index.ts`; глубокие импорты (`features/auth/ui/LoginForm`) запрещены.
- Сегменты внутри слайса: `ui/`, `model/` (zustand-сторы, Zod-схемы, типы), `api/` (обёртки над `@qgames/api`, если нужны), `lib/`, `config/`.
- Внутри приложения слои импортируются через alias `@/` (`@/entities/user`), внутри слайса — относительными путями.
- Имя файла — по главному экспорту: компонент — PascalCase (`HomePage.tsx`, рядом `HomePage.testIds.ts`), остальное — camelCase (`useRoomEvents.ts`, `errorMessages.ts`). Папки — camelCase (`features/createRoom`), папка компонента (если у него свои файлы) — PascalCase. Вне правила: `src/routes/` (имена — сегменты URL), сгенерированное, конфиги, каталоги и имена пакетов (`packages/game-ui`, `@qgames/game-ui`). Проверяет `eslint-plugin-check-file` (`packages/config/eslint/index.js`).
- Правила проверяет `eslint-plugin-boundaries` (`packages/config/eslint/fsd.js`): слои сверху вниз и импорт слайса только через `index.ts`.
- **Роутинг — отдельно от слоёв:**
  - `src/routes/` — файлы роутов TanStack Router; в них только объявление роута (loader, `validateSearch`) и подключение страницы из `pages/`. `src/app/routeTree.gen.ts` генерируется плагином, коммитится, руками не правится;
  - роутинг может импортировать любые слои, включая `app`.
- Общие для нескольких приложений вещи выносятся в `packages/*`, а не копируются. UI-кит — `@qgames/ui`, клиент API — `@qgames/api`.

## 4. Правила использования библиотек

- **TanStack Query** — единственное место для серверных данных. `queryOptions`/`mutationOptions`/хуки и ключи берутся из `@qgames/api` (Orval), свои ключи и fetch-функции для ручек бэкенда не пишем (исключение — URL SSE-ручек, см. `adr/c4/3-frontend.md` «SSE»; решение — `adr/frontend/server-state.md`). Копировать серверные данные в zustand или `useState` запрещено. Инвалидация — через `queryClient.invalidateQueries` по сгенерированным ключам.
- **zustand** — только клиентский стейт (UI, локальное состояние игры до отправки хода). Стор живёт в `model/` своего слайса, экспортируется хук; селекторы обязательны (`useStore((s) => s.x)`), подписку на весь стор не делаем.
- **Формы — react-hook-form + Zod 4** через `zodResolver` из `@hookform/resolvers`. Схема запроса берётся из сгенерированных Orval-Zod-схем; если форме нужно больше полей или правил (например, повтор пароля), схема расширяется в `model/` слайса. Поля верстаются компонентами `@qgames/ui`. Ошибки бэкенда показываются по `ApiError.code`; поля из `VALIDATION_ERROR` подсвечиваются `applyFieldErrors` (`@qgames/api`) нейтральным русским текстом — английские тексты сервера не показываем. Сообщения Zod — на русском (`z.config(z.locales.ru())` и `z.config({jitless: true})` — CSP без `unsafe-eval` — в `app/zodConfig.ts`, который импортируется первым в `index.tsx`: настройки должны действовать до создания схем).
- **Комната — SSE + кеш Query, как партия:** комнату на странице строит только поток — в кеше под ключом `['room-stream', roomId]` (`entities/room`: `useRoomEvents` пишет, `useRoomStream` читает; исключение из правила «ключи только из Orval»). Снапшот `{seq, room}` заменяет комнату, события-патчи применяются общим `applyPatch` (`@qgames/doc-patch`) строго по seq; дыра в seq или патч, который не применился, — переподключение за снапшотом (`applyRoomStreamMessage`). Мутации комнаты (роль, владение, старт, настройки) отвечают 204, изменение приходит событием потока — в кеш их ответы не пишутся. `GET /api/rooms/{id}` (лоадер маршрута) комнату не показывает: он нужен для ошибок и перечитывается (`invalidateRoom`) только после закрытия потока сервером (комната удалена, мест нет).
- **Партия — SSE + кеш Query:** состояние партии хранится в кеше Query под ключом `['session-stream', sessionId]` (`entities/session`: `useSessionEvents` пишет, `useSession` читает). Это **исключение** из правила «ключи только из Orval»: у потока нет GET-ручки. Опроса нет ни в лобби, ни во время партии. Ответы 4xx запросы не повторяют (настройка `retry` в `app/router.ts`).
- **TanStack Router** (portal, admin) — file-based роутинг, `autoCodeSplitting` (каждый роут — отдельный чанк). Search params типизируются через `validateSearch` со Zod-схемой. Навигация только через `Link`/`useNavigate`, строковые URL руками не собираем.
- **Стили — Tailwind 4 + shadcn/ui.** Только utility-классы и компоненты `@qgames/ui`; CSS-модулей, CSS-in-JS и inline `style` нет (кроме динамических значений, которые нельзя выразить классом). Классы объединяются через `cn()`. Тема (CSS-переменные, `@theme`) — только в `packages/ui/src/styles/globals.css`. Новые компоненты shadcn добавляются в `packages/ui` (`pnpm --filter @qgames/ui exec shadcn add <component>`), в приложения не копируются. Свои общие компоненты разметки (`PageLayout`) лежат там же, в `packages/ui/src/components/`, рядом с shadcn; их имена не должны совпадать с именами компонентов shadcn.
- **Курсоры:**
  - у кнопок и интерактивных элементов `pointer`, у заблокированных — `not-allowed`. Общее правило лежит в `globals.css`;
  - `disabled:pointer-events-none` не используем: он прячет курсор и подсказку.
- **Подсказки** к заблокированным элементам (причина, почему действие недоступно) делаются через Tooltip из `@qgames/ui`, а не через `title`:
  - через `WithHint` (`@qgames/ui/components/WithHint`) — в портале и пакетах игр; триггером служит обёртка, потому что disabled-кнопка не получает событий;
  - `TooltipProvider` подключён в `app/App.tsx`.
- **Снекбар** — `toast` из `@qgames/ui/components/sonner` (Sonner, снизу слева; `<Toaster/>` в `app/App.tsx` обоих приложений). Показывает ошибки действий, которым некуда встать в разметке (кнопки вне форм, ход, выход), и успех действий без редиректа и заметной смены UI (смена пароля, сохранение профиля и настроек). Ошибки форм остаются inline под полями. Новые случаи применения согласуются с пользователем.
- **Темы** — `ThemeProvider` из `@qgames/ui/components/ThemeProvider` (next-themes, класс на `<html>`), подключён в `app/App.tsx` обоих приложений. Сейчас тема только light (`forcedTheme`), но механизм тем в компонентах (`useTheme`, `dark:`, `.dark`) не выпиливаем.
- **Переменные окружения** читаются в одном месте (`src/shared/config/env.ts`, наружу — через `@/shared/config`) и валидируются Zod-схемой при старте. Префикс `PUBLIC_` (Rsbuild). Секретов во фронте нет. Адреса API в env нет (same-origin). У админки переменных пока нет: схема пустая (`z.object({})`), `env.d.ts` и `.env.example` остаются местом для будущих переменных.

## 5. Взаимодействие с бэкендом

- **Адресаты:** portal → группа API `portal`, admin → группа `admin` одного приложения бэкенда (REST/JSON). Браузер ходит в API **того же origin**, что и страница (относительные URL: `configureApi({baseUrl: '', authPath})`, `resolveUrl` для SSE), `credentials: 'include'`. CORS нет ни в бэкенде, ни на фронте. Прокси: в `pnpm dev` — `server.proxy` Rsbuild (портал `/api` → `http://localhost:8080`, админка только `/api/admin`), в Docker и проде — nginx (`docker/nginx/web.conf.template`). Куки `SameSite=Lax`, host-only.
- **Клиенты** обеих групп — в одном `@qgames/api`: снапшоты `packages/api/openapi/portal.json` и `admin.json`, цели Orval `portal`, `portalZod`, `admin`, `adminZod`, код в `src/generated/portal/` и `src/generated/admin/`. Отдельный пакет — только если клиенты разойдутся. Mutator общий: каждое приложение вызывает `configureApi({baseUrl: '', authPath})` со своим префиксом ручек сессии (портал — `/api/auth`, админка — `/api/admin/auth`).
- **Аутентификация:** токены живут только в HttpOnly-куках, которые ставит бэкенд; фронт их не видит и не хранит. Признак «залогинен» — успешный `GET /api/users/me` (в админке — `GET /api/admin/admins/me`). На 401 с кодом `UNAUTHENTICATED` mutator делает один общий (single-flight) `POST {authPath}/refresh` и повторяет исходный запрос один раз; если refresh вернул 401, пользователь — гость. Недоступный сервер при refresh (сеть, 5xx) — не гость: `refreshSession()` возвращает `unavailable`, mutator бросает `NETWORK_ERROR`, SSE-обёртка продолжает переподключаться. Другие 401 (например, `INVALID_GOOGLE_TOKEN`) — обычные ошибки, сессию не трогают. Запросы `{authPath}/*` не повторяются.
- **Контракт** — OpenAPI бэкенда, группы `portal` (`/v3/api-docs/portal`) и `admin` (`/v3/api-docs/admin`). Снапшоты `packages/api/openapi/*.json` — вход Orval, не коммитятся (`.gitignore`); коммитится только сгенерированный код `packages/api/src/generated/`, по его диффу виден контракт. Руками сгенерированный код и типы API не пишем.
  - Обновление контракта: запустить бэкенд, `pnpm api:fetch` (снимает обе группы с `API_URL`, по умолчанию `http://localhost:8080`), `pnpm api:generate`, проверить дифф `src/generated/`.
  - Конфликт в `src/generated/**` руками не сливается: взять любую сторону и перегенерировать (`api:fetch` + `api:generate`) по слитому бэкенду.
  - Orval работает в режиме `tags-split`: файл на тег, теги латиницей (portal — `auth`, `users`, `games`, `rooms`; admin — `auth`, `admins`), раскладка `src/generated/<группа>/{query,zod,model}/`. `@qgames/api/portal/zod` — ручной barrel `src/portalZod.ts`: схемы ручек из `zod/index.ts` и схемы components из `zod/index.schemas.ts` (Orval в barrel их не включает).
  - Импорты: `@qgames/api` — `configureApi`, `ApiError`, `isApiError`, `refreshSession` (общий single-flight refresh), `resolveUrl`, `errorMessage`, `applyFieldErrors`; `@qgames/api/portal` — функции, `queryOptions`, хуки и ключи; `@qgames/api/portal/model` — типы; `@qgames/api/portal/zod` — Zod-схемы запросов и всех схем components (`generateReusableSchemas`, union — `discriminatedUnion` через `generateDiscriminatedUnion`). Для админки — `@qgames/api/admin` (`/model`, `/zod`; в `/zod` — схемы ручек, без схем components: `generateReusableSchemas` у цели `adminZod` не включён).
  - SSE-ручки (ответ 200 — `text/event-stream`) исключены из генерации react-query/fetch трансформером входа группы `portal` в `orval.config.ts`: сгенерированный fetch повис бы на бесконечном потоке. Модели и Zod-схемы их событий генерируются.
  - Если контракт неудобен или неполон — сказать пользователю, а не обходить на фронте (§0).
  - Известные расхождения контракта и генерации (фронт их обходит, обходы помечены комментариями со ссылкой сюда):
    - Orval переносит `pattern` в `new RegExp(...)` без флага `u`, поэтому шаблоны с `\p{…}` (ник: `\p{Cc}`) в JS работают неверно и отклоняют обычные ники. Ник проверяется своей схемой с флагом `u` (`entities/user/model/nickname.ts`). Это ограничение генерации, а не бэкенда;
    - тексты в `errors` у `VALIDATION_ERROR` — на английском, поэтому поля подсвечиваются нейтральным русским текстом (`applyFieldErrors`);
    - сгенерированный Zod даёт nullable-полям `.nullish()` (`T | null | undefined`), а модель Orval — `T | null`; с `exactOptionalPropertyTypes` они несовместимы. Данные потока комнаты перед записью в кеш нормализуются (`undefined` → `null`) в `entities/room/lib/streamData.ts`.
- **Ошибки:** все 4xx/5xx приходят как `ProblemDetail` с машиночитаемым `code`. Mutator превращает их в `ApiError` (`status`, `code`, `detail`, `reason` у `MOVE_REJECTED`, `fieldErrors` у `VALIDATION_ERROR`); недоступный сервер — `NETWORK_ERROR`. UI ветвится только по `code` (общие тексты — `errorMessage` из `@qgames/api`, тексты по своим кодам — в слайсах, для комнат — `roomErrorMessage`), тексты `detail` пользователю не показываем.
- **Real-time:** ходы и действия — REST, события — SSE модуля `game` бэкенда через обёртку `apps/portal/src/shared/lib/sse`. Устройство обёртки, переподключение, потоки комнаты и партии, сверка seq — в **`adr/c4/3-frontend.md`** (раздел «SSE»), потоки целиком — `adr/c4/dynamic/room-stream.md` и `adr/c4/dynamic/move.md`: читать, когда трогаешь SSE.

## 6. TypeScript

- TypeScript со строгой типизацией: базовый `tsconfig` в `@qgames/config` включает `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedModules`. Ослаблять флаги в пакетах нельзя.
- Запрещены: `any` (явный и неявный), `@ts-ignore`/`@ts-expect-error` без описания, non-null assertion `!`, `enum` и `namespace` (вместо enum — union-литералы или `as const`-объекты).
- Приведение типа `as` — только с комментарием, почему оно безопасно; `as unknown as` запрещено. Данные извне (env, `localStorage`, search params, сообщения SSE) проходят Zod-валидацию, а не приводятся.
- Импорт только типа — `import type`.
- Проверка типов — `pnpm typecheck` (`tsc --noEmit` в каждом пакете).

## 7. Линтинг и форматирование

- **ESLint** (flat config, фабрика в `@qgames/config/eslint`): база — **gts** (Google TypeScript Style), сверху `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`, `eslint-plugin-react-hooks`, `@tanstack/eslint-plugin-query`, `eslint-plugin-boundaries` (FSD).
- **Prettier** — конфиг gts (`@qgames/config/prettier`), запускается через ESLint (`prettier/prettier`) и отдельно `pnpm format`.
- **Stylelint** — `stylelint-config-standard` с разрешёнными at-rules Tailwind 4 (`@theme`, `@apply`, `@source`, `@utility`, `@variant`, `@custom-variant`, `@plugin`, `@config`, `@reference`).
- Отступления от базовых правил:
  - `only-throw-error` разрешает бросать `NotFoundError` и `Redirect` из `@tanstack/router-core` — так TanStack Router прерывает загрузку маршрута (`throw notFound()`, `throw redirect()`);
  - в портале `no-restricted-imports` запрещает статический импорт пакетов игр (`packages/games/CLAUDE.md`).
- Правила донастроим позже; любое изменение правил — по согласованию (§0). Отключать правило комментарием `eslint-disable` можно только для конкретной строки и с причиной.
- Кеш Turborepo для `lint`, `lint:styles` и `typecheck` учитывает изменения в `packages/config`: правка общих правил перепроверяет все пакеты.

## 8. Тесты

- **E2E — Playwright, пакет `e2e/`** против поднятых стендов (решение — `adr/frontend/e2e-testing.md`). Правила — во вложенном **`e2e/CLAUDE.md`**: читать, когда трогаешь тесты или добавляешь элемент, нужный тестам.
- **`data-testid` в компонентах:** элемент, который нужен или может понадобиться e2e, получает id из файла `<Компонент>.testIds.ts` рядом с компонентом (`generateTestIds` из `@qgames/ui/lib/testIds`). Одинаковые элементы различаются атрибутами `data-*`, а не текстом.
- **Unit-тесты — Vitest** (решение — `adr/frontend/unit-testing.md`): только чистая логика, и только сложная (применитель патчей, сверка seq, guard'ы, применение сообщений потоков). UI-компоненты unit-тестами не покрываем — для них позже скриншотные или снапшотные тесты.
- Тесты лежат рядом с кодом (`*.test.ts`), без конфига Vitest. Пакет с тестами объявляет `"test": "vitest run"` и `vitest` в devDependencies. Запуск — `pnpm test` (turbo, без e2e).
- Сценарии `@qgames/doc-patch` повторяют `DocumentPatchScenariosTest` бэкенда: правка семантики применителя — на обеих сторонах вместе.

## 9. Стек и версии

Node.js 24 LTS, pnpm 12, Turborepo 2, TypeScript 6.0, React 19, Rsbuild 2 (Rspack 2), TanStack Query 5, TanStack Router 1, zustand 5, react-hook-form 7 + Zod 4, Tailwind CSS 4, shadcn/ui, Orval 8, ESLint 9 + gts 7, Stylelint 17, Google Identity Services (скрипт, типы `@types/google.accounts`). Точные версии — только в `catalog` в `pnpm-workspace.yaml`.

- TypeScript 6, а не 7: typescript-eslint поддерживает `typescript <6.1`, а TS 7 (нативный) пока не даёт JS API для тулинга. Решить при появлении поддержки TS 7 в typescript-eslint.
- ESLint 9, а не 10: gts 7 зависит от `eslint ^9`. Решить при выходе gts с поддержкой ESLint 10.

## 10. Локальный запуск

```bash
pnpm install                 # зависимости (только корневой node_modules)
pnpm dev                     # все приложения в dev-режиме
pnpm --filter @qgames/portal dev   # одно приложение
pnpm build                   # сборка всего
pnpm typecheck               # проверка типов
pnpm lint                    # ESLint + Stylelint
pnpm format                  # Prettier
pnpm api:fetch               # снять OpenAPI групп portal и admin с запущенного бэкенда в packages/api/openapi/ (снапшоты не коммитятся; API_URL, по умолчанию http://localhost:8080)
pnpm api:generate            # сгенерировать клиент API (Orval)
pnpm test:e2e                # e2e против поднятых стендов (браузер: pnpm --filter @qgames/e2e exec playwright install chromium); E2E_UPDATE_SCENARIOS=1 — записать ОР сценариев партий
```

- Адреса: Docker — `https://<LOCAL_DOMAIN>` и `https://admin.<LOCAL_DOMAIN>`, `pnpm dev` — те же с портами :3000 и :3001 (HTTPS-хост dev-сервера — `@qgames/config/local-https`, только для `rsbuild dev`).
- Прод-сборка в Docker: `docker compose up --build -d --wait` — один сервис `web` на nginx (статика обоих приложений + reverse proxy на бэкенд). Правила nginx и `PUBLIC_*` при сборке — во вложенном **`docker/CLAUDE.md`**, локальная настройка домена, сертификатов и Google-входа — в `README.md`, устройство образа и CSP — в `adr/c4/deployment.md` и `adr/system/reverse-proxy.md`: читать, когда трогаешь `docker/`, nginx, CSP или Google-вход.
- Бэкенд поднимается в его репозитории: `docker compose up --build -d --wait` (одно приложение, :8080). Swagger UI — http://localhost:8080/swagger-ui.html (выбор группы `portal` / `admin`). Вход в админку на стенде — `admin` / `admin`.
- Переменные окружения приложений — в `.env` приложения (шаблон — `.env.example`).
- Статический результат Rsbuild-приложений — `apps/<app>/dist/`.

## 11. Архитектурные решения и отвергнутые варианты

В **`adr/`** (индекс — `adr/README.md`): читать нужные ADR перед тем, как предлагать архитектурную альтернативу или менять принятое решение.

