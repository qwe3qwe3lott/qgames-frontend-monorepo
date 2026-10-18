import type {ReactNode} from 'react';

export interface GameOverProps {
  title?: string | undefined;
  description?: string | undefined;
  /** Действие после партии, например «Сыграть ещё раз». */
  action?: ReactNode;
}

/** Экран окончания партии. */
export function GameOver({
  title = 'Игра окончена',
  description,
  action,
}: GameOverProps) {
  return (
    <section className="flex flex-col items-start gap-3" aria-live="polite">
      <h2 className="text-2xl font-bold">{title}</h2>
      {description === undefined ? null : (
        <p className="text-muted-foreground">{description}</p>
      )}
      {action}
    </section>
  );
}
