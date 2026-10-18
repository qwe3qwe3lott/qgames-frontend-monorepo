import {RegisterBody} from '@qgames/api/gateway/zod';
import {z} from 'zod';

/**
 * Ник: 3–32 символа, без пробелов по краям и управляющих символов.
 * Шаблон из контракта (`\p{Cntrl}`) работает только в Java: в JS без флага `u`
 * он отклоняет обычные буквы, поэтому правило повторено здесь (CLAUDE.md §5).
 */
const nicknameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[^\s\p{Cc}]([^\p{Cc}]*[^\s\p{Cc}])?$/u, {
    message: 'Без пробелов в начале и в конце',
  });

export const registerSchema = RegisterBody.extend({
  // В контракте пароль не обязателен (нет @NotNull), но без него аккаунт не создать.
  password: z.string().min(8).max(128),
  nickname: nicknameSchema,
});
export type RegisterValues = z.infer<typeof registerSchema>;
