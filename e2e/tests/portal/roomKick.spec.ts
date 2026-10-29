import {expect} from '@playwright/test';

import {testPortal} from '../../src/portal/testPortal';

testPortal('Владелец исключает участника из комнаты', async ({actors}) => {
  const host = actors.main();
  const guest = await actors.player();
  let roomId = '';

  await testPortal.step(
    'Предусловие: гость вошёл в комнату хоста игры «ничто»',
    async () => {
      await host.gameRoomsPage.open('nothing');
      await host.gameRoomsPage.createRoomButton.click();
      roomId = await host.roomPage.roomId();
      await guest.roomPage.open('nothing', roomId);

      await testPortal.expected('Хост видит гостя в комнате', async () => {
        await expect(host.roomPanel.player(guest.id)).toBeVisible();
      });
    },
  );

  await testPortal.step('Шаг 1: Хост исключает гостя', async () => {
    await host.roomPanel.kickButton(guest.id).click();
    await host.roomPanel.kickConfirm.click();

    await testPortal.expected(
      'Гостя увели на страницу игры с окном об исключении, у хоста его нет',
      async () => {
        await expect(guest.gameRoomsPage.kickedDialog).toBeVisible();
        await expect(guest.gameRoomsPage.root).toBeVisible();
        await expect(host.roomPanel.player(guest.id)).toBeHidden();
      },
    );
  });

  await testPortal.step('Шаг 2: Гость снова открывает комнату', async () => {
    await guest.roomPage.open('nothing', roomId);

    await testPortal.expected('Гость вошёл снова: это не бан', async () => {
      await expect(guest.roomPanel.player(guest.id)).toBeVisible();
      await expect(host.roomPanel.player(guest.id)).toBeVisible();
    });
  });
});
