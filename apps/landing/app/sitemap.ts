import type {MetadataRoute} from 'next';

import {env} from '@/shared/config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{url: `${env.NEXT_PUBLIC_SITE_URL}/`}];
}
