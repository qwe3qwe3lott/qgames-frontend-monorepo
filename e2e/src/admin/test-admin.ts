import type {AdminResponse} from '@qgames/api/admin/model';

import {
  apiLogin,
  modelFixtures,
  testBasic,
  withExpected,
  type ModelsOf,
} from '../core/test-basic';
import {adminModels} from './models';

/** Администратор стенда (профиль local бэкенда, `qgames.admin-auth.bootstrap`). */
export const ADMIN = {login: 'admin', password: 'admin'};

type AdminModels = ModelsOf<typeof adminModels>;

interface AdminFixtures extends AdminModels {
  /** Администратор, вошедший до начала теста (null — гость). */
  admin: AdminResponse | null;
}

/** `test` админки: модели страниц и вход администратора через API. */
export const testAdmin = withExpected(
  testBasic.extend<AdminFixtures>({
    ...modelFixtures(adminModels),
    admin: [
      async ({context, guest}, use) => {
        await use(
          guest
            ? null
            : await apiLogin<AdminResponse>(
                context,
                '/api/admin/auth/login',
                ADMIN,
              ),
        );
      },
      {auto: true},
    ],
  }),
);
