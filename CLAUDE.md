# CLAUDE.md — правила разработки qgames-frontend

Фронтенд игрового портала qgames: монорепозиторий с CSR-приложениями (портал, админка). Бэкенд — отдельный репозиторий `qgames-backend-monorepo`, оркестратор агентов — `qgames-workspace`. Все три репозитория лежат рядом в одной родительской папке, поэтому бэкенд доступен по относительному пути `../qgames-backend-monorepo`.

## 0. Процесс принятия решений (главное правило)

- **Архитектурные решения принимает только пользователь.** Новая библиотека, пакет, приложение, слой или сегмент FSD, способ работы с API, изменение правил линтера, сборки или структуры, способ деплоя и т.п. — сначала вопрос пользователю с вариантами и рекомендацией, затем реализация.
- Если правило здесь противоречит задаче — спросить, а не обходить молча.
- **Не замалчивать проблемы.** Если по ходу работы что-то смущает (риск безопасности, противоречие правилам или ранее сказанному, сомнительное поведение, техдолг, расхождение кода, документации и контракта бэкенда), сразу сказать пользователю и спросить, как поступить, предложив варианты. Не чинить молча и не откладывать «на потом» без согласования.
- **Бэкенд изучаем по его монорепозиторию** (`../qgames-backend-monorepo`), только чтение. Когда нужно понять, как работает бэкенд (поведение ручки, коды ошибок, валидация, куки и refresh, SSE, роли), смотреть туда, а не гадать:
  - `CLAUDE.md` бэкенда — архитектура и принятые решения;
  - `user-gateway/user-gateway-public-sync-api` и `admin-gateway/admin-gateway-public-sync-api` — публичные контракты: интерфейсы ручек с описаниями и кодами ошибок (`@Operation`/`@ApiResponses`) и DTO;
  - `user-gateway/user-gateway`, `admin-gateway/admin-gateway` и сервисы (`user-auth`, `game`, `admin-auth`) — реализация (маппинг, проверки, куки, обработка ошибок);
  - `docker-compose.yml`, `application.yml` сервисов — порты, адреса, настройки локального стенда.

  Клиент API (§5) генерируется только по OpenAPI; код бэкенда нужен для понимания поведения, а не для ручного описания типов.

- **Репозиторий бэкенда не правим.** Если фронту нужна правка бэкенда (новая ручка, поле, CORS, код ошибки), описать её пользователю — правку делает он.
- **Git:** рабочая и основная ветка — `master` (`main` не используется). Коммиты делает пользователь; без явной просьбы не коммитить и не пушить.

### Как вести этот файл

- **Разделы 1–10 — принятые решения**, то есть действующие правила. Согласованное решение записывается в профильный раздел.
- **Раздел 11 — отклонённые решения.** Варианты, которые обсуждались и были отвергнуты, с причиной и тем, что выбрано вместо. Повторно такой вариант предлагать только с новым аргументом, и этот аргумент нужно назвать явно.
- **Журнала изменений и дат нет:** файл описывает текущее состояние. Если решение меняется, профильный раздел переписывается на месте, а прежнее решение переносится в раздел 11 с причиной отказа.
- Отложенные вопросы записываются в профильном разделе пометкой «решить при …», а не в отклонённых.
- **От технологии, приложения или фичи отказались — сведения о ней удаляются целиком**, включая отклонённые решения о ней в разделе 11. В разделе 11 остаются только альтернативы действующим решениям.

## 1. Приложения

| Приложение     | Назначение                                            | Сборка              | Рендеринг                           | Порт (dev) |
| -------------- | ----------------------------------------------------- | ------------------- | ----------------------------------- | ---------- |
| `apps/portal`  | Игровой портал: вход, профиль, комнаты, партии        | Rsbuild (Rspack)    | CSR SPA, чанки по роутам            | 3000       |
| `apps/admin`   | Админка портала                                       | Rsbuild (Rspack)    | CSR SPA, чанки по роутам            | 3001       |

- **Бэкенд приложений:** portal → `user-gateway`, admin → `admin-gateway` (отдельный сервис для администраторов, в паре с `admin-auth`).
- **Админка ходит только в `admin-gateway`, никогда в `user-gateway`.** admin-gateway локально — `http://localhost:8083`, сессия — в куках `admin_access_token` / `admin_refresh_token`. Пути `/api/auth/*` и 401 `UNAUTHENTICATED` у него такие же, как у user-gateway.

### Маршруты админки

| URL       | Страница                                              | Доступ      |
| --------- | ----------------------------------------------------- | ----------- |
| `/login`  | вход по логину и паролю (`?redirect=` — куда вернуть) | все         |
| `/`       | редирект на `/admins`                                 | —           |
| `/admins` | список администраторов, у текущего — метка «вы»       | после входа |

- Гость — ответ 401 или 404 `ADMIN_NOT_FOUND` на `GET /api/admins/me` (`entities/admin`). Защищённые маршруты отправляют гостя на `/login?redirect=<текущий адрес>`, `redirect` принимается только как путь этого сайта (`/…`).
- Регистрации нет, ролей нет: первого админа создаёт бэкенд (на стенде `admin` / `admin`).

### Маршруты портала

| URL                                 | Страница                                                 | Доступ      |
| ----------------------------------- | -------------------------------------------------------- | ----------- |
| `/`                                 | главная                                                  | все         |
| `/login`                            | вход по email и паролю или через Google (`?redirect=` — куда вернуть) | все         |
| `/profile`                          | ник и аватар, способы входа (пароль, Google)             | после входа |
| `/games`                            | список игр из `GET /api/games`                           | все         |
| `/rooms`                            | публичные комнаты всех игр (пока не реализован)          | все         |
| `/games/<код>/rooms`                | карточка игры, комнаты (список не реализован) + создание | после входа |
| `/games/<код>/rooms/<uuid комнаты>` | комната: участники, роли, партия                         | после входа |

- `<код>` — код игры из контракта бэкенда (`GameCode`: `nothing`, `carcassonne`, `checkers`) — один и тот же во всём стеке: в URL портала, в путях ручек `/api/games/{код}/...` (игра, создание комнаты, настройки, ход), в `RoomResponse.gameCode`, в дискриминаторе `gameSettings.gameCode` и в имени пакета. Неизвестный код → 404.
- Реестр `entities/game/model/registry.ts` — ручной список кодов (`GAME_CODES`) и `load` (динамический `import()`); название, описание и правила игры приходят с бэкенда (`GET /api/games`, `GET /api/games/{код}`). Игра без пакета на фронте — запись без `load`: доска не рисуется, создание комнаты заблокировано.
- **Каталог и статусы игр.** Статус публикации живёт только на бэкенде (`PUBLISHED`, `HIDDEN`, `NOT_PUBLISHED`), в ответах его нет. `GET /api/games` отдаёт только опубликованные игры; скрытая доступна по прямой ссылке и ведёт себя как опубликованная. Карточка игры (`/games/<код>/rooms`) берёт `GET /api/games/{код}`: число игроков и форма настроек — из `rules`; кнопка «Создать комнату» блокируется (`WithHint`) только у игры без пакета на фронте. `GAME_NOT_FOUND` (игра не опубликована — в разработке или отключена; её комнаты бэкенд удаляет) → 404 на карточке, «Игра недоступна» на странице комнаты.
- Гостя защищённые маршруты отправляют на `/login?redirect=<текущий адрес>`; `redirect` принимается только как путь этого сайта (`/…`).
- **Вход через Google** — Google Identity Services: скрипт GIS грузится по требованию (`shared/lib/google-identity.ts`), стандартную кнопку рисует сам GIS (`shared/ui/google-button.tsx`). ID token уходит в `POST /api/auth/google` (кнопка на `/login`) или `POST /api/users/me/login-methods/google` (привязка в `/profile`). Google — единственный способ создать аккаунт (первый вход создаёт аккаунт), пароль добавляется в профиле, вход по паролю — по email Google-аккаунта. На `ACCOUNT_LINK_REQUIRED` (аккаунт с таким email уже есть) пользователь входит паролем и привязывает Google в профиле. Без `PUBLIC_GOOGLE_CLIENT_ID` кнопка Google и подсказка о создании аккаунта скрыты; тот же Client ID должен быть в `GOOGLE_CLIENT_IDS` бэкенда.
- **Настройки комнаты** (правила времени `timeControl` и полиморфный `gameSettings`):
  - задаются при создании (`POST /api/games/{код}/rooms`); владелец меняет их между партиями в модальном окне (`PUT …/rooms/{id}/settings`);
  - границы, режимы и значения по умолчанию формы берутся из `rules` ответа `GET /api/games/{код}`, на фронте не хардкодятся;
  - поля настроек игры выбираются по `rules.gameSettingsLimits.gameCode`: `nothing` — число раундов, `checkers` — RadioGroup вариантов правил из `limits.variants` (Русские / Международные / Английские);
  - схема `gameSettings` — `discriminatedUnion` по `gameCode` из сгенерированных схем (`NothingSettingsDto`, `CheckersSettingsDto`), вариант игры комнаты дополнен её границами; поля `VALIDATION_ERROR` (`gameSettings.rounds`, `gameSettings.variant`) подсвечиваются;
  - общие поля формы — `entities/room/ui/room-settings-fields.tsx`, схема — `entities/room/model/settings.ts`.
- Видимость комнаты и число игроков при создании — когда появятся в контракте.
- **Присутствие в комнате:**
  - кнопок «Войти» и «Выйти» нет, ручек входа и выхода тоже: **присутствие = открытый SSE-поток комнаты**. Страница комнаты открывает его при открытии и закрывает при уходе (`features/room-membership/model/use-room-presence.ts` → `useRoomEvents`); на возврате из bfcache (`pageshow` с `persisted`) поток переоткрывается. Несколько вкладок допустимы — пользователь выходит, когда закрылась последняя;
  - ушедший участник удаляется сразу. Игрок идущей партии остаётся на месте до её конца с меткой «отошёл» (`leaving`). Ушёл владелец — 15 с у комнаты нет владельца (`ownerId = null`, кнопок владельца ни у кого нет), вернувшись в срок, он снова владелец. В ответе создания комнаты `members` пуст и `ownerId = null`: создатель входит игроком и владельцем при подключении к потоку. Перезагрузка вне партии — выход и новый вход: при занятых местах игрок может вернуться наблюдателем;
  - пока поток переподключается, над комнатой плашка «Нет связи с комнатой — переподключаемся…» без кнопки, переподключение автоматическое.
- **Партия на странице комнаты:**
  - доска подписывается на поток партии, когда у комнаты есть `session.id` (в том числе завершённой — видно последнюю партию); до снапшота — «Загружаем партию…», при переподключении — плашка «Нет связи с партией — переподключаемся…»;
  - кнопки «Пауза/Продолжить» показываются только при активном таймере (`activeTimer`), «Отменить» — всегда у владельца;
  - после ответа 204 на ход, паузу или продолжение кнопки остаются в pending, пока seq партии не вырастет (`useSessionAdvance`, таймаут 5 с на случай обрыва).
- **Роль** меняется кнопкой «Перейти» в заголовке того списка («Игроки» / «Наблюдатели»), где пользователя нет. Оба списка видны всегда. Если переход недоступен, кнопка заблокирована с подсказкой о причине.

## 2. Структура репозитория и пакетов

```
apps/
  portal/        CSR SPA (Rsbuild + TanStack Router)
  admin/         CSR SPA (Rsbuild + TanStack Router)
packages/
  config/        @qgames/config: tsconfig-пресеты, фабрика ESLint flat-конфига, stylelint, prettier
  ui/            @qgames/ui: компоненты shadcn/ui, общая разметка страниц PageLayout, cn(), globals.css (Tailwind 4, тема)
  api/           @qgames/api: Orval-клиенты user-gateway и admin-gateway (типы, queryOptions, хуки, Zod; снапшоты OpenAPI — вход генерации, не коммитятся), fetch-mutator, errorMessage и applyFieldErrors
  game-ui/       @qgames/game-ui: общий игровой UI (аватар, список игроков, описание комнаты, ход, конец партии)
  game-core/     @qgames/game-core: чистые функции партии — применитель патчей applySessionEvent, сверка seq, guard'ы модулей (core, turns, timer, result), checkSessionState, activeTimer, sessionResult
  games/
    <код>/       @qgames/game-<код>: модуль конкретной игры (сейчас nothing, checkers)
```

### Игры

- Каждая игра — отдельный пакет `packages/games/<код>` с именем `@qgames/game-<код>`. Зависит только от `@qgames/ui`, `@qgames/game-ui`, `@qgames/game-core`, `@qgames/api` (только сгенерированные схемы и типы, без запросов) и библиотек каталога; игры друг от друга не зависят.
- **Игры не раздувают основной бандл:** портал подключает пакет игры только динамическим `import()` в `entities/game/model/registry.ts`, поэтому каждая игра — отдельный чанк. Статический импорт `@qgames/game-*` (кроме `@qgames/game-ui`, `@qgames/game-core` и `import type`) в портале запрещён ESLint.
- **Фронт не знает правил игры и кодов событий:** не симулирует состояние и не решает, законен ли ход (единственное исключение — подсказки ввода по флагам `meta.moveRules`, см. «Интерактивный ввод хода»). Сервер присылает поток партии: снапшот документа `{status, meta, state}` для зрителя и события-патчи `{seq, at, method, code, data}`.
  - Состояние меняется только по `method` — один общий применитель `applySessionEvent` (`@qgames/game-core`) с той же семантикой, что `SessionPatch` на бэкенде: `PUT` (заменить/создать; по ненайденному `{id}` — добавить объект с тем же id), `PATCH` (неглубокое слияние, null — значение), `DELETE` (по ключу или id), `INFO` (без изменений). `path` — сегменты: строка — ключ, `{id}` — элемент массива. Ошибка пути — переподключение за свежим снапшотом. Своих редьюсеров у игр нет.
  - `code` (`player-passed`, `turn-changed`, `game-paused`…) — только для журнала и логов (сейчас — отладочный лог в dev), по нему состояние не меняется.
  - Допустимые действия приходят в состоянии (`players[].moveOptions` зрителя) — доска рисует только их и отдаёт выбранный вариант через `onMove`.
  - **Проверка состояния модульная, как на бэкенде.** На снапшоте и после каждого патча: `status` и `meta` — общей схемой (кроме `meta.moveRules`), `meta.game.code` — с кодом игры комнаты, затем `checkSessionState`: guard модуля `core` (`players`) всегда, guard'ы модулей, которые объявила игра (`turns`, `timer`, `result`), и guard **только игровых полей** (`isGameState`; у «ничто» — `moves`, у шашек — `pieces`, `lastMove`, `quietMoves`). Guard'ы строятся на сгенерированных Zod-схемах блоков (`safeParse` исходного объекта, без `as`). Любой провал — переподключение. Доска сужает тип тем же guard'ом (`isNothingSession`, `isCheckersSession`); неразборчивое состояние в доске — сообщение, а не падение.
  - **Поля игры в объектах игроков** (`players[]`, например `color` у шашек) проверяет guard игры (`isGameState`), guard модуля `core` смотрит только `id` и `moveOptions`.
  - **`meta.moveRules`** — правила хода конкретной игры (у игры без них — `null`). Общая проверка документа его не разбирает и переносит как есть (тип `unknown`), форму проверяет guard игры (у шашек — `CheckersMoveRulesDto` в `isCheckersSession`).
  - **Итог партии — модуль `result`** (`state.result`: `null` или `{outcome: WIN | DRAW, winnerIds, reason}`; ставится событием `result-set` вместе с концом партии, у отменённой партии итога нет). Игра объявляет `resultModule` в `modules`; доска показывает итог через `GameOver` (`@qgames/game-ui`): победитель (имена) или ничья, текст причины по `reason` — в пакете игры.
  - Ход — общий конверт `{type, data?}` (как вариант в `moveOptions`), портал отправляет его в `POST /api/games/{код}/rooms/{id}/moves`; ответ 204, результат приходит событиями.
- **Интерактивный ввод хода** (шашки): `moveOptions` дают только типы действий (`MOVE`, `RESIGN`), пути сервер не перечисляет.
  - Доска строит подсказки пути (`lib/path.ts` пакета игры) **только по флагам `meta.moveRules`**: вариантов правил (`RUSSIAN`…) фронт не знает.
  - Отправляется законченный путь целиком (`{type: "MOVE", data: {path}}`); состояние меняют только патчи сервера, локальной симуляции нет.
  - Последнее слово — за сервером: 422 `MOVE_REJECTED` (`ILLEGAL_MOVE` и др.); после ошибки выбор сбрасывается.
- Форма модуля игры (`GameModule = {Board, modules, isGameState}`: доска, модули-механики, которые использует игра (как в `GameRules` бэкенда), и guard игровых полей; пропсы доски) описана в портале — `entities/game/model/types.ts`; пакет игры описывает те же пропсы у себя, совместимость проверяет TypeScript в реестре.
- **Время в доске:**
  - `clockOffsetMs` = `serverTime` снапшота партии минус момент его получения, чтобы обратный отсчёт не зависел от часов клиента;
  - обратный отсчёт рисует `TurnTimer` из `@qgames/game-ui` по блоку таймера состояния (`{paused, deadline, pausedAt}`). Показывать ли таймер, решает только `activeTimer` (`@qgames/game-core`): нет таймера, `STOPPED` или партия не `IN_PROGRESS` — не показывать.
- Игра, у которой ещё нет пакета на фронте (сейчас `carcassonne`), — только запись в реестре без `load`: создание комнаты недоступно, пакет не заводится.
- `@qgames/game-ui` — только презентационные компоненты: данные через props, без запросов и сторов.

- **Менеджер пакетов — pnpm, задачи — Turborepo.** Только Node.js (версия в `.nvmrc` и `engines`), без Bun/Deno.
- **Все зависимости лежат только в корневом `node_modules`:** `nodeLinker: hoisted` в `pnpm-workspace.yaml`. В `apps/*/node_modules` и `packages/*/node_modules` pnpm кладёт только ссылки на workspace-пакеты (`@qgames/*`), `.bin` и кеши инструментов — сторонних пакетов там быть не должно. Если появился вложенный сторонний пакет, значит версия в каталоге конфликтует с транзитивной зависимостью: выбрать совместимую версию, а не мириться с дублем.
- **Одна версия каждой библиотеки на весь репозиторий:** версии задаются только в `catalog` файла `pnpm-workspace.yaml`, в `package.json` пакетов пишется `catalog:` (`catalogMode: strict` не даст поставить версию мимо каталога). Версии фиксируются точно, без `^`/`~`. Новая зависимость — по согласованию (§0), сначала в каталог.
- **Защита цепочки поставок pnpm не ослабляется:** релизы моложе `minimumReleaseAge` (по умолчанию pnpm) не ставим — берём предыдущую версию, исключения (`minimumReleaseAgeExclude`) не добавляем. Install-скрипты зависимостей запрещены (`allowBuilds: <пакет>: false`); разрешить скрипт — только по согласованию.
- CLI-генераторы (shadcn и т.п.) могут сами дописывать зависимости и каталог: после запуска проверить дифф `package.json` и `pnpm-workspace.yaml`. Известный случай: шаблоны shadcn импортируют `cn` из npm-пакета `cn` и дописывают его в каталог. Импорт заменить на `@qgames/ui/lib/utils`, правки зависимостей откатить.
- Зависимость объявляется в `package.json` того пакета, который её импортирует (корневой `package.json` — только инструменты уровня репозитория: turbo, prettier).
- **Внутренние пакеты не собираются:** `exports` указывает на `.ts`-исходники, транспилирует их сборщик приложения. Имена — `@qgames/<пакет>`, подключение — `workspace:*`.
- Приложение зависит только от `packages/*`, никогда от другого приложения. `packages/*` не зависят от приложений.
- **Пустые пакеты «на вырост» не заводим.** Пакет появляется вместе с первым содержимым и удаляется, если опустел.

## 3. Архитектура кода: Feature-Sliced Design

Код приложений раскладывается по слоям FSD (сверху вниз):

```
src/
  app/        инициализация: провайдеры, роутер, глобальные стили, env
  pages/      страницы (композиция виджетов и фич)
  widgets/    крупные самостоятельные блоки UI
  features/   пользовательские сценарии (вход, создание комнаты, ход)
  entities/   бизнес-сущности (user, room, game-session)
  shared/     переиспользуемое без бизнес-логики (lib, config, ui-обёртки)
```

- Импорт только из **нижележащих** слоёв. Слайсы одного слоя друг друга не импортируют (кроме `shared`, где слайсов нет).
- Снаружи слайс доступен только через публичный `index.ts`; глубокие импорты (`features/auth/ui/LoginForm`) запрещены.
- Сегменты внутри слайса: `ui/`, `model/` (zustand-сторы, Zod-схемы, типы), `api/` (обёртки над `@qgames/api`, если нужны), `lib/`, `config/`.
- Внутри приложения слои импортируются через alias `@/` (`@/entities/user`), внутри слайса — относительными путями.
- Имена файлов — kebab-case (`home-page.tsx`, `current-user.tsx`), как у компонентов shadcn.
- Правила проверяет `eslint-plugin-boundaries` (`packages/config/eslint/fsd.js`): слои сверху вниз и импорт слайса только через `index.ts`.
- **Роутинг — отдельно от слоёв:**
  - `src/routes/` — файлы роутов TanStack Router; в них только объявление роута (loader, `validateSearch`) и подключение страницы из `pages/`. `src/app/routeTree.gen.ts` генерируется плагином, коммитится, руками не правится;
  - роутинг может импортировать любые слои, включая `app`.
- Общие для нескольких приложений вещи выносятся в `packages/*`, а не копируются. UI-кит — `@qgames/ui`, клиент API — `@qgames/api`.

## 4. Правила использования библиотек

- **TanStack Query** — единственное место для серверных данных. `queryOptions`/`mutationOptions`/хуки и ключи берутся из `@qgames/api` (Orval), свои ключи и fetch-функции для ручек gateway не пишем (исключение — URL SSE-ручек, см. §5 Real-time). Копировать серверные данные в zustand или `useState` запрещено. Инвалидация — через `queryClient.invalidateQueries` по сгенерированным ключам.
- **zustand** — только клиентский стейт (UI, локальное состояние игры до отправки хода). Стор живёт в `model/` своего слайса, экспортируется хук; селекторы обязательны (`useStore((s) => s.x)`), подписку на весь стор не делаем.
- **Формы — react-hook-form + Zod 4** через `zodResolver` из `@hookform/resolvers`. Схема запроса берётся из сгенерированных Orval-Zod-схем; если форме нужно больше полей или правил (например, повтор пароля), схема расширяется в `model/` слайса. Поля верстаются компонентами `@qgames/ui`. Ошибки бэкенда показываются по `ApiError.code`; поля из `VALIDATION_ERROR` подсвечиваются `applyFieldErrors` (`@qgames/api`) нейтральным русским текстом — английские тексты сервера не показываем. Сообщения Zod — на русском (`z.config(z.locales.ru())` при старте приложения).
- **Комната — SSE + кеш Query:** события потока комнаты пишутся в кеш `GET /api/rooms/{id}` через `setQueryData` по сгенерированному ключу (`entities/room/model/use-room-events.ts`): `snapshot` заменяет данные, `users-changed`/`settings-changed` заменяют свои поля, `session-changed` → `invalidateRoom`, `room-deleted` → закрыть поток и перечитать (покажется `ROOM_NOT_FOUND`). Мутации, которые возвращают комнату (в том числе старт партии), кладут ответ в кеш (`setRoomCache`), а не перезапрашивают.
- **Партия — SSE + кеш Query:** состояние партии хранится в кеше Query под ключом `['session-stream', sessionId]` (`entities/session`: `useSessionEvents` пишет, `useSession` читает). Это **исключение** из правила «ключи только из Orval»: у потока нет GET-ручки. Опроса нет ни в лобби, ни во время партии. Ответы 4xx запросы не повторяют (настройка `retry` в `app/router.ts`).
- **TanStack Router** (portal, admin) — file-based роутинг, `autoCodeSplitting` (каждый роут — отдельный чанк). Search params типизируются через `validateSearch` со Zod-схемой. Навигация только через `Link`/`useNavigate`, строковые URL руками не собираем.
- **Стили — Tailwind 4 + shadcn/ui.** Только utility-классы и компоненты `@qgames/ui`; CSS-модулей, CSS-in-JS и inline `style` нет (кроме динамических значений, которые нельзя выразить классом). Классы объединяются через `cn()`. Тема (CSS-переменные, `@theme`) — только в `packages/ui/src/styles/globals.css`. Новые компоненты shadcn добавляются в `packages/ui` (`pnpm --filter @qgames/ui exec shadcn add <component>`), в приложения не копируются. Свои общие компоненты разметки (`PageLayout`) лежат там же, в `packages/ui/src/components/`, рядом с shadcn; их имена не должны совпадать с именами компонентов shadcn.
- **Курсоры:**
  - у кнопок и интерактивных элементов `pointer`, у заблокированных — `not-allowed`. Общее правило лежит в `globals.css`;
  - `disabled:pointer-events-none` не используем: он прячет курсор и подсказку.
- **Подсказки** к заблокированным элементам (причина, почему действие недоступно) делаются через Tooltip из `@qgames/ui`, а не через `title`:
  - в портале — через `WithHint` (`@/shared/ui`), триггером служит обёртка, потому что disabled-кнопка не получает событий;
  - `TooltipProvider` подключён в `app/app.tsx`.
- **Переменные окружения** читаются в одном месте (`src/shared/config/env.ts`, наружу — через `@/shared/config`) и валидируются Zod-схемой при старте. Префикс `PUBLIC_` (Rsbuild). Секретов во фронте нет.

## 5. Взаимодействие с бэкендом

- **Адресаты:** portal → `user-gateway`, admin → `admin-gateway` (REST/JSON). Браузер ходит в свой gateway **напрямую** на api-домен (`PUBLIC_API_URL`; локально user-gateway — `http://localhost:8080`, admin-gateway — `http://localhost:8083`) с `credentials: 'include'`. CORS с `allowCredentials` настраивается на каждом gateway для своего фронта. Same-site (фронт и api на одном регистрируемом домене) обязателен: куки `SameSite=Lax`.
- **Клиент admin-gateway** — в том же `@qgames/api`: второй снапшот `packages/api/openapi/admin-gateway.json` и вторые цели Orval (`adminGateway`, `adminGatewayZod`), код в `src/generated/admin-gateway/`. Отдельный пакет — только если клиенты разойдутся. Mutator общий: каждое приложение вызывает `configureApi` со своим URL. Это работает, пока у gateway'ев одинаковы пути `/api/auth/*` и 401 `UNAUTHENTICATED`.
- **Аутентификация:** токены живут только в HttpOnly-куках, которые ставит gateway; фронт их не видит и не хранит. Признак «залогинен» — успешный `GET /api/users/me` (в админке — `GET /api/admins/me`). На 401 с кодом `UNAUTHENTICATED` mutator делает один общий (single-flight) `POST /api/auth/refresh` и повторяет исходный запрос один раз; если refresh вернул 401, пользователь — гость. Другие 401 (например, `INVALID_GOOGLE_TOKEN`) — обычные ошибки, сессию не трогают. Запросы `/api/auth/*` не повторяются.
- **Контракт** — OpenAPI gateway'ев. Снапшоты `packages/api/openapi/*.json` — вход Orval, не коммитятся (`.gitignore`); коммитится только сгенерированный код `packages/api/src/generated/`, по его диффу виден контракт. Руками сгенерированный код и типы API не пишем.
  - Обновление контракта: запустить бэкенд, `pnpm api:fetch` (снимает `/v3/api-docs` обоих gateway), `pnpm api:generate`, проверить дифф `src/generated/`.
  - Конфликт в `src/generated/**` руками не сливается: взять любую сторону и перегенерировать (`api:fetch` + `api:generate`) по слитому бэкенду.
  - Orval работает в режиме `tags-split`: файл на тег, теги латиницей (user-gateway — `auth`, `users`, `games`, `rooms`; admin-gateway — `auth`, `admins`), раскладка `src/generated/<gateway>/{query,zod,model}/`. `@qgames/api/gateway/zod` — ручной barrel `src/gateway-zod.ts`: схемы ручек из `zod/index.ts` и схемы components из `zod/index.schemas.ts` (Orval в barrel их не включает).
  - Импорты: `@qgames/api` — `configureApi`, `ApiError`, `isApiError`, `refreshSession` (общий single-flight refresh), `resolveUrl`, `errorMessage`, `applyFieldErrors`; `@qgames/api/gateway` — функции, `queryOptions`, хуки и ключи; `@qgames/api/gateway/model` — типы; `@qgames/api/gateway/zod` — Zod-схемы запросов и всех схем components (`generateReusableSchemas`, union — `discriminatedUnion` через `generateDiscriminatedUnion`). Для админки — `@qgames/api/admin-gateway` (`/model`, `/zod`; в `/zod` — схемы ручек, без схем components: `generateReusableSchemas` у цели `adminGatewayZod` не включён).
  - SSE-ручки (ответ 200 — `text/event-stream`) исключены из генерации react-query/fetch трансформером входа user-gateway в `orval.config.ts`: сгенерированный fetch повис бы на бесконечном потоке. Модели и Zod-схемы их событий генерируются.
  - Если контракт неудобен или неполон — сказать пользователю, а не обходить на фронте (§0).
  - Известные расхождения контракта и генерации (фронт их обходит, обходы помечены комментариями со ссылкой сюда):
    - Orval переносит `pattern` в `new RegExp(...)` без флага `u`, поэтому шаблоны с `\p{…}` (ник: `\p{Cc}`) в JS работают неверно и отклоняют обычные ники. Ник проверяется своей схемой с флагом `u` (`entities/user/model/nickname.ts`). Это ограничение генерации, а не бэкенда;
    - тексты в `errors` у `VALIDATION_ERROR` — на английском, поэтому поля подсвечиваются нейтральным русским текстом (`applyFieldErrors`);
    - сгенерированный Zod даёт nullable-полям `.nullish()` (`T | null | undefined`), а модель Orval — `T | null`; с `exactOptionalPropertyTypes` они несовместимы. Данные потока комнаты перед записью в кеш нормализуются (`undefined` → `null`) в `entities/room/lib/stream-data.ts`.
- **Ошибки:** все 4xx/5xx приходят как `ProblemDetail` с машиночитаемым `code`. Mutator превращает их в `ApiError` (`status`, `code`, `detail`, `reason` у `MOVE_REJECTED`, `fieldErrors` у `VALIDATION_ERROR`); недоступный сервер — `NETWORK_ERROR`. UI ветвится только по `code` (общие тексты — `errorMessage` из `@qgames/api`, тексты по своим кодам — в слайсах, для комнат — `roomErrorMessage`), тексты `detail` пользователю не показываем.
- **Real-time:** ходы и действия — REST, события — SSE от gateway (gateway проксирует поток из сервиса `game`). WebSocket — только для real-time игр (сейчас таких нет).
  - **Обёртка** — `apps/portal/src/shared/lib/sse` (`createEventStream(url, {schema, types, onEvent, onOpen, onError, onInvalid})`): `EventSource` с `withCredentials: true`, каждое сообщение `{type: e.type, data: JSON.parse(e.data)}` проверяется Zod-схемой union событий из components (§6). Когда поток закрылся (`readyState === CLOSED`, в том числе 401 до старта), — `refreshSession()` и переподключение с backoff 1 → 30 с; если refresh вернул false (гость), переподключения нет. Статус ответа из `EventSource` не узнать, поэтому refresh делается перед каждой попыткой.
  - URL SSE-ручки собирается через `resolveUrl` рядом с хуком (Orval её не генерирует).
  - **Подписки комнаты и партии — разные.** Поток комнаты — `GET /api/rooms/{roomId}/events`: первым сообщением `snapshot`, затем события без seq с полным значением (замена). После реконнекта приходит свежий `snapshot`.
  - **Поток партии** — `GET /api/games/{gameCode}/rooms/{roomId}/sessions/{sessionId}/events`: `snapshot` (`{seq, status, serverTime, meta, state}`), затем события `event: put|patch|delete|info` с `{seq, at, method, code, data}`. Каждое сообщение проверяется Zod (`SessionStreamEvent`); seq сверяется (`checkSeq`): повтор отбрасывается; дыра, сообщение не по контракту, ошибка применения патча или провал guard'ов — поток закрывается и открывается заново за свежим снапшотом (backoff 1 → 30 с, сброс после применённого события). Поток закрывается без переподключения, когда `status` документа после патча (или у снапшота) — не `IN_PROGRESS`.

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
  - в портале `no-restricted-imports` запрещает статический импорт пакетов игр (§2).
- Правила донастроим позже; любое изменение правил — по согласованию (§0). Отключать правило комментарием `eslint-disable` можно только для конкретной строки и с причиной.
- Кеш Turborepo для `lint`, `lint:styles` и `typecheck` учитывает изменения в `packages/config`: правка общих правил перепроверяет все пакеты.

## 8. Тесты

- Решить при появлении первой фичи (инструменты, уровень — unit, компонентные, e2e).

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
pnpm api:fetch               # снять OpenAPI с запущенных gateway в packages/api/openapi/ (снапшоты не коммитятся; GATEWAY_URL, ADMIN_GATEWAY_URL)
pnpm api:generate            # сгенерировать клиент API (Orval)
```

- Порты: portal — http://localhost:3000, admin — http://localhost:3001.
- Вход через Google локально: в Google Cloud Console настроить OAuth consent screen (External, Testing, себя — в Test users), создать OAuth client ID типа Web application с Authorized JavaScript origins `http://localhost:3000` и `http://localhost` (redirect URI не нужны). Client ID прописать в `GOOGLE_CLIENT_IDS` (`.env` бэкенда, затем `docker compose up -d`) и в `PUBLIC_GOOGLE_CLIENT_ID` (`apps/portal/.env`).
- Прод-сборка в Docker: `docker compose up --build -d --wait` (portal :3000, admin :3001; статику раздаёт nginx не от root — `nginxinc/nginx-unprivileged`, внутри контейнера порт 8080; hot reload нет — для разработки `pnpm dev`). Общий образ — `docker/app.Dockerfile` (аргументы `APP`, `OUT`, `NGINX_CONF`), конфиг nginx — `docker/nginx/spa.conf` (fallback на `index.html`); заголовки безопасности (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`) задаются на уровне server и через `add_header_inherit merge` приходят на всех ответах. CSP — решить при настройке прод-деплоя. Переменные `PUBLIC_*` вшиваются при сборке из `apps/<app>/.env` (нет файла — сборка падает): после правки `.env` — `--build`. Бэкенд в этот compose не входит.
- Бэкенд поднимается в его репозитории: `docker compose up --build -d --wait`. Swagger: user-gateway — http://localhost:8080/swagger-ui.html, admin-gateway — http://localhost:8083/swagger-ui.html. Вход в админку на стенде — `admin` / `admin`.
- Переменные окружения приложений — в `.env` приложения (шаблон — `.env.example`).
- Статический результат Rsbuild-приложений — `apps/<app>/dist/`.

## 11. Отклонённые решения

### Монорепозиторий

| Вариант                                | Почему отклонён                                                                     | Что вместо                      |
| -------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| npm workspaces                         | При конфликте версий кладёт пакеты во вложенные `node_modules`, нет каталога версий | pnpm (hoisted + strict catalog) |
| Nx                                     | Много собственной магии и конфигурации, для трёх приложений избыточно               | pnpm + Turborepo                |
| pnpm без Turborepo                     | Нет кеша и графа задач                                                              | pnpm + Turborepo                |
| shadcn/ui отдельно в каждом приложении | Дублирование кода, дизайн расходится                                                | Общий `@qgames/ui`              |

### Приложения и сборка

| Вариант                                     | Почему отклонён                                                                                                                             | Что вместо                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Чистый Rspack (`@rspack/cli`) для SPA       | Большой ручной конфиг (loaders, HMR, PostCSS, HTML)                                                                                         | Rsbuild                                                 |
| Node.js 22                                  | Maintenance LTS, поддержка заканчивается в апреле 2027                                                                                      | Node.js 24 LTS                                          |
| Dev-режим (`pnpm dev`) в контейнере         | bind-mount на Windows медленный, вотчеры капризны                                                                                           | Прод-сборка + nginx; для разработки `pnpm dev` локально |
| Build args для `PUBLIC_*` в compose         | Решение пользователя                                                                                                                        | `apps/<app>/.env` в контексте сборки                    |

### Код и библиотеки

| Вариант                                | Почему отклонён                                                     | Что вместо                            |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| Type-sliced структура (как на бэкенде) | Границы между фичами ничем не защищены                              | FSD                                   |
| Feature-folders                        | Слабее FSD по правилам зависимостей                                 | FSD                                   |
| TanStack Form                          | Моложе, обёртку под shadcn пришлось бы писать самим                 | react-hook-form + Zod                 |
| `@hey-api/openapi-ts`                  | Версия 0.x, частые ломающие изменения                               | Orval                                 |
| openapi-typescript + openapi-fetch     | Хуки Query и Zod-схемы пришлось бы писать руками                    | Orval                                 |
| `@react-oauth/google`                  | Runtime-зависимость и провайдер на всё приложение ради одной кнопки | Скрипт GIS + `@types/google.accounts` |
| TypeScript 7                           | Нет поддержки в typescript-eslint и тулинге                         | TypeScript 6.0                        |

### Линтинг

| Вариант                        | Почему отклонён                                                                       | Что вместо                     |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------ |
| `eslint-config-google`         | Не обновлялся с 2019 года, только JS, без flat config, часть правил удалена из ESLint | gts + typescript-eslint strict |
| `stylelint-config-recommended` | Ловит только ошибки, стиль не проверяет                                               | `stylelint-config-standard`    |

### Взаимодействие с бэкендом

| Вариант                                               | Почему отклонён                                                                        | Что вместо                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Same-origin: прокси `/api` через dev-сервер и ingress | Выбраны прямые запросы на отдельный api-домен                                          | Прямые запросы + CORS на gateway            |
| Генерация клиента при каждой сборке с живого gateway  | Сборка фронта зависела бы от запущенного бэкенда, изменения контракта не видны в диффе | Закоммиченный сгенерированный код           |
| Админка через общий `user-gateway`                    | Решение пользователя: у администраторов отдельный сервис                               | `admin-gateway`                             |
| Коммит снапшота OpenAPI                               | Конфликты при параллельной разработке; контракт виден по диффу сгенерированного кода   | Снапшот в `.gitignore`, коммитится `src/generated/` |
| Orval в режиме `split`                                | Один большой файл ручек конфликтует при параллельной разработке                        | `tags-split`, теги латиницей                |

### UI комнаты

| Вариант                                                                                          | Почему отклонён                                                                                | Что вместо                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Кнопки «Войти в комнату» и «Выйти из комнаты»                                                    | Лишние действия; без выхода комната не пустела                                                 | Автовход и автовыход (`useRoomPresence`)                                                                                    |
| Кнопки «Стать игроком» / «Стать наблюдателем» в сайдбаре                                         | Решение пользователя: переключение — в самих списках                                           | «Перейти» в заголовке списка, оба списка видны всегда                                                                       |
| Льготный срок выхода у участников (не выходить сразу на `pagehide`)                              | Перезагрузка всё равно теряла место наблюдателя, комната держала ушедших                       | Мгновенный выход + окно владения 15 с + игроки партии закреплены до конца; присутствие по SSE-потоку                        |
| Вход и выход запросами `join`/`leave` (keepalive на `pagehide`, автовход по опросу)              | Запросы теряются при закрытии вкладки; поток событий и так нужен                               | Присутствие = открытый SSE-поток комнаты                                                                                    |
| Опрос комнаты раз в 2 с всегда                                                                   | Задержка и лишние запросы                                                                      | SSE комнаты; опрос только во время партии до потока партии                                                                  |
| Опрос комнаты во время партии, состояние партии в ответе комнаты                                 | Задержка; ответы мутаций перетирали кеш без сверки                                             | Поток партии, мутации партии отвечают 204                                                                                   |
| `expectedVersion` в ходе                                                                         | Версии партии больше нет, ход проверяет сервер по текущему состоянию                           | Ход без версии, 422 `MOVE_REJECTED`                                                                                         |
| Ручные Zod-схемы состояния в пакете игры                                                         | Контракт дублировался руками и мог разойтись                                                   | Сгенерированные схемы + guard по `meta.game.code`                                                                           |
| Правила игры на фронте (симуляция состояния и проверка законности ходов)                         | Правила только на сервере                                                                      | Фронт применяет события к состоянию, действия — из `moveOptions`; подсказки ввода пути по флагам `meta.moveRules` разрешены |
| Редьюсер на каждый тип события (у игры и модулей)                                                | Каждый новый код и версия игры требуют правок фронта                                           | Общий применитель патчей по `method`, `code` — только для логов                                                             |
| Проверка состояния одной общей схемой (`SessionStateDto`)                                        | Не повторяет модульное устройство бэкенда, при нескольких играх не проверяет соответствие игре | Guard'ы модулей + guard игровых полей                                                                                       |
| Показ пауз у партии без таймера (кнопка с ошибкой или заблокированная)                           | Заведомо бесполезная кнопка                                                                    | Кнопки паузы только при активном таймере                                                                                    |
| Сгенерированный Orval fetch/хук для SSE-ручки                                                    | Повисает на бесконечном потоке, имя совпадает с хуком слайса                                   | Исключение из генерации, обёртка `shared/lib/sse`                                                                           |
| Фиктивный `application/json` у SSE-ручки ради Zod                                                | Документ врёт о формате ответа                                                                 | Zod-схемы components                                                                                                        |
| Подсказки через атрибут `title`                                                                  | Появляются с задержкой, выглядят системно                                                      | Tooltip из `@qgames/ui` (`WithHint`)                                                                                        |
| Статусы игры `DISABLED` (временно недоступна) и `FORCE_DISABLED`, поле `publishStatus` в ответах | Решение пользователя: лишние режимы недоступности                                              | Три статуса на бэкенде; отключение = `NOT_PUBLISHED` (404, комнаты удаляются)                                               |
| Удаление комнаты владельцем                                                                      | Ручное удаление выкидывает остальных участников и стирает историю партий                       | Автоудаление пустых комнат (`EmptyRoomCleanupJob`)                                                                          |
