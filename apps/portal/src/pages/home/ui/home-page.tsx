import {Button} from '@qgames/ui/components/button';

import {CurrentUser} from '@/entities/user';

export function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">qgames</h1>
      <p>
        Пользователь: <CurrentUser />
      </p>
      <Button>Играть</Button>
    </main>
  );
}
