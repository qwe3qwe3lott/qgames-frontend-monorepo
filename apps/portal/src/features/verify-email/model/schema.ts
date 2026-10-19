import {z} from 'zod';

// Шаблон кода в контракте — `[0-9]{6}` без якорей: по семантике OpenAPI (поиск подстроки)
// его проходит и «1234567». Поэтому проверяем ровно 6 цифр сами (CLAUDE.md §5).
export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/, {message: 'Код — 6 цифр из письма'}),
});
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
