import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: 'خرید لپ‌تاپ استوک موجود',
  description: 'مشاهده لپ‌تاپ‌های استوک موجود با مشخصات فنی، قیمت ثبت‌شده و وضعیت واقعی موجودی در دبی خرید.',
  path: '/stock-laptops',
});

export default function StockLaptopsLayout({ children }) { return children; }
