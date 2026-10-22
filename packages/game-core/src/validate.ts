import {SessionMetaDto, SessionSnapshotDto} from '@qgames/api/gateway/zod';

import {isRecord} from './lib/json';
import {isCoreBlock} from './modules/core';
import type {SessionModule} from './modules/module';
import type {SessionDocument, SessionMeta, SessionState} from './session';

/**
 * Что игра объявляет о своём состоянии (как `GameRules` на бэкенде): какие
 * модули-механики она использует и guard своих игровых полей. Модуль core
 * проверяется у каждой игры.
 */
export interface GameStateRules {
  /** Модули-механики игры (core, turns, timer, result); игра без таймера — без timer. */
  modules: readonly SessionModule[];
  /** Guard только игровых полей состояния (не блоков модулей). */
  isGameState: (state: SessionState) => boolean;
}

/**
 * Состояние партии по схемам контракта: блок core, блоки объявленных модулей
 * и игровые поля. Каждый guard проверяет только свой блок.
 */
export function checkSessionState(
  state: SessionState,
  rules: GameStateRules,
): boolean {
  return (
    isCoreBlock(state) &&
    rules.modules.every(module => module.isBlock(state)) &&
    rules.isGameState(state)
  );
}

/**
 * Служебная часть документа партии: `status` и `meta` — общей схемой контракта.
 * `meta.moveRules` зависит от игры и здесь не разбирается — его проверяет guard
 * игры.
 */
const DocumentHeadSchema = SessionSnapshotDto.pick({status: true}).extend({
  meta: SessionMetaDto.omit({moveRules: true}),
});

/**
 * Документ партии после применения события (`applySessionEvent` возвращает
 * JSON без типа): `status` и `meta` (кроме `moveRules`) — общей схемой,
 * состояние — guard'ами модулей и игры (`checkSessionState`). null — документ
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
  // Схема отбрасывает неизвестные ключи: moveRules переносится как есть.
  const meta: SessionMeta = Object.hasOwn(rawMeta, 'moveRules')
    ? {...head.data.meta, moveRules: rawMeta['moveRules']}
    : head.data.meta;
  return {status: head.data.status, meta, state};
}
