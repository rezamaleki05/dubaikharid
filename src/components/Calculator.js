'use client';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { calculateProductPricing } from '@/lib/pricing';

import { useState, useEffect, useRef } from 'react';
import styles from './Calculator.module.css';

export default function Calculator({ initialValues, onOrderSubmit }) {
  const { settings } = useSiteSettings();

  // State Variables
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedItem, setDetectedItem] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [categorySuggestion, setCategorySuggestion] = useState(null);
  
  const [category, setCategory] = useState('bags');
  const [priceAed, setPriceAed] = useState('');
  const [weightClass, setWeightClass] = useState('light'); // 'light', 'medium', 'heavy'

  const calculatorRef = useRef(null);
  const previewControllerRef = useRef(null);
  const previewRequestIdRef = useRef(0);

  // Categories config
  const categoriesConfig = {
    bags: { name: 'کیف و اکسسوری', customsRate: 0.12, cargoRate: 280000 },
    shoes: { name: 'کفش ورزشی و مجلسی', customsRate: 0.15, cargoRate: 280000 },
    electronics: { name: 'لپ‌تاپ و الکترونیک', customsRate: 0.08, cargoRate: 350000 },
    clothing: { name: 'پوشاک و لباس', customsRate: 0.18, cargoRate: 250000 },
    beauty: { name: 'زیبایی و سلامت', customsRate: 0.14, cargoRate: 300000 },
    others: { name: 'سایر کالاها', customsRate: 0.10, cargoRate: 280000 }
  };

  const weightValues = {
    light: 0.5,
    medium: 1.5,
    heavy: 4.0
  };

  // Synchronize when parent passes values
  useEffect(() => {
    if (initialValues) {
      Promise.resolve().then(() => {
        if (initialValues.link) setLink(initialValues.link);
        if (initialValues.price) setPriceAed(initialValues.price);
        if (initialValues.weight) {
          if (initialValues.weight <= 1) setWeightClass('light');
          else if (initialValues.weight <= 3) setWeightClass('medium');
          else setWeightClass('heavy');
        }
        if (initialValues.category) setCategory(initialValues.category);
        if (initialValues.name) {
          setProductTitle(initialValues.name);
          setDetectedItem({ name: initialValues.name, brand: initialValues.brand || 'برند اورجینال', store: 'فروشگاه دبی' });
        }
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [initialValues]);

  useEffect(() => () => previewControllerRef.current?.abort(), []);

  const handleLinkChange = (e) => {
    const url = e.target.value;
    previewControllerRef.current?.abort();
    previewRequestIdRef.current += 1;
    setLink(url);
    setLookupError('');
    setLookupSuccess('');
    setDetectedItem(null);
    setProductTitle('');
    setCategorySuggestion(null);
    setPriceAed('');
    setLoading(false);
  };

  const handleProductPreview = async () => {
    const targetUrl = link.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      setLookupError('لطفاً لینک کامل و معتبر محصول را وارد کنید.');
      return;
    }
    previewControllerRef.current?.abort();
    const controller = new AbortController();
    previewControllerRef.current = controller;
    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;
    setLoading(true);
    setLookupError('');
    setLookupSuccess('');

    try {
      const response = await fetch('/api/product-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'PRODUCT_FETCH_FAILED');
      if (previewRequestIdRef.current !== requestId) return;

      const fields = payload.fields || {};
      setDetectedItem({
        name: fields.title || '',
        brand: fields.brand || '',
        store: payload.sourceLabel || payload.source || 'فروشگاه دبی',
        imageUrl: fields.imageUrl || '',
        variant: fields.variant || '',
      });
      setProductTitle(fields.title || '');
      setPriceAed(fields.priceAed ?? '');
      setCategorySuggestion(fields.categorySuggestion || null);
      if (fields.categorySuggestion && payload.confidence?.categorySuggestion === 'high') {
        setCategory(fields.categorySuggestion);
      }
      setLookupSuccess(`اطلاعات محصول از ${payload.sourceLabel || payload.source || 'فروشگاه'} دریافت شد.`);
      if (!fields.priceAed) {
        setLookupError('قیمت معتبر AED تشخیص داده نشد؛ لطفاً قیمت واقعی را دستی وارد کنید.');
      }
    } catch (error) {
      if (error?.name === 'AbortError' || previewRequestIdRef.current !== requestId) return;
      setDetectedItem(null);
      setLookupError('اطلاعات محصول خودکار دریافت نشد؛ لطفاً موارد زیر را دستی وارد کنید.');
    } finally {
      if (previewRequestIdRef.current === requestId) setLoading(false);
    }
  };

  // Calculations
  const currentCategoryConfig = categoriesConfig[category] || categoriesConfig.others;
  const numPrice = parseFloat(priceAed) || 0;
  const weightVal = weightValues[weightClass];
  
  let pricing = { billableWeight: 0, shippingAed: 0, commissionAed: 0, totalToman: 0 };
  try {
    pricing = calculateProductPricing({ priceAed: numPrice, weight: weightVal }, settings);
  } catch {}
  const roundedWeight = pricing.billableWeight;
  const shippingAed = pricing.shippingAed;
  const commissionAed = pricing.commissionAed;
  const totalToman = pricing.totalToman;

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('fa-IR');
  };

  const handleOrder = () => {
    if (!/^https?:\/\//i.test(link.trim())) {
      setLookupError('لطفاً لینک کامل و معتبر محصول را وارد کنید.');
      return;
    }
    if (onOrderSubmit) {
      onOrderSubmit({
        link: link.trim(),
        productName: productTitle.trim() || `${currentCategoryConfig.name} دبی`,
        store: detectedItem?.store || 'فروشگاه دبی',
        priceAed: numPrice,
        weight: weightVal,
        totalToman,
        ...(initialValues?.laptopId && (initialValues.link || '') === link ? {
          items: [{ id: initialValues.laptopId, laptopId: initialValues.laptopId, product_type: 'laptop_stock', quantity: 1 }],
        } : {}),
      });
    }
  };

  return (
    <section id="calculator" ref={calculatorRef} className={styles.calculatorSection}>
      <div className={`container ${styles.calcContainer}`}>
        
        {/* LEFT SIDE: Text and Trust Bar */}
        <div className={styles.leftCol}>
          <div className={styles.heroTextContent}>
            <h2>
              استعلام سریع<br/>
              <span className={styles.heroHighlight}>قیمت خرید از دبی</span>
            </h2>
            <p>لینک محصول را وارد کنید تا هزینه تقریبی نهایی به همراه نام محصول و فروشگاه نمایش داده شود.</p>
          </div>

          <div className={styles.trustBar}>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div className={styles.trustText}>
                <h4>پشتیبانی واتساپ</h4>
                <p>پاسخگویی سریع در واتساپ<br/>در تمام روزهای هفته</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              </div>
              <div className={styles.trustText}>
                <h4>تضمین اصالت</h4>
                <p>ضمانت ۱۰۰٪ اصالت کالا<br/>از برندهای معتبر</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div className={styles.trustText}>
                <h4>ارسال سریع</h4>
                <p>تحویل سریع و مطمئن<br/>به سراسر ایران</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form Card */}
        <div className={styles.rightCol}>
          <div className={styles.formCard}>
            
            <div className={styles.formHeader}>
              <div className={styles.headerTitleWrap}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87820" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <h2>استعلام و ثبت درخواست خرید از دبی</h2>
              </div>
              <p>اطلاعات محصول و شماره تماس خود را وارد کنید</p>
            </div>

            <div className={styles.formBody}>
              {/* Product Link */}
              <div className={styles.fieldWrapper}>
                <label>لینک محصول</label>
                <div className={styles.linkLookupRow}>
                  <div className={styles.inputContainer}>
                    <input
                      type="text"
                      placeholder="https://www.noon.com/uae-en/product/..."
                      value={link}
                      onChange={handleLinkChange}
                      dir="ltr"
                    />
                    <div className={styles.inputIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    </div>
                  </div>
                  <button type="button" className={styles.previewBtn} onClick={handleProductPreview} disabled={loading || !link.trim()}>
                    {loading ? 'در حال دریافت...' : 'دریافت اطلاعات محصول'}
                  </button>
                </div>
              </div>

              {/* Detected Product Preview */}
              {detectedItem && (
                <div className={styles.productPreview}>
                  {detectedItem.imageUrl && (
                    <div className={styles.productThumb}>
                      <img src={detectedItem.imageUrl} alt={detectedItem.name} onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} />
                    </div>
                  )}
                  <div className={styles.productInfo}>
                    <h3>{detectedItem.name || 'عنوان محصول تشخیص داده نشد'}</h3>
                    <div className={styles.storeTag}>
                      <span className={styles.storeDot}></span>
                      {detectedItem.store}
                    </div>
                    {detectedItem.brand && <span className={styles.detectedBrand}>{detectedItem.brand}</span>}
                    {detectedItem.variant && <span className={styles.detectedBrand}>گزینه: {detectedItem.variant}</span>}
                  </div>
                </div>
              )}
              {loading && (
                <div className={styles.productPreviewLoading}>
                  در حال بررسی لینک...
                </div>
              )}
              {lookupError && (
                <p role="alert" style={{ color: '#fca5a5', fontSize: '12px', margin: '8px 0 0' }}>{lookupError}</p>
              )}
              {lookupSuccess && (
                <p role="status" className={styles.lookupSuccess}>{lookupSuccess}</p>
              )}

              <div className={styles.fieldWrapper}>
                <label>نام محصول</label>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="نام کامل محصول را وارد کنید"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    maxLength={300}
                  />
                </div>
              </div>

              {/* 3 Columns Row */}
              <div className={styles.threeColGrid}>
                {/* Category */}
                <div className={styles.fieldWrapper}>
                  <label>دسته‌بندی محصول</label>
                  <div className={styles.inputContainer}>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="bags">کیف و اکسسوری</option>
                      <option value="shoes">کفش ورزشی و مجلسی</option>
                      <option value="electronics">لپ‌تاپ و الکترونیک</option>
                      <option value="clothing">پوشاک و لباس</option>
                      <option value="beauty">زیبایی و سلامت</option>
                      <option value="others">سایر کالاها</option>
                    </select>
                  </div>
                  {categoriesConfig[categorySuggestion]?.name && (
                    <p className={styles.fieldHint}>دسته پیشنهادی: {categoriesConfig[categorySuggestion].name}</p>
                  )}
                </div>

                {/* Weight Segmented */}
                <div className={styles.fieldWrapper}>
                  <label>وزن تقریبی محصول</label>
                  <div className={styles.segmentedControl}>
                    <button 
                      className={`${styles.segmentBtn} ${weightClass === 'heavy' ? styles.active : ''}`}
                      onClick={() => setWeightClass('heavy')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      سنگین
                    </button>
                    <button 
                      className={`${styles.segmentBtn} ${weightClass === 'medium' ? styles.active : ''}`}
                      onClick={() => setWeightClass('medium')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      متوسط
                    </button>
                    <button 
                      className={`${styles.segmentBtn} ${weightClass === 'light' ? styles.active : ''}`}
                      onClick={() => setWeightClass('light')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="6.5"/></svg>
                      سبک
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className={styles.fieldWrapper}>
                  <label>قیمت تقریبی (درهم)</label>
                  <div className={styles.inputContainer}>
                    <input
                      type="number"
                      placeholder="599"
                      value={priceAed}
                      onChange={(e) => setPriceAed(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className={styles.actionBox}>
                <div className={styles.totalWrap}>
                  <div className={styles.totalIconWrap}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="16" y1="18" x2="16.01" y2="18"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="8" y1="18" x2="8.01" y2="18"/></svg>
                  </div>
                  <div className={styles.totalContent}>
                    <div className={styles.totalLabel}>برآورد اولیه:</div>
                    <div className={styles.totalAmount}>
                      <span className={styles.totalValue}>{totalToman > 0 ? formatNumber(totalToman) : '۰'}</span>
                      <span className={styles.totalCurrency}>تومان</span>
                    </div>
                    <p className={styles.totalNote}>مبلغ نهایی پس از بررسی کارشناسان دبی خرید اعلام می‌شود.</p>
                  </div>
                </div>
                
                <button className={styles.submitBtn} onClick={handleOrder}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  ثبت درخواست خرید
                </button>
              </div>

              <div className={styles.secureNote}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87820" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                با ثبت درخواست، کارشناسان ما برای بررسی قیمت نهایی با شما تماس خواهند گرفت.
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
