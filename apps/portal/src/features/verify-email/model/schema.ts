import {z} from 'zod';

// В контракте `code` не обязателен (нет @NotNull), но без кода подтверждение не пройдёт.
export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/, {message: 'Код — 6 цифр из письма'}),
});
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
