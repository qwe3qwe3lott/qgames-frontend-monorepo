import {Button} from '@qgames/ui/components/button';
import {Link} from '@tanstack/react-router';

import {PageLayout} from '@/shared/ui';

export function HomePage() {
  return (
    <PageLayout
      title="qgames"
      description="Настольные игры онлайн: создайте комнату и пригласите друзей."
    >
      <Button asChild className="self-start">
        <Link to="/games/$gameCode/rooms" params={{gameCode: 'nothing-game'}}>
          Сыграть в «Игру в ничто»
        </Link>
      </Button>
    </PageLayout>
  );
}
