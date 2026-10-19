import {RegisterBody} from '@qgames/api/gateway/zod';
import {z} from 'zod';

/**
 * Ник: 3–32 символа, без пробелов по краям и управляющих символов. Шаблон из контракта
 * (`\p{Cc}`) Orval превращает в `new RegExp(...)` без флага `u`, а без него `\p{…}` в JS
 * означает буквы `p`, `C`, `c` и скобки — обычные ники отклоняются. Поэтому правило
 * повторено здесь с флагом `u` (CLAUDE.md §5).
 */
const nicknameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[^\s\p{Cc}]([^\p{Cc}]*[^\s\p{Cc}])?$/u, {
    message: 'Без пробелов в начале и в конце',
  });

export const registerSchema = RegisterBody.extend({nickname: nicknameSchema});
export type RegisterValues = z.infer<typeof registerSchema>;
