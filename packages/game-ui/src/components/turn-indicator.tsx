export interface TurnIndicatorProps {
  round: number;
  totalRounds?: number | undefined;
  playerName: string;
}

/** Текущий раунд и игрок, который ходит. */
export function TurnIndicator({
  round,
  totalRounds,
  playerName,
}: TurnIndicatorProps) {
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
