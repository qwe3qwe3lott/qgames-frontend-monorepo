import {cn} from '@qgames/ui/lib/utils';
import {Cat, Crown, Dog, User} from 'lucide-react';

/** Аватары из набора, определённого на фронте (контракт: `CAT | DOG`). */
export type PlayerAvatarKind = 'CAT' | 'DOG';

const AVATAR_ICONS = {CAT: Cat, DOG: Dog} as const;

export const AVATAR_LABELS: Record<PlayerAvatarKind, string> = {
  CAT: 'Кот',
  DOG: 'Пёс',
};

export interface PlayerAvatarProps {
  avatar: PlayerAvatarKind | null;
  /** Владелец комнаты: корона на аватаре. */
  owner?: boolean;
  /** Сам пользователь: аватар обведён. */
  self?: boolean;
  className?: string;
}

/** Аватар игрока; без аватара — нейтральная иконка. */
export function PlayerAvatar({
  avatar,
  owner = false,
  self = false,
  className,
}: PlayerAvatarProps) {
  const Icon = avatar === null ? User : AVATAR_ICONS[avatar];
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        role="img"
        aria-label={avatar === null ? 'Без аватара' : AVATAR_LABELS[avatar]}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-full bg-muted',
          self && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      {owner ? (
        <Crown
          role="img"
          aria-label="Владелец"
          className="absolute -top-2 -right-1.5 size-4 rotate-12 fill-amber-400 text-amber-600"
        />
      ) : null}
    </span>
  );
}

export const PLAYER_AVATARS: readonly PlayerAvatarKind[] = ['CAT', 'DOG'];
