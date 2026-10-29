import {expect} from '@playwright/test';

import {testPortal} from '../../src/portal/test-portal';

testPortal('Второй игрок входит в комнату по ссылке', async ({actors}) => {
  const host = actors.main();
  const guest = await actors.player();
  let roomId = '';

  await testPortal.step(
    'Предусловие: хост создал комнату игры «ничто»',
    async () => {
      await host.gameRoomsPage.open('nothing');
      await host.gameRoomsPage.createRoomButton.click();

      await testPortal.expected(
        'Хост в комнате и в списке игроков',
        async () => {
          roomId = await host.roomPage.roomId();
          await expect(host.roomPanel.player(host.id)).toBeVisible();
        },
      );
    },
  );

  await testPortal.step(
    'Шаг 1: Гость открывает ссылку на комнату',
    async () => {
      await guest.roomPage.open('nothing', roomId);

      await testPortal.expected(
        'Гость вошёл игроком: его видят и он сам, и хост',
        async () => {
          await expect(guest.roomPanel.player(guest.id)).toBeVisible();
          await expect(host.roomPanel.player(guest.id)).toBeVisible();
        },
      );
    },
  );
});
