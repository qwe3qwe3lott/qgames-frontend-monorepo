import {RegisterBody} from '@qgames/api/gateway/zod';
import {z} from 'zod';

import {nicknameSchema} from '@/entities/user';

const registerFieldsSchema = RegisterBody.extend({
  nickname: nicknameSchema,
  passwordConfirm: z.string(),
});

/** Регистрация с повтором пароля: повтор сверяется только на клиенте и на сервер не уходит. */
export const registerSchema = registerFieldsSchema.refine(
  values => values.password === values.passwordConfirm,
  {
    message: 'Пароли не совпадают',
    path: ['passwordConfirm'],
    // Сверяем, даже если в других полях есть ошибки, но только при валидных паролях.
    when: payload =>
      registerFieldsSchema
        .pick({password: true, passwordConfirm: true})
        .safeParse(payload.value).success,
  },
);
export type RegisterValues = z.infer<typeof registerSchema>;
