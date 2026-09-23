import { NOINDEX_METADATA, publicPageMetadata } from '@/lib/seo';
export const metadata = publicPageMetadata({
  title: 'جستجوی محصولات و لپ تاپ استوک',
  description: 'جستجو در محصولات، برندها، دسته‌بندی‌ها و مدل‌های موجود لپ تاپ استوک دبی خرید.',
  path: '/search',
  ...NOINDEX_METADATA,
});
export default function Layout({ children }) { return children; }
