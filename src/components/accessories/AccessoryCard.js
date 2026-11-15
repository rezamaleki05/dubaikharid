import Link from "next/link";
import Image from "next/image";
import {
  ACCESSORY_AUTHENTICITY,
  ACCESSORY_CONDITION,
  accessoryCoverImage,
} from "@/lib/laptopAccessoryDomain";
import styles from "./Accessories.module.css";
export default function AccessoryCard({ product: p }) {
  const image = accessoryCoverImage(p);
  return (
    <Link className={styles.card} href={p.publicHref}>
      <Image
        src={image?.url || "/images/product-placeholder.svg"}
        width={480}
        height={360}
        sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"
        alt={image?.altFa || p.nameFa}
      />
      <span>{p.brand?.faName || p.brand?.name}</span>
      <h3>{p.nameFa}</h3>
      <p dir="ltr">{p.accessoryProfile.partNumber}</p>
      <p>
        {p.priceVaries ? "از " : ""}
        {p.priceFrom?.toLocaleString("fa-IR")} تومان ·{" "}
        {p.variants.some((v) => v.available > 0) ? "موجود" : "ناموجود"}
      </p>
      <small>
        {[
          ...new Set(
            p.variants.map(
              (v) => ACCESSORY_AUTHENTICITY[v.accessoryOffer.authenticity],
            ),
          ),
        ].join(" / ")}{" "}
        ·{" "}
        {[
          ...new Set(
            p.variants.map(
              (v) => ACCESSORY_CONDITION[v.accessoryOffer.condition],
            ),
          ),
        ].join(" / ")}
      </small>
    </Link>
  );
}
