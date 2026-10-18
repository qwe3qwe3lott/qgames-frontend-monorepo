import {cn} from '@qgames/ui/lib/utils';

import {PlayerAvatar, type PlayerAvatarKind} from './player-avatar';

export interface PlayerListItem {
  id: string;
  name: string;
  avatar: PlayerAvatarKind | null;
  /** Пометки рядом с именем: «Владелец», «Вы», «Наблюдатель». */
  badges?: readonly string[];
}

export interface PlayerListProps {
  players: readonly PlayerListItem[];
  /** Игрок, который сейчас ходит; подсвечивается. */
  activePlayerId?: string | null;
  title?: string;
}

/** Список игроков комнаты или партии. */
export function PlayerList({
  players,
  activePlayerId = null,
  title = 'Игроки',
}: PlayerListProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">Никого нет</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {players.map(player => {
            const active = player.id === activePlayerId;
            return (
              <li
                key={player.id}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                  active && 'border-primary bg-primary/10 font-medium',
                )}
              >
                <PlayerAvatar avatar={player.avatar} />
                <span className="truncate">{player.name}</span>
                {(player.badges ?? []).map(badge => (
                  <span
                    key={badge}
                    className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
