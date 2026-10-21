import {Button} from '@qgames/ui/components/button';
import {PageLayout} from '@qgames/ui/components/page-layout';
import {Link} from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <PageLayout title="Страница не найдена">
      <Button asChild variant="outline" className="self-start">
        <Link to="/">На главную</Link>
      </Button>
    </PageLayout>
  );
}
