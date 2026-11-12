import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccessoryCatalog from "@/components/accessories/AccessoryCatalog";
import { getPublicAccessories } from "@/lib/publicAccessories";
import { ACCESSORY_CATEGORIES } from "@/lib/laptopAccessoryDomain";
import { publicPageMetadata } from "@/lib/seo";
import styles from "@/components/accessories/Accessories.module.css";
export async function generateMetadata({ params, searchParams }) {
  const { category } = await params;
  if (!Object.hasOwn(ACCESSORY_CATEGORIES, category)) return {};
  const rows = await getPublicAccessories({ category });
  return publicPageMetadata({
    title: ACCESSORY_CATEGORIES[category],
    description: `انتخاب ${ACCESSORY_CATEGORIES[category]} بر اساس شماره قطعه، اصالت و وضعیت واقعی هر حالت فروش.`,
    path: `/laptop-accessories/${category}`,
    robots: {
      index: rows.length > 0 && Object.keys(await searchParams).length === 0,
      follow: true,
    },
  });
}
export default async function CategoryPage({ params }) {
  const { category } = await params;
  if (!Object.hasOwn(ACCESSORY_CATEGORIES, category)) notFound();
  const products = await getPublicAccessories({ category });
  return (
    <>
      <Header />
      <main className={styles.main} dir="rtl">
        <Link href="/laptop-accessories">قطعات و لوازم لپ تاپ</Link>
        <h1>{ACCESSORY_CATEGORIES[category]}</h1>
        <AccessoryCatalog products={products} />
      </main>
      <Footer />
    </>
  );
}
