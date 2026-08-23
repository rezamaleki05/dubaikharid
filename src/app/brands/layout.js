import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: 'برندها و فروشگاه‌های معتبر دبی',
  description: 'فهرست برندها و فروشگاه‌های آنلاین امارات برای انتخاب کالا، ارسال لینک و ثبت سفارش خرید از دبی با ارسال به ایران.',
  path: '/brands',
});

export default function BrandsLayout({ children }) { return children; }
