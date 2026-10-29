import type {ComponentType, ReactNode} from 'react';

import {PlayerCard, type PlayerCardProps} from './PlayerCard';
import {testIds} from './PlayerList.testIds';

export type PlayerListItem = PlayerCardProps;

export interface PlayerListProps {
  players: readonly PlayerListItem[];
  title?: string;
  /** Действие в заголовке списка, например переход в этот список. */
  action?: ReactNode;
  /** Реализация карточки игрока, например от игры; по умолчанию — базовая. */
  Card?: ComponentType<PlayerCardProps>;
}

/** Список игроков комнаты. Карточку игрока рисует переданный `Card`. */
export function PlayerList({
  players,
  title = 'Игроки',
  action,
  Card = PlayerCard,
}: PlayerListProps) {
  return (
    <section className="flex flex-col gap-2" data-testid={testIds.root}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {action}
      </div>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">Никого нет</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {players.map(player => (
            <Card key={player.id} {...player} />
          ))}
        </ul>
      )}
    </section>
  );
}
