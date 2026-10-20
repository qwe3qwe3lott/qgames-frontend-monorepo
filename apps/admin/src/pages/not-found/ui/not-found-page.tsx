import {Button} from '@qgames/ui/components/button';
import {Link} from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Страница не найдена</h1>
      <Button asChild variant="outline" className="self-start">
        <Link to="/">На главную</Link>
      </Button>
    </main>
  );
}
