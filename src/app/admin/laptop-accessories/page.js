"use client";
/* eslint-disable @next/next/no-img-element */
import { upload as uploadBlob } from "@vercel/blob/client";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/components/admin/AdminAccessProvider";
import { ADMIN_PERMISSIONS } from "@/lib/adminPermissions";
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_SPECS,
  ACCESSORY_SPEC_LABELS,
  ACCESSORY_AUTHENTICITY,
  ACCESSORY_CONDITION,
} from "@/lib/laptopAccessoryDomain";
import { publicProductHref } from "@/lib/productUrl";
import styles from "@/components/accessories/AccessoryAdmin.module.css";
const offer = (authenticity, condition) => ({
  authenticity,
  condition,
  isActive: false,
  price: "",
  stock: 0,
  sku: "",
  warrantyDays: "",
  images: [],
});
const blank = () => ({
  nameFa: "",
  nameEn: "",
  slug: "",
  brandId: "",
  categorySlug: "battery",
  partNumber: "",
  modelNumber: "",
  shortTechnicalName: "",
  description: "",
  compatibilityNotes: "",
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
  published: false,
  compatibility: [],
  specs: {},
  images: [],
  offers: ["ORIGINAL", "COMPATIBLE"].flatMap((a) =>
    ["NEW", "USED"].map((c) => offer(a, c)),
  ),
});
function fromRow(p) {
  return {
    ...blank(),
    ...p,
    ...p.accessoryProfile,
    published: p.status === "active",
    compatibility: p.accessoryProfile.compatibility.map((c) => c.laptopModelId),
    specs: Object.fromEntries(
      p.attributeValues.map((v) => [
        v.categoryAttribute.attribute.code.replace("accessory_spec_", ""),
        v.textValue || "",
      ]),
    ),
    offers: p.variants
      .filter((v) => v.accessoryOffer)
      .map((v) => ({
        ...v.accessoryOffer,
        isActive: v.isActive,
        isDefault: v.isDefault,
        price: String(v.priceTomanOverride || ""),
        stock: v.inventory?.stock || 0,
        sku: v.sku || "",
        manufactureDate: v.accessoryOffer.manufactureDate?.slice(0, 10) || "",
        images: v.accessoryImages,
      })),
  };
}
function Gallery({ value, onChange, onBusy }) {
  const [error, setError] = useState("");
  async function upload(event) {
    const files = [...event.target.files];
    onBusy(true);
    setError("");
    const next = [...value];
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024)
          throw Error("حداکثر حجم ۱۰ مگابایت است.");
        const extension = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        }[file.type];
        if (!extension) throw Error("فرمت تصویر معتبر نیست.");
        const data = await uploadBlob(
          `laptop-accessories/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`,
          file,
          {
            access: "public",
            handleUploadUrl: "/api/admin/laptop-accessories/upload",
            multipart: true,
          },
        );
        next.push({
          ...data,
          isPrimary: next.length === 0,
          altFa: "",
          altEn: "",
        });
      }
      onChange(next);
    } catch (e) {
      onChange(next);
      setError(e.message);
    } finally {
      onBusy(false);
      event.target.value = "";
    }
  }
  return (
    <div className={styles.gallery}>
      <label className={styles.field}>
        افزودن تصاویر
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={upload}
        />
      </label>
      <p>
        JPG، PNG، WebP؛ حداکثر ۱۰ مگابایت. حذف از گالری فایل Blob را پاک
        نمی‌کند.
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {value.map((image, i) => (
        <div key={image.url} className={styles.image}>
          <img src={image.url} alt={image.altFa || "پیش‌نمایش"} />
          <label>
            <input
              type="radio"
              checked={image.isPrimary || false}
              onChange={() =>
                onChange(value.map((v, j) => ({ ...v, isPrimary: i === j })))
              }
            />
            شاخص
          </label>
          <input
            aria-label={`متن جایگزین فارسی تصویر ${i + 1}`}
            value={image.altFa || ""}
            onChange={(e) =>
              onChange(
                value.map((v, j) =>
                  j === i ? { ...v, altFa: e.target.value } : v,
                ),
              )
            }
          />
          <input
            aria-label={`متن جایگزین انگلیسی تصویر ${i + 1}`}
            value={image.altEn || ""}
            onChange={(e) =>
              onChange(
                value.map((v, j) =>
                  j === i ? { ...v, altEn: e.target.value } : v,
                ),
              )
            }
          />
          <button
            type="button"
            disabled={!i}
            onClick={() => {
              const n = [...value];
              [n[i - 1], n[i]] = [n[i], n[i - 1]];
              onChange(n);
            }}
          >
            قبلی
          </button>
          <button
            type="button"
            disabled={i === value.length - 1}
            onClick={() => {
              const n = [...value];
              [n[i + 1], n[i]] = [n[i], n[i + 1]];
              onChange(n);
            }}
          >
            بعدی
          </button>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => i !== j))}
          >
            حذف تصویر از گالری
          </button>
        </div>
      ))}
    </div>
  );
}
function Content() {
  const { can } = useAdminAccess();
  const editable = can(ADMIN_PERMISSIONS.LAPTOP_ACCESSORIES_EDIT);
  const [rows, setRows] = useState([]),
    [brands, setBrands] = useState([]),
    [models, setModels] = useState([]),
    [form, setForm] = useState(null),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [uploads, setUploads] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [modelSearch, setModelSearch] = useState(""),
    [filters, setFilters] = useState({}),
    [page, setPage] = useState(1),
    [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        ...filters,
      });
      const r = await fetch("/api/admin/laptop-accessories?" + params);
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setRows(d.data);
      setPagination(d.pagination);
      setBrands(d.brands);
      setModels(d.models);
    } catch (e) {
      setError(e.message);
    }
  }, [search, filters, page]);
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setOffer = (i, key, value) =>
    setForm((f) => ({
      ...f,
      offers: f.offers.map((v, j) => (i === j ? { ...v, [key]: value } : v)),
    }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/admin/laptop-accessories" + (editing ? "/" + editing : ""),
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setForm(null);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter(
    (p) =>
      [
        p.nameFa,
        p.nameEn,
        p.accessoryProfile.partNumber,
        ...p.variants.map((v) => v.sku),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!filters.category ||
        p.accessoryProfile.categorySlug === filters.category) &&
      (!filters.brand || p.brandId === filters.brand) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.featured || p.accessoryProfile.isFeatured) &&
      (!filters.stock ||
        p.variants.some(
          (v) =>
            v.isActive &&
            (v.inventory?.stock || 0) > (v.inventory?.reserved || 0),
        )) &&
      (!(filters.condition || filters.authenticity) ||
        p.variants.some(
          (v) =>
            (!filters.condition ||
              v.accessoryOffer?.condition === filters.condition) &&
            (!filters.authenticity ||
              v.accessoryOffer?.authenticity === filters.authenticity),
        )),
  );
  return (
    <div className={styles.wrap} dir="rtl">
      <h1>قطعات و لوازم لپ تاپ</h1>
      {error && (
        <p role="alert" id="accessory-error" className={styles.error}>
          {error}
        </p>
      )}
      {!form ? (
        <>
          <div className={styles.toolbar}>
            {editable && (
              <button
                onClick={() => {
                  setForm(blank());
                  setEditing(null);
                }}
              >
                افزودن قطعه
              </button>
            )}
            <label>
              جستجوی نام، Part Number یا SKU
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </label>
            {[
              ["category", "دسته‌بندی", ACCESSORY_CATEGORIES],
              [
                "brand",
                "برند",
                Object.fromEntries(
                  brands.map((b) => [b.id, b.faName || b.name]),
                ),
              ],
              ["condition", "وضعیت کالا", ACCESSORY_CONDITION],
              ["authenticity", "اصالت", ACCESSORY_AUTHENTICITY],
              ["status", "انتشار", { active: "منتشرشده", hidden: "پنهان" }],
              ["stock", "موجودی", { yes: "موجود" }],
              ["featured", "ویژه", { yes: "ویژه" }],
            ].map(([key, label, opts]) => (
              <label key={key}>
                {label}
                <select
                  value={filters[key] || ""}
                  onChange={(e) => (
                    setPage(1),
                    setFilters({ ...filters, [key]: e.target.value })
                  )}
                >
                  <option value="">همه</option>
                  {Object.entries(opts).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  {[
                    "تصویر",
                    "نام فارسی / English",
                    "دسته / برند",
                    "Part Number",
                    "حالت فعال / موجودی",
                    "قیمت تومان",
                    "انتشار / ویژه",
                    "آخرین ویرایش",
                    "عملیات",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const active = p.variants.filter((v) => v.isActive);
                  const prices = active.map((v) =>
                    Number(v.priceTomanOverride),
                  );
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.image && (
                          <img src={p.image} width={56} height={56} alt="" />
                        )}
                      </td>
                      <td>
                        {p.nameFa}
                        <br />
                        <bdi>{p.nameEn}</bdi>
                      </td>
                      <td>
                        {p.category?.name}
                        <br />
                        {p.brand?.name}
                      </td>
                      <td>
                        <bdi>{p.accessoryProfile.partNumber}</bdi>
                      </td>
                      <td>
                        {active.length} /{" "}
                        {active.reduce(
                          (n, v) =>
                            n +
                            Math.max(
                              0,
                              (v.inventory?.stock || 0) -
                                (v.inventory?.reserved || 0),
                            ),
                          0,
                        )}
                      </td>
                      <td>
                        {prices.length
                          ? `${Math.min(...prices).toLocaleString("fa-IR")} – ${Math.max(...prices).toLocaleString("fa-IR")}`
                          : "—"}
                      </td>
                      <td>
                        {p.status === "active" ? "منتشرشده" : "پنهان"} /{" "}
                        {p.accessoryProfile.isFeatured ? "ویژه" : "—"}
                      </td>
                      <td>
                        {new Date(p.updatedAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td>
                        {editable && (
                          <button
                            onClick={() => {
                              setForm(fromRow(p));
                              setEditing(p.id);
                            }}
                          >
                            ویرایش / پنهان کردن
                          </button>
                        )}
                        {p.status === "active" && (
                          <a href={publicProductHref(p)}>صفحه عمومی</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav className={styles.toolbar} aria-label="صفحه‌بندی">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              قبلی
            </button>
            <span>
              {page} / {pagination.totalPages} · {pagination.total} قطعه
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              بعدی
            </button>
          </nav>
          {!rows.length && <p>هنوز قطعه‌ای ثبت نشده است.</p>}
        </>
      ) : (
        <form
          className={styles.form}
          onSubmit={save}
          aria-describedby={error ? "accessory-error" : undefined}
        >
          <div className={styles.toolbar}>
            <button
              type="button"
              disabled={busy || uploads}
              onClick={() => setForm(null)}
            >
              بازگشت
            </button>
            <button disabled={busy || uploads || !editable}>
              {busy ? "در حال ثبت…" : "ذخیره قطعه"}
            </button>
          </div>
          <fieldset>
            <legend>اطلاعات اصلی</legend>
            <div className={styles.fields}>
              {[
                ["nameFa", "نام فارسی"],
                ["nameEn", "نام انگلیسی"],
                ["slug", "Slug"],
                ["partNumber", "شماره قطعه"],
                ["modelNumber", "شماره مدل"],
                ["shortTechnicalName", "توضیح کوتاه"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    required={["nameFa", "nameEn", "slug"].includes(key)}
                    maxLength={key === "slug" ? 120 : 240}
                    value={form[key] || ""}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </label>
              ))}
              <label>
                دسته‌بندی
                <select
                  value={form.categorySlug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categorySlug: e.target.value,
                      specs: {},
                    })
                  }
                >
                  {Object.entries(ACCESSORY_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                برند
                <select
                  required
                  value={form.brandId || ""}
                  onChange={(e) => set("brandId", e.target.value)}
                >
                  <option value="">انتخاب برند</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.faName || b.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>مدل‌های سازگار</legend>
            <label className={styles.field}>
              جستجوی برند، سری و مدل
              <input
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
              />
            </label>
            <div className={styles.models}>
              {models
                .filter((m) =>
                  `${m.brand.name} ${m.series || ""} ${m.exactModel || m.name}`
                    .toLowerCase()
                    .includes(modelSearch.toLowerCase()),
                )
                .map((m) => (
                  <label key={m.id}>
                    <input
                      type="checkbox"
                      checked={form.compatibility.includes(m.id)}
                      onChange={(e) =>
                        set(
                          "compatibility",
                          e.target.checked
                            ? [...form.compatibility, m.id]
                            : form.compatibility.filter((id) => id !== m.id),
                        )
                      }
                    />
                    {m.brand.name} / {m.series} / {m.exactModel || m.name}
                  </label>
                ))}
            </div>
            <label className={styles.field}>
              یادداشت سازگاری
              <textarea
                value={form.compatibilityNotes || ""}
                onChange={(e) => set("compatibilityNotes", e.target.value)}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>مشخصات فنی</legend>
            <div className={styles.fields}>
              {ACCESSORY_SPECS[form.categorySlug].map((k) => (
                <label key={k}>
                  {ACCESSORY_SPEC_LABELS[k] || k}
                  <input
                    value={form.specs[k] || ""}
                    onChange={(e) =>
                      set("specs", { ...form.specs, [k]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <section>
            <h2>حالت‌های فروش</h2>
            <p>
              فقط حالت‌های واقعی را فعال کنید. سازگار و Aftermarket غیر اصلی
              هستند.
            </p>
            <div className={styles.matrix}>
              {form.offers.map((o, i) => (
                <fieldset key={o.authenticity + o.condition}>
                  <legend>
                    {ACCESSORY_AUTHENTICITY[o.authenticity]} +{" "}
                    {ACCESSORY_CONDITION[o.condition]}
                  </legend>
                  <label>
                    <input
                      type="checkbox"
                      checked={o.isActive}
                      onChange={(e) =>
                        setOffer(i, "isActive", e.target.checked)
                      }
                    />
                    فعال
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={o.isDefault || false}
                      onChange={(e) =>
                        set(
                          "offers",
                          form.offers.map((v, j) => ({
                            ...v,
                            isDefault: j === i ? e.target.checked : false,
                          })),
                        )
                      }
                    />
                    انتخاب پیش‌فرض در صورت موجودی
                  </label>
                  <div className={styles.fields}>
                    {[
                      ["price", "قیمت تومان"],
                      ["stock", "موجودی کل"],
                      ["sku", "SKU"],
                      ["warrantyDays", "ضمانت روز"],
                      ["manufactureDate", "تاریخ ساخت میلادی"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          type={
                            key === "manufactureDate"
                              ? "date"
                              : ["price", "stock", "warrantyDays"].includes(key)
                                ? "number"
                                : "text"
                          }
                          min="0"
                          required={
                            o.isActive && ["price", "stock"].includes(key)
                          }
                          value={o[key] ?? ""}
                          onChange={(e) => setOffer(i, key, e.target.value)}
                        />
                      </label>
                    ))}
                    {o.condition === "USED" &&
                      [
                        ["grade", "گرید"],
                        ...(["battery", "ssd", "hdd"].includes(
                          form.categorySlug,
                        )
                          ? [["healthPercent", "سلامت ٪"]]
                          : []),
                        ...(form.categorySlug === "battery"
                          ? [["cycleCount", "تعداد چرخه"]]
                          : []),
                        ...(["ssd", "hdd"].includes(form.categorySlug)
                          ? [
                              ["powerOnHours", "ساعت کار"],
                              ["smartStatus", "SMART"],
                            ]
                          : []),
                      ].map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <input
                            value={o[key] ?? ""}
                            onChange={(e) => setOffer(i, key, e.target.value)}
                          />
                        </label>
                      ))}
                  </div>
                  {o.condition === "USED" && (
                    <>
                      <label>
                        تست
                        <select
                          value={o.tested == null ? "" : String(o.tested)}
                          onChange={(e) =>
                            setOffer(
                              i,
                              "tested",
                              e.target.value === ""
                                ? null
                                : e.target.value === "true",
                            )
                          }
                        >
                          <option value="">ثبت نشده</option>
                          <option value="true">تست شده</option>
                          <option value="false">تست نشده</option>
                        </select>
                      </label>
                      <label className={styles.field}>
                        یادداشت تست
                        <textarea
                          value={o.testNotes || ""}
                          onChange={(e) =>
                            setOffer(i, "testNotes", e.target.value)
                          }
                        />
                      </label>
                    </>
                  )}
                  <label className={styles.field}>
                    توضیحات حالت
                    <textarea
                      value={o.offerNotes || ""}
                      onChange={(e) =>
                        setOffer(i, "offerNotes", e.target.value)
                      }
                    />
                  </label>
                  <Gallery
                    value={o.images}
                    onBusy={setUploads}
                    onChange={(v) => setOffer(i, "images", v)}
                  />
                </fieldset>
              ))}
            </div>
            <div className={styles.toolbar}>
              {["OEM", "AFTERMARKET"].flatMap((a) =>
                ["NEW", "USED"].map((c) => (
                  <button
                    key={a + c}
                    type="button"
                    disabled={form.offers.some(
                      (o) => o.authenticity === a && o.condition === c,
                    )}
                    onClick={() => set("offers", [...form.offers, offer(a, c)])}
                  >
                    افزودن {ACCESSORY_AUTHENTICITY[a]} +{" "}
                    {ACCESSORY_CONDITION[c]}
                  </button>
                )),
              )}
            </div>
          </section>
          <fieldset>
            <legend>تصاویر عمومی</legend>
            <Gallery
              value={form.images}
              onBusy={setUploads}
              onChange={(v) => set("images", v)}
            />
          </fieldset>
          <fieldset>
            <legend>توضیحات و SEO</legend>
            <label className={styles.field}>
              توضیحات کامل
              <textarea
                rows={6}
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <div className={styles.fields}>
              {[
                ["seoTitle", "عنوان SEO"],
                ["seoDescription", "توضیح SEO"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    value={form[key] || ""}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>انتشار</legend>
            <label>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
              />
              ویژه
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              منتشرشده (برای پنهان کردن غیرفعال کنید)
            </label>
            <p>ارسال خودکار تلگرام قطعات به‌صورت پیش‌فرض خاموش است.</p>
          </fieldset>
          <button disabled={busy || uploads || !editable}>ذخیره</button>
        </form>
      )}
    </div>
  );
}
export default function Page() {
  return (
    <AdminShell activeTab="laptop_accessories">
      <Content />
    </AdminShell>
  );
}
