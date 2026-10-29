import type {Locator} from '@playwright/test';
import {testIds} from '@qgames/game-checkers/testIds/Board';
import {testIds as gridTestIds} from '@qgames/game-checkers/testIds/CheckersGrid';

import {componentModel} from '../../core/componentModel';

/** Доска шашек; клетки — в координатах партии (`data-x`, `data-y`). */
export class CheckersBoard extends componentModel(testIds) {
  readonly grid = this.page.getByTestId(gridTestIds.root);

  square(x: number, y: number): Locator {
    return this.byData(this.page.getByTestId(gridTestIds.square), {x, y});
  }

  /** Клетка-кнопка: ввод хода включён (ход этого игрока). */
  squareButton(x: number, y: number): Locator {
    return this.square(x, y).and(this.page.locator('button'));
  }
}
