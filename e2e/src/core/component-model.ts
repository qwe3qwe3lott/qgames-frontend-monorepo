import type {Locator, Page} from '@playwright/test';
import type {TestIds} from '@qgames/ui/lib/test-ids';

/**
 * Ключ фабрики: значение не экспортируется, поэтому `new Model(...)` вне этого
 * модуля не скомпилируется и не сработает — модель создаётся только через
 * `Model.new(page)`.
 */
const factoryKey: unique symbol = Symbol('ComponentModel.new');

export type FactoryKey = typeof factoryKey;

/** Конструктор конкретной модели (не абстрактной). */
export type ModelClass<M> = new (key: FactoryKey, page: Page) => M;

/** Локатор на каждый ключ testIds компонента. */
export type Locators<T extends TestIds> = {readonly [K in keyof T]: Locator};

/** `userId` → `data-user-id`. */
function dataAttribute(key: string): string {
  return `data-${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}`;
}

/**
 * Модель компонента (Page Object). Локаторы — только по `data-testid` и
 * атрибутам `data-*`, не по тексту: интерфейс будет переводиться.
 */
export abstract class ComponentModel {
  readonly page: Page;

  constructor(key: FactoryKey, page: Page) {
    if (key !== factoryKey) {
      throw new Error('Модель создаётся только через Model.new(page)');
    }
    this.page = page;
  }

  static new<M extends ComponentModel>(this: ModelClass<M>, page: Page): M {
    return createModel(this, page);
  }

  /**
   * Сужает [locator] до элемента с атрибутами `data-*`:
   * `byData(players.item, {userId})` → `[data-user-id="…"]`.
   */
  protected byData(
    locator: Locator,
    data: Readonly<Record<string, string | number>>,
  ): Locator {
    let result = locator;
    for (const [key, value] of Object.entries(data)) {
      result = result.and(
        this.page.locator(`[${dataAttribute(key)}="${String(value)}"]`),
      );
    }
    return result;
  }
}

/**
 * Создаёт модель класса [Model] (для фикстур по карте моделей). Тестам
 * недоступна: они не импортируют `src/core` (ESLint).
 */
export function createModel<M>(Model: ModelClass<M>, page: Page): M {
  return new Model(factoryKey, page);
}

/** Ставит на модель локатор `page.getByTestId(id)` на каждый ключ testIds. */
export function assignLocators(model: ComponentModel, testIds: TestIds): void {
  for (const key of Object.keys(testIds)) {
    const id: unknown = Reflect.get(testIds, key);
    if (typeof id !== 'string') {
      continue;
    }
    Object.defineProperty(model, key, {
      value: model.page.getByTestId(id),
      enumerable: true,
    });
  }
}

/** Базовый класс модели с локаторами testIds и фабрикой `new`. */
export type ModelBase<
  B extends ComponentModel,
  T extends TestIds,
> = (abstract new (key: FactoryKey, page: Page) => B & Locators<T>) &
  Pick<typeof ComponentModel, 'new'>;

/**
 * Базовый класс модели компонента по его testIds:
 * `class Header extends componentModel(headerTestIds) {}` даёт `header.root`,
 * `header.gamesLink` и т.д.
 */
export function componentModel<const T extends TestIds>(
  testIds: T,
): ModelBase<ComponentModel, T> {
  abstract class Model extends ComponentModel {
    constructor(key: FactoryKey, page: Page) {
      super(key, page);
      assignLocators(this, testIds);
    }
  }
  // Локаторы по ключам testIds ставит конструктор (assignLocators); из цикла
  // TS их тип не выводит.
  return Model as ModelBase<ComponentModel, T>;
}
