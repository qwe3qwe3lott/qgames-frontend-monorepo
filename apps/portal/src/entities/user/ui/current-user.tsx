import {PlayerAvatar} from '@qgames/game-ui/components/player-avatar';

import type {Viewer} from '../model/types';

/** Аватар и ник текущего пользователя. */
export function CurrentUser({viewer}: {viewer: Viewer}) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <PlayerAvatar avatar={viewer.avatar} />
      <span className="max-w-40 truncate font-medium">{viewer.nickname}</span>
    </span>
  );
}
