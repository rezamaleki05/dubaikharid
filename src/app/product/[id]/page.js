'use client';

import { use, useState, useEffect } from 'react';
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
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Validation state
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    let found = getProductById(id);
    if (!found && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dubaiKharidUploadedProducts');
        if (saved) {
          const list = JSON.parse(saved);
          found = list.find(p => p.id === id);
        }
      } catch (e) {
        console.error('Error fetching dynamic product by id:', e);
      }
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

  const tomanPrice = product.priceAed * EXCHANGE_RATE;

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

        {/* Customer Reviews Section */}
        <ReviewsSection productId={product.id} productName={product.name} />
      </main>

      <Footer />
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
