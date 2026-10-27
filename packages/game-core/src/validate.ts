import {SessionMetaDto, SessionSnapshotDto} from '@qgames/api/portal/zod';

import {isRecord} from './lib/json';
import {isCoreState} from './core';
import type {SessionDocument, SessionMeta, SessionState} from './session';

/**
 * Что игра объявляет о своём состоянии (как `GameRules` на бэкенде): guard
 * своих игровых полей. Блоки core есть у каждой игры и проверяются общим
 * guard'ом.
 */
export interface GameStateRules {
  /** Guard только игровых полей состояния (не блоков core). */
  isGameState: (state: SessionState) => boolean;
}

/**
 * Состояние партии по схемам контракта: блоки core и игровые поля. Каждый
 * guard проверяет только свою часть.
 */
export function checkSessionState(
  state: SessionState,
  rules: GameStateRules,
): boolean {
  return isCoreState(state) && rules.isGameState(state);
}

/**
 * Служебная часть документа партии: `status` и `meta` — общей схемой контракта.
 * `meta.advancedRules` зависит от игры и здесь не разбирается — его проверяет guard
 * игры.
 */
const DocumentHeadSchema = SessionSnapshotDto.pick({status: true}).extend({
  meta: SessionMetaDto.omit({advancedRules: true}),
});

/**
 * Документ партии после применения события (`applySessionEvent` возвращает
 * JSON без типа): `status` и `meta` (кроме `advancedRules`) — общей схемой,
 * состояние — guard'ами core и игры (`checkSessionState`). null — документ
 * не по контракту (рассинхронизация, нужен свежий снапшот).
 */
export function parseSessionDocument(
  value: unknown,
  rules: GameStateRules,
): SessionDocument | null {
  if (!isRecord(value)) {
    return null;
  }
  const head = DocumentHeadSchema.safeParse(value);
  const rawMeta = value['meta'];
  const state = value['state'];
  if (
    !head.success ||
    !isRecord(rawMeta) ||
    !isRecord(state) ||
    !checkSessionState(state, rules)
  ) {
    return null;
  }
  // Схема отбрасывает неизвестные ключи: advancedRules переносится как есть.
  const meta: SessionMeta = Object.hasOwn(rawMeta, 'advancedRules')
    ? {...head.data.meta, advancedRules: rawMeta['advancedRules']}
    : head.data.meta;
  return {status: head.data.status, meta, state};
}
