import {Button} from '@qgames/ui/components/Button';
import {PageLayout} from '@qgames/ui/components/PageLayout';
import {Link} from '@tanstack/react-router';

import {testIds} from './NotFoundPage.testIds';

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
