import {
  PlayerList,
  type PlayerListItem,
} from '@qgames/game-ui/components/PlayerList';
import type {PlayerCardProps} from '@qgames/game-ui/components/PlayerCard';
import {RoomInfo} from '@qgames/game-ui/components/RoomInfo';
import type {ComponentType} from 'react';

import {
  memberName,
  ROOM_STATUS_LABELS,
  roomSettingsRows,
  type Membership,
  type RoomMemberView,
  type RoomView,
} from '@/entities/room';
import {RoomSettingsDialog} from '@/features/editRoomSettings';
import {
  ChangeRoleButton,
  KickMemberButton,
  TransferOwnershipButton,
} from '@/features/roomMembership';
import {SessionActions} from '@/features/roomSession';

import {testIds} from './RoomPanel.testIds';

export interface RoomPanelProps {
  /** Название игры из `GET /api/games/{gameCode}`. */
  gameTitle: string;
  room: RoomView;
  membership: Membership;
  viewerId: string;
  /**
   * Реализация карточки участника, например от игры идущей партии (часы,
   * цвет); по умолчанию — базовая. Панель про игры не знает.
   */
  playerCard?: ComponentType<PlayerCardProps>;
}

function toListItem(
  member: RoomMemberView,
  viewerId: string,
  room: RoomView,
  membership: Membership,
): PlayerListItem {
  const badges: string[] = [];
  if (member.id === viewerId) {
    badges.push('Вы');
  }
  if (member.id === room.ownerId) {
    badges.push('Владелец');
  }
  if (member.leaving) {
    badges.push('отошёл');
  }
  return {
    id: member.id,
    name: memberName(member),
    avatar: member.avatar,
    badges,
    actions: (
      <span className="flex">
        <TransferOwnershipButton
          room={room}
          membership={membership}
          member={member}
        />
        <KickMemberButton room={room} membership={membership} member={member} />
      </span>
    ),
  };
}

/** Описание и настройки комнаты, участники по ролям и действия пользователя. */
export function RoomPanel({
  gameTitle,
  room,
  membership,
  viewerId,
  playerCard,
}: RoomPanelProps) {
  // Без карточки PlayerList берёт базовую: пропс со значением undefined не передаём.
  const card = playerCard === undefined ? {} : {Card: playerCard};
  const players = room.members.filter(m => m.role === 'PLAYER');
  const spectators = room.members.filter(m => m.role === 'SPECTATOR');

  return (
    <aside className="flex flex-col gap-4" data-testid={testIds.root}>
      <RoomInfo
        gameTitle={gameTitle}
        status={ROOM_STATUS_LABELS[room.status]}
        playersCount={membership.playersCount}
        minPlayers={room.minPlayers}
        maxPlayers={room.maxPlayers}
        rows={roomSettingsRows(room.settings)}
        actions={
          <>
            <SessionActions room={room} membership={membership} />
            <RoomSettingsDialog room={room} membership={membership} />
          </>
        }
      />
      <div data-testid={testIds.players}>
        <PlayerList
          {...card}
          players={players.map(m => toListItem(m, viewerId, room, membership))}
          title={`Игроки (${String(players.length)}/${String(room.maxPlayers)})`}
          action={
            <ChangeRoleButton
              room={room}
              membership={membership}
              role="PLAYER"
            />
          }
        />
      </div>
      <div data-testid={testIds.spectators}>
        <PlayerList
          {...card}
          players={spectators.map(m =>
            toListItem(m, viewerId, room, membership),
          )}
          title={`Наблюдатели (${String(membership.spectatorsCount)}/${String(membership.maxSpectators)})`}
          action={
            <ChangeRoleButton
              room={room}
              membership={membership}
              role="SPECTATOR"
            />
          }
        />
      </div>
    </aside>
  );
}
