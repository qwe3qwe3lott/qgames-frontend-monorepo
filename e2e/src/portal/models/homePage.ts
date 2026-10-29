import {testIds} from '@portal/pages/home/ui/HomePage.testIds';

import {pageModel} from '../../core/pageModel';

export class HomePage extends pageModel(testIds) {
  async open(): Promise<void> {
    await this.page.goto('/');
  }
}
