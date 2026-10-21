import {Button} from '@qgames/ui/components/button';
import {PageLayout} from '@qgames/ui/components/page-layout';
import {Link} from '@tanstack/react-router';

export function HomePage() {
  return (
    <PageLayout
      title="qgames"
      description="Настольные игры онлайн: создайте комнату и пригласите друзей."
    >
      <Button asChild className="self-start">
        <Link to="/games">Выбрать игру</Link>
      </Button>
    </PageLayout>
  );
}
