import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import AccessoryDetail from "@/components/accessories/AccessoryDetail";
import { getPublicAccessory } from "@/lib/publicAccessories";
import { getPublicLaptopModelGroups } from "@/lib/publicLaptopSeo";
import { ACCESSORY_CATEGORIES } from "@/lib/laptopAccessoryDomain";
import { absoluteUrl, publicPageMetadata, breadcrumbSchema } from "@/lib/seo";
import styles from "@/components/accessories/Accessories.module.css";
export async function generateMetadata({ params }) {
  const { category, slug } = await params;
  const p = await getPublicAccessory(category, slug);
  if (!p) return { robots: { index: false, follow: false } };
  return publicPageMetadata({
    title: p.accessoryProfile.seoTitle || p.nameFa,
    description:
      p.accessoryProfile.seoDescription ||
      p.accessoryProfile.shortTechnicalName ||
      p.nameFa,
    path: p.publicHref,
    image: p.images.find((x) => x.isPrimary)?.url || p.images[0]?.url,
  });
}
export default async function AccessoryPage({ params }) {
  const { category, slug } = await params;
  const p = await getPublicAccessory(category, slug);
  if (!p) notFound();
  const groups = await getPublicLaptopModelGroups();
  const compatibility = p.accessoryProfile.compatibility.map((c) => ({
    ...c.laptopModel,
    group: groups.find(
      (g) =>
        g.brand.toLowerCase() === c.laptopModel.brand.name.toLowerCase() &&
        g.model.toLowerCase() ===
          (c.laptopModel.exactModel || c.laptopModel.name).toLowerCase() &&
        (g.series || "").toLowerCase() ===
          (c.laptopModel.series || "").toLowerCase(),
    ),
  }));
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nameFa,
    alternateName: p.nameEn,
    sku: p.accessoryProfile.partNumber || undefined,
    url: absoluteUrl(p.publicHref),
    image: p.images.map((x) => x.url),
    brand: { "@type": "Brand", name: p.brand?.name },
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      url: absoluteUrl(p.publicHref),
      sku: v.sku || undefined,
      priceCurrency: "IRR",
      price: (BigInt(v.priceTomanOverride) * 10n).toString(),
      availability: `https://schema.org/${v.available > 0 ? "InStock" : "OutOfStock"}`,
      itemCondition: `https://schema.org/${v.accessoryOffer.condition === "NEW" ? "NewCondition" : "UsedCondition"}`,
    })),
  };
  const crumbs = [
    { name: "صفحه اصلی", path: "/" },
    { name: "قطعات و لوازم لپ تاپ", path: "/laptop-accessories" },
    {
      name: ACCESSORY_CATEGORIES[category],
      path: `/laptop-accessories/${category}`,
    },
    { name: p.nameFa, path: p.publicHref },
  ];
  return (
    <>
      <JsonLd data={[schema, breadcrumbSchema(crumbs)]} />
      <Header />
      <main className={styles.main} dir="rtl">
        <nav className={styles.links} aria-label="مسیر صفحه">
          {crumbs.map((c) => (
            <Link key={c.path} href={c.path}>
              {c.name}
            </Link>
          ))}
        </nav>
        <AccessoryDetail product={p} />
        <h2>سازگار با</h2>
        <ul>
          {compatibility.map((m) => (
            <li key={m.id}>
              {m.group ? (
                <Link href={`/laptops/${m.group.slug}`}>
                  {m.brand.name} {m.name}
                </Link>
              ) : (
                <span>
                  {m.brand.name} {m.name} — صفحه عمومی موجود نیست
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className={styles.details}>
          {p.accessoryProfile.compatibilityNotes}
        </p>
        <Link href={`/laptop-accessories/${category}`}>
          سایر قطعات این دسته
        </Link>
      </main>
      <Footer />
    </>
  );
}
