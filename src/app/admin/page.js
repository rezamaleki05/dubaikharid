'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllProducts } from '@/data/products';
import styles from './Admin.module.css';

// Default initial orders/leads seed
const INITIAL_LEADS_SEED = [
  {
    id: 'DKHARID-91823',
    customerName: 'رضا ملکی',
    phone: '09176168381',
    address: 'شیراز، معالی آباد، کوچه ۳، پلاک ۱۴',
    notes: 'لطفاً رنگ مشکی فرستاده شود. تشکر.',
    productName: 'پیش‌فاکتور سبد خرید دبی',
    brand: 'دبی خرید',
    weight: 2.1,
    totalToman: 45630000,
    priceAed: 2340,
    date: '2026-05-28T14:30:00Z',
    status: 'pending',
    items: [
      { name: 'MacBook Air M2', brand: 'Apple', quantity: 1, color: 'مشکی', size: '13.6 inch', priceAed: 1680, discountPercent: 0 },
      { name: 'Michael Kors Jet Set', brand: 'Michael Kors', quantity: 1, color: 'کرم', size: 'متوسط', priceAed: 456, discountPercent: 0 },
      { name: 'عینک آفتابی ری‌بن Aviator Classic', brand: 'Ray-Ban', quantity: 1, color: 'طلایی-سبز', size: 'تك سایز', priceAed: 215, discountPercent: 40 }
    ]
  },
  {
    id: 'DKHARID-43891',
    customerName: 'مهدی علوی',
    phone: '09121234567',
    address: 'تهران، سعادت آباد، خیابان سرو، پلاک ۲۲',
    notes: 'سایز ۴۳، رنگ سفید',
    productName: "Nike Air Force 1 '07",
    brand: 'Nike',
    weight: 0.95,
    totalToman: 5270850,
    priceAed: 318,
    date: '2026-05-26T11:00:00Z',
    status: 'contacted',
    items: [
      { name: "Nike Air Force 1 '07", brand: 'Nike', quantity: 1, color: 'سفید', size: '43', priceAed: 318, discountPercent: 15 }
    ]
  },
  {
    id: 'DKHARID-21844',
    customerName: 'مریم رضایی',
    phone: '09139876543',
    address: 'اصفهان، خیابان چهارباغ بالا، ساختمان پارس',
    notes: 'کادوپیچ شود لطفا.',
    productName: 'Dior Sauvage EDP 100ml',
    brand: 'Dior',
    weight: 0.55,
    totalToman: 6201000,
    priceAed: 318,
    date: '2026-05-25T09:15:00Z',
    status: 'paid',
    items: [
      { name: 'Dior Sauvage EDP 100ml', brand: 'Dior', quantity: 1, color: 'آبی تیره', size: '۱۰۰ میل', priceAed: 318, discountPercent: 0 }
    ]
  }
];

// Color mapping for circular swatches in live preview card
const COLOR_HEX_MAP = {
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
  'قهوه‌ای': '#5c4033',
  'سبز': '#008000',
  'صورتی': '#ffb6c1',
  'قرمز': '#ff0000',
  'نارنجی': '#ff781f'
};

export default function AdminPanel() {
  // Authentication states
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active section/tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'leads', 'reviews', 'settings'

  // Data lists
  const [leads, setLeads] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [allProductsCount, setAllProductsCount] = useState(0);

  // Expanded lead row ID (Accordion)
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  // Search & Filter queries
  const [leadSearch, setLeadSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  // Uploader form state
  const [prodForm, setProdForm] = useState({
    name: '',
    spec: '',
    brand: '',
    store: 'amazon.ae',
    priceAed: '',
    weight: '',
    discountPercent: '',
    category: 'clothing',
    gender: 'none', // 'men', 'women', 'kids', 'none'
    image: '',
    link: '',
    isBestSeller: false,
    colors: '',
    sizes: '',
    description: ''
  });

  // Password management
  const [passForm, setPassForm] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: ''
  });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Password strength gauge
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'خیلی ضعیف', color: '#ff4d4d' });

  // Load persistence layers on mount
  useEffect(() => {
    const session = sessionStorage.getItem('dubaiKharidAdminSession');
    if (session === 'active') {
      setIsLoggedIn(true);
    }

    // Leads seed
    const savedLeads = localStorage.getItem('dubaiKharidLeads');
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    } else {
      localStorage.setItem('dubaiKharidLeads', JSON.stringify(INITIAL_LEADS_SEED));
      setLeads(INITIAL_LEADS_SEED);
    }

    // Reviews seed
    const savedReviews = localStorage.getItem('dubaiKharidReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      const defaultReviews = [
        { id: 'seed-1', productId: 'lap1', productName: 'MacBook Air M2', userName: 'علیرضا زارعی', rating: 5, comment: 'فوق‌العاده تمیز و در حد نو بود. دسته‌بندی استوک دبی خرید حرف نداره. از خریدم خیلی راضی‌ام.', date: '2026-05-15T12:00:00Z', isVerified: true },
        { id: 'seed-2', productId: 'lap1', productName: 'MacBook Air M2', userName: 'مریم حسینی', rating: 4, comment: 'سرعت و قدرت دستگاه عالیه، فقط کارتن نداشت که خب برای استوک طبیعیه. بسته‌بندی ارسال دی‌جی‌کالایی و محکم بود.', date: '2026-05-20T08:30:00Z', isVerified: true },
        { id: 'seed-3', productId: 'p1', productName: "Nike Air Force 1 '07", userName: 'امیر قاسمی', rating: 5, comment: 'نایک ایر فورس اصل، فوق‌العاده راحت. مستقیم از امارات اومد و بارکدش کاملا معتبر بود.', date: '2026-05-24T14:20:00Z', isVerified: true },
        { id: 'seed-4', productId: 'w1', productName: 'پیراهن نخی ساحلی مانگو', userName: 'سارا کریمی', rating: 5, comment: 'جنس نخی خنک و عالی، دقیقا مثل عکسش در سایت مانگو بود. خیلی خوش‌دوخت و زیباست.', date: '2026-05-18T10:15:00Z', isVerified: true }
      ];
      localStorage.setItem('dubaiKharidReviews', JSON.stringify(defaultReviews));
      setReviews(defaultReviews);
    }

    // Uploaded products
    const savedUploaded = localStorage.getItem('dubaiKharidUploadedProducts');
    if (savedUploaded) {
      setUploadedProducts(JSON.parse(savedUploaded));
    }

    // Calculate total catalog count
    const staticProds = getAllProducts();
    const dynamicCount = savedUploaded ? JSON.parse(savedUploaded).length : 0;
    setAllProductsCount(staticProds.length + dynamicCount);
  }, [isLoggedIn]);

  // Real-time password strength evaluator
  useEffect(() => {
    const pw = passForm.newPass;
    if (!pw) {
      setPasswordStrength({ score: 0, label: 'خیلی ضعیف', color: '#ff4d4d' });
      return;
    }

    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    let label = 'خیلی ضعیف';
    let color = '#ff4d4d'; // weak red
    
    if (score === 2) {
      label = 'ضعیف';
      color = '#f39c12'; // orange
    } else if (score === 3) {
      label = 'متوسط';
      color = '#fdf500'; // yellow
    } else if (score >= 4) {
      label = 'قوی و امن';
      color = '#2ecc71'; // green
    }

    setPasswordStrength({ score, label, color });
  }, [passForm.newPass]);

  // Handle Log In
  const handleLogin = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('dubaiKharidPassword') || '@Reza112233';
    
    if (passwordInput === storedPassword) {
      setIsLoggedIn(true);
      sessionStorage.setItem('dubaiKharidAdminSession', 'active');
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('رمز عبور اشتباه است. دوباره تلاش کنید.');
    }
  };

  // Handle Log Out
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('dubaiKharidAdminSession');
  };

  // Toggle lead expanded details accordion
  const toggleLeadAccordion = (leadId) => {
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
    } else {
      setExpandedLeadId(leadId);
    }
  };

  // Handle product upload submission
  const handleProductUpload = (e) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.brand.trim() || !prodForm.priceAed) {
      alert('لطفاً فیلدهای ضروری نام محصول، برند و قیمت درهم را وارد کنید.');
      return;
    }

    const priceAEDNum = parseFloat(prodForm.priceAed) || 0;
    const discountNum = parseFloat(prodForm.discountPercent) || 0;
    const weightNum = parseFloat(prodForm.weight) || 0.5;

    const newProduct = {
      id: `uploaded-${Date.now()}`,
      name: prodForm.name.trim(),
      spec: prodForm.spec.trim() || `${prodForm.brand} original product`,
      brand: prodForm.brand.trim(),
      store: prodForm.store.trim() || 'فروشگاه دبی',
      priceAed: priceAEDNum,
      weight: weightNum,
      discountPercent: discountNum > 0 ? discountNum : undefined,
      category: prodForm.category,
      gender: prodForm.gender !== 'none' ? prodForm.gender : undefined,
      image: prodForm.image.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=450&q=85&auto=format&fit=crop',
      link: prodForm.link.trim() || 'https://www.amazon.ae',
      isBestSeller: prodForm.isBestSeller,
      colors: prodForm.colors ? prodForm.colors.split(',').map(s => s.trim()) : undefined,
      sizes: prodForm.sizes ? prodForm.sizes.split(',').map(s => s.trim()) : undefined,
      description: prodForm.description.trim() || 'این کالا به صورت مستقیم و اختصاصی از دبی خریداری شده و با کارگو هوایی سریع ارسال می‌گردد.'
    };

    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(newProduct);
      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(list));
      
      setUploadedProducts(list);
      setAllProductsCount(prev => prev + 1);

      // Reset form
      setProdForm({
        name: '', spec: '', brand: '', store: 'amazon.ae', priceAed: '', weight: '',
        discountPercent: '', category: 'clothing', gender: 'none', image: '', link: '',
        isBestSeller: false, colors: '', sizes: '', description: ''
      });
      alert('محصول جدید با موفقیت به کاتالوگ فروشگاه افزوده شد!');
    } catch (err) {
      console.error('Error saving uploaded product:', err);
    }
  };

  // Delete uploaded product
  const handleDeleteProduct = (prodId) => {
    if (!confirm('آیا از حذف این محصول آپلود شده مطمئن هستید؟')) return;

    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(p => p.id !== prodId);
      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(filtered));
      
      setUploadedProducts(filtered);
      setAllProductsCount(prev => prev - 1);
    } catch (e) {
      console.error('Error deleting product:', e);
    }
  };

  // Change lead status
  const handleStatusChange = (leadId, newStatus) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return { ...l, status: newStatus };
      }
      return l;
    });

    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
  };

  // Delete lead
  const handleDeleteLead = (leadId) => {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;

    const filtered = leads.filter(l => l.id !== leadId);
    setLeads(filtered);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(filtered));
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
    }
  };

  // Delete review
  const handleDeleteReview = (revId) => {
    if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return;

    try {
      const saved = localStorage.getItem('dubaiKharidReviews');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(r => r.id !== revId);
      localStorage.setItem('dubaiKharidReviews', JSON.stringify(filtered));
      setReviews(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('dubaiKharidPassword') || '@Reza112233';

    if (passForm.oldPass !== storedPassword) {
      setPasswordChangeError('رمز عبور فعلی اشتباه است.');
      setPasswordChangeSuccess(false);
      return;
    }

    if (passForm.newPass.length < 6) {
      setPasswordChangeError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      setPasswordChangeSuccess(false);
      return;
    }

    if (passForm.newPass !== passForm.confirmPass) {
      setPasswordChangeError('تکرار رمز عبور جدید مطابقت ندارد.');
      setPasswordChangeSuccess(false);
      return;
    }

    localStorage.setItem('dubaiKharidPassword', passForm.newPass);
    setPasswordChangeSuccess(true);
    setPasswordChangeError('');
    setPassForm({ oldPass: '', newPass: '', confirmPass: '' });
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    if (!confirm('توجه: با بازیابی اطلاعات، تمام داده‌های جدید پاک شده و اطلاعات پیش‌فرض آزمایشی در لوکال استوریج بازگردانی می‌شوند. آیا ادامه می‌دهید؟')) return;
    
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(INITIAL_LEADS_SEED));
    localStorage.removeItem('dubaiKharidReviews');
    localStorage.removeItem('dubaiKharidUploadedProducts');
    localStorage.setItem('dubaiKharidPassword', '@Reza112233');

    setLeads(INITIAL_LEADS_SEED);
    setReviews([]);
    setUploadedProducts([]);
    setAllProductsCount(getAllProducts().length);
    alert('اطلاعات آزمایشی پیش‌فرض با موفقیت بازیابی شد و رمز عبور به @Reza112233 بازگشت.');
  };

  // Formatting utilities
  const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');
  const fmtDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('fa-IR');
  };

  // WhatsApp link compilation
  const getWhatsAppLink = (lead) => {
    let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = `98${cleanPhone.slice(1)}`;
    }
    
    const message = `سلام ${lead.customerName} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\n📦 سفارش شما: ${lead.productName}\n💰 مبلغ کل: ${fmtToman(lead.totalToman)} تومان\n📍 آدرس تحویل: ${lead.address}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Filtered lists
  const filteredLeads = leads.filter(lead => {
    const q = leadSearch.toLowerCase();
    return (
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.id.toLowerCase().includes(q) ||
      lead.productName.toLowerCase().includes(q)
    );
  });

  const filteredReviews = reviews.filter(rev => {
    const q = reviewSearch.toLowerCase();
    return (
      rev.userName.toLowerCase().includes(q) ||
      rev.productName.toLowerCase().includes(q) ||
      rev.comment.toLowerCase().includes(q)
    );
  });

  // Stats computations
  const totalRevenue = leads
    .filter(l => l.status === 'paid' || l.status === 'shipped')
    .reduce((acc, l) => acc + l.totalToman, 0);

  const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;

  // Live Card Preview Calculations
  const previewPriceAed = parseFloat(prodForm.priceAed) || 0;
  const previewDiscount = parseFloat(prodForm.discountPercent) || 0;
  const baseToman = previewPriceAed * 19500;
  const finalToman = previewDiscount > 0 ? baseToman * (1 - previewDiscount / 100) : baseToman;

  // Color Swatches parser helper
  const parsedPreviewColors = prodForm.colors
    ? prodForm.colors.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const parsedPreviewSizes = prodForm.sizes
    ? prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Render Login Panel
  if (!isLoggedIn) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loginOverlay}>
          <form onSubmit={handleLogin} className={styles.loginCard}>
            <span className={styles.loginLogo}>✈️</span>
            <h1>پنل مدیریت دبی خرید</h1>
            <p>جهت دسترسی به سفارشات، آپلود محصولات و نظرات کاربران، وارد شوید.</p>

            {loginError && <div className={styles.loginError}>{loginError}</div>}

            <div className={styles.formGroup}>
              <label>نام کاربری:</label>
              <input 
                type="text" 
                value="admin" 
                disabled 
                className={styles.loginInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>رمز عبور:</label>
              <input 
                type="password" 
                placeholder="رمز عبور پنل را وارد کنید..."
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                className={styles.loginInput}
                autoFocus
                required
              />
            </div>

            <button type="submit" className={styles.loginBtn}>
              ورود به داشبورد مدیریت
            </button>
            
            <div style={{ marginTop: '20px', fontSize: '11px', color: '#8b92a5' }}>
              <Link href="/" style={{ color: '#f87820', textDecoration: 'none', fontWeight: 'bold' }}>
                بازگشت به صفحه اصلی فروشگاه
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Dynamic SAAS Navigation TopHeader */}
      <header className={styles.topHeader}>
        <div className={styles.topHeaderTitleWrap}>
          <span className={styles.topHeaderLogo}>🛡️</span>
          <div className={styles.topHeaderMeta}>
            <h1>پنل ادمین دبی خرید</h1>
            <span>سامانه مدیریت جامع و پیشرفته کارگو خرید از امارات</span>
          </div>
        </div>
        <Link href="/" className={styles.viewStoreBtn}>
          <span>🛒</span> مشاهده فروشگاه اصلی
        </Link>
      </header>

      <div className={styles.dashboardContainer}>
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.adminProfile}>
              <div className={styles.adminAvatar}>👤</div>
              <div className={styles.adminInfo}>
                <h2>مدیر دبی خرید</h2>
                <span>سطح دسترسی: ادمین کل</span>
              </div>
            </div>

            <nav className={styles.navMenu}>
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
              >
                <span>📊</span> داشبورد آماری
              </button>
              <button 
                onClick={() => setActiveTab('leads')} 
                className={`${styles.navItem} ${activeTab === 'leads' ? styles.navItemActive : ''}`}
              >
                <span>📥</span> سفارشات و لیدها
                {pendingLeadsCount > 0 && (
                  <span style={{ background: '#ff3333', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px', marginRight: 'auto' }}>
                    {pendingLeadsCount} جدید
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('products')} 
                className={`${styles.navItem} ${activeTab === 'products' ? styles.navItemActive : ''}`}
              >
                <span>📤</span> آپلود محصول جدید
              </button>
              <button 
                onClick={() => setActiveTab('reviews')} 
                className={`${styles.navItem} ${activeTab === 'reviews' ? styles.navItemActive : ''}`}
              >
                <span>💬</span> نظرات مشتریان
                {reviews.length > 0 && (
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '9px', padding: '1px 6px', borderRadius: '10px', marginRight: 'auto' }}>
                    {reviews.length} کل
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
              >
                <span>⚙️</span> تنظیمات امنیتی
              </button>
            </nav>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span>🚪</span> خروج از حساب
          </button>
        </aside>

        {/* MAIN DISPLAY VIEW BLOCK */}
        <main className={styles.mainContent}>
          
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === 'overview' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📊 داشبورد آمار و ارقام دبی خرید</h1>
                  <p className={styles.sectionDesc}>خلاصه‌ای از وضعیت فروش، کارگو هوایی و درخواست‌های فعال در سراسر ایران</p>
                </div>
              </div>

              {/* Dynamic stats elements */}
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statCardGold}`}>
                  <div>
                    <span className={styles.statTitle}>درآمد قطعی (وصول شده)</span>
                    <div className={styles.statNumber}>{fmtToman(totalRevenue)} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>تومان</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statIconGold}`}>💰</div>
                </div>
                
                <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                  <div>
                    <span className={styles.statTitle}>سفارشات جدید (لید)</span>
                    <div className={styles.statNumber}>{pendingLeadsCount} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>عدد</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statIconOrange}`}>📥</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                  <div>
                    <span className={styles.statTitle}>کل کالاهای کاتالوگ</span>
                    <div className={styles.statNumber}>{allProductsCount} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>مدل</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statIconGreen}`}>🛍️</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardPurple}`}>
                  <div>
                    <span className={styles.statTitle}>نظرات کاربران</span>
                    <div className={styles.statNumber}>{reviews.length} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>دیدگاه</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statIconPurple}`}>💬</div>
                </div>
              </div>

              <div className={styles.dashboardSplit}>
                {/* Recent Orders List */}
                <div className={styles.splitCard}>
                  <h3>📥 آخرین سفارش‌های ثبت شده</h3>
                  <div className={styles.miniList}>
                    {leads.slice(0, 4).map(lead => (
                      <div key={lead.id} className={styles.miniItem}>
                        <div>
                          <span className={styles.miniName}>{lead.customerName}</span>
                          <span className={styles.miniSub}>{lead.productName} ({fmtToman(lead.totalToman)} تومان)</span>
                        </div>
                        <div>
                          <span className={`${styles.statusTag} ${
                            lead.status === 'pending' ? styles.statusPending :
                            lead.status === 'contacted' ? styles.statusContacted :
                            lead.status === 'paid' ? styles.statusPaid :
                            lead.status === 'shipped' ? styles.statusShipped : styles.statusCancelled
                          }`}>
                            {lead.status === 'pending' ? 'در انتظار بررسی' :
                             lead.status === 'contacted' ? 'تماس گرفته شده' :
                             lead.status === 'paid' ? 'پرداخت شده' :
                             lead.status === 'shipped' ? 'ارسال شده' : 'لغو شده'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#8b92a5', fontSize: '12px', padding: '20px 0' }}>هیچ سفارشی ثبت نشده است.</p>
                    )}
                  </div>
                </div>

                {/* Popular Stores Distribution progress indicators */}
                <div className={styles.splitCard}>
                  <h3>🏢 توزیع منابع سفارش خرید</h3>
                  <div className={styles.progressList}>
                    <div className={styles.progressItem}>
                      <div className={styles.progressLabelRow}>
                        <span>noon.com (امارات)</span>
                        <span className={styles.progressValue}>۴۸٪</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarValue} style={{ width: '48%' }} />
                      </div>
                    </div>
                    
                    <div className={styles.progressItem}>
                      <div className={styles.progressLabelRow}>
                        <span>amazon.ae (آمازون)</span>
                        <span className={styles.progressValue}>۳۵٪</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarValue} style={{ width: '35%' }} />
                      </div>
                    </div>

                    <div className={styles.progressItem}>
                      <div className={styles.progressLabelRow}>
                        <span>namshi.com (پوشاک)</span>
                        <span className={styles.progressValue}>۱۲٪</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarValue} style={{ width: '12%' }} />
                      </div>
                    </div>

                    <div className={styles.progressItem}>
                      <div className={styles.progressLabelRow}>
                        <span>سایر منابع سفارشی</span>
                        <span className={styles.progressValue}>۵٪</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarValue} style={{ width: '5%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS & ACCORDIONS VIEW */}
          {activeTab === 'leads' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📥 مدیریت لیدها و سفارشات نهایی دبی خرید</h1>
                  <p className={styles.sectionDesc}>بررسی پیش‌فاکتورها، ویرایش وضعیت پرداخت و هماهنگی سریع در واتساپ خریدار</p>
                </div>
                
                <div className={styles.searchBarWrapper}>
                  <span>🔍</span>
                  <input 
                    type="text" 
                    placeholder="جستجوی خریدار، شماره یا کالا..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className={styles.searchBarInput}
                  />
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>کد رهگیری</th>
                      <th>نام خریدار</th>
                      <th>شماره موبایل</th>
                      <th>خلاصه کالای درخواستی</th>
                      <th>مبلغ کل سفارش</th>
                      <th>تاریخ ثبت</th>
                      <th>وضعیت پیش‌فاکتور</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => {
                      const isExpanded = expandedLeadId === lead.id;
                      return (
                        <>
                          {/* Accordion Main row trigger */}
                          <tr 
                            key={lead.id} 
                            onClick={() => toggleLeadAccordion(lead.id)} 
                            className={`${styles.accordionTriggerRow} ${isExpanded ? styles.accordionActiveRow : ''}`}
                          >
                            <td>
                              <span className={`${styles.rotatorArrow} ${isExpanded ? styles.arrowFlipped : ''}`}>
                                🔽
                              </span>
                            </td>
                            <td style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#ff9d00', fontSize: '11px' }}>{lead.id}</td>
                            <td style={{ fontWeight: '750' }}>{lead.customerName}</td>
                            <td style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{lead.phone}</td>
                            <td>{lead.productName}</td>
                            <td style={{ fontWeight: '850', color: '#fff' }}>{fmtToman(lead.totalToman)} T</td>
                            <td style={{ fontSize: '11px', color: '#8b92a5' }}>{fmtDate(lead.date)}</td>
                            <td>
                              <span className={`${styles.statusTag} ${
                                lead.status === 'pending' ? styles.statusPending :
                                lead.status === 'contacted' ? styles.statusContacted :
                                lead.status === 'paid' ? styles.statusPaid :
                                lead.status === 'shipped' ? styles.statusShipped : styles.statusCancelled
                              }`}>
                                {lead.status === 'pending' ? 'در انتظار بررسی' :
                                 lead.status === 'contacted' ? 'تماس گرفته شده' :
                                 lead.status === 'paid' ? 'پرداخت شده' :
                                 lead.status === 'shipped' ? 'ارسال شده' : 'لغو شده'}
                              </span>
                            </td>
                            {/* Stop propagation so clicking select or delete doesn't trigger accordion fold */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select 
                                  value={lead.status} 
                                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                  className={styles.statusSelect}
                                >
                                  <option value="pending">بررسی</option>
                                  <option value="contacted">تماس</option>
                                  <option value="paid">پرداخت</option>
                                  <option value="shipped">ارسال</option>
                                  <option value="cancelled">لغو</option>
                                </select>
                                <button 
                                  onClick={() => handleDeleteLead(lead.id)} 
                                  className={styles.deleteActionBtn}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Collapsed breakdown Accordion row */}
                          {isExpanded && (
                            <tr className={styles.accordionCollapseRow}>
                              <td colSpan="9">
                                <div className={styles.accordionContent}>
                                  <div className={styles.accordionDetailsGrid}>
                                    
                                    {/* Client information panel */}
                                    <div className={styles.detailsBlock}>
                                      <h4>📍 مشخصات و آدرس خریدار</h4>
                                      <div className={styles.detailsMetaList}>
                                        <div className={styles.detailsMetaItem}>
                                          <span>نام تحویل‌گیرنده:</span>
                                          <span className={styles.detailsMetaVal}>{lead.customerName}</span>
                                        </div>
                                        <div className={styles.detailsMetaItem}>
                                          <span>تلفن تماس هماهنگی:</span>
                                          <span className={styles.detailsMetaVal} style={{ direction: 'ltr' }}>{lead.phone}</span>
                                        </div>
                                        <div className={styles.detailsMetaItem} style={{ flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                          <span>آدرس دقیق تحویل در ایران:</span>
                                          <div style={{ color: '#fff', fontSize: '13px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                                            {lead.address}
                                          </div>
                                        </div>
                                        {lead.notes && (
                                          <div className={styles.detailsMetaItem} style={{ flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                            <span>توضیحات مشتری (سایز، رنگ، کد فنی):</span>
                                            <div style={{ color: '#ff781f', fontSize: '12px', background: 'rgba(248,120,32,0.04)', padding: '8px', borderRadius: '8px', border: '1px dashed rgba(248,120,32,0.2)', marginTop: '4px' }}>
                                              📝 {lead.notes}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Cart detailed items panel */}
                                    <div className={styles.detailsBlock}>
                                      <h4>🛍️ جزئیات پیش‌فاکتور سفارش دبی</h4>
                                      
                                      {lead.items && lead.items.length > 0 ? (
                                        <table className={styles.nestedCartTable}>
                                          <thead>
                                            <tr>
                                              <th>نام محصول</th>
                                              <th>مشخصات خرید</th>
                                              <th>تعداد</th>
                                              <th>قیمت واحد</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {lead.items.map((item, idx) => (
                                              <tr key={idx}>
                                                <td style={{ fontWeight: '750', color: '#fff' }}>{item.name}</td>
                                                <td>
                                                  {(item.color || item.size) ? (
                                                    <span style={{ fontSize: '11px', color: '#ff781f' }}>
                                                      {item.color && `رنگ: ${item.color}`} {item.size && ` | سایز: ${item.size}`}
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: '#8b92a5' }}>دیفالت</span>
                                                  )}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity} عدد</td>
                                                <td>
                                                  {item.discountPercent > 0 ? (
                                                    <div>
                                                      <span style={{ textDecoration: 'line-through', color: '#8b92a5', fontSize: '10px', marginLeft: '6px' }}>{item.priceAed} AED</span>
                                                      <span style={{ color: '#ff3333', fontWeight: 'bold' }}>{Math.round(item.priceAed * (1 - item.discountPercent / 100))} AED</span>
                                                    </div>
                                                  ) : (
                                                    <span>{item.priceAed} AED</span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className={styles.detailsMetaList}>
                                          <div className={styles.detailsMetaItem}>
                                            <span>نام کالا:</span>
                                            <span className={styles.detailsMetaVal}>{lead.productName}</span>
                                          </div>
                                          <div className={styles.detailsMetaItem}>
                                            <span>برند مبدا:</span>
                                            <span className={styles.detailsMetaVal}>{lead.brand}</span>
                                          </div>
                                        </div>
                                      )}

                                      <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '11px', color: '#8b92a5' }}>
                                          سایت مبدا: {lead.brand === 'دبی خرید' ? 'خرید گروهی سبد خرید' : 'noon.com'} | وزن: {lead.weight}kg
                                        </div>
                                        
                                        <a 
                                          href={getWhatsAppLink(lead)} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className={styles.whatsappLinkBtn}
                                        >
                                          💬 ارسال فاکتور هماهنگی واتساپ
                                        </a>
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: '#8b92a5', padding: '40px 0' }}>هیچ موردی یافت نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT UPLOADER WITH LIVE CARD PREVIEW */}
          {activeTab === 'products' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📤 آپلود و درج محصول جدید در دبی خرید</h1>
                  <p className={styles.sectionDesc}>درج مشخصات کالا جهت آپلود مستقیم در کاتالوگ فروشگاه با فیلترها و پیش‌نمایش زنده</p>
                </div>
              </div>

              {/* Advanced Uploader Layout Grid */}
              <div className={styles.uploaderLayout}>
                
                {/* Right Form Card */}
                <form onSubmit={handleProductUpload} className={styles.uploadForm}>
                  
                  {/* Part 1: Core Details */}
                  <div className={styles.formCardSection}>
                    <h3 className={styles.formSectionHeader}>🛍️ مشخصات اصلی کالا</h3>
                    <div className={styles.formInputGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>نام کالا (فارسی) *</label>
                        <input 
                          type="text" 
                          value={prodForm.name} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="مثال: کتانی اورجینال نایک مدل Air Max" 
                          className={styles.inputField} 
                          required 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>نام برند (انگلیسی) *</label>
                        <input 
                          type="text" 
                          value={prodForm.brand} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, brand: e.target.value }))}
                          placeholder="مثال: Nike" 
                          className={styles.inputField} 
                          required 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>سایت مرجع امارات (دبی)</label>
                        <input 
                          type="text" 
                          value={prodForm.store} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, store: e.target.value }))}
                          placeholder="مثال: noon.com" 
                          className={styles.inputField} 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>قیمت خرید کالا در دبی (درهم) *</label>
                        <input 
                          type="number" 
                          value={prodForm.priceAed} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, priceAed: e.target.value }))}
                          placeholder="مثال: 599" 
                          className={styles.inputField} 
                          required 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>درصد تخفیف (در صورت وجود)</label>
                        <input 
                          type="number" 
                          value={prodForm.discountPercent} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                          placeholder="مثال: 20" 
                          className={styles.inputField} 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>وزن تقریبی کالا (کیلوگرم)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={prodForm.weight} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="مثال: 0.95" 
                          className={styles.inputField} 
                        />
                      </div>
                      <div className={styles.checkboxWrap} style={{ gridColumn: 'span 2' }}>
                        <input 
                          type="checkbox" 
                          id="isBestSeller"
                          checked={prodForm.isBestSeller} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                          className={styles.checkboxInput} 
                        />
                        <label htmlFor="isBestSeller" className={styles.checkboxLabel}>کالا به عنوان پرفروش علامت‌گذاری شود</label>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Appearance & Categorization */}
                  <div className={styles.formCardSection}>
                    <h3 className={styles.formSectionHeader}>⚙️ مشخصات فنی و فیلترها</h3>
                    <div className={styles.formInputGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>دسته‌بندی اصلی</label>
                        <select 
                          value={prodForm.category} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, category: e.target.value }))}
                          className={styles.selectField}
                        >
                          <option value="clothing">پوشاک و لباس</option>
                          <option value="pants">شلوار</option>
                          <option value="shoes">کفش و کتانی</option>
                          <option value="bags">کیف و اکسسوری</option>
                          <option value="electronics">لپ‌تاپ و الکترونیک</option>
                          <option value="beauty">زیبایی و سلامت</option>
                          <option value="others">سایر کالاها</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>منوی جنسیت هدف</label>
                        <select 
                          value={prodForm.gender} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, gender: e.target.value }))}
                          className={styles.selectField}
                        >
                          <option value="none">غیر وابسته به جنسیت (عمومی)</option>
                          <option value="men">مردانه (Men)</option>
                          <option value="women">زنانه (Women)</option>
                          <option value="kids">بچه‌گانه (Kids)</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>رنگ‌های موجود (جدا شده با کامای فارسی)</label>
                        <input 
                          type="text" 
                          value={prodForm.colors} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, colors: e.target.value }))}
                          placeholder="مثال: مشکی, سفید, طوسی, کرم" 
                          className={styles.inputField} 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>سایزهای موجود (جدا شده با کامای فارسی)</label>
                        <input 
                          type="text" 
                          value={prodForm.sizes} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, sizes: e.target.value }))}
                          placeholder="مثال: 40, 41, 42, L, XL" 
                          className={styles.inputField} 
                        />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label className={styles.formLabel}>مشخصات فرعی / خلاصه مشخصات فنی کوتاه</label>
                        <input 
                          type="text" 
                          value={prodForm.spec} 
                          onChange={(e) => setProdForm(prev => ({ ...prev, spec: e.target.value }))}
                          placeholder="مثال: پردازنده Intel i7 / چرم طبیعی گاو" 
                          className={styles.inputField} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part 3: Image & Description */}
                  <div className={styles.formCardSection}>
                    <h3 className={styles.formSectionHeader}>🖼️ تصویر و توضیحات</h3>
                    <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                      <label className={styles.formLabel}>آدرس اینترنتی تصویر کالا (URL)</label>
                      <input 
                        type="text" 
                        value={prodForm.image} 
                        onChange={(e) => setProdForm(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="https://images.unsplash.com/photo-..." 
                        className={styles.inputField} 
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                      <label className={styles.formLabel}>لینک کالا در فروشگاه اصلی امارات</label>
                      <input 
                        type="text" 
                        value={prodForm.link} 
                        onChange={(e) => setProdForm(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="https://www.amazon.ae/gp/product/..." 
                        className={styles.inputField} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>توضیحات کامل محصول</label>
                      <textarea 
                        rows="3"
                        value={prodForm.description} 
                        onChange={(e) => setProdForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="توضیحات کامل فیزیکی، نحوه سفارش، اصالت و..."
                        className={styles.textareaField}
                      />
                    </div>
                  </div>

                  {/* Form Submission */}
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.loginBtn} style={{ margin: 0, width: 'auto', padding: '14px 40px' }}>
                      📤 آپلود محصول در وب‌سایت
                    </button>
                  </div>

                </form>

                {/* Left Sticky Live Preview card Column */}
                <div className={styles.previewStickyCol}>
                  <span className={styles.previewTitle}>👁️ پیش‌نمایش زنده کارت کاتالوگ</span>
                  
                  <div className={styles.mockCatalogCard}>
                    
                    {/* Image box */}
                    <div className={styles.mockImgBox}>
                      {prodForm.image ? (
                        <img src={prodForm.image} alt="Preview thumbnail" className={styles.mockImg} onError={(e) => { e.target.src = ''; }} />
                      ) : (
                        <div className={styles.mockImgFallback}>
                          <span style={{ fontSize: '32px' }}>📷</span>
                          <span>آدرس تصویر کالا</span>
                        </div>
                      )}
                      
                      {previewDiscount > 0 && (
                        <div className={styles.mockSaleBadge}>
                          {previewDiscount}%-
                        </div>
                      )}
                    </div>

                    {/* Card Content block */}
                    <div className={styles.mockCardContent}>
                      
                      {/* Brand Row */}
                      <div className={styles.mockBrandRow}>
                        <span>{prodForm.brand || 'برند کالا'}</span>
                        <span className={styles.mockStoreLabel}>{prodForm.store || 'amazon.ae'}</span>
                      </div>

                      {/* Title & Specs */}
                      <div className={styles.mockTitle}>{prodForm.name || 'نام فارسی محصول جدید'}</div>
                      <div className={styles.mockSpecs}>{prodForm.spec || 'خلاصه مشخصات فنی'}</div>

                      {/* Interactive Colors render */}
                      {parsedPreviewColors.length > 0 && (
                        <div className={styles.mockPreviewSwatches}>
                          {parsedPreviewColors.map((color, idx) => {
                            const hex = COLOR_HEX_MAP[color] || '#808080';
                            return (
                              <div 
                                key={idx} 
                                className={styles.mockColorDot} 
                                style={{ background: hex }} 
                                title={color}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Dynamic Sizes render */}
                      {parsedPreviewSizes.length > 0 && (
                        <div className={styles.mockPreviewSizes}>
                          {parsedPreviewSizes.slice(0, 4).map((size, idx) => (
                            <span key={idx} className={styles.mockSizeTag}>
                              {size}
                            </span>
                          ))}
                          {parsedPreviewSizes.length > 4 && (
                            <span className={styles.mockSizeTag}>+</span>
                          )}
                        </div>
                      )}

                      {/* Pricing toman calculator */}
                      <div className={styles.mockPriceRow}>
                        <span className={styles.mockPriceLabel}>قیمت نهایی با هزینه ارسال:</span>
                        
                        {previewDiscount > 0 ? (
                          <div>
                            <span style={{ fontSize: '11px', textDecoration: 'line-through', color: '#8b92a5' }}>
                              {fmtToman(baseToman)}
                            </span>
                            <div className={styles.mockPriceVal} style={{ color: '#ff3333' }}>
                              {fmtToman(finalToman)} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>تومان</span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.mockPriceVal}>
                            {previewPriceAed > 0 ? fmtToman(baseToman) : '۰'} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>تومان</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              {/* Uploaded products checklist */}
              {uploadedProducts.length > 0 && (
                <div style={{ marginTop: '50px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '22px', borderRight: '3px solid #f87820', paddingRight: '10px' }}>
                    🛍️ محصولات آپلود شده توسط شما ({uploadedProducts.length})
                  </h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>تصویر</th>
                          <th>نام کالا</th>
                          <th>برند</th>
                          <th>قیمت خرید دبی</th>
                          <th>دسته‌بندی / منو</th>
                          <th>وضعیت پرفروش</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedProducts.map(p => (
                          <tr key={p.id}>
                            <td>
                              <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                            </td>
                            <td>
                              <div style={{ fontWeight: '750' }}>{p.name}</div>
                              <span style={{ fontSize: '11px', color: '#8b92a5' }}>شناسه: {p.id}</span>
                            </td>
                            <td>{p.brand}</td>
                            <td>{p.priceAed} AED</td>
                            <td>
                              <div>{p.category}</div>
                              <span style={{ fontSize: '11px', color: '#8b92a5' }}>
                                منو: {p.gender === 'men' ? 'مردانه' : p.gender === 'women' ? 'زنانه' : p.gender === 'kids' ? 'کودک' : 'عمومی'}
                              </span>
                            </td>
                            <td>{p.isBestSeller ? '🔥 پرفروش' : 'عادی'}</td>
                            <td>
                              <button onClick={() => handleDeleteProduct(p.id)} className={styles.deleteActionBtn} style={{ width: 'auto', padding: '6px 14px' }}>
                                حذف کالا
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>💬 مدیریت نظرات و دیدگاه‌های خریداران دبی خرید</h1>
                  <p className={styles.sectionDesc}>بررسی بازخوردهای ارسالی کاربران، تایید اصالت خرید و جلوگیری از هرزنامه‌ها</p>
                </div>

                <div className={styles.searchBarWrapper}>
                  <span>🔍</span>
                  <input 
                    type="text" 
                    placeholder="جستجو در نظرات، خریداران یا کالاها..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className={styles.searchBarInput}
                  />
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>نام کاربر</th>
                      <th>محصول درخواستی</th>
                      <th>امتیاز</th>
                      <th>متن دیدگاه خریدار</th>
                      <th>تاریخ ارسال</th>
                      <th>وضعیت اصالت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map(rev => (
                      <tr key={rev.id}>
                        <td style={{ fontWeight: '750' }}>{rev.userName}</td>
                        <td>{rev.productName}</td>
                        <td style={{ color: '#ff9d00', letterSpacing: '1px', fontWeight: 'bold' }}>
                          {'★'.repeat(rev.rating)}
                          {'☆'.repeat(5 - rev.rating)}
                        </td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'normal', lineHeight: '1.5' }}>
                          {rev.comment}
                        </td>
                        <td style={{ fontSize: '11px', color: '#8b92a5' }}>{fmtDate(rev.date)}</td>
                        <td>
                          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)' }}>
                            ✓ تایید شده
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteReview(rev.id)} className={styles.deleteActionBtn} style={{ width: 'auto', padding: '6px 14px' }}>
                            حذف نظر
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredReviews.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '40px 0' }}>دیدگاهی ثبت نشده است.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY SETTINGS & PASSWORD COMPLEXITY GAUGE */}
          {activeTab === 'settings' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>⚙️ تنظیمات امنیتی پنل دبی خرید</h1>
                  <p className={styles.sectionDesc}>تغییر رمز عبور ادمین و ریست کردن دیتابیس لوکال فروشگاه کارگو</p>
                </div>
              </div>

              {/* Password change form */}
              <div className={styles.securityCard}>
                <h3>🔑 تغییر رمز عبور ورود ادمین</h3>
                
                {passwordChangeSuccess && (
                  <div className={styles.successNote}>رمز عبور پنل مدیریت با موفقیت تغییر یافت.</div>
                )}
                {passwordChangeError && (
                  <div className={styles.loginError} style={{ margin: '0 0 20px' }}>{passwordChangeError}</div>
                )}

                <form onSubmit={handlePasswordChange}>
                  <div className={styles.formGroup} style={{ maxWidth: '350px' }}>
                    <label>رمز عبور فعلی ادمین:</label>
                    <input 
                      type="password" 
                      value={passForm.oldPass} 
                      onChange={e => setPassForm(prev => ({ ...prev, oldPass: e.target.value }))}
                      placeholder="وارد کردن رمز عبور قدیمی..." 
                      className={styles.inputField} 
                      required
                    />
                  </div>

                  <div className={styles.formGroup} style={{ maxWidth: '350px' }}>
                    <label>رمز عبور جدید:</label>
                    <input 
                      type="password" 
                      value={passForm.newPass} 
                      onChange={e => setPassForm(prev => ({ ...prev, newPass: e.target.value }))}
                      placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)..." 
                      className={styles.inputField} 
                      required
                    />
                    
                    {/* Interactive password complexity strength indicator */}
                    {passForm.newPass && (
                      <div className={styles.strengthMeter}>
                        <div className={styles.strengthMeterLabelRow}>
                          <span style={{ color: '#8b92a5' }}>پیچیدگی رمز عبور:</span>
                          <span style={{ fontWeight: '750', color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className={styles.strengthMeterTrack}>
                          <div 
                            className={styles.strengthMeterFill} 
                            style={{ 
                              width: `${(passwordStrength.score / 5) * 100}%`,
                              backgroundColor: passwordStrength.color
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup} style={{ maxWidth: '350px' }}>
                    <label>تکرار رمز عبور جدید:</label>
                    <input 
                      type="password" 
                      value={passForm.confirmPass} 
                      onChange={e => setPassForm(prev => ({ ...prev, confirmPass: e.target.value }))}
                      placeholder="تکرار رمز عبور جدید..." 
                      className={styles.inputField} 
                      required
                    />
                  </div>

                  <button type="submit" className={styles.loginBtn} style={{ width: 'auto', padding: '10px 30px', margin: '15px 0 0' }}>
                    تغییر رمز عبور ورود
                  </button>
                </form>
              </div>

              {/* Restore Defaults */}
              <div className={styles.securityCard} style={{ border: '1px solid rgba(255, 77, 77, 0.2)', background: 'rgba(255, 77, 77, 0.01)' }}>
                <h3 style={{ borderRightColor: '#ff4d4d', color: '#ff4d4d' }}>🚨 بازیابی داده‌های اولیه و ریست کامل</h3>
                <p style={{ fontSize: '13px', color: '#c4c8d4', lineHeight: '1.6', marginBottom: '20px' }}>
                  توجه: این عمل تمامی اطلاعات لیدها، محصولات آپلودی جدید و پیام‌ها را حذف کرده و داده‌های آزمایشی اولیه و رمز عبور پیش‌فرض پنل مدیریت (<strong>@Reza112233</strong>) را در لوکال استوریج بازیابی می‌کند.
                </p>
                <button 
                  onClick={handleRestoreDefaults} 
                  className={styles.logoutBtn} 
                  style={{ width: 'auto', padding: '12px 30px', margin: 0 }}
                >
                  حذف داده‌های ثبت شده و بازگشت به تنظیمات کارخانه
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
