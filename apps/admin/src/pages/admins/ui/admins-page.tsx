import {errorMessage} from '@qgames/api';
import {useGetAdmins} from '@qgames/api/admin-gateway';
import type {AdminResponse} from '@qgames/api/admin-gateway/model';
import {Button} from '@qgames/ui/components/button';
import {PageLayout} from '@qgames/ui/components/page-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@qgames/ui/components/table';

import {useCurrentAdmin} from '@/entities/admin';

const TITLE = 'Администраторы';

const CREATED_AT_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface AdminRowProps {
  admin: AdminResponse;
  isCurrent: boolean;
}

function AdminRow({admin, isCurrent}: AdminRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {admin.login}
        {isCurrent ? (
          <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
            вы
          </span>
        ) : null}
      </TableCell>
      <TableCell>
        <time dateTime={admin.createdAt}>
          {CREATED_AT_FORMAT.format(new Date(admin.createdAt))}
        </time>
      </TableCell>
    </TableRow>
  );
}

/** Все администраторы из `GET /api/admins` (по дате создания). */
export function AdminsPage() {
  const current = useCurrentAdmin();
  const {data, error, isPending, isFetching, refetch} = useGetAdmins();

  if (isPending) {
    return (
      <PageLayout title={TITLE}>
        <p className="text-muted-foreground">Загружаем администраторов…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout title={TITLE}>
        <div className="flex flex-col items-start gap-3" role="alert">
          <p className="text-destructive">{errorMessage(error)}</p>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            Повторить
          </Button>
        </div>
      </PageLayout>
    );
  }

  const currentId = current.status === 'admin' ? current.admin.id : undefined;

  return (
    <PageLayout title={TITLE}>
      {data.admins.length === 0 ? (
        <p className="text-muted-foreground">Администраторов нет.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Логин</TableHead>
              <TableHead>Создан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.admins.map(admin => (
              <AdminRow
                key={admin.id}
                admin={admin}
                isCurrent={admin.id === currentId}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </PageLayout>
  );
}
