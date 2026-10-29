import type {Page} from '@playwright/test';
import type {TestIds} from '@qgames/ui/lib/test-ids';

import {
  assignLocators,
  ComponentModel,
  type FactoryKey,
  type ModelBase,
} from './component-model';

/**
 * Модель страницы. Страница открывается только своим `open(...)`: прямой
 * `page.goto` в тестах запрещён (ESLint), адрес страницы знает её модель.
 */
export abstract class PageModel extends ComponentModel {
  abstract open(...args: never[]): Promise<void>;
}

/**
 * Базовый класс модели страницы по её testIds:
 * `class HomePage extends pageModel(homePageTestIds) { async open() {…} }`.
 */
export function pageModel<const T extends TestIds>(
  testIds: T,
): ModelBase<PageModel, T> {
  abstract class Model extends PageModel {
    constructor(key: FactoryKey, page: Page) {
      super(key, page);
      assignLocators(this, testIds);
    }
  }
  // Локаторы по ключам testIds ставит конструктор (assignLocators); из цикла
  // TS их тип не выводит.
  return Model as ModelBase<PageModel, T>;
}
