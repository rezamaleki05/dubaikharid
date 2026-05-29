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
    productName: 'MacBook Air M2',
    brand: 'Apple',
    weight: 1.24,
    totalToman: 32760000,
    priceAed: 1680,
    date: '2026-05-28T14:30:00Z',
    status: 'pending'
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
    totalToman: 6201000,
    priceAed: 318,
    date: '2026-05-26T11:00:00Z',
    status: 'contacted'
  },
  {
    id: 'DKHARID-21844',
    customerName: 'مریم رضایی',
    phone: '09139876543',
    address: 'اصفهان، خیابان چهارباغ بالا، ساختمان پارس',
    notes: 'کادوپچ شود لطفا.',
    productName: 'Dior Sauvage EDP 100ml',
    brand: 'Dior',
    weight: 0.55,
    totalToman: 6201000,
    priceAed: 318,
    date: '2026-05-25T09:15:00Z',
    status: 'paid'
  }
];

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

  // Load persistence layers on mount
  useEffect(() => {
    // Check if already logged in via sessionStorage during tab session
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

  // Handle Log In
  const handleLogin = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('dubaiKharidAdminPassword') || '@Reza112233';
    
    if (passwordInput === storedPassword) {
      setIsLoggedIn(true);
      sessionStorage.setItem('dubaiKharidAdminSession', 'active');
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('رمز ورود اشتباه است. لطفاً دوباره تلاش کنید.');
    }
  };

  // Handle Log Out
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('dubaiKharidAdminSession');
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

    // Compile new product object
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
      alert('محصول جدید با موفقیت به سایت اضافه شد و در لیست دسته‌بندی‌ها قرار گرفت!');
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

  // Change lead status in real-time
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
  };

  // Moderate review status (approve or delete)
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
    const storedPassword = localStorage.getItem('dubaiKharidAdminPassword') || '@Reza112233';

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

    // Save new password
    localStorage.setItem('dubaiKharidAdminPassword', passForm.newPass);
    setPasswordChangeSuccess(true);
    setPasswordChangeError('');
    setPassForm({ oldPass: '', newPass: '', confirmPass: '' });
  };

  // Restore default seed settings
  const handleRestoreDefaults = () => {
    if (!confirm('توجه: با بازگردانی اطلاعات، تمام لیدها و پیام‌های دریافتی جدید شما پاک شده و دیتابیس آزمایشی بازیابی خواهد شد. آیا ادامه می‌دهید؟')) return;
    
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(INITIAL_LEADS_SEED));
    localStorage.setItem('dubaiKharidReviews', JSON.stringify([]));
    localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify([]));
    localStorage.setItem('dubaiKharidAdminPassword', '@Reza112233');

    setLeads(INITIAL_LEADS_SEED);
    setReviews([]);
    setUploadedProducts([]);
    setAllProductsCount(getAllProducts().length);
    alert('اطلاعات پیش‌فرض پنل مدیریت با موفقیت بازیابی شد و رمز عبور به @Reza112233 بازگشت.');
  };

  // Formatting utilities
  const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');
  const fmtDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('fa-IR');
  };

  // Build direct WhatsApp pre-filled link
  const getWhatsAppLink = (lead) => {
    let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = `98${cleanPhone.slice(1)}`;
    }
    
    const message = `سلام ${lead.customerName} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\n📦 سفارش شما: ${lead.productName}\n💰 مبلغ کل: ${fmtToman(lead.totalToman)} تومان\n📍 آدرس تحویل: ${lead.address}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Filtered Leads list
  const filteredLeads = leads.filter(lead => {
    const q = leadSearch.toLowerCase();
    return (
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.id.toLowerCase().includes(q) ||
      lead.productName.toLowerCase().includes(q)
    );
  });

  // Filtered Reviews list
  const filteredReviews = reviews.filter(rev => {
    const q = reviewSearch.toLowerCase();
    return (
      rev.userName.toLowerCase().includes(q) ||
      rev.productName.toLowerCase().includes(q) ||
      rev.comment.toLowerCase().includes(q)
    );
  });

  // Dashboard Overview computations
  const totalRevenue = leads
    .filter(l => l.status === 'paid' || l.status === 'shipped')
    .reduce((acc, l) => acc + l.totalToman, 0);

  const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;

  // Render Login overlay if not authenticated
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
      {/* Dynamic Standalone Top Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '850', color: '#fff', margin: 0 }}>پنل ادمین دبی خرید</h1>
            <span style={{ fontSize: '11px', color: '#8b92a5' }}>سامانه جامع مدیریت فروشگاه کارگو امارات</span>
          </div>
        </div>
        <Link href="/" className={styles.editActionBtn} style={{ textDecoration: 'none', background: 'rgba(248,120,32,0.1)', color: '#f87820', borderColor: 'rgba(248,120,32,0.2)', padding: '8px 18px', fontWeight: 'bold' }}>
          🛒 مشاهده فروشگاه اصلی
        </Link>
      </header>

      <div className={styles.dashboardContainer}>
        {/* SIDEBAR NAVIGATION */}
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
            <span>🚪</span> خروج از پنل ادمین
          </button>
        </aside>

        {/* MAIN PANEL CONTENT BODY */}
        <main className={styles.mainContent}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📊 داشبورد آمار و ارقام دبی خرید</h1>
                  <p className={styles.sectionDesc}>خلاصه‌ای از وضعیت فروش، کارگو هوایی و درخواست‌های فعال در سراسر ایران</p>
                </div>
              </div>

              {/* Stat Boxes */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div>
                    <span className={styles.statTitle}>درآمد قطعی (وصول شده)</span>
                    <div className={styles.statNumber}>{fmtToman(totalRevenue)} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>تومان</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statOrange}`}>💰</div>
                </div>
                
                <div className={styles.statCard}>
                  <div>
                    <span className={styles.statTitle}>سفارشات جدید (لید)</span>
                    <div className={styles.statNumber}>{pendingLeadsCount} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>عدد</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statOrange}`}>📥</div>
                </div>

                <div className={styles.statCard}>
                  <div>
                    <span className={styles.statTitle}>کل کالاهای کاتالوگ</span>
                    <div className={styles.statNumber}>{allProductsCount} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>مدل</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statOrange}`}>🛍️</div>
                </div>

                <div className={styles.statCard}>
                  <div>
                    <span className={styles.statTitle}>نظرات کاربران</span>
                    <div className={styles.statNumber}>{reviews.length} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>دیدگاه</span></div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.statOrange}`}>💬</div>
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

                {/* Popular Stores & Categories Breakdown */}
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

          {/* TAB 2: LEADS & ORDERS MANAGER */}
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
                      <th>کد رهگیری</th>
                      <th>نام خریدار</th>
                      <th>شماره موبایل</th>
                      <th>محصول درخواستی</th>
                      <th>مبلغ کل (تومان)</th>
                      <th>تاریخ ثبت سفارش</th>
                      <th>هماهنگی واتساپ</th>
                      <th>تغییر وضعیت سفارش</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id}>
                        <td style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#ff9d00', fontSize: '11px' }}>{lead.id}</td>
                        <td>
                          <div style={{ fontWeight: '750' }}>{lead.customerName}</div>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }} title={lead.address}>
                            {lead.address.slice(0, 20)}...
                          </span>
                        </td>
                        <td style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{lead.phone}</td>
                        <td>
                          <div>{lead.productName}</div>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>
                            برند: {lead.brand} | وزن: {lead.weight}kg
                          </span>
                          {lead.notes && (
                            <div style={{ fontSize: '10px', color: '#f87820', background: 'rgba(248,120,32,0.05)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                              📝 {lead.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>{fmtToman(lead.totalToman)}</td>
                        <td style={{ fontSize: '11px', color: '#8b92a5' }}>{fmtDate(lead.date)}</td>
                        <td>
                          <a 
                            href={getWhatsAppLink(lead)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.whatsappLinkBtn}
                          >
                            💬 چت هماهنگی
                          </a>
                        </td>
                        <td>
                          <select 
                            value={lead.status} 
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={styles.statusSelect}
                          >
                            <option value="pending">در انتظار بررسی</option>
                            <option value="contacted">تماس گرفته شده</option>
                            <option value="paid">پرداخت شده</option>
                            <option value="shipped">ارسال شده (کارگو)</option>
                            <option value="cancelled">لغو شده</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteLead(lead.id)} 
                            className={styles.deleteActionBtn}
                            title="حذف سفارش"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
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

          {/* TAB 3: PRODUCT UPLOADER */}
          {activeTab === 'products' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📤 آپلود و درج محصول جدید در دبی خرید</h1>
                  <p className={styles.sectionDesc}>درج مشخصات کالا جهت آپلود مستقیم در کاتالوگ فروشگاه با فیلترها و رنگ‌های تعاملی</p>
                </div>
              </div>

              {/* Uploader Form */}
              <form onSubmit={handleProductUpload} className={styles.uploadForm}>
                
                {/* Title */}
                <div className={styles.formHalfWidth}>
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

                {/* Subtitle spec */}
                <div>
                  <label className={styles.formLabel}>مشخصات فرعی یا مشخصات فنی کوتاه</label>
                  <input 
                    type="text" 
                    value={prodForm.spec} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, spec: e.target.value }))}
                    placeholder="مثال: لایه هوای فعال / استوک وارداتی" 
                    className={styles.inputField} 
                  />
                </div>

                {/* Brand */}
                <div>
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

                {/* Store origin */}
                <div>
                  <label className={styles.formLabel}>سایت مرجع امارات (دبی)</label>
                  <input 
                    type="text" 
                    value={prodForm.store} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, store: e.target.value }))}
                    placeholder="مثال: noon.com" 
                    className={styles.inputField} 
                  />
                </div>

                {/* Price AED */}
                <div>
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

                {/* Category */}
                <div>
                  <label className={styles.formLabel}>دسته‌بندی فروشگاه</label>
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

                {/* Gender targeting routing */}
                <div>
                  <label className={styles.formLabel}>منوی جنسیت هدف (جهت هماهنگی منو)</label>
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

                {/* Weight class */}
                <div>
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

                {/* Discount percent */}
                <div>
                  <label className={styles.formLabel}>درصد تخفیف (در صورت وجود)</label>
                  <input 
                    type="number" 
                    value={prodForm.discountPercent} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                    placeholder="مثال: 20" 
                    className={styles.inputField} 
                  />
                </div>

                {/* Colors (comma separated) */}
                <div>
                  <label className={styles.formLabel}>رنگ‌های موجود (با کامای فارسی جدا کنید)</label>
                  <input 
                    type="text" 
                    value={prodForm.colors} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, colors: e.target.value }))}
                    placeholder="مثال: مشکی, سفید, طوسی" 
                    className={styles.inputField} 
                  />
                </div>

                {/* Sizes (comma separated) */}
                <div>
                  <label className={styles.formLabel}>سایزهای موجود (با کامای فارسی جدا کنید)</label>
                  <input 
                    type="text" 
                    value={prodForm.sizes} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, sizes: e.target.value }))}
                    placeholder="مثال: 40, 41, 42, 43" 
                    className={styles.inputField} 
                  />
                </div>

                {/* Image URL */}
                <div className={styles.formHalfWidth}>
                  <label className={styles.formLabel}>آدرس تصویر کالا (Image URL)</label>
                  <input 
                    type="text" 
                    value={prodForm.image} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-..." 
                    className={styles.inputField} 
                  />
                </div>

                {/* Store link URL */}
                <div className={styles.formHalfWidth}>
                  <label className={styles.formLabel}>لینک کالا در سایت مرجع امارات</label>
                  <input 
                    type="text" 
                    value={prodForm.link} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://www.amazon.ae/gp/product/..." 
                    className={styles.inputField} 
                  />
                </div>

                {/* isBestSeller checkbox */}
                <div className={styles.checkboxFieldWrap}>
                  <input 
                    type="checkbox" 
                    id="isBestSeller"
                    checked={prodForm.isBestSeller} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                    className={styles.checkboxField} 
                  />
                  <label htmlFor="isBestSeller" className={styles.checkboxLabel}>کالا به عنوان پرفروش علامت‌گذاری شود</label>
                </div>

                {/* Description */}
                <div className={styles.formFullWidth}>
                  <label className={styles.formLabel}>توضیحات تکمیلی کالا</label>
                  <textarea 
                    rows="3"
                    value={prodForm.description} 
                    onChange={(e) => setProdForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="اطلاعات تکمیلی، نحوه دوخت، ویژگی‌ها و..."
                    className={styles.textareaField}
                  />
                </div>

                {/* Action button */}
                <div className={styles.formActionsWrap}>
                  <button type="submit" className={styles.loginBtn} style={{ margin: 0, width: 'auto', padding: '14px 40px' }}>
                    📤 آپلود و انتشار محصول در سایت
                  </button>
                </div>
              </form>

              {/* Uploaded Products list for management */}
              {uploadedProducts.length > 0 && (
                <div style={{ marginTop: '50px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '750', marginBottom: '20px', borderRight: '3px solid #f87820', paddingRight: '10px' }}>
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
                              <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                            </td>
                            <td>
                              <div style={{ fontWeight: '750' }}>{p.name}</div>
                              <span style={{ fontSize: '11px', color: '#8b92a5' }}>شناسه: {p.id}</span>
                            </td>
                            <td>{p.brand}</td>
                            <td>{p.priceAed} درهم</td>
                            <td>
                              <div>{p.category}</div>
                              <span style={{ fontSize: '11px', color: '#8b92a5' }}>
                                منو: {p.gender === 'men' ? 'مردانه' : p.gender === 'women' ? 'زنانه' : p.gender === 'kids' ? 'کودک' : 'عمومی'}
                              </span>
                            </td>
                            <td>{p.isBestSeller ? '🔥 پرفروش' : 'عادی'}</td>
                            <td>
                              <button onClick={() => handleDeleteProduct(p.id)} className={styles.deleteActionBtn}>
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
                          <button onClick={() => handleDeleteReview(rev.id)} className={styles.deleteActionBtn}>
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

          {/* TAB 5: SECURITY SETTINGS */}
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
                      className={styles.reviewInput} 
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
                      className={styles.reviewInput} 
                      required
                    />
                  </div>

                  <div className={styles.formGroup} style={{ maxWidth: '350px' }}>
                    <label>تکرار رمز عبور جدید:</label>
                    <input 
                      type="password" 
                      value={passForm.confirmPass} 
                      onChange={e => setPassForm(prev => ({ ...prev, confirmPass: e.target.value }))}
                      placeholder="تکرار رمز عبور جدید..." 
                      className={styles.reviewInput} 
                      required
                    />
                  </div>

                  <button type="submit" className={styles.loginBtn} style={{ width: 'auto', padding: '10px 30px', margin: '10px 0 0' }}>
                    تغییر رمز عبور ورود
                  </button>
                </form>
              </div>

              {/* Restore Defaults / Reset */}
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
