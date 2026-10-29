import type {Locator} from '@playwright/test';
import {testIds as playerListTestIds} from '@qgames/game-ui/test-ids/player-list';
import {testIds as changeRoleTestIds} from '@portal/features/room-membership/ui/change-role-button.test-ids';
import {testIds} from '@portal/widgets/room-panel/ui/room-panel.test-ids';

import {componentModel} from '../../core/component-model';

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
