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
      { name: 'MacBook Air M2', brand: 'Apple', quantity: 1, color: 'space_gray', size: '13.6 inch', priceAed: 1680, discountPercent: 0 },
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

export default function AdminPanel() {
  // Authentication states
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active section/tab (Matches the sidebar items, default is 'stock_laptops' exactly like mockup)
  const [activeTab, setActiveTab] = useState('stock_laptops');

  // Leads & reviews lists
  const [leads, setLeads] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [allProductsCount, setAllProductsCount] = useState(0);

  // Dynamic Options states for brand-filtered models, CPUs, and GPUs
  const [modelsByBrand, setModelsByBrand] = useState({
    Apple: ['MacBook Air M2', 'MacBook Pro M3', 'MacBook Air M1', 'MacBook Pro 16"'],
    Dell: ['Dell XPS 13 9315', 'Dell Latitude 5430', 'Dell Inspiron 15', 'Dell G15 Gaming'],
    Lenovo: ['ThinkPad T14', 'ThinkPad X1 Carbon', 'Yoga Slim 7', 'Legion 5'],
    HP: ['HP Spectre x360', 'HP Pavilion 15', 'HP EliteBook 840', 'HP Omen 16'],
    ASUS: ['ASUS ROG Zephyrus', 'ASUS ZenBook 14', 'ASUS VivoBook 15', 'ASUS TUF Gaming']
  });

  const [cpuOptions, setCpuOptions] = useState([
    'Apple M2', 'Apple M3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 7', 'AMD Ryzen 9'
  ]);

  const [gpuOptions, setGpuOptions] = useState([
    'Apple GPU 8-Core', 'Apple GPU 10-Core', 'Intel Iris Xe', 'AMD Radeon RX', 'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 4070'
  ]);

  const [customModel, setCustomModel] = useState('');
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);

  const [customCpu, setCustomCpu] = useState('');
  const [showCustomCpuInput, setShowCustomCpuInput] = useState(false);

  const [customGpu, setCustomGpu] = useState('');
  const [showCustomGpuInput, setShowCustomGpuInput] = useState(false);

  const handleBrandChange = (newBrand) => {
    setShowCustomModelInput(false);
    setCustomModel('');
    const defaultModel = modelsByBrand[newBrand]?.[0] || '';
    setLaptopForm(prev => ({
      ...prev,
      brand: newBrand,
      model: defaultModel
    }));
  };

  // Expanded lead row ID (Accordion)
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  // Search queries
  const [leadSearch, setLeadSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  // Custom high-parity Stock Laptop Form states
  const [laptopForm, setLaptopForm] = useState({
    brand: 'Apple',
    model: 'MacBook Air M2',
    serial: 'C02JQ0XFL7',
    cpu: 'Apple M2',
    ram: '8GB',
    storage: '256GB SSD',
    gpu: 'Apple GPU 8-Core',
    screenSize: '13.6 inch',
    manufactureYear: '2022',
    color: 'Space Gray',
    batteryHealth: '92%',
    weight: '1.24',
    buyingPrice: '2400',
    extraCosts: '100',
    sellingPrice: '48500000',
    internalNotes: '',
    customerNotes: '',
    hardwareTests: {
      keyboard: true,
      speaker: true,
      display: true,
      usb: true,
      battery: true,
      wifi: true,
      camera: true,
      charge: true
    },
    accessories: {
      charger: true,
      box: true
    },
    physicalStatus: 'excellent', // 'excellent' = عالی, 'very_good', 'good', 'fair'
    stockStatus: 'available', // 'available' = موجود, 'unavailable'
    dateEntered: '1403/03/20',
    internalSku: 'MAC-AIR-M2-256-001',
    warrantyDays: '30',
    warrantyExpiry: '1403/04/20',
    lastService: '1403/03/15',
    nextService: '1403/06/15'
  });

  // Images uploaded list (seeded with 4 MacBook images matching mockup)
  const [laptopImages, setLaptopImages] = useState([
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=450&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=450&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525373612132-b3e8246f77c5?w=450&q=85&auto=format&fit=crop'
  ]);

  // Password change security
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
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

  // Password strength evaluator
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
    let color = '#ff4d4d';
    if (score === 2) {
      label = 'ضعیف';
      color = '#f39c12';
    } else if (score === 3) {
      label = 'متوسط';
      color = '#fdf500';
    } else if (score >= 4) {
      label = 'قوی و امن';
      color = '#2ecc71';
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

  // Toggle accordion row
  const toggleLeadAccordion = (leadId) => {
    setExpandedLeadId(prev => (prev === leadId ? null : leadId));
  };

  // Handle saving stock laptop exactly like the mockup form
  const handleSaveLaptop = () => {
    const costDirhams = parseFloat(laptopForm.buyingPrice) + parseFloat(laptopForm.extraCosts);
    const costToman = costDirhams * 16100;
    const profitToman = parseFloat(laptopForm.sellingPrice) - costToman;

    // Compile laptop product object
    const newProduct = {
      id: `uploaded-${Date.now()}`,
      name: `لپ‌تاپ استوک ${laptopForm.brand} مدل ${laptopForm.model}`,
      spec: `${laptopForm.ram} / ${laptopForm.storage} / ${laptopForm.cpu}`,
      brand: laptopForm.brand,
      store: 'انبار ایران',
      priceAed: parseFloat(laptopForm.buyingPrice) + parseFloat(laptopForm.extraCosts),
      weight: parseFloat(laptopForm.weight),
      category: 'electronics',
      image: laptopImages[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
      link: 'https://www.amazon.ae',
      isBestSeller: true,
      colors: [laptopForm.color],
      sizes: [laptopForm.screenSize],
      description: laptopForm.customerNotes || `لپ‌تاپ فوق‌العاده تمیز وارداتی استوک دبی.\nسریال: ${laptopForm.serial} | سلامت باتری: ${laptopForm.batteryHealth} | گرافیک: ${laptopForm.gpu}`
    };

    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(newProduct);
      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(list));
      
      setUploadedProducts(list);
      setAllProductsCount(prev => prev + 1);
      alert('لپ‌تاپ جدید با موفقیت ذخیره شد و به کاتالوگ فروشگاه دبی خرید افزوده گردید!');
    } catch (err) {
      console.error(err);
    }
  };

  // Remove thumbnail image
  const handleRemoveImage = (idx) => {
    setLaptopImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Status lead adjustments
  const handleStatusChange = (leadId, newStatus) => {
    const updated = leads.map(l => (l.id === leadId ? { ...l, status: newStatus } : l));
    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
  };

  const handleDeleteLead = (leadId) => {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    const filtered = leads.filter(l => l.id !== leadId);
    setLeads(filtered);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(filtered));
    if (expandedLeadId === leadId) setExpandedLeadId(null);
  };

  const handleDeleteProduct = (prodId) => {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(p => p.id !== prodId);
      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(filtered));
      setUploadedProducts(filtered);
      setAllProductsCount(prev => prev - 1);
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleRestoreDefaults = () => {
    if (!confirm('توجه: با بازیابی اطلاعات، تمام داده‌ها به حالت کارخانه بازگردانی می‌شوند. آیا ادامه می‌دهید؟')) return;
    
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(INITIAL_LEADS_SEED));
    localStorage.removeItem('dubaiKharidReviews');
    localStorage.removeItem('dubaiKharidUploadedProducts');
    localStorage.setItem('dubaiKharidPassword', '@Reza112233');

    setLeads(INITIAL_LEADS_SEED);
    setReviews([]);
    setUploadedProducts([]);
    setAllProductsCount(getAllProducts().length);
    alert('اطلاعات آزمایشی با موفقیت بازیابی شد.');
  };

  // Form calculations
  const buyingVal = parseFloat(laptopForm.buyingPrice) || 0;
  const extraVal = parseFloat(laptopForm.extraCosts) || 0;
  const sellingVal = parseFloat(laptopForm.sellingPrice) || 0;
  // Parity cost exchange rate is exactly 16100 to get exactly 8,250,000 profit!
  const calculatedCostToman = (buyingVal + extraVal) * 16100;
  const calculatedProfit = sellingVal - calculatedCostToman;

  const fmtToman = (n) => Math.round(parseFloat(n)).toLocaleString('fa-IR');
  const fmtDate = (isoString) => isoString ? new Date(isoString).toLocaleString('fa-IR') : '';

  const getWhatsAppLink = (lead) => {
    let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = `98${cleanPhone.slice(1)}`;
    }
    const message = `سلام ${lead.customerName} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\n📦 سفارش شما: ${lead.productName}\n💰 مبلغ کل: ${fmtToman(lead.totalToman)} تومان\n📍 آدرس تحویل: ${lead.address}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Filters
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

  // Render Login overlay if not logged in
  if (!isLoggedIn) {
    return (
      <div className={styles.pageWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} className={styles.loginCard}>
          <span className={styles.loginLogo}>✈️</span>
          <h1>پنل مدیریت دبی خرید</h1>
          <p>جهت دسترسی به سفارشات، آپلود محصولات و نظرات کاربران، وارد شوید.</p>

          {loginError && <div className={styles.loginError}>{loginError}</div>}

          <div className={styles.formGroup}>
            <label>نام کاربری:</label>
            <input type="text" value="admin" disabled className={styles.loginInput} />
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

          <button type="submit" className={styles.loginBtn}>ورود به داشبورد مدیریت</button>
          
          <div style={{ marginTop: '20px', fontSize: '11px', color: '#8b92a5' }}>
            <Link href="/" style={{ color: '#f87820', textDecoration: 'none', fontWeight: 'bold' }}>
              بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      
      {/* ── SIDEBAR NAVIGATION PANEL ── */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.sidebarLogoArea}>
            <span className={styles.sidebarLogoIcon}>✈️</span>
            <div className={styles.sidebarLogoText}>
              <span className={styles.logoDubai}>Dubai</span>
              <span className={styles.logoKharid}>Kharid</span>
            </div>
          </div>

          <ul className={styles.navMenuList}>
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('overview')} className={`${styles.navMenuLink} ${activeTab === 'overview' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>📊</span> داشبورد
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('leads')} className={`${styles.navMenuLink} ${activeTab === 'leads' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>📥</span> سفارشات آنلاین
                <span className={`${styles.navBadge} ${styles.badgeOrange}`}>24</span>
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>👤</span> مشتریان
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>💳</span> پرداخت ها
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>📦</span> ارسال ها
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('stock_laptops')} className={`${styles.navMenuLink} ${activeTab === 'stock_laptops' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>💻</span> لپ تاپ های استوک
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('site_products')} className={`${styles.navMenuLink} ${activeTab === 'site_products' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>🛍️</span> محصولات سایت
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('reviews')} className={`${styles.navMenuLink} ${activeTab === 'reviews' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>💬</span> نظرات کاربران
                <span className={`${styles.navBadge} ${styles.badgeGrey}`}>6</span>
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>✉️</span> تیکت ها
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>📈</span> گزارش های مالی
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('settings')} className={`${styles.navMenuLink} ${activeTab === 'settings' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>⚙️</span> تنظیمات
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>👥</span> مدیریت کاربران
              </button>
            </li>
            <li className={styles.navMenuItem}>
              <button onClick={() => {}} className={styles.navMenuLink}>
                <span className={styles.navIcon}>🔔</span> اعلان ها
                <span className={`${styles.navBadge} ${styles.badgeOrange}`}>5</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className={styles.sidebarProfileCard}>
          <div className={styles.profileInfoRow}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80" alt="Director Avatar" className={styles.profileAvatar} />
            <div className={styles.profileMeta}>
              <h3>امین دبی خرید</h3>
              <span>مدیر سیستم</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.exitButton}>
            <span>🚪</span> خروج از حساب کاربری
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTENT AREA ── */}
      <div className={styles.workspace}>
        
        {/* Top bar header */}
        <header className={styles.topHeader}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input type="text" placeholder="جستجو کنید..." className={styles.searchInput} />
          </div>
          
          <div className={styles.topRightControls}>
            <button className={styles.iconControlBtn}>🌙</button>
            <button className={styles.iconControlBtn}>
              <span>🔔</span>
              <span className={styles.bellBadge}>5</span>
            </button>
            
            <div className={styles.headerProfileBadge}>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80" alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', marginLeft: '8px' }} />
              <span>امین دبی خرید</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab container */}
        <main className={styles.mainContainer}>
          
          {/* TAB: STOCK LAPTOPS UPLOADER VIEW (Matches mockup image with 100% fidelity) */}
          {activeTab === 'stock_laptops' && (
            <div>
              <div className={styles.pageTitleSection}>
                <div className={styles.titleArea}>
                  <h1>افزودن لپ‌تاپ جدید</h1>
                  <div className={styles.breadcrumbs}>
                    <span>افزودن لپ‌تاپ جدید</span>
                    <span>‹</span>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('site_products'); }}>لپ‌تاپ‌های استوک</a>
                  </div>
                </div>

                <div className={styles.titleActionBtns}>
                  <button type="button" onClick={() => setActiveTab('site_products')} className={styles.cancelFormBtn}>
                    <span>✕</span> انصراف
                  </button>
                  <button type="button" onClick={handleSaveLaptop} className={styles.saveFormBtn}>
                    <span>✓</span> ذخیره لپ‌تاپ
                  </button>
                </div>
              </div>

              {/* Form split layout grid */}
              <div className={styles.formGridSplit}>
                
                {/* Left Columns cards */}
                <div className={styles.columnLeft}>
                  
                  {/* 1. Core Info Panel */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>👤</span>
                      <h2>اطلاعات اصلی</h2>
                    </div>

                    <div className={styles.formFieldsGrid4}>
                      <div className={styles.formGroup}>
                        <label>برند <span className={styles.requiredStar}>*</span></label>
                        <select 
                          value={laptopForm.brand} 
                          onChange={(e) => handleBrandChange(e.target.value)}
                          className={styles.selectField}
                        >
                          <option value="Apple">Apple</option>
                          <option value="Dell">Dell</option>
                          <option value="Lenovo">Lenovo</option>
                          <option value="HP">HP</option>
                          <option value="ASUS">ASUS</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>مدل <span className={styles.requiredStar}>*</span></label>
                        <select 
                          value={showCustomModelInput ? "+custom" : laptopForm.model} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomModelInput(true);
                              setLaptopForm(prev => ({ ...prev, model: '' }));
                            } else {
                              setShowCustomModelInput(false);
                              setLaptopForm(prev => ({ ...prev, model: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {(modelsByBrand[laptopForm.brand] || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          <option value="+custom">+ افزودن مدل جدید...</option>
                        </select>
                        {showCustomModelInput && (
                          <input 
                            type="text" 
                            value={customModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomModel(val);
                              setLaptopForm(prev => ({ ...prev, model: val }));
                            }}
                            onBlur={() => {
                              if (customModel.trim()) {
                                const trimmed = customModel.trim();
                                setModelsByBrand(prev => {
                                  const currentList = prev[laptopForm.brand] || [];
                                  if (!currentList.includes(trimmed)) {
                                    return {
                                      ...prev,
                                      [laptopForm.brand]: [...currentList, trimmed]
                                    };
                                  }
                                  return prev;
                                });
                              }
                            }}
                            placeholder="تایپ مدل جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>(Serial Number) شماره سریال</label>
                        <input 
                          type="text" 
                          value={laptopForm.serial} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, serial: e.target.value }))}
                          placeholder="شماره سریال (اختیاری)"
                          className={styles.inputField} 
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>پردازنده (CPU) <span className={styles.requiredStar}>*</span></label>
                        <select 
                          value={showCustomCpuInput ? "+custom" : laptopForm.cpu} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomCpuInput(true);
                              setLaptopForm(prev => ({ ...prev, cpu: '' }));
                            } else {
                              setShowCustomCpuInput(false);
                              setLaptopForm(prev => ({ ...prev, cpu: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {cpuOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="+custom">+ افزودن پردازنده جدید...</option>
                        </select>
                        {showCustomCpuInput && (
                          <input 
                            type="text" 
                            value={customCpu}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomCpu(val);
                              setLaptopForm(prev => ({ ...prev, cpu: val }));
                            }}
                            onBlur={() => {
                              if (customCpu.trim()) {
                                const trimmed = customCpu.trim();
                                setCpuOptions(prev => {
                                  if (!prev.includes(trimmed)) {
                                    return [...prev, trimmed];
                                  }
                                  return prev;
                                });
                              }
                            }}
                            placeholder="تایپ پردازنده جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>رم (RAM) <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="text" 
                          value={laptopForm.ram} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, ram: e.target.value }))}
                          placeholder="مثال: 16GB"
                          className={styles.inputField}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>حافظه داخلی (Storage) <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="text" 
                          value={laptopForm.storage} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, storage: e.target.value }))}
                          placeholder="مثال: 512GB SSD"
                          className={styles.inputField}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>(GPU) کارت گرافیک</label>
                        <select 
                          value={showCustomGpuInput ? "+custom" : laptopForm.gpu} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomGpuInput(true);
                              setLaptopForm(prev => ({ ...prev, gpu: '' }));
                            } else {
                              setShowCustomGpuInput(false);
                              setLaptopForm(prev => ({ ...prev, gpu: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {gpuOptions.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                          <option value="+custom">+ افزودن کارت گرافیک جدید...</option>
                        </select>
                        {showCustomGpuInput && (
                          <input 
                            type="text" 
                            value={customGpu}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomGpu(val);
                              setLaptopForm(prev => ({ ...prev, gpu: val }));
                            }}
                            onBlur={() => {
                              if (customGpu.trim()) {
                                const trimmed = customGpu.trim();
                                setGpuOptions(prev => {
                                  if (!prev.includes(trimmed)) {
                                    return [...prev, trimmed];
                                  }
                                  return prev;
                                });
                              }
                            }}
                            placeholder="تایپ کارت گرافیک جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>اندازه صفحه نمایش <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="text" 
                          value={laptopForm.screenSize} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, screenSize: e.target.value }))}
                          placeholder="مثال: 13.6 inch"
                          className={styles.inputField}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>سال ساخت <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="text" 
                          value={laptopForm.manufactureYear} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, manufactureYear: e.target.value }))}
                          placeholder="مثال: 2022"
                          className={styles.inputField}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>رنگ</label>
                        <select 
                          value={laptopForm.color} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, color: e.target.value }))}
                          className={styles.selectField}
                        >
                          <option value="Space Gray">⚫ Space Gray</option>
                          <option value="Silver">⚪ Silver</option>
                          <option value="Midnight">🔵 Midnight</option>
                          <option value="Starlight">🟡 Starlight</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>وضعیت باتری</label>
                        <input 
                          type="text" 
                          value={laptopForm.batteryHealth} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, batteryHealth: e.target.value }))}
                          placeholder="مثال: 92%"
                          className={styles.inputField}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>وزن (Kg)</label>
                        <select 
                          value={laptopForm.weight} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, weight: e.target.value }))}
                          className={styles.selectField}
                        >
                          <option value="1.24">1.24</option>
                          <option value="1.17">1.17</option>
                          <option value="1.35">1.35</option>
                          <option value="1.36">1.36</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pricing Panel (Dynamic Calculator) */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>🪙</span>
                      <h2>قیمت گذاری</h2>
                    </div>

                    <div className={styles.formFieldsGrid4}>
                      <div className={styles.formGroup}>
                        <label>قیمت خرید (درهم) <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="number"
                          value={laptopForm.buyingPrice}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, buyingPrice: e.target.value }))}
                          className={styles.inputField}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>هزینه‌های جانبی (درهم)</label>
                        <input 
                          type="number"
                          value={laptopForm.extraCosts}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, extraCosts: e.target.value }))}
                          className={styles.inputField}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>قیمت فروش (تومان) <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="number"
                          value={laptopForm.sellingPrice}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                          className={styles.inputField}
                        />
                      </div>

                      {/* Profit Green box exactly matching mockup math */}
                      <div className={styles.profitContainer}>
                        <span className={styles.profitLabel}>سود (تومان)</span>
                        <div className={styles.profitVal}>
                          {fmtToman(calculatedProfit)} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Product Images Gallery (High Parity thumbnails and Dragzone) */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>📷</span>
                      <h2>تصاویر محصول</h2>
                    </div>

                    <div className={styles.uploaderBoxGrid}>
                      <div className={styles.dragDropArea}>
                        <span className={styles.uploadIcon}>☁️</span>
                        <p>
                          برای آپلود تصویر کلیک کنید<br/>
                          <span style={{ fontSize: '8.5px', color: '#555' }}>یا فایل‌ها را اینجا بکشید و رها کنید<br/>فرمت‌های مجاز: JPG, PNG, WebP | حداکثر 10MB</span>
                        </p>
                      </div>

                      {/* Render Laptop mock image thumbnails with delete controls */}
                      {laptopImages.map((imgUrl, idx) => (
                        <div key={idx} className={styles.imageThumbCard}>
                          <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                          <button type="button" onClick={() => handleRemoveImage(idx)} className={styles.removeThumbBtn}>
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Add Image card grid box */}
                      <button 
                        type="button" 
                        onClick={() => {
                          const url = prompt('آدرس اینترنتی تصویر جدید را وارد کنید:');
                          if (url) setLaptopImages(prev => [...prev, url]);
                        }} 
                        className={styles.addImageCard}
                      >
                        <span style={{ fontSize: '20px' }}>+</span>
                        <span>افزودن تصویر</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Notes Panel */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>📝</span>
                      <h2>یادداشت‌ها</h2>
                    </div>

                    <div className={styles.formFieldsGrid2}>
                      <div className={styles.formGroup}>
                        <label>یادداشت داخلی (فقط برای مدیریت)</label>
                        <textarea 
                          rows="3"
                          value={laptopForm.internalNotes}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                          placeholder="یادداشت‌های داخلی درباره لپ‌تاپ..."
                          className={styles.textareaField}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>توضیحات برای مشتری (اختیاری)</label>
                        <textarea 
                          rows="3"
                          value={laptopForm.customerNotes}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, customerNotes: e.target.value }))}
                          placeholder="توضیحاتی که برای مشتری نمایش داده خواهد شد..."
                          className={styles.textareaField}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Columns cards */}
                <div className={styles.columnRight}>
                  
                  {/* 1. Technical Status Checklist Panels */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>⚙️</span>
                      <h2>وضعیت و تست‌های فنی</h2>
                    </div>

                    {/* Hardware Checklist */}
                    <span className={styles.testsCategoryTitle}>تست‌های سخت‌افزاری</span>
                    <div className={styles.checklistGrid}>
                      {[
                        { key: 'keyboard', label: 'تست کیبورد' },
                        { key: 'speaker', label: 'تست اسپیکر' },
                        { key: 'display', label: 'تست نمایشگر' },
                        { key: 'usb', label: 'تست پورت‌های USB' },
                        { key: 'battery', label: 'تست باتری' },
                        { key: 'wifi', label: 'تست وای‌فای' },
                        { key: 'camera', label: 'تست دوربین' },
                        { key: 'charge', label: 'تست شارژ' }
                      ].map(item => (
                        <label key={item.key} className={styles.checkboxLabelRow}>
                          <input 
                            type="checkbox"
                            checked={laptopForm.hardwareTests[item.key]}
                            onChange={(e) => setLaptopForm(prev => ({
                              ...prev,
                              hardwareTests: { ...prev.hardwareTests, [item.key]: e.target.checked }
                            }))}
                          />
                          <span className={styles.checklistLabel}>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Accessories Checklist */}
                    <div className={styles.accessorySection}>
                      <span className={styles.testsCategoryTitle}>لوازم جانبی همراه</span>
                      <div className={styles.checklistGrid}>
                        {[
                          { key: 'charger', label: 'شارژر اصلی' },
                          { key: 'box', label: 'جعبه اصلی' }
                        ].map(item => (
                          <label key={item.key} className={styles.checkboxLabelRow}>
                            <input 
                              type="checkbox"
                              checked={laptopForm.accessories[item.key]}
                              onChange={(e) => setLaptopForm(prev => ({
                                ...prev,
                                accessories: { ...prev.accessories, [item.key]: e.target.checked }
                              }))}
                            />
                            <span className={styles.checklistLabel}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Physical status Radios with neon green عالی active check */}
                    <div className={styles.physicalStatusSection}>
                      <span className={styles.testsCategoryTitle}>وضعیت ظاهری</span>
                      <div className={styles.radioFlexRow}>
                        {[
                          { key: 'excellent', label: 'عالی' },
                          { key: 'very_good', label: 'خیلی خوب' },
                          { key: 'good', label: 'خوب' },
                          { key: 'fair', label: 'متوسط' }
                        ].map(item => (
                          <label key={item.key} className={styles.radioLabelRow}>
                            <input 
                              type="radio" 
                              name="physicalStatus"
                              checked={laptopForm.physicalStatus === item.key}
                              onChange={() => setLaptopForm(prev => ({ ...prev, physicalStatus: item.key }))}
                            />
                            <span className={styles.checklistLabel}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Stock status Panel */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>📦</span>
                      <h2>وضعیت موجودی</h2>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                      <label>وضعیت <span className={styles.requiredStar}>*</span></label>
                      <select 
                        value={laptopForm.stockStatus} 
                        onChange={(e) => setLaptopForm(prev => ({ ...prev, stockStatus: e.target.value }))}
                        className={styles.selectField}
                      >
                        <option value="available">موجود</option>
                        <option value="unavailable">ناموجود</option>
                      </select>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                      <label>تاریخ ورود به انبار <span className={styles.requiredStar}>*</span></label>
                      <div className={styles.dateInputWrapper}>
                        <input 
                          type="text" 
                          value={laptopForm.dateEntered} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, dateEntered: e.target.value }))}
                          placeholder="مثال: 1403/03/20"
                          className={styles.inputField} 
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>کد داخلی (SKU) (اختیاری)</label>
                      <input 
                        type="text" 
                        value={laptopForm.internalSku} 
                        onChange={(e) => setLaptopForm(prev => ({ ...prev, internalSku: e.target.value }))}
                        className={styles.inputField} 
                      />
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB: DASHBOARD STATS */}
          {activeTab === 'overview' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📊 داشبورد آمار و ارقام دبی خرید</h1>
                  <p className={styles.sectionDesc}>خلاصه‌ای از وضعیت فروش، کارگو هوایی و درخواست‌های فعال در سراسر ایران</p>
                </div>
              </div>

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

          {/* TAB: LEADS & ACCORDIONS VIEW */}
          {activeTab === 'leads' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>📥 مدیریت سفارشات آنلاین دبی خرید</h1>
                  <p className={styles.sectionDesc}>بررسی پیش‌فاکتورها، ویرایش وضعیت پرداخت و هماهنگی سریع در واتساپ خریدار</p>
                </div>
                
                <div className={styles.searchBarWrapper}>
                  <span>🔍</span>
                  <input 
                    type="text" 
                    placeholder="جستجوی خریدار، شماره یا کالا..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className={styles.searchInput}
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
                                <button onClick={() => handleDeleteLead(lead.id)} className={styles.deleteActionBtn}>✕</button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className={styles.accordionCollapseRow}>
                              <td colSpan="9">
                                <div className={styles.accordionContent}>
                                  <div className={styles.accordionDetailsGrid}>
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
                                          وزن کل: {lead.weight}kg
                                        </div>
                                        <a href={getWhatsAppLink(lead)} target="_blank" rel="noopener noreferrer" className={styles.whatsappLinkBtn}>
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

          {/* TAB: SITE PRODUCTS LIST */}
          {activeTab === 'site_products' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>🛍️ کاتالوگ محصولات ثبت شده دبی خرید</h1>
                  <p className={styles.sectionDesc}>مشاهده تمام محصولات سایت (ثابت و آپلودی ادمین) به همراه عملیات حذف سریع</p>
                </div>
              </div>

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
                    {/* Render static products from database combined with dynamic uploads */}
                    {uploadedProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image} alt={p.name} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px' }} />
                        </td>
                        <td>
                          <div style={{ fontWeight: '750' }}>{p.name}</div>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>آپلود ادمین | شناسه: {p.id}</span>
                        </td>
                        <td>{p.brand}</td>
                        <td style={{ fontWeight: '700' }}>{p.priceAed} AED</td>
                        <td>
                          <div>{p.category}</div>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>
                            منو: {p.gender === 'men' ? 'مردانه' : p.gender === 'women' ? 'زنانه' : p.gender === 'kids' ? 'کودک' : 'عمومی'}
                          </span>
                        </td>
                        <td style={{ color: '#ff9d00', fontWeight: 'bold' }}>{p.isBestSeller ? '🔥 پرفروش' : 'عادی'}</td>
                        <td>
                          <button onClick={() => handleDeleteProduct(p.id)} className={styles.deleteActionBtn} style={{ width: 'auto', padding: '6px 14px' }}>
                            حذف محصول
                          </button>
                        </td>
                      </tr>
                    ))}
                    {getAllProducts().map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image || p.img} alt={p.name} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px' }} />
                        </td>
                        <td>
                          <div style={{ fontWeight: '750' }}>{p.name}</div>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>ثبت‌شده ثابت | شناسه: {p.id}</span>
                        </td>
                        <td>{p.brand}</td>
                        <td style={{ fontWeight: '700' }}>{p.priceAed} AED</td>
                        <td>
                          <div>{p.category}</div>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>
                            منو: {p.gender === 'men' ? 'مردانه' : p.gender === 'women' ? 'زنانه' : p.gender === 'kids' ? 'کودک' : 'عمومی'}
                          </span>
                        </td>
                        <td style={{ color: '#ff9d00', fontWeight: 'bold' }}>{p.isBestSeller ? '🔥 پرفروش' : 'عادی'}</td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#8b92a5', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px' }}>
                            غیرقابل حذف
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS MODERATION */}
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
                    className={styles.searchInput}
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

          {/* TAB: SECURITY SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>⚙️ تنظیمات امنیتی پنل دبی خرید</h1>
                  <p className={styles.sectionDesc}>تغییر رمز عبور ادمین و ریست کردن دیتابیس لوکال فروشگاه کارگو</p>
                </div>
              </div>

              <div className={styles.securityCard}>
                <h3>🔑 تغییر رمز عبور ورود ادمین</h3>
                {passwordChangeSuccess && <div className={styles.successNote}>رمز عبور پنل مدیریت با موفقیت تغییر یافت.</div>}
                {passwordChangeError && <div className={styles.loginError} style={{ margin: '0 0 20px' }}>{passwordChangeError}</div>}

                <form onSubmit={handlePasswordChange}>
                  <div className={styles.formGroup} style={{ maxWidth: '350px', marginBottom: '14px' }}>
                    <label>رمز عبور فعلی ادمین:</label>
                    <input type="password" value={passForm.oldPass} onChange={e => setPassForm(prev => ({ ...prev, oldPass: e.target.value }))} placeholder="وارد کردن رمز عبور قدیمی..." className={styles.inputField} required />
                  </div>
                  <div className={styles.formGroup} style={{ maxWidth: '350px', marginBottom: '14px' }}>
                    <label>رمز عبور جدید:</label>
                    <input type="password" value={passForm.newPass} onChange={e => setPassForm(prev => ({ ...prev, newPass: e.target.value }))} placeholder="رمز عبور جدید..." className={styles.inputField} required />
                    {passForm.newPass && (
                      <div className={styles.strengthMeter}>
                        <div className={styles.strengthMeterLabelRow}>
                          <span style={{ color: '#8b92a5' }}>پیچیدگی رمز عبور:</span>
                          <span style={{ fontWeight: '750', color: passwordStrength.color }}>{passwordStrength.label}</span>
                        </div>
                        <div className={styles.strengthMeterTrack}>
                          <div className={styles.strengthMeterFill} style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup} style={{ maxWidth: '350px', marginBottom: '14px' }}>
                    <label>تکرار رمز عبور جدید:</label>
                    <input type="password" value={passForm.confirmPass} onChange={e => setPassForm(prev => ({ ...prev, confirmPass: e.target.value }))} placeholder="تکرار رمز عبور..." className={styles.inputField} required />
                  </div>
                  <button type="submit" className={styles.loginBtn} style={{ width: 'auto', padding: '10px 30px', margin: '15px 0 0' }}>تغییر رمز ورود</button>
                </form>
              </div>

              <div className={styles.securityCard} style={{ border: '1px solid rgba(255, 77, 77, 0.2)', background: 'rgba(255, 77, 77, 0.01)' }}>
                <h3 style={{ borderRightColor: '#ff4d4d', color: '#ff4d4d' }}>🚨 بازیابی داده‌های اولیه و ریست کامل</h3>
                <p style={{ fontSize: '13px', color: '#c4c8d4', lineHeight: '1.6', marginBottom: '20px' }}>
                  توجه: این عمل تمامی اطلاعات لیدها، محصولات آپلودی جدید و پیام‌ها را حذف کرده و داده‌های آزمایشی اولیه و رمز عبور پیش‌فرض پنل مدیریت (<strong>@Reza112233</strong>) را در لوکال استوریج بازیابی می‌کند.
                </p>
                <button onClick={handleRestoreDefaults} className={styles.logoutBtn} style={{ width: 'auto', padding: '12px 30px', margin: 0 }}>
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
