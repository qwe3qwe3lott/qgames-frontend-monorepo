import type {Locator} from '@playwright/test';
import {testIds} from '@admin/pages/admins/ui/admins-page.test-ids';

import {pageModel} from '../../core/page-model';

/** Список администраторов. */
export class AdminsPage extends pageModel(testIds) {
  async open(): Promise<void> {
    await this.page.goto('/admins');
  }

  /** Строка администратора [login]. */
  admin(login: string): Locator {
    return this.byData(this.row, {login});
  }
}
