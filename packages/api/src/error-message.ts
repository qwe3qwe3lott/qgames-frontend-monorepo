import {isApiError, NETWORK_ERROR_CODE} from './api-error';

/** Тексты общих кодов, которые может вернуть любой gateway. */
const COMMON_MESSAGES: Readonly<Record<string, string>> = {
  [NETWORK_ERROR_CODE]:
    'Сервер недоступен. Проверьте соединение и попробуйте ещё раз.',
  SERVICE_UNAVAILABLE: 'Сервис временно недоступен. Попробуйте позже.',
  UNAUTHENTICATED: 'Нужно войти в аккаунт.',
};

const FALLBACK_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз.';

/**
 * Текст ошибки для пользователя по `ApiError.code` (CLAUDE.md §5).
 * `messages` — коды конкретного сценария, они важнее общих.
 */
export function errorMessage(
  error: unknown,
  messages: Readonly<Record<string, string>> = {},
): string {
  if (!isApiError(error)) {
    return FALLBACK_MESSAGE;
  }
  return (
    messages[error.code] ?? COMMON_MESSAGES[error.code] ?? FALLBACK_MESSAGE
  );
}
