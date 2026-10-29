import type {ComponentProps, ReactNode} from 'react';
import {cn} from '../lib/utils';

/** Остальные атрибуты (`data-testid`, `data-*`) ставятся на `<main>`. */
export interface PageLayoutProps extends Omit<
  ComponentProps<'main'>,
  'title' | 'children'
> {
  title: string;
  description?: string | undefined;
  /** Действия рядом с заголовком. */
  actions?: ReactNode;
  children?: ReactNode;
}

/** Общая разметка страницы: заголовок, описание, содержимое. */
export function PageLayout({
  title,
  description,
  actions,
  children,
  className,
  ...rest
}: PageLayoutProps) {
  return (
    <main
      {...rest}
      className={cn(
        'mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{title}</h1>
          {description === undefined ? null : (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}
