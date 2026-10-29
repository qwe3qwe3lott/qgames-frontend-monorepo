import {ChangePasswordBody} from '@qgames/api/portal/zod';
import {z} from 'zod';

const changePasswordFieldsSchema = ChangePasswordBody.extend({
  newPasswordConfirm: z.string(),
});

/** Смена пароля с повтором нового: повтор сверяется только на клиенте и на сервер не уходит. */
export const changePasswordSchema = changePasswordFieldsSchema.refine(
  values => values.newPassword === values.newPasswordConfirm,
  {
    message: 'Пароли не совпадают',
    path: ['newPasswordConfirm'],
  },
);
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
