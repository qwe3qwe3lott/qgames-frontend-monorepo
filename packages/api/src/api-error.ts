import {z} from 'zod';

/** Тело ошибки gateway: ProblemDetail с машиночитаемым `code`. */
const problemDetailSchema = z.object({
  status: z.number().int().optional(),
  title: z.string().optional(),
  detail: z.string().optional(),
  code: z.string().optional(),
});

/** Код ошибки, если gateway его не прислал (сеть, не-JSON ответ, прокси). */
export const UNKNOWN_ERROR_CODE = 'UNKNOWN';

/** Ошибка ответа gateway. UI ветвится только по `code` (CLAUDE.md §5). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;

  constructor(status: number, code: string, detail: string | undefined) {
    super(
      `${String(status)} ${code}${detail === undefined ? '' : `: ${detail}`}`,
    );
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const body: unknown = await response.json().catch(() => undefined);
    const parsed = problemDetailSchema.safeParse(body);
    if (!parsed.success) {
      return new ApiError(response.status, UNKNOWN_ERROR_CODE, undefined);
    }
    return new ApiError(
      response.status,
      parsed.data.code ?? UNKNOWN_ERROR_CODE,
      parsed.data.detail,
    );
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
