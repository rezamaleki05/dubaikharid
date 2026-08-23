import { SITE_URL } from '@/lib/seo';
import { isPreviewDeployment } from '@/lib/env';

export default function robots() {
  if (isPreviewDeployment()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/', '/payment'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
