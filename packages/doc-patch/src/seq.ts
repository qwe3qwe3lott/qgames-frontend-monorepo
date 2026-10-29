/**
 * Сверка seq события потока с последним применённым: `next` — применить,
 * `duplicate` — уже применено (отбросить), `gap` — событие потеряно
 * (переподключиться за свежим снапшотом).
 */
export type SeqCheck = 'next' | 'duplicate' | 'gap';

export function checkSeq(lastSeq: number, seq: number): SeqCheck {
  if (seq <= lastSeq) {
    return 'duplicate';
  }
  return seq === lastSeq + 1 ? 'next' : 'gap';
}
