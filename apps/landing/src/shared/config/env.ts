import {z} from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_PORTAL_URL: z.url(),
});

/** Переменные окружения, проверенные при сборке (CLAUDE.md §4). */
export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env['NEXT_PUBLIC_SITE_URL'],
  NEXT_PUBLIC_PORTAL_URL: process.env['NEXT_PUBLIC_PORTAL_URL'],
});
