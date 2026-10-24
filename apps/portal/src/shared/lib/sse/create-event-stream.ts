import {refreshSession} from '@qgames/api';
import type {z} from 'zod';

/** Пауза перед первым переподключением закрытого потока; дальше удваивается. */
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

export interface EventStreamError {
  /**
   * Поток закрыт (ответ не 200, например 401 или 404, или сервер закрыл его
   * сам): обёртка обновит сессию и переподключится. false — обрыв, браузер
   * переподключается сам.
   */
  closed: boolean;
  /** Переподключения не будет: сессию обновить нельзя (пользователь — гость). */
  final: boolean;
}

export interface EventStreamOptions<T> {
  /**
   * Схема сообщения `{type, data}`: `type` — поле `event:` кадра SSE, `data` —
   * JSON из поля `data:`.
   */
  schema: z.ZodType<T>;
  /** Типы событий (`event:`), на которые подписывается поток. */
  types: readonly string[];
  onEvent: (event: T) => void;
  /** Поток открыт (в том числе после переподключения). */
  onOpen?: () => void;
  onError?: (error: EventStreamError) => void;
  /** Сообщение не прошло схему или не JSON; событие пропускается. */
  onInvalid?: (error: unknown) => void;
}

export interface EventStream {
  close: () => void;
}

/**
 * Поток Server-Sent Events бэкенда (`EventSource` с куками). Каждое сообщение
 * проверяется Zod-схемой (CLAUDE.md §6). Обрыв соединения браузер чинит сам;
 * если поток закрыт, обёртка один раз обновляет сессию (общий refresh с
 * клиентом API) и переподключается с нарастающей паузой.
 */
export function createEventStream<T>(
  url: string,
  options: EventStreamOptions<T>,
): EventStream {
  const {schema, types, onEvent, onOpen, onError, onInvalid} = options;
  let source: EventSource | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let stopped = false;

  const handleMessage = (event: Event) => {
    if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      onInvalid?.(error);
      return;
    }
    const parsed = schema.safeParse({type: event.type, data});
    if (parsed.success) {
      onEvent(parsed.data);
    } else {
      onInvalid?.(parsed.error);
    }
  };

  const reconnect = async () => {
    const refreshed = await refreshSession();
    if (stopped) {
      return;
    }
    if (!refreshed) {
      stopped = true;
      onError?.({closed: true, final: true});
      return;
    }
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
    attempt += 1;
    reconnectTimer = setTimeout(connect, delay);
  };

  function connect(): void {
    reconnectTimer = undefined;
    if (stopped) {
      return;
    }
    const current = new EventSource(url, {withCredentials: true});
    source = current;
    current.onopen = () => {
      attempt = 0;
      onOpen?.();
    };
    current.onerror = () => {
      if (current.readyState !== EventSource.CLOSED) {
        onError?.({closed: false, final: false});
        return;
      }
      current.close();
      source = undefined;
      onError?.({closed: true, final: false});
      void reconnect();
    };
    for (const type of types) {
      current.addEventListener(type, handleMessage);
    }
  }

  connect();

  return {
    close: () => {
      stopped = true;
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
      }
      source?.close();
      source = undefined;
    },
  };
}
