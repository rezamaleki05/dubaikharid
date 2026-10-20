import Link from 'next/link';
import { connection } from 'next/server';
import { calculateProductPricing } from '@/lib/pricing';
import { getPricingSettings } from '@/lib/settings';
import ContentEvidence from './ContentEvidence';
import styles from './Guide.module.css';

const format = value => Number(value).toLocaleString('fa-IR', { maximumFractionDigits: 2 });

export default async function CostEstimateExample() {
  await connection();
  let quote;
  try {
    quote = calculateProductPricing({ priceAed: 200, weight: 1.2 }, await getPricingSettings());
  } catch {
    // Guidance stays useful without substituting invented rates when settings are unavailable.
  }
  const evidence = {
    title: 'هزینه خرید چگونه محاسبه می‌شود؟ یک مثال آموزشی',
    intro: 'در این مثال، قیمت فرضی کالا ۲۰۰ درهم و وزن فرضی ۱٫۲ کیلوگرم است. این اعداد مربوط به محصول یا سفارش واقعی نیستند. اگر تنظیمات قیمت در دسترس باشند، مثال با همان تابع محاسبه و تنظیمات معتبر سامانه نمایش داده می‌شود؛ اعداد جای پیشنهاد نهایی خرید نیستند.',
    columns: ['جزء برآورد', 'روش محاسبه', 'نتیجه در این مثال'],
    rows: [
      ['قیمت کالا', 'قیمت همان گزینه انتخابی در صفحه مبدأ', '۲۰۰ درهم؛ ورودی فرضی'],
      ['وزن قابل محاسبه', 'اعمال حداقل وزن و روش گردکردن تنظیم‌شده بر وزن ورودی', quote ? `${format(quote.billableWeight)} کیلوگرم` : 'نیازمند تنظیمات معتبر'],
      ['کارمزد خرید', 'قیمت کالا × درصد کارمزد تنظیم‌شده', quote ? `${format(quote.commissionAed)} درهم با نرخ ${format(quote.commissionPercent)}٪` : 'درصد کارمزد باید از تنظیمات معتبر دریافت شود'],
      ['حمل در برآورد', 'وزن قابل محاسبه × هزینه حمل هر کیلوگرم', quote ? `${format(quote.shippingAed)} درهم؛ هر کیلوگرم ${format(quote.shippingPerKgAed)} درهم` : 'نرخ حمل باید از تنظیمات معتبر دریافت شود'],
      ['برآورد تومان', 'جمع قیمت، کارمزد و حمل (درهم) × نرخ درهم؛ سپس گردکردن به تومان', quote ? `${format(quote.totalToman)} تومان؛ هر درهم ${format(quote.exchangeRate)} تومان` : 'تا دریافت نرخ معتبر، عددی نمایش داده نمی‌شود'],
    ],
    closing: 'این فرمول فقط اجزای محاسبه‌شده در سامانه را توضیح می‌دهد. تخفیف وابسته به حساب، هزینه احتمالی مبدأ، وزن واقعی یا شرایط خاص کالا ممکن است نیاز به بررسی جداگانه داشته باشند؛ درباره هزینه‌های نامشخص و مبلغ نهایی پیش از ادامه سفارش سؤال کنید. تغییر تنظیمات یا ورودی‌ها نتیجه مثال را تغییر می‌دهد.',
  };
  return <div id="cost-example"><ContentEvidence evidence={evidence} mobileStacked /><Link className={styles.cta} href="/#calculator">برآورد کالای خودتان با لینک محصول ←</Link></div>;
}
