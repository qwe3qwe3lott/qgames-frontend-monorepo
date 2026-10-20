import {errorMessage} from '@qgames/api';
import {Button} from '@qgames/ui/components/button';

export interface ErrorPageProps {
  error: unknown;
  onRetry: () => void;
}

/** Ошибка загрузки маршрута (например, сервер недоступен). */
export function ErrorPage({error, onRetry}: ErrorPageProps) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Не удалось открыть страницу</h1>
      <p className="text-destructive" role="alert">
        {errorMessage(error)}
      </p>
      <Button variant="outline" className="self-start" onClick={onRetry}>
        Повторить
      </Button>
    </main>
  );
}
