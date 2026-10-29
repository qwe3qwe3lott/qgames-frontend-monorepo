import {testIds as createRoomTestIds} from '@portal/features/create-room/ui/create-room-button.test-ids';
import {testIds} from '@portal/pages/game-rooms/ui/game-rooms-page.test-ids';

import {pageModel} from '../../core/page-model';

/** Страница игры: описание и создание комнаты. */
export class GameRoomsPage extends pageModel(testIds) {
  readonly createRoomButton = this.page.getByTestId(createRoomTestIds.root);

  async open(gameCode: string): Promise<void> {
    await this.page.goto(`/games/${gameCode}/rooms`);
  }
}
