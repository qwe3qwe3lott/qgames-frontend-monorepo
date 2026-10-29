// События-патчи документов потоков (партия, комната): общий применитель с той же
// семантикой, что у DocumentPatch бэкенда, и сверка seq. Только чистые функции.

export {
  applyPatch,
  type ApplyPatchResult,
  type PatchEvent,
  type PathSegment,
} from './patch';
export {checkSeq, type SeqCheck} from './seq';
