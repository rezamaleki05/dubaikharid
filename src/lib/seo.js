import { getSiteUrl } from '@/lib/env';

export const SITE_NAME = 'دبی خرید';
export const SITE_URL = getSiteUrl();
export const DEFAULT_OG_IMAGE = '/images/logo dubai kharid.png';

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function publicPageMetadata({ title, description, path, image = DEFAULT_OG_IMAGE, type = 'website', robots }) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots,
    openGraph: {
      type,
      locale: 'fa_IR',
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const NOINDEX_METADATA = {
  robots: { index: false, follow: true, nocache: true },
};

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
