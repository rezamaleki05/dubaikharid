import { FashionCatalog } from '../men/page';
import { connection } from 'next/server';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import ContentEvidence from '@/components/seo/ContentEvidence';
import { shoeEvidence } from '@/lib/organicGrowthContent';
import { breadcrumbSchema } from '@/lib/seo';
import styles from '@/components/seo/Guide.module.css';

export default async function SportsShoesPage() {
  // Render the search-param catalog and its server-authored guidance at request time.
  await connection();
  const crumbs = [{ name: 'صفحه اصلی', path: '/' }, { name: 'کفش و کتونی', path: '/sports-shoes' }];
  return <FashionCatalog preset="sportsShoes">
    <JsonLd data={breadcrumbSchema(crumbs)} />
    <Breadcrumbs items={crumbs} />
    <ContentEvidence evidence={shoeEvidence} />
    <nav className={styles.evidenceLinks} aria-label="راهنمای انتخاب و سفارش کفش">
      <Link href="/brands/nike">انتخاب کد مدل نایکی</Link>
      <Link href="/guides/shoe-sizing">راهنمای اندازه‌گیری پا</Link>
      <Link href="/stores/namshi">انتخاب کفش در نمشی</Link>
      <Link href="/buy-from-dubai#cost-example">بررسی اجزای هزینه</Link>
      <Link href="/#calculator">ارسال لینک کفش برای استعلام</Link>
    </nav>
  </FashionCatalog>;
}
