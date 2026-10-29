import {cn} from '@qgames/ui/lib/utils';
import {Cat, Dog, User} from 'lucide-react';

/** Аватары из набора, определённого на фронте (контракт: `CAT | DOG`). */
export type PlayerAvatarKind = 'CAT' | 'DOG';

const AVATAR_ICONS = {CAT: Cat, DOG: Dog} as const;

export const AVATAR_LABELS: Record<PlayerAvatarKind, string> = {
  CAT: 'Кот',
  DOG: 'Пёс',
};

export interface PlayerAvatarProps {
  avatar: PlayerAvatarKind | null;
  className?: string;
}

/** Аватар игрока; без аватара — нейтральная иконка. */
export function PlayerAvatar({avatar, className}: PlayerAvatarProps) {
  const Icon = avatar === null ? User : AVATAR_ICONS[avatar];
  return (
    <span
      role="img"
      aria-label={avatar === null ? 'Без аватара' : AVATAR_LABELS[avatar]}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted',
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

export const PLAYER_AVATARS: readonly PlayerAvatarKind[] = ['CAT', 'DOG'];
