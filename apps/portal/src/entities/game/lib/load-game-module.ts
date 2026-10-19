import type {GameApi, GameCode} from '../model/registry';
import type {GameModule} from '../model/types';

const loading = new Map<GameCode, Promise<GameModule>>();

/**
 * Один промис на игру — для `use()` внутри `Suspense`. Повторный вызов
 * возвращает тот же промис, поэтому чанк грузится один раз.
 */
export function loadGameModule(api: GameApi): Promise<GameModule> {
  let promise = loading.get(api.gameCode);
  if (promise === undefined) {
    promise = api.load();
    // Неудачную загрузку (например, сеть) можно повторить.
    promise.catch(() => loading.delete(api.gameCode));
    loading.set(api.gameCode, promise);
  }
  return promise;
}
