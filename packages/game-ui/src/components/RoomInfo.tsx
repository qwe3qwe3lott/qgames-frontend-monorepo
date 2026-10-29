import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@qgames/ui/components/Card';
import type {ReactNode} from 'react';

export interface RoomInfoRow {
  label: string;
  value: string;
}

export interface RoomInfoProps {
  gameTitle: string;
  /** Статус комнаты в человекочитаемом виде («Ожидание», «Идёт партия»). */
  status: string;
  playersCount: number;
  minPlayers: number;
  maxPlayers: number;
  /** Дополнительные строки описания. */
  rows?: readonly RoomInfoRow[];
  /** Блок под строками описания, например пометка о продвинутых правилах. */
  details?: ReactNode;
  /** Действия с комнатой (вход, роли, старт партии). */
  actions?: ReactNode;
}

/** Описание комнаты: игра, статус, заполненность. */
export function RoomInfo({
  gameTitle,
  status,
  playersCount,
  minPlayers,
  maxPlayers,
  rows = [],
  details,
  actions,
}: RoomInfoProps) {
  const playersRange =
    minPlayers === maxPlayers
      ? String(maxPlayers)
      : `${String(minPlayers)}–${String(maxPlayers)}`;
  const allRows: readonly RoomInfoRow[] = [
    {label: 'Статус', value: status},
    {label: 'Игроки', value: `${String(playersCount)} (нужно ${playersRange})`},
    ...rows,
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{gameTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {allRows.map(row => (
            <div key={row.label} className="contents">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {details}
        {actions === undefined ? null : (
          <div className="flex flex-wrap gap-2">{actions}</div>
        )}
      </CardContent>
    </Card>
  );
}
