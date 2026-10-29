import {testIds as createRoomTestIds} from '@portal/features/createRoom/ui/CreateRoomButton.testIds';
import {testIds} from '@portal/pages/gameRooms/ui/GameRoomsPage.testIds';

import {pageModel} from '../../core/pageModel';

/** Страница игры: описание и создание комнаты. */
export class GameRoomsPage extends pageModel(testIds) {
  readonly createRoomButton = this.page.getByTestId(createRoomTestIds.root);

  async open(gameCode: string): Promise<void> {
    await this.page.goto(`/games/${gameCode}/rooms`);
  }
}
