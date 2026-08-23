import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: 'خرید محصولات زیبایی و سلامت از دبی',
  description: 'مشاهده و سفارش محصولات زیبایی، بهداشتی و سلامت از فروشگاه‌های معتبر دبی.',
  path: '/beauty-health',
});

export default function Layout({ children }) { return children; }
