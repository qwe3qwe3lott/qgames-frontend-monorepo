import {
  PlayerList,
  type PlayerListItem,
} from '@qgames/game-ui/components/player-list';
import {RoomInfo} from '@qgames/game-ui/components/room-info';

import type {GameInfo} from '@/entities/game';
import {
  memberName,
  ROOM_STATUS_LABELS,
  roomSettingsRows,
  type Membership,
  type RoomMemberView,
  type RoomView,
} from '@/entities/room';
import {DeleteRoomButton} from '@/features/delete-room';
import {RoomSettingsDialog} from '@/features/edit-room-settings';
import {ChangeRoleButton} from '@/features/room-membership';
import {SessionActions} from '@/features/room-session';

export interface RoomPanelProps {
  game: GameInfo;
  room: RoomView;
  membership: Membership;
  viewerId: string;
}

function toListItem(member: RoomMemberView, viewerId: string): PlayerListItem {
  const badges: string[] = [];
  if (member.userId === viewerId) {
    badges.push('Вы');
  }
  if (member.owner) {
    badges.push('Владелец');
  }
  if (member.leaving) {
    badges.push('отошёл');
  }
  return {
    id: member.userId,
    name: memberName(member),
    avatar: member.avatar,
    badges,
  };
}

/** Описание и настройки комнаты, участники по ролям и действия пользователя. */
export function RoomPanel({game, room, membership, viewerId}: RoomPanelProps) {
  const players = room.members.filter(m => m.role === 'PLAYER');
  const spectators = room.members.filter(m => m.role === 'SPECTATOR');

  return (
    <aside className="flex flex-col gap-4">
      <RoomInfo
        gameTitle={game.title}
        status={ROOM_STATUS_LABELS[room.status]}
        playersCount={membership.playersCount}
        minPlayers={room.minPlayers}
        maxPlayers={room.maxPlayers}
        rows={roomSettingsRows(room.settings)}
        actions={
          <>
            <SessionActions room={room} membership={membership} />
            {game.api === null ? null : (
              <RoomSettingsDialog
                api={game.api}
                room={room}
                membership={membership}
              />
            )}
            <DeleteRoomButton
              room={room}
              membership={membership}
              gameCode={game.code}
            />
          </>
        }
      />
      <PlayerList
        players={players.map(m => toListItem(m, viewerId))}
        title={`Игроки (${String(players.length)}/${String(room.maxPlayers)})`}
        action={
          <ChangeRoleButton room={room} membership={membership} role="PLAYER" />
        }
      />
      <PlayerList
        players={spectators.map(m => toListItem(m, viewerId))}
        title="Наблюдатели"
        action={
          <ChangeRoleButton
            room={room}
            membership={membership}
            role="SPECTATOR"
          />
        }
      />
    </aside>
  );
}
