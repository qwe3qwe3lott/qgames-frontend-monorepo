import type {BrowserContext, Page} from '@playwright/test';

/** Сообщение SSE, полученное страницей. */
export interface RecordedFrame {
  /** Адрес потока (`…/sessions/<id>/events`, `…/rooms/<id>/events`). */
  url: string;
  /** Поле `event:` кадра. */
  type: string;
  /** JSON из поля `data:`. */
  data: unknown;
}

interface RecorderWindow {
  __e2eSse?: RecordedFrame[];
}

/**
 * Скрипт страницы: оборачивает `EventSource` и складывает в
 * `window.__e2eSse` каждое сообщение, на тип которого подписалось
 * приложение. Код приложения не меняется — тест видит ровно то, что получил
 * браузер этого пользователя (с маскировкой под зрителя).
 */
function installRecorder(): void {
  const frames: RecordedFrame[] = [];
  Object.defineProperty(window, '__e2eSse', {value: frames});
  // eslint-disable-next-line @typescript-eslint/unbound-method -- вызывается только через call/apply с this потока
  const nativeAdd = EventSource.prototype.addEventListener;
  const recorded = new WeakMap<EventSource, Set<string>>();

  // Подмена метода прототипа: у addEventListener перегрузки, поэтому через
  // defineProperty, а не присваиванием.
  Object.defineProperty(EventSource.prototype, 'addEventListener', {
    configurable: true,
    writable: true,
    value: function (this: EventSource, ...args: unknown[]): void {
      const [type] = args;
      const types = recorded.get(this) ?? new Set<string>();
      recorded.set(this, types);
      if (typeof type === 'string' && !types.has(type)) {
        types.add(type);
        // Запись — раньше слушателя приложения: кадр сохраняется, даже если
        // приложение на нём упадёт.
        nativeAdd.call(this, type, (event: Event) => {
          if (event instanceof MessageEvent && typeof event.data === 'string') {
            let data: unknown = event.data;
            try {
              data = JSON.parse(event.data);
            } catch {
              // Не JSON — сохраняем строкой.
            }
            frames.push({url: this.url, type, data});
          }
        });
      }
      Reflect.apply(nativeAdd, this, args);
    },
  });
}

/** Включает запись SSE во всех страницах контекста. */
export async function recordEventStreams(
  context: BrowserContext,
): Promise<void> {
  await context.addInitScript(installRecorder);
}

/** Кадры, полученные страницей с начала записи. */
export async function readFrames(page: Page): Promise<RecordedFrame[]> {
  return page.evaluate(() => {
    // Поле ставит installRecorder; без записи (гость без потоков) — пусто.
    const recorder = window as RecorderWindow;
    return recorder.__e2eSse?.slice() ?? [];
  });
}
