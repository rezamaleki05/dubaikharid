import { prisma } from "@/lib/prisma";
import { getPublicAccessories } from "@/lib/publicAccessories";
import AccessoryCard from "./AccessoryCard";
import styles from "./Accessories.module.css";
export default async function CompatibleAccessories({ group }) {
  const models = await prisma.laptopModel.findMany({
    where: {
      active: true,
      brand: { name: { equals: group.brand, mode: "insensitive" } },
      exactModel: { equals: group.model, mode: "insensitive" },
      series: group.series || null,
    },
    select: { id: true },
  });
  const rows = await Promise.all(
    models.map((m) => getPublicAccessories({ laptopModelId: m.id })),
  );
  const products = [...new Map(rows.flat().map((p) => [p.id, p])).values()];
  if (!products.length) return null;
  return (
    <section dir="rtl">
      <h2>قطعات و لوازم سازگار</h2>
      <div className={styles.grid}>
        {products.map((p) => (
          <AccessoryCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
