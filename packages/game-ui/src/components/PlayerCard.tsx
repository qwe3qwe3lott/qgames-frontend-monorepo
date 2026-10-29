import {cn} from '@qgames/ui/lib/utils';
import type {ReactNode} from 'react';

import {PlayerAvatar, type PlayerAvatarKind} from './PlayerAvatar';
import {testIds} from './PlayerCard.testIds';

export interface PlayerCardProps {
  id: string;
  name: string;
  avatar: PlayerAvatarKind | null;
  /** Пометки рядом с именем: «Владелец», «Вы», цвет в партии. */
  badges?: readonly string[];
  /** Игрок сейчас ходит; карточка подсвечивается. */
  active?: boolean;
  /** Строка под именем, например «Предлагает ничью». */
  note?: ReactNode;
  /** Состояние игрока в партии справа, например его часы. */
  status?: ReactNode;
  /** Действия над участником справа, например «Исключить». */
  actions?: ReactNode;
}

/**
 * Карточка игрока в списке. Игра подставляет свою реализацию поверх этой:
 * дописывает пометки, подсветку, `note` и `status` из состояния партии.
 */
export function PlayerCard({
  id,
  name,
  avatar,
  badges = [],
  active = false,
  note,
  status,
  actions,
}: PlayerCardProps) {
  return (
    <li
      data-testid={testIds.root}
      data-user-id={id}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
        active && 'border-primary bg-primary/10',
      )}
    >
      <PlayerAvatar avatar={avatar} />
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn('truncate', active && 'font-medium')}>
            {name}
          </span>
          {badges.map(badge => (
            <span
              key={badge}
              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
        {note === undefined ? null : <div className="text-xs">{note}</div>}
      </div>
      {status === undefined && actions === undefined ? null : (
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {status}
          {actions}
        </span>
      )}
    </li>
  );
}
