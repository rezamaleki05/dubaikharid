'use client';

import { use, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductById } from '@/data/products';
import { useCart } from '@/context/CartContext';
import styles from './Product.module.css';

const EXCHANGE_RATE = 19500;
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
  // Unwrap params using React.use() to avoid Next.js sync params warning
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { addToCart } = useCart();
  
  const product = getProductById(id);

  // Selector states
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Validation state
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

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

  const tomanPrice = product.priceAed * EXCHANGE_RATE;

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContainer}>
        <div className={styles.productGrid}>
          {/* Image Section */}
          <div className={styles.imageSection}>
            <img src={product.image} alt={product.name} className={styles.mainImage} />
          </div>

          {/* Info Section */}
          <div className={styles.infoSection} dir="rtl">
            <div className={styles.brandBadge}>{product.brand}</div>
            <h1 className={styles.productName}>{product.name}</h1>
            
            {/* dynamic Specs */}
            {product.model ? (
              <div className={styles.specsGrid}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>مدل:</span>
                  <span className={styles.specValue}>{product.model}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>پردازنده (CPU):</span>
                  <span className={styles.specValue}>{product.cpu}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>رم (RAM):</span>
                  <span className={styles.specValue}>{product.ram}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>حافظه:</span>
                  <span className={styles.specValue}>{product.storage}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>گرافیک (GPU):</span>
                  <span className={styles.specValue}>{product.gpu}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>اندازه صفحه:</span>
                  <span className={styles.specValue}>{product.screenSize}</span>
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
              <div className={styles.priceLabel}>قیمت نهایی با احتساب هزینه‌های ارسال:</div>
              <div className={styles.priceValue}>
                {fmtToman(tomanPrice)}
                <span className={styles.priceUnit}>تومان</span>
              </div>
            </div>

            <div className={styles.actionSection}>
              <button 
                type="button"
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                افزودن به سبد خرید
              </button>

              <div className={styles.storeInfo}>
                <span className={styles.storeLabel}>فروشگاه مبدا (دبی):</span>
                <span className={styles.storeName}>{product.store}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
