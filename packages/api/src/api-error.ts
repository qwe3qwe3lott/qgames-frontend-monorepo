import {z} from 'zod';

/** Тело ошибки gateway: ProblemDetail с машиночитаемым `code`. */
const problemDetailSchema = z.object({
  status: z.number().int().optional(),
  title: z.string().optional(),
  detail: z.string().optional(),
  code: z.string().optional(),
  /** Причина отказа хода у MOVE_REJECTED (например, NOT_YOUR_TURN). */
  reason: z.string().optional(),
  /** Ошибки полей у VALIDATION_ERROR: имя поля → сообщение. */
  errors: z.record(z.string(), z.string().nullable()).optional(),
});

/** Код ошибки, если gateway его не прислал (не-JSON ответ, прокси). */
export const UNKNOWN_ERROR_CODE = 'UNKNOWN';
/** Код ошибки, если до gateway не удалось достучаться. */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

interface ApiErrorDetails {
  detail?: string | undefined;
  reason?: string | undefined;
  fieldErrors?: Readonly<Record<string, string>> | undefined;
}

/** Ошибка ответа gateway. UI ветвится только по `code` (CLAUDE.md §5). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;
  readonly reason: string | undefined;
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(status: number, code: string, details: ApiErrorDetails = {}) {
    super(
      `${String(status)} ${code}${details.detail === undefined ? '' : `: ${details.detail}`}`,
    );
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = details.detail;
    this.reason = details.reason;
    this.fieldErrors = details.fieldErrors ?? {};
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const body: unknown = await response.json().catch(() => undefined);
    const parsed = problemDetailSchema.safeParse(body);
    if (!parsed.success) {
      return new ApiError(response.status, UNKNOWN_ERROR_CODE);
    }
    const {code, detail, reason, errors = {}} = parsed.data;
    const fieldErrors: Record<string, string> = {};
    for (const [field, message] of Object.entries(errors)) {
      if (message !== null) {
        fieldErrors[field] = message;
      }
    }
    return new ApiError(response.status, code ?? UNKNOWN_ERROR_CODE, {
      detail,
      reason,
      fieldErrors,
    });
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
