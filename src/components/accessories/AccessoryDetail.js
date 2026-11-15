"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import PublicProductGallery from "@/components/product/PublicProductGallery";
import {
  chooseAccessoryOffer,
  accessoryGallery,
  ACCESSORY_AUTHENTICITY,
  ACCESSORY_CONDITION,
  ACCESSORY_SPEC_LABELS,
} from "@/lib/laptopAccessoryDomain";
import styles from "./Accessories.module.css";
export default function AccessoryDetail({ product: p }) {
  const [selected, setSelected] = useState(
    chooseAccessoryOffer(p.variants)?.id,
  );
  const [message, setMessage] = useState("");
  const v =
    p.variants.find((x) => x.id === selected) ||
    chooseAccessoryOffer(p.variants);
  const detail = v?.accessoryOffer;
  const images = accessoryGallery(p, v);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  return (
    <>
      <div className={styles.detail}>
        <PublicProductGallery
          key={v?.id}
          images={images}
          coverImage={images.find((x) => x.isPrimary)?.url}
          productName={p.nameFa}
        />
        <section>
          <p>{p.brand?.faName || p.brand?.name}</p>
          <h1>{p.nameFa}</h1>
          <p dir="ltr">{p.nameEn}</p>
          <p>
            شماره قطعه: <bdi>{p.accessoryProfile.partNumber || "ثبت نشده"}</bdi>
          </p>
          <div
            className={styles.offers}
            role="group"
            aria-label="نوع قطعه و وضعیت"
          >
            {p.variants.map((offer) => (
              <button
                type="button"
                key={offer.id}
                aria-pressed={selected === offer.id}
                onClick={() => {
                  setSelected(offer.id);
                  setMessage("");
                }}
              >
                {ACCESSORY_AUTHENTICITY[offer.accessoryOffer.authenticity]} +{" "}
                {ACCESSORY_CONDITION[offer.accessoryOffer.condition]} ·{" "}
                {offer.available > 0 ? "موجود" : "ناموجود"}
              </button>
            ))}
          </div>
          {v && (
            <>
              <p aria-live="polite">
                <strong>
                  {Number(v.priceTomanOverride).toLocaleString("fa-IR")} تومان
                </strong>{" "}
                · {v.available > 0 ? `${v.available} عدد موجود` : "ناموجود"}
              </p>
              <p>
                SKU: <bdi>{v.sku || "ثبت نشده"}</bdi>
              </p>
              <table className={styles.specs}>
                <caption>اطلاعات ثبت‌شده این حالت فروش</caption>
                <tbody>
                  {[
                    ["اصالت", ACCESSORY_AUTHENTICITY[detail.authenticity]],
                    ["وضعیت", ACCESSORY_CONDITION[detail.condition]],
                    ["گرید", detail.grade],
                    ["سلامت درصد", detail.healthPercent],
                    ["تعداد چرخه", detail.cycleCount],
                    ["ساعت کار", detail.powerOnHours],
                    ["SMART", detail.smartStatus],
                    [
                      "تست",
                      detail.tested == null
                        ? null
                        : detail.tested
                          ? "تست شده"
                          : "تست نشده",
                    ],
                    ["یادداشت تست", detail.testNotes],
                    ["ضمانت (روز)", detail.warrantyDays],
                    ["توضیحات حالت", detail.offerNotes],
                  ]
                    .filter(([, value]) => value != null && value !== "")
                    .map(([label, value]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td>{String(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className={styles.actions}>
                <button
                  disabled={v.available <= 0}
                  onClick={() => {
                    const ok = addToCart({
                      type: "PRODUCT",
                      id: p.id,
                      productId: p.id,
                      productVariantId: v.id,
                      name: p.nameFa,
                      nameFa: p.nameFa,
                      nameEn: p.nameEn,
                      image: images[0]?.url,
                      priceToman: v.priceTomanOverride,
                      supplyMode: "IRAN_STOCK",
                    });
                    setMessage(
                      ok ? "به سبد خرید اضافه شد." : "افزودن انجام نشد.",
                    );
                  }}
                >
                  افزودن به سبد خرید
                </button>
                <button
                  aria-pressed={isInWishlist(p.id, "PRODUCT")}
                  onClick={() =>
                    toggleWishlist({
                      type: "PRODUCT",
                      id: p.id,
                      productId: p.id,
                      name: p.nameFa,
                    })
                  }
                >
                  علاقه‌مندی
                </button>
              </div>
              <p role="status">{message}</p>
            </>
          )}
        </section>
      </div>
      <h2>مشخصات فنی</h2>
      <table className={styles.specs}>
        <tbody>
          {p.attributeValues.map((s, i) => (
            <tr key={i}>
              <th scope="row">{ACCESSORY_SPEC_LABELS[s.categoryAttribute.attribute.code.replace("accessory_spec_", "")] || s.categoryAttribute.attribute.nameFa}</th>
              <td>{s.textValue ?? s.numberValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.details}>{p.description}</div>
      <h2>راهنمای انتخاب</h2>
      <p className={styles.intro}>
        شماره قطعه، اتصال و مشخصات دستگاه را پیش از خرید تطبیق دهید. قطعه سازگار
        یا Aftermarket غیر اصلی است. اطلاعات سلامت و تست تنها موارد ثبت‌شده برای
        حالت انتخابی است؛ مقدار نامعلوم به معنی سلامت کامل نیست.
      </p>
    </>
  );
}
