import {expect} from '@playwright/test';
import {testIds} from '@portal/pages/room/ui/RoomPage.testIds';

import {pageModel} from '../../core/pageModel';

/** Страница комнаты; корень — с `data-room-id`. */
export class RoomPage extends pageModel(testIds) {
  async open(gameCode: string, roomId: string): Promise<void> {
    await this.page.goto(`/games/${gameCode}/rooms/${roomId}`);
  }

  /** id открытой комнаты из `data-room-id`. */
  async roomId(): Promise<string> {
    await expect(this.root).toHaveAttribute('data-room-id', /.+/);
    const id = await this.root.getAttribute('data-room-id');
    if (id === null) {
      throw new Error('У страницы комнаты нет data-room-id');
    }
    return id;
  }
}
