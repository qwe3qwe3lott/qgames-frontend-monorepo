import {z} from 'zod';

/**
 * Куда вернуться после входа: только путь этого сайта (`/…`, но не `//host`),
 * чтобы ссылкой нельзя было увести пользователя на чужой сайт.
 */
export const redirectSchema = z
  .string()
  .regex(/^\/(?!\/)/)
  .optional()
  .catch(undefined);

export const authSearchSchema = z.object({redirect: redirectSchema});
