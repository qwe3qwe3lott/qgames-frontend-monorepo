import {testIds} from '@portal/pages/home/ui/home-page.test-ids';

import {pageModel} from '../../core/page-model';

export class HomePage extends pageModel(testIds) {
  async open(): Promise<void> {
    await this.page.goto('/');
  }
}
