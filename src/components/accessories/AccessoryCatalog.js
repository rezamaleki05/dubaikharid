"use client";
import { useState } from "react";
import AccessoryCard from "./AccessoryCard";
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_AUTHENTICITY,
  ACCESSORY_CONDITION,
} from "@/lib/laptopAccessoryDomain";
import styles from "./Accessories.module.css";
export default function AccessoryCatalog({ products }) {
  const [filters, setFilters] = useState({});
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  const rows = products.filter(
    (p) =>
      (!filters.q ||
        [
          p.nameFa,
          p.nameEn,
          p.accessoryProfile.partNumber,
          p.accessoryProfile.modelNumber,
          ...p.attributeValues.map((x) => x.textValue),
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (!filters.category ||
        p.accessoryProfile.categorySlug === filters.category) &&
      (!filters.brand || p.brand?.id === filters.brand) &&
      (!filters.model ||
        p.accessoryProfile.compatibility.some(
          (c) => c.laptopModel.id === filters.model,
        )) &&
      p.variants.some(
        (v) =>
          (!filters.authenticity ||
            v.accessoryOffer.authenticity === filters.authenticity) &&
          (!filters.condition ||
            v.accessoryOffer.condition === filters.condition) &&
          (!filters.stock || v.available > 0),
      ),
  );
  const brands = [
    ...new Map(
      products
        .filter((p) => p.brand)
        .map((p) => [p.brand.id, p.brand.faName || p.brand.name]),
    ),
  ];
  const models = [
    ...new Map(
      products.flatMap((p) =>
        p.accessoryProfile.compatibility.map((c) => [
          c.laptopModel.id,
          c.laptopModel.brand.name + " " + c.laptopModel.name,
        ]),
      ),
    ),
  ];
  return (
    <>
      <div className={styles.filters}>
        <label>
          جستجو و مشخصات
          <input
            value={filters.q || ""}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Part Number، ظرفیت، DDR، وات…"
          />
        </label>
        {[
          ["category", "دسته‌بندی", Object.entries(ACCESSORY_CATEGORIES)],
          ["brand", "برند", brands],
          ["model", "مدل سازگار", models],
          ["authenticity", "نوع قطعه", Object.entries(ACCESSORY_AUTHENTICITY)],
          ["condition", "وضعیت", Object.entries(ACCESSORY_CONDITION)],
        ].map(([k, label, options]) => (
          <label key={k}>
            {label}
            <select
              value={filters[k] || ""}
              onChange={(e) => set(k, e.target.value)}
            >
              <option value="">همه</option>
              {options.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          موجودی
          <select
            value={filters.stock || ""}
            onChange={(e) => set("stock", e.target.value)}
          >
            <option value="">همه</option>
            <option value="yes">فقط موجود</option>
          </select>
        </label>
      </div>
      <p aria-live="polite">{rows.length} قطعه</p>
      {rows.length ? (
        <div className={styles.grid}>
          {rows.map((p) => (
            <AccessoryCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          در حال حاضر قطعه‌ای مطابق این انتخاب ثبت نشده است.
        </p>
      )}
    </>
  );
}
