export interface TurnIndicatorProps {
  /** Номер раунда; нет — игра без раундов, показывается только чей ход. */
  round?: number | undefined;
  totalRounds?: number | undefined;
  playerName: string;
}

/** Текущий раунд (если он есть у игры) и игрок, который ходит. */
export function TurnIndicator({
  round,
  totalRounds,
  playerName,
}: TurnIndicatorProps) {
  if (round === undefined) {
    return (
      <p className="text-lg" aria-live="polite">
        Ходит <span className="font-semibold">{playerName}</span>
      </p>
    );
  }
  const roundText =
    totalRounds === undefined
      ? `Раунд ${String(round)}`
      : `Раунд ${String(round)} из ${String(totalRounds)}`;
  return (
    <p className="text-lg" aria-live="polite">
      {roundText} · ходит <span className="font-semibold">{playerName}</span>
    </p>
  );
}
