import {activeTimer, isSessionOver, moveOptionsOf} from '@qgames/game-core';
import {Button} from '@qgames/ui/components/Button';
import {WithHint} from '@qgames/ui/components/WithHint';

import {COLOR_LABELS} from '../lib/labels';
import {
  PICK_COLOR,
  type CheckersColor,
  type CheckersColorPickSession,
} from '../state';
import type {BoardProps} from '../types';
import {testIds} from './ColorPick.testIds';

const COLORS: readonly CheckersColor[] = ['WHITE', 'BLACK'];
const PAUSED_HINT = 'Партия на паузе';

interface ColorPickProps extends Omit<BoardProps, 'session' | 'players'> {
  session: CheckersColorPickSession;
}

/**
 * Стадия выбора цвета: кто первым нажмёт свой цвет, получит его, соперник —
 * противоположный. Кнопки — только у игрока с вариантом `PICK_COLOR`;
 * общий отсчёт стадии портал показывает над доской.
 */
export function ColorPick({
  session,
  viewerId,
  onMove,
  movePending,
}: ColorPickProps) {
  const paused = activeTimer(session)?.paused ?? false;
  const canPick =
    !isSessionOver(session) &&
    !paused &&
    !movePending &&
    moveOptionsOf(session.state, viewerId).some(
      option => option.type === PICK_COLOR,
    );
  const isPlayer = session.state.players.some(player => player.id === viewerId);
  return (
    <div className="flex flex-col items-start gap-3" data-testid={testIds.root}>
      <p>
        {isPlayer
          ? 'Выберите цвет: кто выберет первым, получит его, сопернику достанется другой. Если никто не выберет, цвета распределятся случайно.'
          : 'Игроки выбирают цвета.'}
      </p>
      {isPlayer ? (
        <div className="flex gap-2">
          {COLORS.map(color => (
            <WithHint key={color} hint={paused ? PAUSED_HINT : null}>
              <Button
                disabled={!canPick}
                data-testid={testIds.pickButton}
                data-color={color}
                onClick={() => {
                  onMove({type: PICK_COLOR, data: {color}});
                }}
              >
                {COLOR_LABELS[color]}
              </Button>
            </WithHint>
          ))}
        </div>
      ) : null}
    </div>
  );
}
