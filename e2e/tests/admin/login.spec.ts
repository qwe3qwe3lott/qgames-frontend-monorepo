import {expect} from '@playwright/test';

import {ADMIN, testAdmin} from '../../src/admin/testAdmin';

testAdmin.use({guest: true});

testAdmin('Вход администратора', async ({loginPage, header, adminsPage}) => {
  await testAdmin.step('Предусловие: гость на странице входа', async () => {
    await loginPage.open();

    await testAdmin.expected('Открыта страница входа', async () => {
      await expect(loginPage.root).toBeVisible();
    });
  });

  await testAdmin.step('Шаг 1: Ввести логин и пароль и войти', async () => {
    await loginPage.login(ADMIN.login, ADMIN.password);

    await testAdmin.expected('В шапке вошедший администратор', async () => {
      await expect(header.currentAdmin).toHaveAttribute(
        'data-login',
        ADMIN.login,
      );
    });
  });

  await testAdmin.step(
    'Шаг 2: Открыть раздел администраторов из шапки',
    async () => {
      await header.adminsLink.click();

      await testAdmin.expected(
        'В списке есть вошедший администратор',
        async () => {
          await expect(adminsPage.admin(ADMIN.login)).toBeVisible();
        },
      );
    },
  );
});
