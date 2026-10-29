import type {RecordedFrame} from '../core/sseRecorder';
import type {Frame} from './schema';

/** Заглушка изменчивого времени в ожидаемых кадрах. */
export const TIME = '$time';

/**
 * Поля времени, значения которых меняются от прогона к прогону: время события
 * и сервера, дедлайн и пауза таймера, остаток часов.
 */
const TIME_KEYS: ReadonlySet<string> = new Set([
  'at',
  'serverTime',
  'deadline',
  'pausedAt',
  'remainingMs',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Патч `{path, value}` с последним сегментом пути — полем времени. */
function isTimePatch(value: Record<string, unknown>): boolean {
  const {path} = value;
  if (!Array.isArray(path) || !('value' in value)) {
    return false;
  }
  const last: unknown = path.at(-1);
  return typeof last === 'string' && TIME_KEYS.has(last);
}

function normalizeValue(
  value: unknown,
  ids: ReadonlyMap<string, string>,
): unknown {
  if (typeof value === 'string') {
    return ids.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item, ids));
  }
  if (!isRecord(value)) {
    return value;
  }
  const timePatch = isTimePatch(value);
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const time =
      item !== null && (TIME_KEYS.has(key) || (timePatch && key === 'value'));
    result[key] = time ? TIME : normalizeValue(item, ids);
  }
  return result;
}

/**
 * Кадр для сравнения с файлом: id (пользователей, комнаты, партии) заменены
 * подстановками `{{…}}`, время — `$time`.
 */
export function normalizeFrame(
  frame: RecordedFrame,
  ids: ReadonlyMap<string, string>,
): Frame {
  return {type: frame.type, data: normalizeValue(frame.data, ids)};
}

/** seq кадра (у снапшота и событий партии он есть). */
export function frameSeq(frame: Frame): number | null {
  const {data} = frame;
  return isRecord(data) && typeof data['seq'] === 'number' ? data['seq'] : null;
}
