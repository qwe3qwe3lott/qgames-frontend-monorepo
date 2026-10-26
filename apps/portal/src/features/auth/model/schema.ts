import {LoginBody, RegisterWithGoogleBody} from '@qgames/api/portal/zod';
import {z} from 'zod';

import {loginSchema} from '@/entities/user';

export const loginFormSchema = LoginBody;
export type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Пароль при регистрации необязателен: пустое поле — без входа по паролю. */
const registerFieldsSchema = z.object({
  login: loginSchema,
  password: z.union([
    z.literal(''),
    RegisterWithGoogleBody.shape.password.unwrap().unwrap(),
  ]),
  passwordConfirm: z.string(),
});

/** Повтор пароля сверяется только на клиенте и на сервер не уходит. */
export const registerFormSchema = registerFieldsSchema.refine(
  values => values.password === values.passwordConfirm,
  {message: 'Пароли не совпадают', path: ['passwordConfirm']},
);
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
