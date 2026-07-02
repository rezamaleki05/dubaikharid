'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './Payment.module.css';
import { useSiteSettings } from '@/context/SiteSettingsContext';

// Bank details with logo text/color indicators
const BANK_CARD_PREFIXES = [
  { prefix: '603799', name: 'بانک ملی ایران', color: '#0b2240', text: 'ملی' },
  { prefix: '610433', name: 'بانک ملت', color: '#e60012', text: 'ملت' },
  { prefix: '621986', name: 'بانک سامان', color: '#143d8c', text: 'سامان' },
  { prefix: '627412', name: 'بانک پاسارگاد', color: '#ffcc00', text: 'پاسارگاد' },
  { prefix: '627884', name: 'بانک پارسیان', color: '#821948', text: 'پارسیان' },
  { prefix: '627353', name: 'بانک تجارت', color: '#0058a9', text: 'تجارت' },
  { prefix: '589210', name: 'بانک سپه', color: '#a3704c', text: 'سپه' },
  { prefix: '603769', name: 'بانک صادرات', color: '#004c8f', text: 'صادرات' },
  { prefix: '603770', name: 'بانک کشاورزی', color: '#00843d', text: 'کشاورزی' },
  { prefix: '636214', name: 'بانک آینده', color: '#8a6d3b', text: 'آینده' }
];

export default function PaymentGateway() {
  return (
    <Suspense fallback={<div className={styles.loadingOverlay}><div className={styles.spinner}></div><h3>در حال بارگذاری درگاه پرداخت شتاب...</h3></div>}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const { settings } = useSiteSettings();
  const searchParams = useSearchParams();

  // Search parameters
  const amount = searchParams.get('amount') || '0';
  const trackingCode = searchParams.get('tracking') || 'DKHARID-00000';
  const productName = searchParams.get('prodName') || 'کالای سفارشی دبی';
  const customerName = searchParams.get('customer') || 'خریدار محترم';
  const phone = searchParams.get('phone') || '';
  const address = searchParams.get('address') || '';
  const notes = searchParams.get('notes') || '';

  // Step state: 1 = Form input, 2 = Loading transaction, 3 = Success Receipt
  const [step, setStep] = useState(1);

  // Form Fields States
  const [cardNumber, setCardNumber] = useState('');
  const [cvv2, setCvv2] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Active focused input for virtual keypad
  const [focusedInput, setFocusedInput] = useState('card'); // 'card', 'cvv2', 'month', 'year', 'captcha', 'otp'

  // Captcha security Code
  const [captchaCode, setCaptchaCode] = useState('');
  
  // Timer States
  const [gatewayTimer, setGatewayTimer] = useState(600); // 10 minutes
  const [otpTimer, setOtpTimer] = useState(0); // 120 seconds
  const [otpSentCode, setOtpSentCode] = useState('');

  const [errors, setErrors] = useState({});
  const [bankDetail, setBankDetail] = useState(null);

  // Expiration reference
  const timerRef = useRef(null);
  const otpRef = useRef(null);

  // Generate Captcha on mount
  useEffect(() => {
    generateCaptcha();
    
    // Gateway 10m countdown
    timerRef.current = setInterval(() => {
      setGatewayTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          alert('زمان معتبر برای پرداخت سفارش شما به پایان رسید.');
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(otpRef.current);
    };
  }, []);

  // Detect bank logo in real-time
  useEffect(() => {
    const rawNumber = cardNumber.replace(/[^0-9]/g, '');
    if (rawNumber.length >= 6) {
      const match = BANK_CARD_PREFIXES.find(b => rawNumber.startsWith(b.prefix));
      setBankDetail(match || { name: 'شتاب عمومی', color: '#0b2240', text: 'شتاب' });
    } else {
      setBankDetail(null);
    }
  }, [cardNumber]);

  // Captcha generator
  const generateCaptcha = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setCaptchaCode(num.toString());
    setCaptchaInput('');
  };

  // OTP Simulated SMS Alerts trigger
  const handleRequestOtp = () => {
    if (cardNumber.replace(/[^0-9]/g, '').length < 16) {
      setErrors(prev => ({ ...prev, card: 'لطفاً شماره کارت ۱۶ رقمی را کامل کنید.' }));
      return;
    }

    const randCode = Math.floor(10000 + Math.random() * 90000);
    setOtpSentCode(randCode.toString());
    setOtpTimer(120);

    // Dynamic countdown
    if (otpRef.current) clearInterval(otpRef.current);
    otpRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(otpRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Trigger browser SMS notification alert
    setTimeout(() => {
      alert(`✉️ پیامک بانک صادرکننده کارت:\n\nرمز پویای شما: ${randCode}\nمدت اعتبار: ۱۲۰ ثانیه\nسایت پذیرنده: دبی خرید شتاب\nمبلغ تراکنش: ${fmtToman(amount)} T`);
    }, 400);
  };

  // Formatting utilities
  const fmtToman = (n) => Math.round(parseFloat(n)).toLocaleString('fa-IR');
  const fmtRials = (n) => Math.round(parseFloat(n) * 10).toLocaleString('fa-IR');
  
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle Card input formatting (adds hyphens automatically)
  const handleCardNumberChange = (val) => {
    const rawVal = val.replace(/[^0-9]/g, '').slice(0, 16);
    let formatted = '';
    for (let i = 0; i < rawVal.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += rawVal[i];
    }
    setCardNumber(formatted);
    if (errors.card) setErrors(prev => ({ ...prev, card: '' }));
  };

  // Virtual numeric keypad entries
  const handleKeypadPress = (num) => {
    if (focusedInput === 'card') {
      const raw = cardNumber.replace(/[^0-9]/g, '') + num;
      handleCardNumberChange(raw);
    } else if (focusedInput === 'cvv2') {
      setCvv2(prev => (prev + num).slice(0, 4));
    } else if (focusedInput === 'month') {
      setExpMonth(prev => (prev + num).slice(0, 2));
    } else if (focusedInput === 'year') {
      setExpYear(prev => (prev + num).slice(0, 2));
    } else if (focusedInput === 'captcha') {
      setCaptchaInput(prev => (prev + num).slice(0, 4));
    } else if (focusedInput === 'otp') {
      setOtpInput(prev => (prev + num).slice(0, 5));
    }
  };

  // Handle pay submission & local storage lead state changes
  const handlePay = (e) => {
    e.preventDefault();
    const newErrors = {};

    const cleanCard = cardNumber.replace(/[^0-9]/g, '');
    if (cleanCard.length < 16) newErrors.card = 'شماره کارت وارد شده معتبر نیست.';
    if (cvv2.length < 3 || cvv2.length > 4) newErrors.cvv2 = 'کد CVV2 معتبر نیست.';
    if (!expMonth || parseInt(expMonth) < 1 || parseInt(expMonth) > 12) newErrors.expiry = 'ماه انقضا معتبر نیست.';
    if (!expYear) newErrors.expiry = 'سال انقضا معتبر نیست.';
    if (captchaInput !== captchaCode) newErrors.captcha = 'کد امنیتی صحیح نیست.';
    if (!otpInput || otpInput !== otpSentCode) newErrors.otp = 'رمز پویا وارد شده صحیح نیست.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Switch step to loading
    setStep(2);

    setTimeout(() => {
      // Find order in dubaiKharidLeads, update status to 'processing' and paymentStatus to 'paid'
      try {
        const saved = localStorage.getItem('dubaiKharidLeads');
        if (saved) {
          const list = JSON.parse(saved);
          const order = list.find(l => l.id === trackingCode);
          
          if (order) {
            // Update order status and paymentStatus
            const updated = list.map(l => {
              if (l.id === trackingCode) {
                return { ...l, status: 'processing', paymentStatus: 'paid' };
              }
              return l;
            });
            localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));

            // 1. Decrement warehouse products stock (for iran_inventory)
            try {
              const savedWarehouse = localStorage.getItem('dubaiKharidWarehouseProducts');
              if (savedWarehouse) {
                const warehouseList = JSON.parse(savedWarehouse);
                let warehouseUpdated = false;
                
                const updatedWarehouse = warehouseList.map(wp => {
                  const matchedItem = (order.items || []).find(item => 
                    item.sku === wp.sku || 
                    item.id === wp.id || 
                    (item.name && wp.name && (
                      item.name.toLowerCase().includes(wp.name.toLowerCase()) ||
                      wp.name.toLowerCase().includes(item.name.toLowerCase())
                    ))
                  );
                  
                  if (matchedItem) {
                    warehouseUpdated = true;
                    return {
                      ...wp,
                      stock: Math.max(0, wp.stock - (matchedItem.quantity || 1)),
                      history: [
                        ...(wp.history || []),
                        {
                          action: 'decrease',
                          qty: matchedItem.quantity || 1,
                          user: 'سیستم (پرداخت آنلاین)',
                          date: new Date().toLocaleDateString('fa-IR'),
                          reason: `فروش آنلاین سفارش ${order.id}`
                        }
                      ]
                    };
                  }
                  return wp;
                });
                
                if (warehouseUpdated) {
                  localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(updatedWarehouse));
                }
              }
            } catch (err) {
              console.error('Failed to update warehouse stock:', err);
            }
            
            // 2. Decrement uploaded products (laptops) stock status (for stock_laptop)
            try {
              const savedUploaded = localStorage.getItem('dubaiKharidUploadedProducts');
              if (savedUploaded) {
                const uploadedList = JSON.parse(savedUploaded);
                let uploadedUpdated = false;
                
                const updatedUploaded = uploadedList.map(up => {
                  const matchedItem = (order.items || []).find(item => 
                    item.id === up.id || 
                    (item.name && up.name && (
                      item.name.toLowerCase().includes(up.name.toLowerCase()) ||
                      up.name.toLowerCase().includes(item.name.toLowerCase())
                    ))
                  );
                  
                  if (matchedItem) {
                    uploadedUpdated = true;
                    return {
                      ...up,
                      stockStatus: 'sold'
                    };
                  }
                  return up;
                });
                
                if (uploadedUpdated) {
                  localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(updatedUploaded));
                }
              }
            } catch (err) {
              console.error('Failed to update uploaded laptops stock:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to update payment status in Admin leads:', err);
      }

      setStep(3); // Receipt step
    }, 2200);
  };

  // Transition helper
  const handleCancelPayment = () => {
    if (confirm('آیا از پرداخت انصراف می‌دهید؟ پیش‌فاکتور شما به صورت بررسی واتساپ ذخیره خواهد شد.')) {
      window.location.href = '/';
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Dynamic Shetab Header */}
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src={settings.siteLogoUrl} alt={settings.siteName} className={styles.shaparakLogo} style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <div className={styles.headerText}>
            <h1>درگاه پرداخت الکترونیک شاپرک</h1>
            <span>سامانه شبکه الکترونیکی پرداخت کارت‌های عضو شتاب</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffcc00', fontWeight: 'bold', fontSize: '13px' }}>
          <span>🛡️ درگاه پرداخت امن و معتبر</span>
        </div>
      </header>

      {/* STEP 1: SHAPARAK GATEWAY INTERFACE */}
      {step === 1 && (
        <main className={styles.gatewayContainer}>
          
          {/* Card entry form */}
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>مشخصات کارت بانکی خود را وارد کنید</h2>
            
            <div className={styles.formGrid}>
              
              {/* Form entries column */}
              <form onSubmit={handlePay}>
                
                {/* 1. Card Number */}
                <div className={styles.inputGroup}>
                  <label>شماره کارت ۱۶ رقمی:</label>
                  <div className={styles.cardNumberWrapper}>
                    {bankDetail && (
                      <div 
                        className={styles.bankLogoInline}
                        style={{ background: bankDetail.color, color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                      >
                        {bankDetail.text}
                      </div>
                    )}
                    <input 
                      type="text"
                      className={styles.cardNumInput}
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      onFocus={() => setFocusedInput('card')}
                      placeholder="XXXX - XXXX - XXXX - XXXX"
                      required
                    />
                  </div>
                  {errors.card && <span style={{ color: '#ff3333', fontSize: '11px', fontWeight: 'bold' }}>{errors.card}</span>}
                </div>

                {/* 2. CVV2 & Expiry date row */}
                <div className={styles.formRowSplit}>
                  
                  {/* CVV2 */}
                  <div className={styles.inputGroup}>
                    <label>کد CVV2 کارت:</label>
                    <input 
                      type="password"
                      className={styles.formInput}
                      value={cvv2}
                      onChange={(e) => setCvv2(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      onFocus={() => setFocusedInput('cvv2')}
                      placeholder="۳ یا ۴ رقم پشت کارت"
                      required
                    />
                    {errors.cvv2 && <span style={{ color: '#ff3333', fontSize: '11px', fontWeight: 'bold' }}>{errors.cvv2}</span>}
                  </div>

                  {/* Expiry date */}
                  <div className={styles.inputGroup}>
                    <label>تاریخ انقضای کارت (ماه / سال):</label>
                    <div className={styles.expiryGrid}>
                      <input 
                        type="text"
                        className={styles.formInput}
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                        onFocus={() => setFocusedInput('month')}
                        placeholder="ماه"
                        style={{ textAlign: 'center' }}
                        required
                      />
                      <span className={styles.expirySlash}>/</span>
                      <input 
                        type="text"
                        className={styles.formInput}
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                        onFocus={() => setFocusedInput('year')}
                        placeholder="سال"
                        style={{ textAlign: 'center' }}
                        required
                      />
                    </div>
                    {errors.expiry && <span style={{ color: '#ff3333', fontSize: '11px', fontWeight: 'bold' }}>{errors.expiry}</span>}
                  </div>

                </div>

                {/* 3. Captcha module */}
                <div className={styles.formRowSplit}>
                  
                  <div className={styles.inputGroup}>
                    <label>کد امنیتی (تصویر روبرو):</label>
                    <input 
                      type="text"
                      className={styles.formInput}
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      onFocus={() => setFocusedInput('captcha')}
                      placeholder="کد ۴ رقمی روبرو را وارد کنید"
                      required
                    />
                    {errors.captcha && <span style={{ color: '#ff3333', fontSize: '11px', fontWeight: 'bold' }}>{errors.captcha}</span>}
                  </div>

                  <div className={styles.inputGroup} style={{ justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <div className={styles.captchaContainer}>
                      <div className={styles.captchaImageBlock}>
                        {captchaCode}
                      </div>
                      <button 
                        type="button" 
                        onClick={generateCaptcha} 
                        className={styles.captchaRefreshBtn}
                        title="تازه سازی کد امنیتی"
                      >
                        🔄
                      </button>
                    </div>
                  </div>

                </div>

                {/* 4. Dynamic OTP password module */}
                <div className={styles.inputGroup}>
                  <label>رمز دوم پویا:</label>
                  <div className={styles.otpWrapper}>
                    <input 
                      type="password"
                      className={styles.formInput}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      onFocus={() => setFocusedInput('otp')}
                      placeholder="رمز ایستای دوم یا رمز پویای دریافتی"
                      required
                    />
                    <button 
                      type="button"
                      onClick={handleRequestOtp}
                      className={styles.requestOtpBtn}
                      disabled={otpTimer > 0}
                    >
                      {otpTimer > 0 ? `ارسال مجدد (${otpTimer} ثانیه)` : 'درخواست رمز پویا'}
                    </button>
                  </div>
                  {errors.otp && <span style={{ color: '#ff3333', fontSize: '11px', fontWeight: 'bold' }}>{errors.otp}</span>}
                </div>

                {/* Form Action buttons */}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.payBtn}>
                    پرداخت آنلاین و نهایی‌سازی سفارش
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancelPayment} 
                    className={styles.cancelBtn}
                  >
                    انصراف از پرداخت
                  </button>
                </div>

              </form>

              {/* Left Column: Virtual Numeric Pad */}
              <div className={styles.keypadCard}>
                <span className={styles.keypadTitle}>⌨️ صفحه کلید امن شتاب</span>
                <div className={styles.keypadGrid}>
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => (
                    <button 
                      key={n}
                      type="button" 
                      onClick={() => handleKeypadPress(n.toString())}
                      className={styles.keypadBtn}
                    >
                      {n}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => {
                      if (focusedInput === 'card') setCardNumber('');
                      else if (focusedInput === 'cvv2') setCvv2('');
                      else if (focusedInput === 'month') setExpMonth('');
                      else if (focusedInput === 'year') setExpYear('');
                      else if (focusedInput === 'captcha') setCaptchaInput('');
                      else if (focusedInput === 'otp') setOtpInput('');
                    }}
                    className={styles.keypadBtn}
                    style={{ background: '#f5f5f5', color: '#ff3333', fontSize: '10px' }}
                  >
                    پاک کردن
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleKeypadPress('0')}
                    className={styles.keypadBtn}
                  >
                    0
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (focusedInput === 'card') handleCardNumberChange(cardNumber.replace(/[^0-9]/g, '').slice(0, -1));
                      else if (focusedInput === 'cvv2') setCvv2(prev => prev.slice(0, -1));
                      else if (focusedInput === 'month') setExpMonth(prev => prev.slice(0, -1));
                      else if (focusedInput === 'year') setExpYear(prev => prev.slice(0, -1));
                      else if (focusedInput === 'captcha') setCaptchaInput(prev => prev.slice(0, -1));
                      else if (focusedInput === 'otp') setOtpInput(prev => prev.slice(0, -1));
                    }}
                    className={styles.keypadBtn}
                    style={{ background: '#f5f5f5', color: '#555', fontSize: '10px' }}
                  >
                    حذف قلم
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Panel: Merchant Details */}
          <div className={styles.merchantCard}>
            <div className={styles.merchantHeader}>
              <div className={styles.merchantAvatar}>✈️</div>
              <div>
                <h2>پذیرنده: {settings.siteName}</h2>
                <span>{settings.siteUrl}</span>
              </div>
            </div>
            
            <div className={styles.merchantBody}>
              <div className={styles.merchantRow}>
                <label>کد رهگیری فاکتور:</label>
                <span style={{ fontFamily: 'monospace', color: '#ff781f' }}>{trackingCode}</span>
              </div>
              <div className={styles.merchantRow}>
                <label>محصول خریداری شده:</label>
                <span style={{ maxWidth: '180px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} title={productName}>
                  {productName}
                </span>
              </div>
              <div className={styles.merchantRow}>
                <label>زمان باقی‌مانده تراکنش:</label>
                <span className={styles.timerGlow}>{formatTime(gatewayTimer)}</span>
              </div>

              {/* Amount Box */}
              <div className={styles.amountContainer}>
                <span className={styles.amountLabel}>مبلغ قابل پرداخت نهایی:</span>
                <div className={styles.amountVal}>
                  {fmtToman(amount)} <span className={styles.amountUnit}>تومان</span>
                </div>
                <span className={styles.amountRial}>معادل: {fmtRials(amount)} ریال</span>
              </div>
            </div>
          </div>

        </main>
      )}

      {/* STEP 2: GATEWAY PROCESSING LOADER */}
      {step === 2 && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <h3>در حال اتصال و تایید تراکنش در شبکه شتاب...</h3>
          <p>لطفاً پنجره مرورگر خود را نبندید یا دکمه برگشت را نزنید.</p>
        </div>
      )}

      {/* STEP 3: TRANSACTION SUCCESS RECEIPT SCREEN */}
      {step === 3 && (
        <div className={styles.receiptOverlay}>
          <div className={styles.receiptCard}>
            
            <div className={styles.receiptBanner}>
              <div className={styles.successCircle}>✓</div>
              <h2>تراکنش شتاب با موفقیت انجام شد!</h2>
              <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '6px' }}>پرداخت پیش‌فاکتور لپ‌تاپ {settings.siteName} تایید گردید.</p>
            </div>

            <div className={styles.receiptBody}>
              <div className={styles.receiptRow}>
                <label>پذیرنده فروشگاهی:</label>
                <span>{settings.siteName} ({settings.siteUrl.toUpperCase()})</span>
              </div>
              <div className={styles.receiptRow}>
                <label>مبلغ پرداخت شده:</label>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{fmtToman(amount)} تومان</span>
              </div>
              <div className={styles.receiptRow}>
                <label>کد رهگیری خرید:</label>
                <span style={{ color: '#ff781f', fontFamily: 'monospace' }}>{trackingCode}</span>
              </div>
              <div className={styles.receiptRow}>
                <label>شماره مرجع تراکنش (RRN):</label>
                <span style={{ fontFamily: 'monospace' }}>REF-{Math.floor(100000000 + Math.random() * 900000000)}</span>
              </div>
              <div className={styles.receiptRow}>
                <label>کارت استفاده شده:</label>
                <span style={{ fontFamily: 'monospace' }}>
                  {cardNumber ? `${cardNumber.slice(0, 7)}**-****-${cardNumber.slice(-4)}` : '****-****-****-****'}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <label>وضعیت تراکنش شتاب:</label>
                <span className={styles.receiptStatusBadge}>✓ پرداخت شده قطعی</span>
              </div>

              <div style={{ marginTop: '20px', background: '#f8f9fc', border: '1px solid #e1e4ed', borderRadius: '10px', padding: '16px', fontSize: '11.5px', color: '#7e8b9b', lineHeight: '1.7', textAlign: 'right' }}>
                📦 <strong>پیام کارگو {settings.siteName}:</strong> سفارش خرید لپ‌تاپ شما با موفقیت ثبت قطعی شد. کارشناسان ما جهت هماهنگی بسته‌بندی، کارگو اختصاصی هوایی و شماره بیمه‌نامه تا حداکثر <strong>۳۰ دقیقه آینده</strong> با شماره همراه شما تماس خواهند گرفت.
              </div>

              <button 
                type="button" 
                onClick={() => { window.location.href = '/'; }} 
                className={styles.doneBtn}
              >
                فهمیدم، بازگشت به فروشگاه
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Authentic security warning guide banner at the bottom */}
      {step === 1 && (
        <section className={styles.guidelineCard}>
          <div className={styles.guidelineInner}>
            <div className={styles.guidelineIcon}>🛡️</div>
            <div className={styles.guidelineText}>
              <h4>راهنمای استفاده و نکات امنیتی درگاه شاپرک:</h4>
              <p>
                ۱. هرگز اطلاعات کارت بانکی خود را در سایت‌های متفرقه وارد نکنید. همواره اطمینان حاصل کنید که آدرس بار مرورگر شما با پیشوند رسمی <strong>https</strong> شروع می‌شود.<br />
                ۲. برای ورود رمزهای حساس (کد CVV2 و رمز دوم پویا)، استفاده از صفحه کلید امن شتاب که در درگاه شاپرک قرار داده شده است توصیه می‌گردد تا از فیشینگ‌های کی‌لاگر جلوگیری شود.<br />
                ۳. رمز دوم پویا (OTP) پیامک شده توسط بانک صادرکننده را بلافاصله وارد کنید. این رمزها تنها برای مدت ۱۲۰ ثانیه معتبر خواهند بود.
              </p>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
