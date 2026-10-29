import {expect} from '@playwright/test';

import {testPortal} from '../../src/portal/test-portal';

testPortal.use({guest: true});

testPortal(
  'Вход по логину и паролю через окно входа',
  async ({homePage, header, authDialog, credentials}) => {
    await testPortal.step(
      'Предусловие: гость на главной странице',
      async () => {
        await homePage.open();

        await testPortal.expected(
          'В шапке кнопка входа, профиля нет',
          async () => {
            await expect(header.loginButton).toBeVisible();
            await expect(header.profileLink).toBeHidden();
          },
        );
      },
    );

    await testPortal.step('Шаг 1: Нажать «Войти» в шапке', async () => {
      await header.loginButton.click();

      await testPortal.expected('Открыто окно входа', async () => {
        await expect(authDialog.root).toBeVisible();
      });
    });

    await testPortal.step('Шаг 2: Ввести логин и пароль и войти', async () => {
      await authDialog.login(credentials.login, credentials.password);

      await testPortal.expected(
        'Окно входа закрыто, в шапке профиль вошедшего игрока',
        async () => {
          await expect(authDialog.root).toBeHidden();
          await expect(header.profileLink).toHaveAttribute(
            'data-login',
            credentials.login,
          );
        },
      );
    });
  },
);
