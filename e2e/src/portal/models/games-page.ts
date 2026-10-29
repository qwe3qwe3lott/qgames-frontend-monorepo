import type {Locator} from '@playwright/test';
import {testIds} from '@portal/pages/games/ui/games-page.test-ids';

import {pageModel} from '../../core/page-model';

/** Каталог игр. */
export class GamesPage extends pageModel(testIds) {
  async open(): Promise<void> {
    await this.page.goto('/games');
  }

  /** Карточка игры [gameCode]. */
  card(gameCode: string): Locator {
    return this.byData(this.gameCard, {gameCode});
  }
}
