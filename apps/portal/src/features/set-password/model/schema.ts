import {AddPasswordLoginBody} from '@qgames/api/gateway/zod';
import {z} from 'zod';

const setPasswordFieldsSchema = AddPasswordLoginBody.extend({
  passwordConfirm: z.string(),
});

/** Пароль с повтором: повтор сверяется только на клиенте и на сервер не уходит. */
export const setPasswordSchema = setPasswordFieldsSchema.refine(
  values => values.password === values.passwordConfirm,
  {
    message: 'Пароли не совпадают',
    path: ['passwordConfirm'],
  },
);
export type SetPasswordValues = z.infer<typeof setPasswordSchema>;
