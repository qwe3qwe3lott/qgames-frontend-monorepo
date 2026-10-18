import {Button} from '@qgames/ui/components/button';

import {errorMessage} from '@/shared/lib';
import {PageLayout} from '@/shared/ui';

export interface ErrorPageProps {
  error: unknown;
  onRetry: () => void;
}

/** Ошибка загрузки маршрута (например, сервер недоступен). */
export function ErrorPage({error, onRetry}: ErrorPageProps) {
  return (
    <PageLayout title="Не удалось открыть страницу">
      <p className="text-destructive" role="alert">
        {errorMessage(error)}
      </p>
      <Button variant="outline" className="self-start" onClick={onRetry}>
        Повторить
      </Button>
    </PageLayout>
  );
}
