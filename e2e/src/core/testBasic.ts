import {test as base, type BrowserContext, type Page} from '@playwright/test';

import {
  createModel,
  type ComponentModel,
  type ModelClass,
} from './componentModel';
import {recordEventStreams} from './sseRecorder';

/**
 * Ожидаемый результат шага: вложенный шаг `ОР: <text>` с проверками [checks].
 * В отчёте — «Шаг N › ОР: …»; упавшая проверка подсвечивается внутри узла ОР,
 * а его заголовок попадает в стек ошибки.
 */
export function expected(
  text: string,
  checks: () => Promise<void>,
): Promise<void> {
  return base.step(`ОР: ${text}`, checks);
}

/**
 * Вешает `expected` на расширенный `test` (`testPortal.expected(…)`). `extend`
 * возвращает новый объект без своих свойств, поэтому вызывается на каждом
 * уровне: testBasic, testPortal, testAdmin.
 */
export function withExpected<T extends object>(
  test: T,
): T & {expected: typeof expected} {
  return Object.assign(test, {expected});
}

/** Карта моделей приложения: имя фикстуры → класс модели. */
export type ModelMap = Readonly<Record<string, ModelClass<ComponentModel>>>;

/** Экземпляры моделей карты [M]. */
export type ModelsOf<M extends ModelMap> = {
  readonly [K in keyof M]: InstanceType<M[K]>;
};

/** Фикстуры моделей: `homePage: ({page}, use) => use(HomePage.new(page))`. */
export function modelFixtures<M extends ModelMap>(models: M) {
  const fixtures: Record<
    string,
    (
      args: {page: Page},
      use: (model: ComponentModel) => Promise<void>,
    ) => Promise<void>
  > = {};
  for (const [name, Model] of Object.entries(models)) {
    fixtures[name] = async ({page}, use) => {
      await use(createModel(Model, page));
    };
  }
  // Фикстура на каждый ключ карты создаёт экземпляр её класса.
  return fixtures as {
    [K in keyof M]: (
      args: {page: Page},
      use: (model: InstanceType<M[K]>) => Promise<void>,
    ) => Promise<void>;
  };
}

/** Модели карты для страницы [page], создаются при первом обращении. */
export function lazyModels<M extends ModelMap>(
  models: M,
  page: Page,
): ModelsOf<M> {
  const result = {};
  for (const [name, Model] of Object.entries(models)) {
    let instance: ComponentModel | undefined;
    Object.defineProperty(result, name, {
      enumerable: true,
      get: () => (instance ??= createModel(Model, page)),
    });
  }
  // Свойства по всем ключам карты определены в цикле выше.
  return result as ModelsOf<M>;
}

/** Вход через API: куки сессии ложатся в контекст браузера. */
export async function apiLogin<T>(
  context: BrowserContext,
  path: string,
  data: {login: string; password: string},
): Promise<T> {
  const response = await context.request.post(path, {data});
  if (!response.ok()) {
    throw new Error(
      `Вход ${data.login} через ${path}: ${String(response.status())} ${await response.text()}`,
    );
  }
  // Ответ ручки входа — модель пользователя из контракта API.
  return (await response.json()) as T;
}

interface BasicOptions {
  /** Тест начинается гостем: фикстуры не входят в аккаунт. */
  guest: boolean;
}

/** Общее для портала и админки: опция `guest`, запись SSE, `expected`. */
export const testBasic = withExpected(
  base.extend<BasicOptions>({
    guest: [false, {option: true}],
    context: async ({context}, use) => {
      await recordEventStreams(context);
      await use(context);
    },
  }),
);
