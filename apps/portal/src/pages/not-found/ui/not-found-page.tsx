import {Button} from '@qgames/ui/components/button';
import {Link} from '@tanstack/react-router';

import {PageLayout} from '@/shared/ui';

export function NotFoundPage() {
  return (
    <PageLayout title="Страница не найдена">
      <Button asChild variant="outline" className="self-start">
        <Link to="/">На главную</Link>
      </Button>
    </PageLayout>
  );
}
