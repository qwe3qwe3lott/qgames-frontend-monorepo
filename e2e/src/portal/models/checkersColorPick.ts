import type {Locator} from '@playwright/test';
import {testIds} from '@qgames/game-checkers/testIds/ColorPick';

import {componentModel} from '../../core/componentModel';

/** Стадия выбора цвета шашек: кнопки цветов (`data-color`). */
export class CheckersColorPick extends componentModel(testIds) {
  colorButton(color: 'WHITE' | 'BLACK'): Locator {
    return this.byData(this.pickButton, {color});
  }
}
