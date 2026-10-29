import type {RoomSettingsDto} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/Dialog';

import {advancedSettingsRows} from '../lib/settingsLabels';
import {testIds} from './AdvancedRulesDialog.testIds';

export interface AdvancedRulesDialogProps {
  settings: RoomSettingsDto;
}

/**
 * Пометка «Выбраны продвинутые правила» со ссылкой «Подробнее…»: по ней
 * открывается список текущих продвинутых правил комнаты (только просмотр).
 */
export function AdvancedRulesDialog({settings}: AdvancedRulesDialogProps) {
  const rows = advancedSettingsRows(settings);
  return (
    <Dialog>
      <p
        className="flex flex-wrap items-baseline gap-x-2 text-sm"
        data-testid={testIds.summary}
      >
        <span>Выбраны продвинутые правила</span>
        <DialogTrigger asChild>
          <Button
            variant="link"
            className="h-auto p-0"
            data-testid={testIds.open}
          >
            Подробнее…
          </Button>
        </DialogTrigger>
      </p>
      <DialogContent data-testid={testIds.dialog}>
        <DialogHeader>
          <DialogTitle>Продвинутые правила</DialogTitle>
          <DialogDescription>
            Текущие правила игры в этой комнате.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          {rows.map(row => (
            <div
              key={row.label}
              className="contents"
              data-testid={testIds.row}
              data-label={row.label}
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
