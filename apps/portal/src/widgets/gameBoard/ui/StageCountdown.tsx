import {activeTimer, stageClock, type SessionData} from '@qgames/game-core';
import {Clock} from '@qgames/game-ui/components/Clock';

import {testIds} from './StageCountdown.testIds';

/**
 * Общий отсчёт стадии, где ходят сразу несколько игроков (`timer.kind =
 * STAGE`), — над доской, а не в карточке игрока. У часов игроков и без
 * таймера ничего не показывает.
 */
export function StageCountdown({session}: {session: SessionData}) {
  const timer = activeTimer(session);
  const clock = timer === null ? null : stageClock(timer);
  if (clock === null) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 text-sm" data-testid={testIds.root}>
      <span className="text-muted-foreground">
        {clock.paused ? 'Время этапа (пауза)' : 'Время этапа'}
      </span>
      <Clock clock={clock} clockOffsetMs={session.clockOffsetMs} />
    </div>
  );
}
