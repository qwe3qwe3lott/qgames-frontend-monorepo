import {z} from 'zod';

const envSchema = z.object({
  PUBLIC_API_URL: z.url(),
  /** Client ID Google Identity Services; не задан — вход через Google скрыт. */
  PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
});

/** Пустая строка в .env означает «не задано». */
function optional(value: string | undefined): string | undefined {
  return value === '' ? undefined : value;
}

/** Переменные окружения, проверенные при старте (CLAUDE.md §4). */
export const env = envSchema.parse({
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
  PUBLIC_GOOGLE_CLIENT_ID: optional(import.meta.env.PUBLIC_GOOGLE_CLIENT_ID),
});
