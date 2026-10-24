import {ApiError, NETWORK_ERROR_CODE} from './api-error';

/** Код 401 бэкенда, когда нет access-токена или он истёк. */
const UNAUTHENTICATED_CODE = 'UNAUTHENTICATED';

interface ApiConfig {
  baseUrl: string;
  /** Префикс ручек сессии приложения без `/` в конце (`/api/auth`, `/api/admin/auth`). */
  authPath: string;
}

let config: ApiConfig | undefined;
let refreshInFlight: Promise<boolean> | undefined;

/**
 * Задаёт адрес бэкенда и префикс ручек сессии своей группы API
 * (`{authPath}/refresh` — обновление сессии, запросы `{authPath}/*` не повторяются).
 * Приложение вызывает один раз при старте.
 */
export function configureApi(options: ApiConfig): void {
  config = {
    baseUrl: options.baseUrl.replace(/\/+$/, ''),
    authPath: options.authPath.replace(/\/+$/, ''),
  };
}

function requireConfig(): ApiConfig {
  if (config === undefined) {
    throw new Error('@qgames/api: перед запросами вызовите configureApi()');
  }
  return config;
}

/** Полный адрес ручки бэкенда по пути из сгенерированного клиента (`get…Url`). */
export function resolveUrl(path: string): string {
  return `${requireConfig().baseUrl}${path}`;
}

/**
 * Обновляет сессию по refresh-куке. Параллельные 401 ждут один общий запрос.
 * Возвращает false, если сессию обновить нельзя (пользователь — гость).
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(resolveUrl(`${requireConfig().authPath}/refresh`), {
    method: 'POST',
    credentials: 'include',
  })
    .then(response => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = undefined;
    });
  return refreshInFlight;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  return text === '' ? undefined : JSON.parse(text);
}

/**
 * Mutator для Orval: все запросы к бэкенду проходят здесь.
 * Куки отправляются всегда; на 401 сессия обновляется и запрос повторяется один раз.
 */
export async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const request = (): Promise<Response> =>
    fetch(resolveUrl(path), {...init, credentials: 'include'}).catch(
      (error: unknown) => {
        // Отмену запроса (AbortSignal от TanStack Query) пробрасываем как есть.
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        throw new ApiError(0, NETWORK_ERROR_CODE);
      },
    );

  let response = await request();
  if (
    response.status === 401 &&
    !path.startsWith(`${requireConfig().authPath}/`)
  ) {
    // Обновляем сессию только при истёкшем access-токене: другие 401
    // (например, INVALID_GOOGLE_TOKEN при привязке Google) — обычные ошибки.
    const error = await ApiError.fromResponse(response.clone());
    if (error.code !== UNAUTHENTICATED_CODE) {
      throw error;
    }
    if (await refreshSession()) {
      response = await request();
    }
  }
  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }
  // Тип ответа задаёт сгенерированный по OpenAPI код; рантайм-проверки контракта нет.
  return (await parseBody(response)) as T;
}

export type ErrorType<E> = E extends unknown ? ApiError : never;
