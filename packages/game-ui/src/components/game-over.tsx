import type {ReactNode} from 'react';

/** Итог партии для экрана окончания: победа (с именами победителей) или ничья. */
export type GameOverResult =
  {outcome: 'WIN'; winnerNames: readonly string[]} | {outcome: 'DRAW'};

export interface GameOverProps {
  title?: string | undefined;
  /** Итог партии; нет — партия без итога (например, отменена). */
  result?: GameOverResult | undefined;
  /** Пояснение: причина окончания (текст передаёт игра) или описание партии. */
  description?: string | undefined;
  /** Действие после партии, например «Сыграть ещё раз». */
  action?: ReactNode;
}

function resultText(result: GameOverResult): string {
  if (result.outcome === 'DRAW') {
    return 'Ничья';
  }
  if (result.winnerNames.length === 0) {
    return 'Победа';
  }
  const names = result.winnerNames.join(', ');
  return result.winnerNames.length > 1
    ? `Победители: ${names}`
    : `Победитель: ${names}`;
}

/** Экран окончания партии: заголовок, итог и причина окончания. */
export function GameOver({
  title = 'Игра окончена',
  result,
  description,
  action,
}: GameOverProps) {
  return (
    <section className="flex flex-col items-start gap-3" aria-live="polite">
      <h2 className="text-2xl font-bold">{title}</h2>
      {result === undefined ? null : (
        <p className="text-lg font-semibold">{resultText(result)}</p>
      )}
      {description === undefined ? null : (
        <p className="text-muted-foreground">{description}</p>
      )}
      {action}
    </section>
  );
}
