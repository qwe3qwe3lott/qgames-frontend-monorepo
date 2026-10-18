import '@/app/styles/index.css';

import type {Metadata} from 'next';
import type {ReactNode} from 'react';

import {env} from '@/shared/config';

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {default: 'qgames — настольные игры онлайн', template: '%s — qgames'},
  description: 'Играйте в настольные игры онлайн с друзьями.',
  openGraph: {type: 'website', siteName: 'qgames'},
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
