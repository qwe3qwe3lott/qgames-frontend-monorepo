import {ApiError} from './api-error';

const AUTH_PATH = '/api/auth/';
const REFRESH_PATH = '/api/auth/refresh';

let baseUrl: string | undefined;
let refreshInFlight: Promise<boolean> | undefined;

/** Задаёт адрес gateway. Приложение вызывает один раз при старте. */
export function configureApi(options: {baseUrl: string}): void {
  baseUrl = options.baseUrl.replace(/\/+$/, '');
}

function resolveUrl(path: string): string {
  if (baseUrl === undefined) {
    throw new Error('@qgames/api: перед запросами вызовите configureApi()');
  }
  return `${baseUrl}${path}`;
}

/**
 * Обновляет сессию по refresh-куке. Параллельные 401 ждут один общий запрос.
 * Возвращает false, если сессию обновить нельзя (пользователь — гость).
 */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(resolveUrl(REFRESH_PATH), {
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
 * Mutator для Orval: все запросы к gateway проходят здесь.
 * Куки отправляются всегда; на 401 сессия обновляется и запрос повторяется один раз.
 */
export async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const request = (): Promise<Response> =>
    fetch(resolveUrl(path), {...init, credentials: 'include'});

  let response = await request();
  if (response.status === 401 && !path.startsWith(AUTH_PATH)) {
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
