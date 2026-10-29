import type {GameCode, GameLoader} from '../model/registry';
import type {GameModule} from '../model/types';

const loading = new Map<GameCode, Promise<GameModule>>();

/**
 * Один промис на игру — для `use()` внутри `Suspense`. Повторный вызов
 * возвращает тот же промис, поэтому чанк грузится один раз.
 */
export function loadGameModule(
  code: GameCode,
  load: GameLoader,
): Promise<GameModule> {
  let promise = loading.get(code);
  if (promise === undefined) {
    promise = load();
    // Неудачную загрузку (например, сеть) можно повторить.
    promise.catch(() => loading.delete(code));
    loading.set(code, promise);
  }
  return promise;
}
