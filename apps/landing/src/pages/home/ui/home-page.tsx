import {Button} from '@qgames/ui/components/button';

import {env} from '@/shared/config';

export function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-4xl font-bold">qgames</h1>
      <p className="text-muted-foreground">
        Настольные игры онлайн: создайте комнату и пригласите друзей.
      </p>
      <Button asChild className="self-start">
        <a href={env.NEXT_PUBLIC_PORTAL_URL}>Играть</a>
      </Button>
    </main>
  );
}
