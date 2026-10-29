import {testIds as loginFormTestIds} from '@admin/features/login/ui/LoginForm.testIds';
import {testIds} from '@admin/pages/login/ui/LoginPage.testIds';

import {pageModel} from '../../core/pageModel';

/** Вход администратора по логину и паролю. */
export class LoginPage extends pageModel(testIds) {
  readonly loginInput = this.page.getByTestId(loginFormTestIds.loginInput);
  readonly passwordInput = this.page.getByTestId(
    loginFormTestIds.passwordInput,
  );
  readonly submitButton = this.page.getByTestId(loginFormTestIds.submitButton);

  async open(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(login: string, password: string): Promise<void> {
    await this.loginInput.fill(login);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
