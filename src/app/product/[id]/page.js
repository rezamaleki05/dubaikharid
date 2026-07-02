'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { use, useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductById, getProductType } from '@/data/products';
import { useCart } from '@/context/CartContext';
import CheckoutModal from '@/components/CheckoutModal';
import styles from './Product.module.css';

// Replaced hardcoded exchange rate
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

// Colors to Hex mapping for circular swatches
const colorMap = {
  'مشکی': '#000000',
  'سفید': '#ffffff',
  'طوسی': '#808080',
  'سرمه‌ای': '#0c2340',
  'کرم': '#e6d7c3',
  'خردلی': '#e1ad01',
  'زیتونی': '#556b2f',
  'آبی تیره': '#000080',
  'ذغالی': '#36454f',
  'آبی روشن': '#add8e6',
  'طوسی ملانژ': '#a9a9a9',
  'طوسی روشن': '#d3d3d3',
  'سبز یشمی': '#1e4620',
  'آبی-طوسی': '#708090',
  'سفید-قرمز': 'linear-gradient(135deg, #ffffff 50%, #ff0000 50%)',
  'مشکی-سفید': 'linear-gradient(135deg, #000000 50%, #ffffff 50%)',
  'طوسی-نارنجی': 'linear-gradient(135deg, #808080 50%, #f87820 50%)',
  'مولتی‌کالر گل‌دار': 'linear-gradient(45deg, #ff007f, #ff8c00, #00ffc4, #0077ff)',
  'قهوه‌ای': '#5c4033',
  'سبز نعنایی': '#a3e4d7',
  'صورتی': '#ffb6c1',
  'سبز': '#008000',
  'صورتی ملایم': '#ffc0cb',
  'مشکی-طلایی': 'linear-gradient(135deg, #000000 50%, #ffd700 50%)'
};

export default function ProductPage({ params }) {
  const { settings } = useSiteSettings();
  // Unwrap params using React.use() to avoid Next.js sync params warning
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Validation state
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Direct checkout and inquiry modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [directOrderData, setDirectOrderData] = useState(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', notes: '' });
  const [inquiryQty, setInquiryQty] = useState(1);
  const [inquiryColor, setInquiryColor] = useState('');
  const [inquirySize, setInquirySize] = useState('');

  useEffect(() => {
    if (isInquiryOpen && product) {
      setInquiryColor(selectedColor || (product.colors ? product.colors[0] : ''));
      setInquirySize(selectedSize || (product.sizes ? product.sizes[0] : ''));
    }
  }, [isInquiryOpen, product, selectedColor, selectedSize]);

  const handleDirectPayment = () => {
    if (product.colors && !selectedColor) {
      setWarningMessage('لطفاً رنگ مورد نظر خود را انتخاب کنید.');
      setShowWarning(true);
      return;
    }
    if (product.sizes && !selectedSize) {
      setWarningMessage('لطفاً سایز مورد نظر خود را انتخاب کنید.');
      setShowWarning(true);
      return;
    }
    
    setShowWarning(false);
    
    const finalTomanPrice = product.discountPercent && product.discountPercent > 0
      ? tomanPrice * (1 - product.discountPercent / 100)
      : tomanPrice;

    const orderData = {
      price: product.priceAed,
      weight: product.weight || 0.5,
      category: product.category,
      name: product.name,
      brand: product.brand,
      totalToman: finalTomanPrice,
      productName: product.name,
      items: [{
        name: product.name,
        brand: product.brand,
        quantity: 1,
        color: selectedColor || '',
        size: selectedSize || '',
        priceAed: product.priceAed,
        discountPercent: product.discountPercent || 0
      }]
    };

    setDirectOrderData(orderData);
    setIsCheckoutOpen(true);
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || !inquiryForm.phone.trim()) {
      alert('لطفاً نام و شماره تماس خود را وارد کنید.');
      return;
    }
    
    // Convert to english digits
    const toEnglishDigits = (str) => {
      const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return str
        .replace(/[۰-۹]/g, (w) => farsiDigits.indexOf(w))
        .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w));
    };

    const cleanPhone = toEnglishDigits(inquiryForm.phone.trim().replace(/\s+/g, ''));
    if (!/^(?:09|\+989|989|00989)\d{9}$/.test(cleanPhone)) {
      alert('شماره موبایل وارد شده معتبر نیست. (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)');
      return;
    }

    const randNum = Math.floor(10000 + Math.random() * 90000);
    const tracking = `DKHARID-REQ-${randNum}`;

    const newLead = {
      id: tracking,
      customerName: inquiryForm.name.trim(),
      phone: cleanPhone,
      address: 'استعلام قیمت (بدون آدرس اولیه)',
      notes: inquiryForm.notes.trim() || 'درخواست استعلام قیمت محصول خارجی',
      productName: product.name,
      brand: product.brand,
      weight: product.weight || 0.5,
      totalToman: 0,
      priceAed: product.priceAed,
      date: new Date().toISOString(),
      status: 'pending',
      paymentMethod: 'gateway',
      paymentStatus: 'pending',
      img: product.image,
      store: product.store,
      color: inquiryColor || '',
      size: inquirySize || '',
      qty: inquiryQty,
      isRequest: true,
      items: [{
        name: product.name,
        brand: product.brand,
        quantity: inquiryQty,
        color: inquiryColor || '',
        size: inquirySize || '',
        priceAed: product.priceAed,
        discountPercent: product.discountPercent || 0
      }]
    };

    try {
      const existingLeads = JSON.parse(localStorage.getItem('dubaiKharidLeads') || '[]');
      existingLeads.unshift(newLead);
      localStorage.setItem('dubaiKharidLeads', JSON.stringify(existingLeads));
      
      setIsInquiryOpen(false);
      setInquiryForm({ name: '', phone: '', notes: '' });
      setInquiryQty(1);

      alert(`درخواست شما ثبت شد. پس از بررسی قیمت نهایی، وزن واقعی، هزینه ارسال و نرخ روز درهم، قیمت دقیق از طریق واتساپ یا تماس به شما اعلام میشود.\nشناسه درخواست: ${tracking}`);
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت درخواست. لطفاً مجدداً تلاش کنید.');
    }
  };

  // Extract uploader or static technical specs
  const getLaptopSpecs = (prod) => {
    if (!prod) return null;
    if (prod.rawSpecs) {
      const rs = prod.rawSpecs;
      let storageCombined = `${rs.storageSize}${rs.storageType}`;
      if (rs.storage2Type !== 'none' && parseFloat(rs.storage2Size) > 0) {
        storageCombined += ` + ${rs.storage2Size}${rs.storage2Type}`;
      }
      return {
        model: rs.model,
        cpu: rs.cpu,
        ram: `${rs.ram}GB`,
        storage: storageCombined,
        gpu: rs.gpu,
        screenSize: `${rs.screenSize} اینچ`,
        batteryHealth: rs.batteryHealth ? `${rs.batteryHealth}%` : null,
        physicalStatus: rs.physicalStatus === 'excellent' ? 'عالی (در حد نو)' :
                        rs.physicalStatus === 'very_good' ? 'خیلی خوب' :
                        rs.physicalStatus === 'good' ? 'خوب' : 'متوسط',
        serial: rs.serial && rs.serial !== 'نامشخص' ? rs.serial : null,
        warranty: rs.warrantyDays ? `${rs.warrantyDays} روز مهلت تست و گارانتی` : null,
        accessories: rs.accessories ? Object.entries(rs.accessories)
          .filter(([_, checked]) => checked)
          .map(([key]) => key === 'charger' ? 'شارژر اصلی' : 'کارتن اصلی')
          .join(' + ') : null,
        tests: rs.hardwareTests ? rs.hardwareTests : null
      };
    }
    
    // Fallback for static laptops
    if (prod.model || prod.id.startsWith('lap') || prod.category === 'electronics') {
      return {
        model: prod.model || 'M2 2022',
        cpu: prod.cpu || 'Apple M2',
        ram: prod.ram || '8GB',
        storage: prod.storage || '256GB SSD',
        gpu: prod.gpu || 'Apple GPU 8-Core',
        screenSize: prod.screenSize || '13.6 اینچ',
        batteryHealth: '92%',
        physicalStatus: 'عالی (در حد نو)',
        serial: null,
        warranty: '30 روز مهلت تست و تعویض',
        accessories: 'شارژر اصلی دبی',
        tests: { keyboard: true, speaker: true, display: true, usb: true, battery: true, wifi: true, camera: true, charge: true }
      };
    }

    return null;
  };

  const laptopSpecs = (product && (product.category === 'electronics' || product.id.startsWith('lap') || product.id.startsWith('uploaded'))) ? getLaptopSpecs(product) : null;

  useEffect(() => {
    let found = null;
    
    // Check deleted static items first
    if (typeof window !== 'undefined') {
      try {
        const deletedSaved = localStorage.getItem('dubaiKharidDeletedStaticLaptops');
        if (deletedSaved) {
          const deletedIds = JSON.parse(deletedSaved);
          if (deletedIds.includes(id)) {
            setProduct(null);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Check localStorage overrides next
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dubaiKharidUploadedProducts');
        if (saved) {
          const list = JSON.parse(saved);
          found = list.find(p => p.id === id);
        }
      } catch (e) {
        console.error('Error fetching dynamic product override:', e);
      }
    }

    // Fallback to static lists
    if (!found) {
      found = getProductById(id);
    }

    setProduct(found || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div className={styles.notFound} style={{ color: '#8b92a5', padding: '100px', textAlign: 'center' }}>در حال بارگذاری مشخصات محصول...</div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div className={styles.notFound}>محصول مورد نظر یافت نشد.</div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    // Validate selections if color/size options are present
    if (product.colors && !selectedColor) {
      setWarningMessage('لطفاً رنگ مورد نظر خود را انتخاب کنید.');
      setShowWarning(true);
      return;
    }
    if (product.sizes && !selectedSize) {
      setWarningMessage('لطفاً سایز مورد نظر خود را انتخاب کنید.');
      setShowWarning(true);
      return;
    }

    setShowWarning(false);
    addToCart(product, selectedSize, selectedColor);
    
    // Custom Farsi alert confirmation
    alert(`«${product.name}» با موفقیت به سبد خرید افزوده شد.\n${selectedColor ? `رنگ: ${selectedColor}` : ''} ${selectedSize ? `| سایز: ${selectedSize}` : ''}`);
  };

  const tomanPrice = getProductTomanPrice(product, settings);

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContainer}>
        <div className={styles.productGrid}>
          {/* Image Section */}
          <div className={styles.imageSection} style={{ position: 'relative' }}>
            <img src={product.image} alt={product.name} className={styles.mainImage} />
            {product.discountPercent && product.discountPercent > 0 && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#ff3333', color: '#fff', fontSize: '14px', fontWeight: '850', padding: '5px 12px', borderRadius: '6px', boxShadow: '0 0 15px #ff3333', zIndex: 5, direction: 'ltr' }}>
                {product.discountPercent}%-
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className={styles.infoSection} dir="rtl">
            <div className={styles.brandBadge}>{product.brand}</div>
            <h1 className={styles.productName}>{product.name}</h1>
            
            {/* dynamic Specs */}
            {laptopSpecs ? (
              <div className={styles.specsGrid}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>مدل:</span>
                  <span className={styles.specValue}>{laptopSpecs.model}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>پردازنده (CPU):</span>
                  <span className={styles.specValue}>{laptopSpecs.cpu}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>رم (RAM):</span>
                  <span className={styles.specValue}>{laptopSpecs.ram}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>حافظه داخلی:</span>
                  <span className={styles.specValue}>{laptopSpecs.storage}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>کارت گرافیک (GPU):</span>
                  <span className={styles.specValue}>{laptopSpecs.gpu}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>اندازه صفحه:</span>
                  <span className={styles.specValue}>{laptopSpecs.screenSize}</span>
                </div>
              </div>
            ) : (
              <div className={styles.productSpec}>{product.spec}</div>
            )}

            {/* Interactive Color Selector */}
            {product.colors && (
              <div className={styles.attributeBlock}>
                <span className={styles.attributeLabel}>انتخاب رنگ:</span>
                <div className={styles.colorSwatches}>
                  {product.colors.map((color, idx) => {
                    const colorBg = colorMap[color] || '#808080';
                    const isSelected = selectedColor === color;
                    return (
                      <div 
                        key={idx} 
                        className={styles.colorSwatchWrap}
                        onClick={() => { setSelectedColor(color); setShowWarning(false); }}
                      >
                        <div 
                          className={`${styles.colorSwatch} ${isSelected ? styles.colorSwatchSelected : ''}`}
                          style={{ background: colorBg }}
                          title={color}
                        />
                        <span className={styles.colorName}>{color}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Size Selector */}
            {product.sizes && (
              <div className={styles.attributeBlock}>
                <span className={styles.attributeLabel}>انتخاب سایز:</span>
                <div className={styles.sizeGrid}>
                  {product.sizes.map((size, idx) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button 
                        key={idx}
                        type="button"
                        className={`${styles.sizeOption} ${isSelected ? styles.sizeOptionSelected : ''}`}
                        onClick={() => { setSelectedSize(size); setShowWarning(false); }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Validation warning */}
            {showWarning && (
              <div className={styles.validationWarning}>
                {warningMessage}
              </div>
            )}
            
            <div className={styles.productDescription}>
              {product.description || 'اطلاعات کامل و جزئیات دقیق این محصول را می‌توانید از طریق لینک فروشگاه اصلی مشاهده کنید. ما این کالا را به صورت مستقیم از دبی خریداری کرده و درب منزل به شما تحویل می‌دهیم.'}
            </div>

            <div className={styles.priceSection}>
              {getProductType(product) === 'external_product' ? (
                <div>
                  <div className={styles.priceLabel}>قیمت نهایی محصول:</div>
                  <div className={styles.priceValue} style={{ fontSize: '20px', color: '#f87820', fontWeight: 'bold' }}>
                    قیمت نهایی پس از بررسی اعلام می‌شود
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b92a5', marginTop: '6px' }}>
                    (قیمت تقریبی مبدا: {product.priceAed} درهم)
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.priceLabel}>قیمت نهایی با احتساب هزینه‌های ارسال:</div>
                  {product.discountPercent && product.discountPercent > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px', textDecoration: 'line-through', color: '#8b92a5' }}>
                          {fmtToman(tomanPrice)} تومان
                        </span>
                        <span style={{ background: '#ff3333', color: '#fff', fontSize: '14px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 0 10px #ff3333' }}>
                          {product.discountPercent}% تخفیف
                        </span>
                      </div>
                      <div className={styles.priceValue} style={{ color: '#ff3333' }}>
                        {fmtToman(tomanPrice * (1 - product.discountPercent / 100))}
                        <span className={styles.priceUnit} style={{ color: '#ff3333' }}>تومان</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.priceValue}>
                      {fmtToman(tomanPrice)}
                      <span className={styles.priceUnit}>تومان</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.actionSection}>
              {getProductType(product) === 'external_product' ? (
                <div style={{ display: 'flex', gap: '12px', width: '100%', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button 
                      type="button"
                      className={styles.addToCartBtn}
                      onClick={() => setIsInquiryOpen(true)}
                      style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', flex: 1 }}
                    >
                      ثبت درخواست خرید
                    </button>
                    <button 
                      type="button"
                      className={styles.addToCartBtn}
                      onClick={() => setIsInquiryOpen(true)}
                      style={{ background: 'transparent', border: '1.5px solid #f87820', color: '#f87820', flex: 1 }}
                    >
                      استعلام قیمت
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button 
                      type="button"
                      className={styles.addToCartBtn}
                      onClick={handleAddToCart}
                      style={{ flex: 1 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      افزودن به سبد خرید
                    </button>
                    <button 
                      type="button"
                      className={styles.addToCartBtn}
                      onClick={handleDirectPayment}
                      style={{ background: '#2ecc71', color: '#fff', flex: 1 }}
                    >
                      💳 پرداخت آنلاین
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.storeInfo}>
                <span className={styles.storeLabel}>فروشگاه مبدا (دبی):</span>
                <span className={styles.storeName}>{product.store}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Specifications & Tests Dashboard */}
        {laptopSpecs && (
          <div className={styles.technicalPanel} dir="rtl" style={{ marginBottom: '30px' }}>
            <h2 className={styles.technicalTitle}>📋 وضعیت سلامت فیزیکی و تست‌های سخت‌افزاری</h2>
            
            <div className={styles.technicalGrid}>
              
              {/* Left Column: Health and Warranty Stats */}
              <div className={styles.techCard}>
                <h3>⚙️ اصالت و سلامت فنی دستگاه</h3>
                <ul className={styles.techList}>
                  <li>
                    <span>سلامت باتری:</span>
                    <strong style={{ color: '#2ecc71' }}>{laptopSpecs.batteryHealth || 'نامشخص'}</strong>
                  </li>
                  <li>
                    <span>وضعیت ظاهری:</span>
                    <strong style={{ color: '#ff9d00' }}>{laptopSpecs.physicalStatus || 'عالی'}</strong>
                  </li>
                  {laptopSpecs.warranty && (
                    <li>
                      <span>ضمانت و گارانتی:</span>
                      <strong style={{ color: '#ffd073' }}>{laptopSpecs.warranty}</strong>
                    </li>
                  )}
                  {laptopSpecs.accessories && (
                    <li>
                      <span>اقلام همراه لپ‌تاپ:</span>
                      <strong style={{ color: '#fff' }}>{laptopSpecs.accessories}</strong>
                    </li>
                  )}
                  {laptopSpecs.serial && (
                    <li>
                      <span>شماره سریال (S/N):</span>
                      <span style={{ fontFamily: 'monospace', color: '#8b92a5', fontSize: '12px' }}>{laptopSpecs.serial}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Right Column: Hardware Checklist Tests */}
              {laptopSpecs.tests && (
                <div className={styles.techCard}>
                  <h3>🔍 چک‌لیست تست‌های سخت‌افزاری (پاس شده)</h3>
                  <div className={styles.checklistGrid}>
                    {Object.entries(laptopSpecs.tests).map(([testKey, passed]) => {
                      const testLabels = {
                        keyboard: 'تست کیبورد و تاچ‌پد',
                        speaker: 'تست اسپیکر و خروجی صدا',
                        display: 'تست صفحه نمایش و پیکسل',
                        usb: 'تست پورت‌های USB/Type-C',
                        battery: 'تست شارژدهی باتری',
                        wifi: 'تست اتصال Wi-Fi و بلوتوث',
                        camera: 'تست وب‌کم و میکروفون',
                        charge: 'تست اتصال شارژر و آداپتور'
                      };
                      return (
                        <div key={testKey} className={styles.checkItem}>
                          <span style={{ color: passed ? '#2ecc71' : '#ff4d4d', fontSize: '16px', marginLeft: '6px' }}>
                            {passed ? '✓' : '✕'}
                          </span>
                          <span style={{ color: passed ? '#fff' : '#8b92a5', fontSize: '13px' }}>
                            {testLabels[testKey] || testKey}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <ReviewsSection productId={product.id} productName={product.name} />
      </main>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        orderData={directOrderData}
        onClose={() => setIsCheckoutOpen(false)}
        onCartIncrement={() => {
          setIsCheckoutOpen(false);
        }}
      />

      {isInquiryOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#11131a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            color: '#fff',
            direction: 'rtl',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f87820' }}>استعلام قیمت و ثبت درخواست خرید</h2>
              <button 
                onClick={() => setIsInquiryOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#8b92a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <img src={product.image} alt={product.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{product.name}</h4>
                <p style={{ fontSize: '11px', color: '#8b92a5', margin: 0 }}>فروشگاه مبدا: {product.store} | قیمت تقریبی: {product.priceAed} درهم</p>
              </div>
            </div>

            <form onSubmit={handleInquirySubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8b92a5', marginBottom: '6px' }}>نام و نام خانوادگی:</label>
                  <input 
                    type="text" 
                    required 
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: رضا محمدی"
                    style={{
                      width: '100%',
                      background: '#1a1d26',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8b92a5', marginBottom: '6px' }}>شماره تماس (جهت هماهنگی):</label>
                  <input 
                    type="text" 
                    required 
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                    style={{
                      width: '100%',
                      background: '#1a1d26',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      direction: 'ltr',
                      textAlign: 'right'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b92a5', marginBottom: '6px' }}>تعداد:</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={inquiryQty}
                      onChange={(e) => setInquiryQty(parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        background: '#1a1d26',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b92a5', marginBottom: '6px' }}>رنگ:</label>
                    <input 
                      type="text" 
                      value={inquiryColor}
                      onChange={(e) => setInquiryColor(e.target.value)}
                      placeholder="اختیاری"
                      style={{
                        width: '100%',
                        background: '#1a1d26',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b92a5', marginBottom: '6px' }}>سایز:</label>
                    <input 
                      type="text" 
                      value={inquirySize}
                      onChange={(e) => setInquirySize(e.target.value)}
                      placeholder="اختیاری"
                      style={{
                        width: '100%',
                        background: '#1a1d26',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8b92a5', marginBottom: '6px' }}>توضیحات مشتری:</label>
                  <textarea 
                    rows="3" 
                    value={inquiryForm.notes}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="توضیحات رنگ، سایز یا مشخصات مورد نظر خود را بنویسید..."
                    style={{
                      width: '100%',
                      background: '#1a1d26',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  ثبت درخواست استعلام
                </button>
                <button 
                  type="button"
                  onClick={() => setIsInquiryOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// CUSTOMER REVIEWS LOGIC & SEEDS
// ==========================================================================
const MOCK_REVIEWS_SEED = [
  { id: 'seed-1', productId: 'lap1', userName: 'علیرضا زارعی', rating: 5, comment: 'فوق‌العاده تمیز و در حد نو بود. دسته‌بندی استوک دبی خرید حرف نداره. از خریدم خیلی راضی‌ام.', date: '2026-05-15T12:00:00Z', isVerified: true },
  { id: 'seed-2', productId: 'lap1', userName: 'مریم حسینی', rating: 4, comment: 'سرعت و قدرت دستگاه عالیه، فقط کارتن نداشت که خب برای استوک طبیعیه. بسته‌بندی ارسال دی‌جی‌کالایی و محکم بود.', date: '2026-05-20T08:30:00Z', isVerified: true },
  { id: 'seed-3', productId: 'p1', userName: 'امیر قاسمی', rating: 5, comment: 'نایک ایر فورس اصل، فوق‌العاده راحت. مستقیم از امارات اومد و بارکدش کاملا معتبر بود.', date: '2026-05-24T14:20:00Z', isVerified: true },
  { id: 'seed-4', productId: 'w1', userName: 'سارا کریمی', rating: 5, comment: 'جنس نخی خنک و عالی، دقیقا مثل عکسش در سایت مانگو بود. خیلی خوش‌دوخت و زیباست.', date: '2026-05-18T10:15:00Z', isVerified: true },
  { id: 'seed-5', productId: 'ba2', userName: 'رضا صبوری', rating: 5, comment: 'بسیار لوکس و باابهت. موتور اتوماتیک رولکس عالی کار می‌کنه و تمام شناسنامه‌های اصالت رو داشت.', date: '2026-05-22T19:40:00Z', isVerified: true }
];

function ReviewsSection({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', rating: 5, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dubaiKharidReviews');
      let allReviews = [];
      if (saved) {
        allReviews = JSON.parse(saved);
      } else {
        localStorage.setItem('dubaiKharidReviews', JSON.stringify(MOCK_REVIEWS_SEED));
        allReviews = MOCK_REVIEWS_SEED;
      }
      
      const filtered = allReviews.filter(r => r.productId === productId);
      setReviews(filtered);
    } catch (e) {
      console.error('Error loading reviews:', e);
    }
  }, [productId]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.comment.trim()) {
      alert('لطفاً نام و متن نظر خود را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const newReview = {
          id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId,
          productName,
          userName: formData.name.trim(),
          rating: formData.rating,
          comment: formData.comment.trim(),
          date: new Date().toISOString(),
          isVerified: Math.random() > 0.3
        };

        const saved = localStorage.getItem('dubaiKharidReviews');
        const allReviews = saved ? JSON.parse(saved) : [...MOCK_REVIEWS_SEED];
        allReviews.unshift(newReview);
        localStorage.setItem('dubaiKharidReviews', JSON.stringify(allReviews));

        setReviews(prev => [newReview, ...prev]);
        setFormData({ name: '', rating: 5, comment: '' });
        setShowForm(false);
        alert('دیدگاه شما با موفقیت ثبت شد و انتشار یافت!');
      } catch (err) {
        console.error('Error saving review:', err);
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  const totalCount = reviews.length;
  const avgScore = totalCount > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1) 
    : '۵.۰';

  const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = Math.round(r.rating);
    if (starDistribution[star] !== undefined) {
      starDistribution[star]++;
    }
  });

  const getPercent = (star) => {
    if (totalCount === 0) return 0;
    return Math.round((starDistribution[star] / totalCount) * 100);
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('fa-IR');
  };

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.reviewsHeader}>
        <h2 className={styles.reviewsTitle}>
          <span style={{ marginLeft: '10px' }}>💬</span> نظرات خریداران ({totalCount})
        </h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className={styles.writeReviewBtn}>
            ✏️ ثبت دیدگاه جدید
          </button>
        )}
      </div>

      <div className={styles.ratingSummary}>
        <div className={styles.ratingAverage}>
          <div className={styles.averageScore}>{avgScore}</div>
          <div className={styles.averageStars}>
            {'★'.repeat(Math.round(parseFloat(avgScore)))}
            {'☆'.repeat(5 - Math.round(parseFloat(avgScore)))}
          </div>
          <div className={styles.totalReviewsText}>بر اساس {totalCount} نظر</div>
        </div>
        
        <div className={styles.distributionBars}>
          {[5, 4, 3, 2, 1].map(star => {
            const pct = getPercent(star);
            return (
              <div key={star} className={styles.distributionRow}>
                <span className={styles.barLabel}>{star} ستاره</span>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.barPercent}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className={styles.reviewFormCard}>
          <h3 className={styles.formTitle}>ثبت دیدگاه جدید</h3>
          <form onSubmit={handleSubmitReview}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>نام و نام خانوادگی:</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: رضا احمدی" 
                  className={styles.reviewInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>امتیاز شما به محصول:</label>
                <div className={styles.starRatingSelector}>
                  {[1, 2, 3, 4, 5].map(star => {
                    const isActive = hoverRating ? star <= hoverRating : star <= formData.rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.selectorStarBtn} ${isActive ? styles.selectorStarBtnActive : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                        aria-label={`امتیاز ${star} ستاره`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.formGroupFull}>
                <label>متن دیدگاه:</label>
                <textarea 
                  rows="3" 
                  value={formData.comment} 
                  onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="نظرات خود درباره محصول را وارد کنید..." 
                  className={styles.reviewInput}
                  required
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitReviewBtn} disabled={isSubmitting}>
                {isSubmitting ? 'در حال ثبت...' : 'ثبت و انتشار نظر'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelReviewBtn}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.emptyReviews}>
            <div className={styles.emptyIcon}>📦</div>
            <p>هنوز هیچ دیدگاهی ثبت نشده است.</p>
            <p style={{ fontSize: '12px', color: '#8b92a5', marginTop: '6px' }}>اولین کسی باشید که برای این محصول نظر ثبت می‌کند!</p>
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.reviewUserRow}>
                <div className={styles.userNameWrap}>
                  <span className={styles.userName}>{rev.userName}</span>
                  {rev.isVerified && (
                    <span className={styles.verifiedBadge}>✓ خریدار تأیید شده</span>
                  )}
                </div>
                <div className={styles.reviewStars}>
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </div>
              </div>
              <p className={styles.reviewText}>{rev.comment}</p>
              <div className={styles.reviewMeta}>
                <span>مرجع: دبی خرید</span>
                <span>{formatDate(rev.date)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
