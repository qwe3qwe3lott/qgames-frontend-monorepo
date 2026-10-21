import {z} from 'zod';

/**
 * Куда вернуться после входа: только путь этого сайта (`/…`, но не `//host`),
 * чтобы ссылкой нельзя было увести администратора на чужой сайт.
 */
const redirectSchema = z
  .string()
  .regex(/^\/(?!\/)/)
  .optional()
  .catch(undefined);

export const loginSearchSchema = z.object({redirect: redirectSchema});
