# Phase 3J — Adidas catalog decision

Reviewed 2026-10-21, Asia/Dubai, against Production/source
`3452395060ffe31611bcf136a042d427d84ad78e`. Research and proposal only.
The seven Phase 3H/3I research/execution inputs were reviewed; their historical
observations remain intact. No catalog record, Product, image upload, deployment
or application-code change was made.

## Decision and evidence strength

**Supported purchasing evidence: YES, conditional manual link review.**
This is not evidence of completed Adidas orders, universal availability, automated
Adidas price extraction, or official partnership.

- Live `/buy-from-dubai` names Adidas among example sources and explicitly makes
  each request subject to country, seller, availability and shipping review.
- `src/app/profile/page.js` includes `Adidas.ae` in the customer request selector.
- `src/components/Header.js` includes an Adidas Brand search shortcut.
- `src/lib/commerceGuides.js` contains the dormant Adidas code/size guidance;
  `docs/seo/PHASE-3C-CONTENT-REVIEW.md` documents its intended public identity.
- `src/app/api/fetch-product/route.js` recognizes Adidas in title classification,
  but `src/lib/externalUrls.js:isSupportedProductStore` permits automatic fetching
  only for Amazon UAE, Noon and Namshi. Do not promise automatic Adidas extraction.
- No Setting keys matching store/brand/source/adidas were found in the narrow
  read-only check. Catalog records and source content, rather than a Settings
  feature flag, govern this destination.
- Earlier synthetic Galaxy 6 fixtures in `docs/PHASE-3A-PRODUCT-SOURCE.md` were
  isolated QA. They are **not** genuine inventory or business-support evidence.
- No contract, authorized-reseller status, distributor status or partnership
  evidence was found. None is proposed.

## Production inspection

Used the existing configured Production connection, verified database `neondb`
and expected endpoint identity, with explicit `BEGIN READ ONLY` and rollback.
Applied migrations **30**, failed **0**. Adidas Store **absent**, Adidas Brand
**absent**, including a Persian-name check in the detailed catalog query.
Brand count30, Store count6, Product count4 (includes retained hidden QA artifact).
No customer/order details or credentials were exported. Live `/brands/adidas`
returns404. No Product or historical Laptop was modified.

## Architecture, including current clusters

| Cluster | Representation | Public path | Content and metadata | Empty catalog behavior |
| --- | --- | --- | --- | --- |
| SHEIN | Brand `shein`, visible | `/brands/shein` | `brandGuides.shein`; Brand name/image/category | Curated guide permits indexing without Products |
| Nike | Brand `nike`, visible | `/brands/nike` | `brandGuides.nike`; Brand name/image/category | Same |
| Temu | Code-authored guide, no Temu Store among six current Stores | `/guides/temu-ordering` | `guides['temu-ordering']` | No Product dependency |
| Amazon UAE | Store `amazon` | `/stores/amazon` | Store DB description/image; STORE_INTENTS, storeAnswers, orderingEvidence | Allowed in sitemap without Products |
| Noon | Store `noon` | `/stores/noon` | Same source layers, distinct Noon answers | Same |
| Namshi | Store `namshi` | `/stores/namshi` | Same source layers, distinct size answers | Same |

Source: `prisma/schema.prisma` Brand/Store/Product models;
`src/lib/publicSeoData.js`; `src/app/brands/[slug]/page.js`;
`src/app/stores/[slug]/page.js`; `src/app/sitemap.js`;
`src/lib/commerceGuides.js`; `src/lib/organicGrowthContent.js`.

- Route `[slug]` resolves the **entity ID**, not a separate Brand/Store slug
  field. There is no Brand↔Store foreign key. Product has separate optional
  `brandId` and `storeId`; BrandCategory mappings are optional.
- Public Brand resolution requires `showInBrandDirectory:true`. Brand `adidas`
  would use the existing curated profile and apex canonical `/brands/adidas`.
  Unknown/hidden Brand yields404. Generic empty Brands are noindex; a visible
  curated Adidas profile is indexable without Products and eligible for sitemap.
  Facets/pagination continue through `collectionSeoState`; no second destination.
- Stores can exist without Products; all six are Admin-managed source entities.
  Only the curated Amazon/Noon/Namshi IDs or Stores with public Products enter
  sitemap. Creating Store `adidas` would not activate `brandGuides.adidas` or
  supply the matching brand-specific answers. **Do not create both entities.**
- Brand has no CMS title/description/body fields. DB holds identity, URL, image,
  category and visibility. Curated body/title/description are code-authored.
  Store `desc` is editable; its richer answers are also code-authored.
- Current Nike logo is `/images/logo/NIKE.svg`; SHEIN image path is
  `/images/logo/Shein.png`. Store Amazon/Noon use local logos; others use text
  fallbacks. Optional Brand logos can be uploaded through protected Brand upload
  API/Blob. No image is necessary for a legitimate page.

## Exact proposed record — NOT EXECUTED

Recommended entity: **one Brand**, using the existing protected create service.

```json
{
  "id": "adidas",
  "name": "Adidas",
  "faName": "آدیداس",
  "cat": "کفش و پوشاک ورزشی",
  "url": "https://www.adidas.ae/en",
  "img": null,
  "hasImage": false,
  "fallback": "ADIDAS",
  "showInBrandDirectory": true,
  "supportsLaptop": false,
  "categoryIds": []
}
```

No Product, stock, price, variant, BrandCategory or Store record is required.
Category mappings can be a separately reviewed later decision; display category
`cat` does not fabricate inventory. Logo strategy: plain text initially; no copied
logo, remote hotlink, placeholder Product image or unlicensed upload.

Official source verified on [Adidas UAE](https://www.adidas.ae/en), which identifies
itself as the official UAE site and displays AED prices. This is a Brand source
homepage, **not** an exact Product URL for a future Product record.

Required action after approval: authenticated **POST `/api/admin/brands`**,
`validateBrandCreatePayload` → `createAdminBrand`. Existing authorization permits
BRANDS_MANAGE or PRODUCTS_CREATE/EDIT. Validator accepts explicit ID, rejects
unknown fields and invalid URLs; service checks normalized duplicate names and
existing categories. A normal Admin form is safe for ordinary entity creation,
but its current create payload omits `id`, so it would generate a cuid and miss
the prepared `adidas` guide. Use the protected API with the explicit ID; no SQL,
auth bypass, migration, seed or permanent Admin feature is needed.

Expected additional application side effects: BRAND_CREATED activity log and
public-catalog revalidation. A visible curated Brand also invokes the existing
IndexNow change hook when configured. **No such action was taken.** The current
phase prohibits IndexNow submissions, so approval of this proposal must not be
silently treated as permission to execute that hook in this phase. A later
controlled creation scope must explicitly cover the normal publication side
effects. Do not disable/bypass IndexNow to work around that boundary.

## Initial published fields versus prepared expansion

Creation alone would expose the **existing** title/intro/two answers in
`brandGuides.adidas`, the standard independent-service notice, link request CTA,
code/sizing links and honest empty-product notice. Metadata description uses the
existing guide intro. No Product/Offer availability is invented. The following
substantive expansion is a **draft in this document**, not a DB field, code patch
or published content; it requires a later reviewed content release.

### Proposed Persian content specification

**عنوان/H1:** خرید کفش و محصولات آدیداس از دبی

**توضیح پیشنهادی:** راهنمای ارسال لینک محصولات آدیداس امارات برای بررسی خرید؛
کد کالا، رنگ، جدول سایز، قیمت درهم و اجزای هزینه سفارش را پیش از تأیید مشخص کنید.

**معرفی:** برای بررسی خرید از آدیداس امارات، صفحه دقیق محصول را همراه کد کالا،
رنگ، سایز و تعداد بفرستید. دبی خرید درخواست را در چارچوب سرویس مستقل خرید از
فروشگاه‌های امارات بررسی می‌کند؛ دریافت لینک به معنی تأیید موجودی یا انجام خرید
نیست. دبی خرید نماینده، توزیع‌کننده یا شریک رسمی آدیداس نیست.

**چرا لینک و کد کالا هر دو لازم‌اند؟** نام‌هایی مانند نام یک خانواده کفش ممکن است
برای رنگ‌ها و نسخه‌های مختلف تکرار شوند. کد صفحه مبدأ، تصویر رنگ و گزینه انتخابی
را کنار هم نگه دارید. صفحه اصلی آدیداس، نتیجه جستجو یا لینک سبد خرید جای صفحه
دقیق همان کالا را نمی‌گیرد. اطلاعات ورود یا لینک خصوصی حساب را ارسال نکنید.

**قیمت کدام گزینه بررسی می‌شود؟** کشور امارات و ارز AED صفحه را مشخص کنید.
قیمت سایز و رنگ انتخاب‌شده، تعداد و شرایط پیشنهاد باید بررسی شوند. تخفیف اعضا،
کد شخصی یا تخفیف سبد را تخفیف قابل استفاده برای همه فرض نکنید؛ قیمت دیده‌شده در
مرورگر شما به‌تنهایی تأیید مبلغ نهایی سفارش نیست.

**برای کفش چه سایزی بنویسیم؟** طول هر دو پا و واحد اندازه‌گیری را یادداشت کنید و
راهنمای همان محصول را ببینید. عین استاندارد صفحه، مانند EU یا UK، گروه زنانه،
مردانه یا کودک و عرض در صورت درج را بفرستید. سایز نایکی یا سایز کفش قبلی را
تبدیل ثابت برای همه مدل‌های آدیداس نگیرید. راهنمای رسمی یک مرجع اندازه است و
تضمین تناسب همه قالب‌ها نیست.

**برای پوشاک چه تفاوتی دارد؟** جدول لباس را با اندازه بدن و واحد جدول تطبیق
دهید. گروه سنی، فرم برش و اندازه انتخابی را از همان صفحه بردارید؛ جدول کفش
برای لباس کاربرد ندارد. برای ست چندتکه مشخص کنید قیمت و انتخاب مربوط به کدام
قطعه است.

**هزینه خرید چگونه برآورد می‌شود؟** قیمت معتبر کالا، کارمزد تنظیم‌شده، وزن قابل
محاسبه، هزینه حمل و نرخ درهم در برآورد سامانه اثر دارند. هزینه احتمالی مبدأ و
شرایط خاص کالا باید جداگانه روشن شوند. به مثال آموزشی هزینه در راهنمای سفارش
ارجاع دهید؛ مبلغ یا نرخ ثابت برای همه سفارش‌های آدیداس ننویسید.

**پس از ارسال لینک چه می‌شود؟** ابتدا قیمت، موجودی همان انتخاب و امکان خرید و
حمل بررسی می‌شود. سپس مبلغ و شرایط ادامه سفارش با شما هماهنگ می‌شود. زمان
تحویل، وزن واقعی و شرایط لغو یا بازگشت باید برای همان درخواست روشن شوند؛ تحویل
فوری، تعویض رایگان یا امکان سفارش همه کالاها وعده داده نمی‌شود.

**اگر لینک خودکار خوانده نشد چه کنیم؟** جزئیات انتخاب و قیمت/ارز صفحه را برای
بررسی دستی بفرستید. نبود استخراج خودکار به معنی موجود بودن یا نبودن محصول
نیست. هیچ درخواست واقعی یا آزمایشی برای اثبات این مسیر در این مرحله ثبت نشد.

**آیا شرایط بازگشت سایت آدیداس همان شرایط سفارش در ایران است؟** خیر؛ سیاست
فروشگاه مبدأ را با شرایط سرویس واسط و حمل به ایران یکسان فرض نکنید. پیش از
تأیید، محدودیت همان کالا و مسئولیت/هزینه احتمالی برگشت را از پشتیبانی بپرسید.
از نقل تعداد روز یا هزینه بدون بررسی جاری پرهیز کنید.

Links planned: `/guides/shoe-sizing`, `/sports-shoes`, `/clothing`,
`/buy-from-dubai#cost-example`, `/buy-from-dubai#shipping`, `/#calculator`.
Sources checked: [official sizing](https://www.adidas.ae/en/size-chart-men-shoes.html),
[official returns](https://www.adidas.ae/en/returns.html). Do not copy a full chart
or imply source returns override DubaiKharid conditions.

## One owner decision

**APPROVE / DO NOT APPROVE creation of the single proposed Adidas Brand above**
(`id: adidas`, visible, official UAE source, text fallback, no Products/relations).
Approval confirms the intended conditional purchasing offer. Execution remains
for a controlled scope covering the existing publication hook. The draft content
expansion is separate from record creation. No owner research or manual data
entry is needed to make this decision.
