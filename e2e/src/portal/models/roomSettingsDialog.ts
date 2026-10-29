import {expect, type Locator} from '@playwright/test';
import type {
  GameAdvancedSettingsDto,
  GameSimpleSettingsDto,
  RoomOptionsDto,
  TimeControlDto,
} from '@qgames/api/portal/model';
import {testIds as fieldsTestIds} from '@portal/entities/room/ui/RoomSettingsFields.testIds';
import {testIds} from '@portal/features/editRoomSettings/ui/RoomSettingsDialog.testIds';

import {componentModel} from '../../core/componentModel';

/** Настройки, которые владелец выставляет в окне: группы целиком, как в PUT. */
export interface RoomSettingsInput {
  room?: RoomOptionsDto | undefined;
  simple?: GameSimpleSettingsDto | undefined;
  advanced?: GameAdvancedSettingsDto | undefined;
}

/**
 * Поля, от которых зависят другие (варианты времени шашек — от варианта
 * правил), выставляются первыми.
 */
const FIRST_FIELDS = ['variant'];

/** Окно настроек комнаты у владельца. */
export class RoomSettingsDialog extends componentModel(testIds) {
  readonly fields = this.page.getByTestId(fieldsTestIds.root);
  readonly advancedCheckbox = this.page.getByTestId(
    fieldsTestIds.advancedCheckbox,
  );
  readonly baseMinutes = this.page.getByTestId(fieldsTestIds.baseMinutes);
  readonly baseSeconds = this.page.getByTestId(fieldsTestIds.baseSeconds);

  /** Поле формы (число или галочка) по пути `simple.rounds`, `advanced.flyingKings`. */
  field(path: string): Locator {
    return this.byData(this.page.getByTestId(fieldsTestIds.field), {
      field: path,
    });
  }

  /** Вариант радиокнопок поля [path] со значением [value]. */
  option(path: string, value: string): Locator {
    return this.byData(this.page.getByTestId(fieldsTestIds.option), {
      field: path,
      value,
    });
  }

  /**
   * Открывает окно, выставляет переданные группы кликами и сохраняет. advanced
   * включает галочку «Продвинутые правила» (сервер заполняет поля из simple),
   * simple — выключает её. Код игры в группе не выставляется: он из комнаты.
   */
  async apply(settings: RoomSettingsInput): Promise<void> {
    await this.openButton.click();
    await expect(this.fields).toBeVisible();
    if (settings.room !== undefined) {
      await this.field('room.maxSpectators').fill(
        String(settings.room.maxSpectators),
      );
    }
    if (settings.simple !== undefined) {
      await this.advancedCheckbox.setChecked(false);
      await this.fill('simple', settings.simple);
    }
    if (settings.advanced !== undefined) {
      if (!(await this.advancedCheckbox.isChecked())) {
        await this.advancedCheckbox.click();
      }
      // Галочка и поля появляются после ответа сервера на перевод simple → advanced.
      await expect(this.advancedCheckbox).toBeChecked();
      const {timeControl, ...rules} = settings.advanced;
      await this.fill('advanced', rules);
      await this.fillTimeControl(timeControl);
    }
    await this.submitButton.click();
    await expect(this.root).toBeHidden();
  }

  private async fill(
    group: 'simple' | 'advanced',
    values: object,
  ): Promise<void> {
    const entries = Object.entries(values)
      .filter(([key]) => key !== 'gameCode')
      .sort(
        ([a], [b]) =>
          Number(FIRST_FIELDS.includes(b)) - Number(FIRST_FIELDS.includes(a)),
      );
    for (const [key, value] of entries) {
      const path = `${group}.${key}`;
      if (typeof value === 'boolean') {
        await this.field(path).setChecked(value);
      } else if (typeof value === 'number') {
        await this.field(path).fill(String(value));
      } else if (typeof value === 'string') {
        await this.option(path, value).click();
      } else {
        throw new Error(
          `Поле ${path}: значение ${JSON.stringify(value)} не выставить`,
        );
      }
    }
  }

  private async fillTimeControl(timeControl: TimeControlDto): Promise<void> {
    const enabled = this.option(
      'advanced.timeControl.enabled',
      String(timeControl.enabled),
    );
    // Без радиокнопок часы у игры обязательны.
    if ((await enabled.count()) > 0) {
      await enabled.click();
    }
    if (!timeControl.enabled) {
      return;
    }
    await this.baseMinutes.fill(
      String(Math.floor(timeControl.baseSeconds / 60)),
    );
    await this.baseSeconds.fill(String(timeControl.baseSeconds % 60));
    await this.field('advanced.timeControl.incrementSeconds').fill(
      String(timeControl.incrementSeconds),
    );
  }
}
