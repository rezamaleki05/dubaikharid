import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccessoryCatalog from "@/components/accessories/AccessoryCatalog";
import { getPublicAccessories } from "@/lib/publicAccessories";
import { ACCESSORY_CATEGORIES } from "@/lib/laptopAccessoryDomain";
import { publicPageMetadata } from "@/lib/seo";
import styles from "@/components/accessories/Accessories.module.css";
export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }) {
  const rows = await getPublicAccessories();
  return publicPageMetadata({
    title: "قطعات و لوازم لپ تاپ",
    description:
      "انتخاب باتری، RAM، SSD، شارژر و قطعات لپ تاپ با اصالت، وضعیت و سازگاری مشخص.",
    path: "/laptop-accessories",
    robots: {
      index: rows.length > 0 && Object.keys(await searchParams).length === 0,
      follow: true,
    },
  });
}
export default async function AccessoriesPage() {
  const products = await getPublicAccessories();
  return (
    <>
      <Header />
      <main className={styles.main} dir="rtl">
        <h1>قطعات و لوازم لپ تاپ</h1>
        <p className={styles.intro}>
          قطعه را بر اساس شماره قطعه، مشخصات و مدل سازگار انتخاب کنید. قیمت هر
          حالت فروش به تومان و وضعیت نو یا دست دوم و اصلی یا سازگار جداگانه ثبت
          می‌شود.
        </p>
        <nav className={styles.links} aria-label="دسته‌بندی قطعات">
          {Object.entries(ACCESSORY_CATEGORIES).map(([key, label]) => (
            <Link key={key} href={`/laptop-accessories/${key}`}>
              {label}
            </Link>
          ))}
        </nav>
        <AccessoryCatalog products={products} />
        <h2>پیش از انتخاب قطعه</h2>
        <p className={styles.intro}>
          شماره قطعه و اتصال را بررسی کنید. سازگاری یک مدل به تنهایی تأیید همه
          پیکربندی‌های آن نیست؛ یادداشت سازگاری و مشخصات ثبت‌شده را بخوانید.
        </p>
        <Link href="/stock-laptops">مشاهده لپ تاپ‌های استوک</Link>
      </main>
      <Footer />
    </>
  );
}
