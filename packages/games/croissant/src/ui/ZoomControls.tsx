import {Button} from '@qgames/ui/components/Button';
import {WithHint} from '@qgames/ui/components/WithHint';
import {LocateFixed, Minus, Plus} from 'lucide-react';
import {
  useControls,
  useTransformComponent,
  useTransformInit,
} from 'react-zoom-pan-pinch';

import {testIds} from './Board.testIds';

const ZOOM_STEP = 0.3;
const FIT_ANIMATION_MS = 200;

interface ZoomControlsProps {
  /** Показать всё поле: масштаб и центр по выложенным тайлам и свободным клеткам. */
  readonly onFit: (animationMs: number) => void;
}

/**
 * Кнопки масштаба поля; живут внутри `TransformWrapper` и берут его состояние из контекста. Стартовый вид («всё
 * поле») ставится здесь, а не в `onInit` обёртки: тот срабатывает раньше, чем счётчик масштаба подпишется на
 * изменения, и показал бы 100%.
 */
export function ZoomControls({onFit}: ZoomControlsProps) {
  const {zoomIn, zoomOut} = useControls();
  const scale = useTransformComponent(({state}) => state.scale);
  useTransformInit(() => {
    onFit(0);
  });

  return (
    <div className="flex flex-col items-center gap-1 rounded-md border bg-background/90 p-1 shadow-sm">
      <WithHint hint="Приблизить">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Приблизить"
          data-testid={testIds.zoomIn}
          onClick={() => {
            void zoomIn(ZOOM_STEP);
          }}
        >
          <Plus />
        </Button>
      </WithHint>
      <span className="text-xs text-muted-foreground tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <WithHint hint="Отдалить">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Отдалить"
          data-testid={testIds.zoomOut}
          onClick={() => {
            void zoomOut(ZOOM_STEP);
          }}
        >
          <Minus />
        </Button>
      </WithHint>
      <WithHint hint="Показать всё поле">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Показать всё поле"
          data-testid={testIds.zoomReset}
          onClick={() => {
            onFit(FIT_ANIMATION_MS);
          }}
        >
          <LocateFixed />
        </Button>
      </WithHint>
    </div>
  );
}
