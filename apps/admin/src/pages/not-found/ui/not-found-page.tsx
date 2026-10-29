import {Button} from '@qgames/ui/components/button';
import {PageLayout} from '@qgames/ui/components/page-layout';
import {Link} from '@tanstack/react-router';

import {testIds} from './not-found-page.test-ids';

export function NotFoundPage() {
  return (
    <PageLayout data-testid={testIds.root} title="Страница не найдена">
      <Button asChild variant="outline" className="self-start">
        <Link to="/" data-testid={testIds.homeButton}>
          На главную
        </Link>
      </Button>
    </PageLayout>
  );
}
