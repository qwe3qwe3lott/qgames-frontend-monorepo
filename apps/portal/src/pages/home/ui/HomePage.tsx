import {Button} from '@qgames/ui/components/Button';
import {PageLayout} from '@qgames/ui/components/PageLayout';
import {Link} from '@tanstack/react-router';

import {testIds} from './HomePage.testIds';

export function HomePage() {
  return (
    <PageLayout
      data-testid={testIds.root}
      title="qgames"
      description="Настольные игры онлайн: создайте комнату и пригласите друзей."
    >
      <Button asChild className="self-start">
        <Link to="/games" data-testid={testIds.gamesButton}>
          Выбрать игру
        </Link>
      </Button>
    </PageLayout>
  );
}
