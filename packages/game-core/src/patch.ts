import {applyPatch, type ApplyPatchResult} from '@qgames/doc-patch';

import type {SessionDocument, SessionLogEvent} from './session';

/**
 * Итог применения события: новый документ или причина, по которой событие не
 * применилось. Документ — JSON без типа: его форму проверяет
 * `parseSessionDocument` (guard'ы core и игры).
 */
export type ApplySessionEventResult = ApplyPatchResult;

/**
 * Применяет событие журнала к документу партии `{status, meta, state}` общим
 * применителем патчей (`applyPatch` из `@qgames/doc-patch`, семантика — как у
 * `DocumentPatch` бэкенда). seq не сверяется (`checkSeq`), форма документа не
 * проверяется (`parseSessionDocument`).
 */
export function applySessionEvent(
  document: SessionDocument,
  event: SessionLogEvent,
): ApplySessionEventResult {
  return applyPatch(document, event);
}
