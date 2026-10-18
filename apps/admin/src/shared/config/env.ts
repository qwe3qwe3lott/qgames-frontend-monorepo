import {z} from 'zod';

const envSchema = z.object({
  PUBLIC_API_URL: z.url(),
});

/** Переменные окружения, проверенные при старте (CLAUDE.md §4). */
export const env = envSchema.parse({
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
});
