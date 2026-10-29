import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@qgames/ui/components/Tooltip';
import type {ReactElement} from 'react';

export interface WithHintProps {
  /** Текст подсказки; null — подсказки нет, элемент выводится как есть. */
  hint: string | null;
  children: ReactElement;
}

/**
 * Подсказка при наведении и фокусе. Триггер — обёртка, а не сам элемент:
 * заблокированная кнопка не получает событий мыши и фокуса, поэтому подсказка
 * «почему недоступно» вешается на `span` вокруг неё.
 */
export function WithHint({hint, children}: WithHintProps) {
  if (hint === null) {
    return children;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
