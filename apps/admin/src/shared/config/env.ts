import {z} from 'zod';

// Переменных пока нет: адрес API не нужен (same-origin, CLAUDE.md §5).
const envSchema = z.object({});

/** Переменные окружения, проверенные при старте (CLAUDE.md §4). */
export const env = envSchema.parse({});
