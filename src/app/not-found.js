import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return <div style={{ minHeight: '100vh', background: '#080b12', color: '#fff' }}>
    <Header />
    <main dir="rtl" style={{ minHeight: '55vh', display: 'grid', placeItems: 'center', padding: '72px 20px', textAlign: 'center' }}>
      <div><p style={{ color: '#f87820', fontWeight: 900 }}>خطای ۴۰۴</p><h1 style={{ fontSize: 'clamp(30px, 6vw, 54px)', margin: '8px 0 16px' }}>صفحه موردنظر پیدا نشد</h1><p style={{ color: '#aeb5c1', marginBottom: '28px' }}>ممکن است کالا حذف شده باشد یا آدرس صفحه تغییر کرده باشد.</p><Link href="/" style={{ display: 'inline-flex', padding: '12px 22px', borderRadius: '8px', color: '#fff', background: '#f87820', textDecoration: 'none', fontWeight: 800 }}>بازگشت به صفحه اصلی</Link></div>
    </main>
    <Footer />
  </div>;
}
