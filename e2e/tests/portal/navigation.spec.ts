import {expect} from '@playwright/test';

import {testPortal} from '../../src/portal/test-portal';

testPortal(
  'Переход из шапки на страницу списка игр',
  async ({homePage, header, gamesPage}) => {
    await testPortal.step(
      'Предусловие: пользователь на главной странице',
      async () => {
        await homePage.open();

        await testPortal.expected('Открыта главная страница', async () => {
          await expect(homePage.root).toBeVisible();
        });
      },
    );

    await testPortal.step(
      'Шаг 1: Открыть страницу списка игр из шапки',
      async () => {
        await header.gamesLink.click();

        await testPortal.expected(
          'Пользователь на странице списка игр, в каталоге есть шашки',
          async () => {
            await expect(gamesPage.root).toBeVisible();
            await expect(gamesPage.card('checkers')).toBeVisible();
          },
        );
      },
    );
  },
);
