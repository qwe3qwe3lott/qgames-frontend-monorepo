import type {Locator} from '@playwright/test';
import {testIds as playerListTestIds} from '@qgames/game-ui/testIds/PlayerList';
import {testIds as changeRoleTestIds} from '@portal/features/roomMembership/ui/ChangeRoleButton.testIds';
import {testIds} from '@portal/widgets/roomPanel/ui/RoomPanel.testIds';

import {componentModel} from '../../core/componentModel';

export type RoomRole = 'PLAYER' | 'SPECTATOR';

/** Панель комнаты: участники по ролям и смена роли. */
export class RoomPanel extends componentModel(testIds) {
  /** Строка участника [userId] в списке игроков. */
  player(userId: string): Locator {
    return this.member(this.players, userId);
  }

  /** Строка участника [userId] в списке наблюдателей. */
  spectator(userId: string): Locator {
    return this.member(this.spectators, userId);
  }

  /** Кнопка перехода в роль [role]. */
  changeRoleButton(role: RoomRole): Locator {
    return this.byData(this.page.getByTestId(changeRoleTestIds.root), {role});
  }

  private member(list: Locator, userId: string): Locator {
    return this.byData(list.getByTestId(playerListTestIds.item), {userId});
  }
}
