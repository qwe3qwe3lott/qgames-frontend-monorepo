import {testIds as loginFormTestIds} from '@portal/features/auth/ui/LoginForm.testIds';
import {testIds} from '@portal/features/auth/ui/AuthDialog.testIds';

import {componentModel} from '../../core/componentModel';

/** Окно входа и регистрации с формой входа по паролю. */
export class AuthDialog extends componentModel(testIds) {
  readonly loginInput = this.page.getByTestId(loginFormTestIds.loginInput);
  readonly passwordInput = this.page.getByTestId(
    loginFormTestIds.passwordInput,
  );
  readonly submitButton = this.page.getByTestId(loginFormTestIds.submitButton);

  async login(login: string, password: string): Promise<void> {
    await this.loginInput.fill(login);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
