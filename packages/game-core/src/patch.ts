import type {PathSegmentOutput} from '@qgames/api/portal/zod';

import {isRecord} from './lib/json';
import type {SessionDocument, SessionLogEvent} from './session';

/**
 * Итог применения события: новый документ или причина, по которой событие не
 * применилось (путь не найден, неподходящий тип узла). При ошибке клиент
 * переподключается за свежим снапшотом. Документ — JSON без типа: его форму
 * проверяет `parseSessionDocument` (guard'ы core и игры).
 */
export type ApplySessionEventResult =
  {ok: true; document: unknown} | {ok: false; error: string};

/** Ошибка применения патча: путь или тип узла не совпали с документом. */
class PatchPathError extends Error {}

/** Пометка «удалить узел» из операции над листом пути. */
const REMOVE = Symbol('remove');

/**
 * Операция над листом пути: получает текущее значение (`exists` — есть ли
 * оно) и возвращает новое или `REMOVE`.
 */
type LeafOperation = (current: unknown, exists: boolean) => unknown;

function describe(segment: PathSegmentOutput): string {
  return typeof segment === 'string' ? segment : `{id: ${segment.id}}`;
}

/**
 * Неизменяемое обновление узла по пути: копируются только узлы на пути, всё
 * остальное переиспользуется. Промежуточные узлы должны существовать; лист
 * может отсутствовать — решает операция.
 */
function updateAt(
  node: unknown,
  path: readonly PathSegmentOutput[],
  leaf: LeafOperation,
): unknown {
  const [segment, ...rest] = path;
  if (segment === undefined) {
    return leaf(node, true);
  }
  const last = rest.length === 0;

  if (typeof segment === 'string') {
    if (!isRecord(node)) {
      throw new PatchPathError(`ключ ${segment}: узел не объект`);
    }
    const exists = Object.hasOwn(node, segment);
    if (!exists && !last) {
      throw new PatchPathError(`ключ ${segment} не найден`);
    }
    const next = last
      ? leaf(node[segment], exists)
      : updateAt(node[segment], rest, leaf);
    if (next === REMOVE) {
      return Object.fromEntries(
        Object.entries(node).filter(([key]) => key !== segment),
      );
    }
    return {...node, [segment]: next};
  }

  if (!Array.isArray(node)) {
    throw new PatchPathError(`${describe(segment)}: узел не массив`);
  }
  const items: readonly unknown[] = node;
  const index = items.findIndex(
    item => isRecord(item) && item['id'] === segment.id,
  );
  if (index === -1) {
    if (!last) {
      throw new PatchPathError(`${describe(segment)} не найден`);
    }
    // Нет элемента с таким id: операция решает, можно ли его создать (PUT —
    // добавить в конец массива, как `SessionPatch` бэкенда).
    const created = leaf(undefined, false);
    if (created === REMOVE) {
      throw new PatchPathError(`${describe(segment)} не найден`);
    }
    // Иначе адресация по {id} молча сломается: схема требует id, но не его
    // совпадения с путём.
    if (!isRecord(created) || created['id'] !== segment.id) {
      throw new PatchPathError(
        `${describe(segment)}: новый элемент должен быть объектом с тем же id`,
      );
    }
    return [...items, created];
  }
  const next = last
    ? leaf(items[index], true)
    : updateAt(items[index], rest, leaf);
  return next === REMOVE
    ? items.filter((_, i) => i !== index)
    : items.map((item, i) => (i === index ? next : item));
}

/** Операция над листом пути по методу события (кроме INFO). */
function leafOperation(
  event: Exclude<SessionLogEvent, {method: 'INFO'}>,
): LeafOperation {
  switch (event.method) {
    case 'PUT': {
      const {value} = event.data;
      return () => {
        // value обязателен по контракту (может быть null), но Zod `unknown()`
        // пропускает и отсутствующий ключ: отсутствие — сообщение не по
        // контракту.
        if (value === undefined) {
          throw new PatchPathError('PUT без value');
        }
        return value;
      };
    }
    case 'PATCH': {
      const {value} = event.data;
      return (current, exists) => {
        if (!exists) {
          throw new PatchPathError('PATCH: путь не найден');
        }
        if (!isRecord(current)) {
          throw new PatchPathError('PATCH: узел не объект');
        }
        return {...current, ...value};
      };
    }
    case 'DELETE':
      return (_, exists) => {
        if (!exists) {
          throw new PatchPathError('DELETE: путь не найден');
        }
        return REMOVE;
      };
  }
}

/**
 * Применяет событие журнала к документу партии `{status, meta, state}` — чистая
 * функция, документ не меняется:
 * - `PUT {path, value}` — заменить или создать значение по пути; `{id}` в конце
 *   пути, которого нет, — добавить элемент в конец массива;
 * - `PATCH {path, value}` — неглубокое слияние объекта по пути с `value`
 *   (`null` — значение), путь должен существовать;
 * - `DELETE {path}` — удалить поле объекта или элемент массива по id, путь
 *   должен существовать;
 * - `INFO` — документ не меняется.
 *
 * Путь — сегменты от корня документа: строка — ключ объекта, `{id}` — элемент
 * массива с этим id. `code` события на применение не влияет. seq не сверяется
 * (`checkSeq`), форма документа не проверяется (`parseSessionDocument`).
 */
export function applySessionEvent(
  document: SessionDocument,
  event: SessionLogEvent,
): ApplySessionEventResult {
  if (event.method === 'INFO') {
    return {ok: true, document};
  }
  let next: unknown;
  try {
    next = updateAt(document, event.data.path, leafOperation(event));
  } catch (error) {
    if (error instanceof PatchPathError) {
      return {
        ok: false,
        error: `${event.method} ${event.code}: ${error.message}`,
      };
    }
    throw error;
  }
  return next === REMOVE
    ? {ok: false, error: `${event.method} ${event.code}: удаление корня`}
    : {ok: true, document: next};
}
