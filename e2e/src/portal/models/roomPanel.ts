import type {Locator} from '@playwright/test';
import {testIds as playerListTestIds} from '@qgames/game-ui/testIds/PlayerList';
import {testIds as changeRoleTestIds} from '@portal/features/roomMembership/ui/ChangeRoleButton.testIds';
import {testIds as kickTestIds} from '@portal/features/roomMembership/ui/KickMemberButton.testIds';
import {testIds} from '@portal/widgets/roomPanel/ui/RoomPanel.testIds';

import {componentModel} from '../../core/componentModel';

export type RoomRole = 'PLAYER' | 'SPECTATOR';

/** Панель комнаты: участники по ролям, смена роли и исключение участника. */
export class RoomPanel extends componentModel(testIds) {
  /** «Исключить» в окне подтверждения. */
  readonly kickConfirm = this.page.getByTestId(kickTestIds.confirm);

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

  /** Кнопка «Исключить» в строке участника [userId] (видна владельцу). */
  kickButton(userId: string): Locator {
    return this.byData(this.page.getByTestId(kickTestIds.root), {userId});
  }

  private member(list: Locator, userId: string): Locator {
    return this.byData(list.getByTestId(playerListTestIds.item), {userId});
  }
}
