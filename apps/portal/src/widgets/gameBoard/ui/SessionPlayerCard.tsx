import {
  PlayerCard,
  type PlayerCardProps,
} from '@qgames/game-ui/components/PlayerCard';
import {createContext, Suspense, use, type ReactNode} from 'react';

import {loadGameModule, type GameEntry, type GameLoader} from '@/entities/game';
import type {RoomView} from '@/entities/room';
import {useSession} from '@/entities/session';

import {ChunkErrorBoundary} from './ChunkErrorBoundary';

interface GameSession {
  game: GameEntry;
  room: RoomView;
  viewerId: string;
}

const GameSessionContext = createContext<GameSession | null>(null);

export interface GameSessionProviderProps extends GameSession {
  children: ReactNode;
}

/** Партия комнаты для карточек игроков (`SessionPlayerCard`) внутри провайдера. */
export function GameSessionProvider({
  game,
  room,
  viewerId,
  children,
}: GameSessionProviderProps) {
  return (
    <GameSessionContext value={{game, room, viewerId}}>
      {children}
    </GameSessionContext>
  );
}

function GameCard({
  card,
  load,
  room,
  sessionId,
  viewerId,
}: {
  card: PlayerCardProps;
  load: GameLoader;
  room: RoomView;
  sessionId: string;
  viewerId: string;
}) {
  // Тот же промис, что у доски: чанк игры грузится один раз.
  const module = use(loadGameModule(room.gameCode, load));
  const session = useSession(sessionId);
  if (session === undefined || module.PlayerCard === undefined) {
    return <PlayerCard {...card} />;
  }
  return (
    <module.PlayerCard session={session} viewerId={viewerId} card={card} />
  );
}

/**
 * Карточка игрока для списка игроков комнаты: в партии — карточка игры из её
 * чанка, иначе (нет партии или пакета игры, чанк грузится или не загрузился) —
 * базовая. Партию берёт из `GameSessionProvider`.
 */
export function SessionPlayerCard(card: PlayerCardProps) {
  const context = use(GameSessionContext);
  const load = context?.game.load;
  const session = context?.room.session ?? null;
  if (context === null || load === undefined || session === null) {
    return <PlayerCard {...card} />;
  }
  const fallback = <PlayerCard {...card} />;
  return (
    <ChunkErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GameCard
          card={card}
          load={load}
          room={context.room}
          sessionId={session.id}
          viewerId={context.viewerId}
        />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
