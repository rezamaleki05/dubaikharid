import MultiStoreNotice from '@/components/seo/MultiStoreNotice';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import AnswerSections from '@/components/seo/AnswerSections';
import { guides } from '@/lib/commerceGuides';
import { absoluteUrl, breadcrumbSchema, publicPageMetadata } from '@/lib/seo';
import styles from '@/components/seo/Guide.module.css';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = Object.hasOwn(guides, slug) ? guides[slug] : null;
  if (!guide) return { title: 'راهنما پیدا نشد', robots: { index: false, follow: true } };
  return publicPageMetadata({ title: guide.title, description: guide.description, path: `/guides/${slug}` });
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = Object.hasOwn(guides, slug) ? guides[slug] : null;
  if (!guide) notFound();
  const path = `/guides/${slug}`;
  const crumbs = [{ name: 'صفحه اصلی', path: '/' }, { name: 'راهنمای خرید', path: '/buy-from-dubai' }, { name: guide.title, path }];
  return <div className={styles.page}>
    <Header />
    <main className={styles.main}>
      <JsonLd data={[breadcrumbSchema(crumbs), { '@context': 'https://schema.org', '@type': 'WebPage', name: guide.title, description: guide.description, url: absoluteUrl(path), inLanguage: 'fa-IR', publisher: { '@id': `${absoluteUrl('/')}#organization` } }]} />
      <Breadcrumbs items={crumbs} />
      <header className={styles.hero}><span className={styles.eyebrow}>راهنمای تصمیم خرید · DubaiKharid</span><h1>{guide.title}</h1><p>{guide.intro}</p></header>
      <AnswerSections answers={guide.answers} links={guide.links} />
      <MultiStoreNotice />
      <Link href="/buy-from-dubai" className={styles.cta}>مراحل ثبت درخواست و بررسی هزینه ←</Link>
    </main><Footer />
  </div>;
}
