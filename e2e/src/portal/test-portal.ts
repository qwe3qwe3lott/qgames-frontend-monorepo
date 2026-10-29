import type {BrowserContext, Page} from '@playwright/test';
import type {UserResponse} from '@qgames/api/portal/model';

import {
  apiLogin,
  lazyModels,
  modelFixtures,
  testBasic,
  withExpected,
  type ModelsOf,
} from '../core/test-basic';
import {recordEventStreams} from '../core/sse-recorder';
import {runScenario} from '../scenario/run-scenario';
import {portalModels} from './models';
import {PLAYER_PASSWORD, playerLogin} from './players';

export type PortalModels = ModelsOf<typeof portalModels>;

/** Тестовый игрок, вошедший в аккаунт. */
export interface Player {
  login: string;
  id: string;
}

/** Игрок со своим контекстом браузера и моделями портала. */
export type Actor = Player & {page: Page} & PortalModels;

export interface Actors {
  /** Основной игрок теста — на странице `page` (та же, что у фикстур моделей). */
  main(): Actor;
  /** Новый игрок пула воркера в отдельном контексте браузера. */
  player(): Promise<Actor>;
}

export interface Scenarios {
  /** Прогоняет сценарий партии из JSON-файла (см. `e2e/CLAUDE.md`). */
  run(file: string): Promise<void>;
}

interface PortalFixtures extends PortalModels {
  /** Логин и пароль основного игрока — и в тесте с `guest: true` (вход через UI). */
  credentials: {login: string; password: string};
  /** Основной игрок; в тесте с `guest: true` недоступен. */
  player: Player;
  actors: Actors;
  scenarios: Scenarios;
}

interface PortalAutoFixtures {
  /** Вход основного игрока до начала теста (null — гость). */
  account: Player | null;
}

async function loginPlayer(
  context: BrowserContext,
  login: string,
): Promise<Player> {
  const user = await apiLogin<UserResponse>(context, '/api/auth/login', {
    login,
    password: PLAYER_PASSWORD,
  });
  return {login: user.login, id: user.id};
}

function toActor(player: Player, page: Page): Actor {
  return Object.assign(lazyModels(portalModels, page), player, {page});
}

/**
 * `test` портала: модели страниц и компонентов, основной игрок, акторы и
 * сценарии партий. Модели и утилиты в тестах не импортируются — только через
 * фикстуры.
 */
export const testPortal = withExpected(
  testBasic.extend<PortalFixtures & PortalAutoFixtures>({
    ...modelFixtures(portalModels),
    // eslint-disable-next-line no-empty-pattern -- Playwright требует деструктуризацию, зависимостей нет
    credentials: async ({}, use, testInfo) => {
      await use({
        login: playerLogin(testInfo.parallelIndex, 0),
        password: PLAYER_PASSWORD,
      });
    },
    account: [
      async ({context, guest, credentials}, use) => {
        await use(guest ? null : await loginPlayer(context, credentials.login));
      },
      {auto: true},
    ],
    player: async ({account}, use) => {
      if (account === null) {
        throw new Error('В тесте с guest: true основного игрока нет');
      }
      await use(account);
    },
    actors: async ({browser, page, account}, use, testInfo) => {
      const contexts: BrowserContext[] = [];
      let next = 1;
      await use({
        main: () => {
          if (account === null) {
            throw new Error('В тесте с guest: true основного игрока нет');
          }
          return toActor(account, page);
        },
        player: async () => {
          const login = playerLogin(testInfo.parallelIndex, next);
          next += 1;
          const {baseURL} = testInfo.project.use;
          const context = await browser.newContext(
            baseURL === undefined ? {} : {baseURL},
          );
          contexts.push(context);
          await recordEventStreams(context);
          const player = await loginPlayer(context, login);
          return toActor(player, await context.newPage());
        },
      });
      await Promise.all(contexts.map(context => context.close()));
    },
    scenarios: async ({actors}, use) => {
      await use({run: file => runScenario(file, actors)});
    },
  }),
);
