import {Button} from '@qgames/ui/components/Button';
import {PageLayout} from '@qgames/ui/components/PageLayout';
import {useState} from 'react';

import {AuthDialog} from '@/features/auth';

/**
 * Гость открыл страницу авторизованной зоны (например, по ссылке на комнату): сразу
 * открывается окно входа, адрес не меняется. После входа маршрут перезагружается
 * и показывает саму страницу.
 */
export function AuthRequiredPage() {
  const [open, setOpen] = useState(true);

  return (
    <PageLayout title="Нужен вход">
      <p className="text-muted-foreground">
        Войдите или зарегистрируйтесь, чтобы открыть эту страницу.
      </p>
      <Button
        className="self-start"
        onClick={() => {
          setOpen(true);
        }}
      >
        Войти
      </Button>
      <AuthDialog
        open={open}
        onOpenChange={setOpen}
        description="Войдите или зарегистрируйтесь, чтобы открыть эту страницу."
      />
    </PageLayout>
  );
}
