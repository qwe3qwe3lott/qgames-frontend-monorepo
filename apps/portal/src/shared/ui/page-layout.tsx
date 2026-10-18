import type {ReactNode} from 'react';

export interface PageLayoutProps {
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
}: PageLayoutProps) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
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
