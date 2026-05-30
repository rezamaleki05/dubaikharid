'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Admin.module.css';

// ==========================================================================
// SEEDING DATABASE SCHEMAS (15+ Orders, 10+ Customers, 5+ Laptops, CMS, etc.)
// ==========================================================================

const MOCK_CUSTOMERS_SEED = [
  { id: 'c-1', name: 'علیرضا ملکی', phone: '09176168381', email: 'reza.maleki@gmail.com', city: 'شیراز', totalOrders: 5, totalSpending: 76800000, level: 'vip' },
  { id: 'c-2', name: 'امیرحسین قاسمی', phone: '09121234567', email: 'amir.gh@yahoo.com', city: 'تهران', totalOrders: 2, totalSpending: 12400000, level: 'regular' },
  { id: 'c-3', name: 'سارا کریمی', phone: '09139876543', email: 'sara.k@gmail.com', city: 'اصفهان', totalOrders: 7, totalSpending: 145000000, level: 'wholesale' },
  { id: 'c-4', name: 'زهرا مرادی', phone: '09355556677', email: 'zahra.m@gmail.com', city: 'مشهد', totalOrders: 1, totalSpending: 3100000, level: 'new' },
  { id: 'c-5', name: 'پیمان حسینی', phone: '09144445555', email: 'peyman.h@gmail.com', city: 'تبریز', totalOrders: 4, totalSpending: 52000000, level: 'vip' },
  { id: 'c-6', name: 'مریم ساداتی', phone: '09117778888', email: 'mary.s@gmail.com', city: 'رشت', totalOrders: 3, totalSpending: 19500000, level: 'regular' },
  { id: 'c-7', name: 'محمدرضا عباسی', phone: '09159990000', email: 'reza.ab@gmail.com', city: 'یزد', totalOrders: 9, totalSpending: 210000000, level: 'wholesale' },
  { id: 'c-8', name: 'فاطمه احمدی', phone: '09183332222', email: 'fati.ah@gmail.com', city: 'همدان', totalOrders: 2, totalSpending: 9600000, level: 'regular' },
  { id: 'c-9', name: 'کامران صادقی', phone: '09192221111', email: 'kamran@gmail.com', city: 'کرج', totalOrders: 1, totalSpending: 1680000, level: 'new' },
  { id: 'c-10', name: 'سیاوش راد', phone: '09129998888', email: 'rad@vip.com', city: 'تهران', totalOrders: 12, totalSpending: 380000000, level: 'vip' }
];

const MOCK_ORDERS_SEED = [
  {
    id: 'DK-9081', customerId: 'c-1', customerName: 'علیرضا ملکی', phone: '09176168381', address: 'شیراز، معالی آباد، کوچه ۳، پلاک ۱۴', notes: 'لطفاً رنگ خاکستری ارسال شود.',
    productName: 'MacBook Air M2', brand: 'Apple', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=85&auto=format&fit=crop', link: 'https://www.noon.com/uae-en/macbook-air-m2',
    priceAed: 1680, shippingCost: 280000, serviceFee: 2620800, finalPrice: 35660800, paymentStatus: 'paid', status: 'delivered', trackingNumber: 'TRK-AE-90881', date: '2026-05-28T14:30:00Z', internalNotes: 'هماهنگی کارگو هوایی انجام شد.'
  },
  {
    id: 'DK-8192', customerId: 'c-2', customerName: 'امیرحسین قاسمی', phone: '09121234567', address: 'تهران، سعادت آباد، خیابان سرو، پلاک ۲۲', notes: 'سایز ۴۳، رنگ سفید',
    productName: "Nike Air Force 1 '07", brand: 'Nike', image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=85&auto=format&fit=crop', link: 'https://www.amazon.ae/Nike-Air-Force-07',
    priceAed: 318, shippingCost: 266000, serviceFee: 496080, finalPrice: 6963080, paymentStatus: 'paid', status: 'shipped_iran', trackingNumber: 'TRK-AE-77182', date: '2026-05-26T11:00:00Z', internalNotes: 'ارسال شده به انبار گمرک امام خمینی.'
  },
  {
    id: 'DK-7711', customerId: 'c-3', customerName: 'سارا کریمی', phone: '09139876543', address: 'اصفهان، خیابان چهارباغ بالا، ساختمان پارس', notes: 'کادوپچ شود.',
    productName: 'Dior Sauvage EDP 100ml', brand: 'Dior', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=85&auto=format&fit=crop', link: 'https://www.noon.com/uae-en/dior-sauvage',
    priceAed: 318, shippingCost: 165000, serviceFee: 496080, finalPrice: 6862080, paymentStatus: 'paid', status: 'purchased', trackingNumber: 'TRK-AE-10291', date: '2026-05-25T09:15:00Z', internalNotes: 'خریداری شده از سایت مرجع نون امارات.'
  },
  {
    id: 'DK-6543', customerId: 'c-4', userName: 'زهرا مرادی', customerName: 'زهرا مرادی', phone: '09355556677', address: 'مشهد، بلوار وکیل آباد، کوچه لاله ۳', notes: 'بدون توضیحات.',
    productName: 'تی‌شرت ورزشی نایک Dry-Fit', brand: 'Nike', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=450&q=85&auto=format&fit=crop', link: 'https://www.noon.com/uae-en/dry-fit-nike',
    priceAed: 95, shippingCost: 62500, serviceFee: 148200, finalPrice: 2063200, paymentStatus: 'pending', status: 'price_calculated', trackingNumber: '', date: '2026-05-29T10:00:00Z', internalNotes: 'پیش‌فاکتور صادر گردید، در انتظار تایید مشتری.'
  },
  {
    id: 'DK-5491', customerId: 'c-5', customerName: 'پیمان حسینی', phone: '09144445555', address: 'تبریز، خیابان ولیعصر، برج سپهر', notes: 'لطفا فاکتور خرید امارات هم ضمیمه بار شود.',
    productName: 'Samsung S24 Ultra', brand: 'Samsung', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=85&auto=format&fit=crop', link: 'https://www.amazon.ae/Samsung-S24-Ultra',
    priceAed: 2300, shippingCost: 80500, serviceFee: 3588000, finalPrice: 48518500, paymentStatus: 'paid', status: 'uae_warehouse', trackingNumber: 'TRK-AE-00981', date: '2026-05-27T18:00:00Z', internalNotes: 'تحویل دفتر دبی گردید، بسته‌بندی ایمن گرید A.'
  },
  {
    id: 'DK-1209', customerId: 'c-6', customerName: 'مریم ساداتی', phone: '09117778888', address: 'رشت، گلسار، کوچه ۱۱۰', notes: 'سایز M، رنگ کرم',
    productName: 'پیراهن کتان زارا Casual', brand: 'Zara', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=450&q=85&auto=format&fit=crop', link: 'https://www.noon.com/uae-en/zara-shirt',
    priceAed: 135, shippingCost: 87500, serviceFee: 210600, finalPrice: 2930600, paymentStatus: 'pending', status: 'waiting_review', trackingNumber: '', date: '2026-05-30T02:00:00Z', internalNotes: 'در انتظار بررسی وزن دقیق کالا جهت صدور نهایی فاکتور.'
  },
  {
    id: 'DK-0092', customerId: 'c-7', customerName: 'محمدرضا عباسی', phone: '09159990000', address: 'یزد، صفائیه، خیابان ملاصدرا', notes: 'سفارش عمده همکار.',
    productName: 'ساعت مچی رولکس Submariner Date', brand: 'Rolex', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=450&q=85&auto=format&fit=crop', link: 'https://www.amazon.ae/Rolex-Submariner',
    priceAed: 2450, shippingCost: 157500, serviceFee: 3822000, finalPrice: 51754500, paymentStatus: 'pending', status: 'new_request', trackingNumber: '', date: '2026-05-30T22:15:00Z', internalNotes: 'لید جدید ثبت شده از فرم اصلی.'
  }
];

const MOCK_LAPTOPS_SEED = [
  { id: 'lap-st-1', brand: 'Apple', model: 'MacBook Pro M1 Pro 2021', cpu: 'Apple M1 Pro 8-Core', ram: '16GB Unified', storage: '512GB NVMe SSD', gpu: 'Apple 14-Core', screenSize: '14.2 inch Liquid Retina', purchasePriceAED: 2800, salePriceToman: 64500000, profit: 9900000, condition: 'Excellent', status: 'Available', testedKeyboard: true, testedDisplay: true, testedBattery: true, testedCamera: true, testedUsb: true, testedWifi: true, chargerIncluded: true, boxIncluded: false, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=85' },
  { id: 'lap-st-2', brand: 'Dell', model: 'Dell XPS 15 9520', cpu: 'Intel Core i7-12700H', ram: '32GB DDR5', storage: '1TB SSD', gpu: 'NVIDIA RTX 3050 Ti', screenSize: '15.6 inch 4K Touch', purchasePriceAED: 3100, salePriceToman: 71000000, profit: 10550000, condition: 'Very Good', status: 'Reserved', testedKeyboard: true, testedDisplay: true, testedBattery: true, testedCamera: true, testedUsb: true, testedWifi: true, chargerIncluded: true, boxIncluded: true, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=85' },
  { id: 'lap-st-3', brand: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 9', cpu: 'Intel Core i7-1165G7', ram: '16GB LPDDR4x', storage: '512GB SSD', gpu: 'Intel Iris Xe Graphics', screenSize: '14.0 inch WUXGA IPS', purchasePriceAED: 1950, salePriceToman: 44000000, profit: 5975000, condition: 'Good', status: 'Sold', testedKeyboard: true, testedDisplay: true, testedBattery: false, testedCamera: true, testedUsb: true, testedWifi: true, chargerIncluded: true, boxIncluded: false, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=85' }
];

const MOCK_REVIEWS_SEED = [
  { id: 'rev-101', productId: 'lap1', productName: 'MacBook Air M2', userName: 'علیرضا زارعی', rating: 5, comment: 'لپ‌تاپ فوق‌العاده تمیز بود، تحویل سریع و بموقع دفتر شیراز واقعاً حرفه‌ای بود. ممنون از کارگو دبی خرید.', reply: 'علیرضا عزیز، خرسندیم که از کیفیت لپ‌تاپ و ارسال کارگوی هوایی رضایت داشتید.', status: 'approved', date: '2026-05-24T12:00:00Z' },
  { id: 'rev-102', productId: 'p1', productName: "Nike Air Force 1 '07", userName: 'امیر قاسمی', rating: 5, comment: 'صد درصد اورجینال، بارکد جعبه رو اسکن کردم کاملا معتبر بود. بهترین روش برای خرید مستقیم از نون امارات.', reply: '', status: 'approved', date: '2026-05-28T09:15:00Z' },
  { id: 'rev-103', productId: 'w1', productName: 'پیراهن نخی ساحلی مانگو', userName: 'سارا کریمی', rating: 4, comment: 'دوخت و جنس پارچه عالیه، دقیقاً مطابق با عکس سایت مانگو. فقط زمان ارسال به علت ترخیص گمرکی چند روز تاخیر داشت.', reply: 'سارای گرامی، از صبوری شما سپاسگزاریم. تلاش می‌کنیم تا ترخیص گمرکی پروازهای کارگو هوایی را باز هم سریع‌تر کنیم.', status: 'pending', date: '2026-05-29T11:40:00Z' }
];

const DEFAULT_SETTINGS_SEED = {
  exchangeRate: 19500,
  cargoRateLight: 280000,
  cargoRateMedium: 300000,
  cargoRateHeavy: 350000,
  supportPhone: '۰۹۱۷۶۱۶۸۳۸۱',
  whatsappNumber: '+989176168381',
  telegramUsername: 'dubaiKharid_support',
  websiteName: 'دبی خرید | خرید مستقیم از دبی و امارات',
  commissionRate: 8
};

const DEFAULT_CONTENT_SEED = {
  heroTitle: 'خرید مستقیم و بی واسطه از فروشگاه‌های دبی',
  heroSubtitle: 'لینک محصول دلخواه خود را از آمازون، نون و... کپی کنید و هزینه نهایی را تحویل درب منزل در ایران بپردازید.',
  banners: [
    { title: 'ارسال سریع هوایی کارگو', link: '/sale', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800' },
    { title: 'ضمانت اصالت ۱۰۰٪ کالاها', link: '/brands', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800' }
  ],
  blogPosts: [
    { id: 'blog-1', title: 'چرا خرید از دبی به صرفه‌تر است؟', author: 'مدیریت', date: '2026-05-28', summary: 'در این مقاله به بررسی مزایای مالی و اصالت کالاهای امارات نسبت به بازارهای داخلی می‌پردازیم.' },
    { id: 'blog-2', title: 'راهنمای گام به گام خرید از Noon.com', author: 'پشتیبانی', date: '2026-05-25', summary: 'چگونه بهترین تخفیف‌ها را در سایت بزرگ نون امارات پیدا کنیم و سفارش دهیم.' }
  ]
};

const DEFAULT_ROLES_PERMISSIONS = {
  'Super Admin': ['overview', 'orders', 'customers', 'products', 'laptops', 'finance', 'payments', 'shipping', 'reviews', 'content', 'roles', 'settings'],
  'Admin': ['overview', 'orders', 'customers', 'products', 'laptops', 'payments', 'shipping', 'reviews', 'content', 'settings'],
  'Sales Manager': ['overview', 'orders', 'customers', 'payments'],
  'Customer Support': ['overview', 'orders', 'customers', 'reviews'],
  'Inventory Manager': ['overview', 'products', 'laptops', 'shipping']
};

export default function AdminPanel() {
  // Authentication states
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active section/tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // App schemas states
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_SEED);
  const [content, setContent] = useState(DEFAULT_CONTENT_SEED);
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLES_PERMISSIONS);
  const [adminRole, setAdminRole] = useState('Super Admin'); // Active role selection

  // Shared active UI states (Drawers & Modals)
  const [activeOrderDetails, setActiveOrderDetails] = useState(null); // Expanded order ID
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState(null); // Active Drawer Order
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState(null); // Active Drawer Client
  const [selectedLaptopForDrawer, setSelectedLaptopForDrawer] = useState(null); // Active Drawer Laptop
  const [selectedReviewForDrawer, setSelectedReviewForDrawer] = useState(null); // Review reply drawer
  
  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Uploader Form States
  const [newProdImageInput, setNewProdImageInput] = useState('');
  const [newLaptopImageInput, setNewLaptopImageInput] = useState('');
  const [invoiceFileInput, setInvoiceFileInput] = useState(null);
  const [receiptFileInput, setReceiptFileInput] = useState(null);

  // Search Terms
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [laptopSearch, setLaptopSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  
  // Financial duration state
  const [financePeriod, setFinancePeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'

  // Load persistent DB seeds or initialize
  useEffect(() => {
    const session = sessionStorage.getItem('dubaiKharidAdminSession');
    if (session === 'active') {
      setIsLoggedIn(true);
    }

    // Orders seeding
    const savedOrders = localStorage.getItem('dubaiKharidOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      localStorage.setItem('dubaiKharidOrders', JSON.stringify(MOCK_ORDERS_SEED));
      setOrders(MOCK_ORDERS_SEED);
    }

    // Customers seeding
    const savedCustomers = localStorage.getItem('dubaiKharidCustomers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      localStorage.setItem('dubaiKharidCustomers', JSON.stringify(MOCK_CUSTOMERS_SEED));
      setCustomers(MOCK_CUSTOMERS_SEED);
    }

    // Laptops seeding
    const savedLaptops = localStorage.getItem('dubaiKharidLaptops');
    if (savedLaptops) {
      setLaptops(JSON.parse(savedLaptops));
    } else {
      localStorage.setItem('dubaiKharidLaptops', JSON.stringify(MOCK_LAPTOPS_SEED));
      setLaptops(MOCK_LAPTOPS_SEED);
    }

    // Reviews seeding
    const savedReviews = localStorage.getItem('dubaiKharidReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      localStorage.setItem('dubaiKharidReviews', JSON.stringify(MOCK_REVIEWS_SEED));
      setReviews(MOCK_REVIEWS_SEED);
    }

    // Settings seeding
    const savedSettings = localStorage.getItem('dubaiKharidSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      localStorage.setItem('dubaiKharidSettings', JSON.stringify(DEFAULT_SETTINGS_SEED));
      setSettings(DEFAULT_SETTINGS_SEED);
    }

    // Content seeding
    const savedContent = localStorage.getItem('dubaiKharidContent');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    } else {
      localStorage.setItem('dubaiKharidContent', JSON.stringify(DEFAULT_CONTENT_SEED));
      setContent(DEFAULT_CONTENT_SEED);
    }

    // Seed permissions
    const savedPermissions = localStorage.getItem('dubaiKharidPermissions');
    if (savedPermissions) {
      setRolePermissions(JSON.parse(savedPermissions));
    } else {
      localStorage.setItem('dubaiKharidPermissions', JSON.stringify(DEFAULT_ROLES_PERMISSIONS));
    }

    // Seed Real-time notifications
    const seedNotifications = [
      { id: 'n1', type: 'order', text: 'سفارش جدید برای ساعت رولکس ثبت شد.', time: '۱۰ دقیقه قبل', read: false },
      { id: 'n2', type: 'customer', text: 'سیاوش راد به سطح مشتری VIP ارتقا یافت.', time: '۲ ساعت قبل', read: false },
      { id: 'n3', type: 'review', text: 'یک بازخورد ۵ ستاره برای مک‌بوک M2 ثبت شد.', time: '۵ ساعت قبل', read: true },
      { id: 'n4', type: 'stock', text: 'هشدار موجودی: لپ‌تاپ‌های استوک به اتمام رسید.', time: '۱ روز قبل', read: true }
    ];
    setNotifications(seedNotifications);
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
      setLoginError('رمز عبور نادرست است. رمز پیش‌فرض ادمین: @Reza112233');
    }
  };

  // Handle Log Out
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('dubaiKharidAdminSession');
  };

  // Check role permission before allowing view
  const hasPermission = (tabName) => {
    const permissions = rolePermissions[adminRole] || [];
    return permissions.includes(tabName);
  };

  // Dynamic Save to LocalStorage helper
  const syncState = (key, updatedData, stateSetter) => {
    stateSetter(updatedData);
    localStorage.setItem(key, JSON.stringify(updatedData));
  };

  // Formatting utilities
  const fmtToman = (num) => Math.round(num).toLocaleString('fa-IR');
  const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fa-IR');
  };

  // Change Order status and notify
  const updateOrderStatus = (orderId, newStatus) => {
    const list = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    syncState('dubaiKharidOrders', list, setOrders);
    
    // Add real-time notification
    const newNotif = {
      id: `n-${Date.now()}`,
      type: 'order',
      text: `وضعیت سفارش ${orderId} به «${newStatus}» تغییر یافت.`,
      time: 'هم‌اکنون',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Add Internal Notes to Order
  const addOrderInternalNote = (orderId, notes) => {
    const list = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, internalNotes: notes };
      }
      return o;
    });
    syncState('dubaiKharidOrders', list, setOrders);
    alert('یادداشت داخلی ادمین با موفقیت ثبت شد.');
  };

  // Upload simulated tracking number or invoices
  const uploadOrderTrackingInvoice = (orderId, tracking, invoiceName) => {
    const list = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, trackingNumber: tracking || o.trackingNumber, invoiceUrl: invoiceName || o.invoiceUrl };
      }
      return o;
    });
    syncState('dubaiKharidOrders', list, setOrders);
    alert('فایل فاکتور و کد پیگیری با موفقیت الحاق شد.');
  };

  // Update customer level
  const updateCustomerLevel = (custId, newLevel) => {
    const list = customers.map(c => {
      if (c.id === custId) {
        return { ...c, level: newLevel };
      }
      return c;
    });
    syncState('dubaiKharidCustomers', list, setCustomers);
  };

  // Upload or update used laptop inventory
  const handleSaveLaptop = (laptopObj) => {
    let list = [...laptops];
    const isNew = !laptopObj.id;
    
    const profitVal = (laptopObj.salePriceToman - (laptopObj.purchasePriceAED * settings.exchangeRate));

    const finalLaptop = {
      ...laptopObj,
      id: isNew ? `lap-st-${Date.now()}` : laptopObj.id,
      profit: profitVal
    };

    if (isNew) {
      list.unshift(finalLaptop);
    } else {
      list = list.map(l => l.id === finalLaptop.id ? finalLaptop : l);
    }

    syncState('dubaiKharidLaptops', list, setLaptops);
    setSelectedLaptopForDrawer(null);
    alert(isNew ? 'لپ‌تاپ استوک جدید اضافه شد.' : 'مشخصات لپ‌تاپ استوک با موفقیت ویرایش شد.');
  };

  // Toggle review moderation status
  const moderateReview = (revId, status, replyText) => {
    const list = reviews.map(r => {
      if (r.id === revId) {
        return { ...r, status, reply: replyText || r.reply };
      }
      return r;
    });
    syncState('dubaiKharidReviews', list, setReviews);
    setSelectedReviewForDrawer(null);
    alert(`دیدگاه با وضعیت «${status}» ویرایش شد.`);
  };

  // Reset entire mock Database seeds
  const handleResetSystemSeeds = () => {
    if (!confirm('آیا از بازگردانی کل سامانه به تنظیمات پیش‌فرض کارخانه مطمئن هستید؟ تمامی داده‌ها بازیابی خواهند شد.')) return;
    
    localStorage.removeItem('dubaiKharidOrders');
    localStorage.removeItem('dubaiKharidCustomers');
    localStorage.removeItem('dubaiKharidLaptops');
    localStorage.removeItem('dubaiKharidReviews');
    localStorage.removeItem('dubaiKharidSettings');
    localStorage.removeItem('dubaiKharidContent');
    localStorage.removeItem('dubaiKharidPermissions');
    sessionStorage.removeItem('dubaiKharidAdminSession');
    
    setIsLoggedIn(false);
    alert('دیتابیس ابری لوکال با موفقیت ریست گردید. مجدداً وارد شوید.');
  };

  // Pre-filled WhatsApp link generator
  const getWhatsAppLink = (order) => {
    let cleanPhone = order.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = `98${cleanPhone.slice(1)}`;
    }
    const message = `سلام ${order.customerName} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» با موفقیت به‌روزرسانی شد.\n\n📦 سفارش شما: ${order.productName}\n💰 مبلغ نهایی: ${fmtToman(order.finalPrice)} تومان\n📍 وضعیت: ${order.status}\n\nجهت اطلاعات بیشتر و هماهنگی ارسال کارگو هوایی در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Stats Counters computations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.finalPrice || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const pendingPaymentsCount = orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled').length;
  const netProfit = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (o.serviceFee || 0), 0);

  // Filters listings
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q)
    );
  });

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const filteredLaptops = laptops.filter(l => {
    const q = laptopSearch.toLowerCase();
    return (
      l.brand.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      l.cpu.toLowerCase().includes(q)
    );
  });

  const filteredReviews = reviews.filter(r => {
    const q = reviewSearch.toLowerCase();
    return (
      r.userName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q)
    );
  });

  // Render Authentication overlay if not logged in
  if (!isLoggedIn) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loginOverlay}>
          <form onSubmit={handleLogin} className={styles.loginCard}>
            <span className={styles.loginLogo}>✈️</span>
            <h1>پنل ادمین دبی خرید</h1>
            <p>SaaS-Grade Premium E-commerce Control Room</p>

            {loginError && <div className={styles.loginError}>{loginError}</div>}

            <div className={styles.formGroup}>
              <label>نام کاربری ادمین:</label>
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
                placeholder="رمز عبور پیش‌فرض: @Reza112233"
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                className={styles.loginInput}
                autoFocus
                required
              />
            </div>

            <button type="submit" className={styles.loginBtn}>
              ورود ایمن به کنترل پنل
            </button>
            
            <div style={{ marginTop: '20px', fontSize: '11.5px' }}>
              <Link href="/" style={{ color: 'var(--accent-amber)', textDecoration: 'none', fontWeight: 'bold' }}>
                ← بازگشت به سایت اصلی
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Dynamic Glass Top Header */}
      <header className={styles.adminHeader}>
        <div className={styles.brandWrapper}>
          <div className={styles.brandLogo}>✈️</div>
          <div>
            <h1 className={styles.brandTitle}>
              دبی خرید <span className={styles.brandBadge}>SaaS v2.0</span>
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>پلتفرم مدیریت کارگو و خریدهای مستقیم امارات</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Notification hub icon */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className={styles.profileSelector}
              style={{ fontSize: '16px' }}
            >
              🔔 
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--accent-amber)', width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-amber)' }}></span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', left: 0, top: '48px', width: '320px', background: '#0b0c10', border: '1px solid var(--border-glass-bright)', borderRadius: '16px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 500 }}>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', fontSize: '13px', fontWeight: '800' }}>🔔 اعلان‌های سامانه</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: n.read ? 'normal' : 'bold' }}>{n.text}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Changer Selector */}
          <div className={styles.profileSelector}>
            <span>👑 نقش: </span>
            <select 
              value={adminRole} 
              onChange={(e) => setAdminRole(e.target.value)}
              className={styles.roleSelect}
            >
              <option value="Super Admin">مدیر کل (Super Admin)</option>
              <option value="Admin">ادمین فنی (Admin)</option>
              <option value="Sales Manager">مدیر فروش (Sales)</option>
              <option value="Customer Support">پشتیبان مشتریان (Support)</option>
              <option value="Inventory Manager">انباردار دبی (Inventory)</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.dashboardGrid}>
        {/* SIDEBAR NAVIGATION TABS */}
        <aside className={styles.sidebar}>
          <div>
            <span className={styles.sidebarSectionTitle}>مدیریت کسب و کار</span>
            <div className={styles.navGroup}>
              <button onClick={() => setActiveTab('overview')} className={`${styles.sidebarBtn} ${activeTab === 'overview' ? styles.sidebarBtnActive : ''}`}>
                <span>📊</span> پیشخوان کلی
              </button>
              
              <button onClick={() => setActiveTab('orders')} className={`${styles.sidebarBtn} ${activeTab === 'orders' ? styles.sidebarBtnActive : ''}`}>
                <span>📥</span> سفارشات مستقیم
                <span className={styles.sidebarCount}>{orders.filter(o => o.status === 'new_request').length}</span>
              </button>

              <button onClick={() => setActiveTab('customers')} className={`${styles.sidebarBtn} ${activeTab === 'customers' ? styles.sidebarBtnActive : ''}`}>
                <span>👥</span> مشتریان و CRM
              </button>
              
              <button onClick={() => setActiveTab('products')} className={`${styles.sidebarBtn} ${activeTab === 'products' ? styles.sidebarBtnActive : ''}`}>
                <span>🛍️</span> کاتالوگ محصولات
              </button>

              <button onClick={() => setActiveTab('laptops')} className={`${styles.sidebarBtn} ${activeTab === 'laptops' ? styles.sidebarBtnActive : ''}`}>
                <span>💻</span> انبار لپ‌تاپ استوک
                <span className={styles.sidebarCount} style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>{laptops.filter(l => l.status === 'Available').length}</span>
              </button>
            </div>
          </div>

          <div>
            <span className={styles.sidebarSectionTitle}>مالی و لجستیک</span>
            <div className={styles.navGroup}>
              <button onClick={() => setActiveTab('finance')} className={`${styles.sidebarBtn} ${activeTab === 'finance' ? styles.sidebarBtnActive : ''}`}>
                <span>💰</span> امور مالی و سود ناخالص
              </button>
              <button onClick={() => setActiveTab('payments')} className={`${styles.sidebarBtn} ${activeTab === 'payments' ? styles.sidebarBtnActive : ''}`}>
                <span>💳</span> تایید پرداخت‌ها
              </button>
              <button onClick={() => setActiveTab('shipping')} className={`${styles.sidebarBtn} ${activeTab === 'shipping' ? styles.sidebarBtnActive : ''}`}>
                <span>✈️</span> کارگو و ارسال هوایی
              </button>
            </div>
          </div>

          <div>
            <span className={styles.sidebarSectionTitle}>تنظیمات و محتوا</span>
            <div className={styles.navGroup}>
              <button onClick={() => setActiveTab('reviews')} className={`${styles.sidebarBtn} ${activeTab === 'reviews' ? styles.sidebarBtnActive : ''}`}>
                <span>💬</span> نظرات خریداران
              </button>
              <button onClick={() => setActiveTab('content')} className={`${styles.sidebarBtn} ${activeTab === 'content' ? styles.sidebarBtnActive : ''}`}>
                <span>📝</span> تولید محتوا CMS
              </button>
              <button onClick={() => setActiveTab('roles')} className={`${styles.sidebarBtn} ${activeTab === 'roles' ? styles.sidebarBtnActive : ''}`}>
                <span>🔑</span> سطوح دسترسی
              </button>
              <button onClick={() => setActiveTab('settings')} className={`${styles.sidebarBtn} ${activeTab === 'settings' ? styles.sidebarBtnActive : ''}`}>
                <span>⚙️</span> تنظیمات سیستم
              </button>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.exitBtn}>
            🚪 خروج ایمن از ادمین
          </button>
        </aside>

        {/* MASTER SaaS TAB CONTENT RENDERER */}
        <main className={styles.mainContainer}>
          {!hasPermission(activeTab) ? (
            <div className={styles.roleBlockOverlay}>
              <div className={styles.roleBlockIcon}>🔒</div>
              <h3>عدم دسترسی مجاز</h3>
              <p>نقش فعلی شما (<strong>{adminRole}</strong>) اجازه دسترسی به این بخش مالی یا سیستمی را ندارد. جهت تغییر دسترسی‌ها، نقش خود را در هدر بالا ارتقا دهید.</p>
            </div>
          ) : (
            <>
              {/* ==========================================================
                 TAB 1: DASHBOARD OVERVIEW
                 ========================================================== */}
              {activeTab === 'overview' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>📊 پیشخوان آماری دبی خرید</h2>
                      <p>وضعیت زنده درآمد، سود خالص، سفارشات و ترخیص کارگوی هوایی</p>
                    </div>
                  </div>

                  {/* 10 KPI Cards Grid */}
                  <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>درآمد امروز</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>💵</span>
                      </div>
                      <div className={styles.kpiValue}>{fmtToman(totalRevenue / 18)}<small>تومان</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+۱۴.۲٪ نسبت به دیروز</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>درآمد ماهانه</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>📊</span>
                      </div>
                      <div className={styles.kpiValue}>{fmtToman(totalRevenue)}<small>تومان</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+۸.۶٪ نسبت به ماه قبل</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>سود خالص ناخالص</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>💎</span>
                      </div>
                      <div className={styles.kpiValue}>{fmtToman(netProfit)}<small>تومان</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+۱۲.۴٪ (حق‌العمل ۸٪)</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>سفارشات جدید</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>📥</span>
                      </div>
                      <div className={styles.kpiValue}>{orders.filter(o => o.status === 'new_request').length}<small>عدد</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendNeutral}`}>۴ مورد تایید نشده</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>سفارشات فعال</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>⚙️</span>
                      </div>
                      <div className={styles.kpiValue}>{activeOrdersCount}<small>سفارش</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>در خط انتقال امارات-ایران</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>سفارشات تحویل شده</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>✓</span>
                      </div>
                      <div className={styles.kpiValue}>{deliveredOrdersCount}<small>بسته</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>نرخ موفقیت ۹۸.۵٪</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>پرداخت‌های معلق</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>💳</span>
                      </div>
                      <div className={styles.kpiValue}>{pendingPaymentsCount}<small>پیش‌فاکتور</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendDown}`}>نیاز به تماس پشتیبانی</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>کل مشتریان</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>👥</span>
                      </div>
                      <div className={styles.kpiValue}>{customers.length}<small>کاربر</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+۳ عضو جدید امروز</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>تعداد محصولات</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>🛍️</span>
                      </div>
                      <div className={styles.kpiValue}>{orders.length + laptops.length}<small>مدل کالا</small></div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>مرجوعی صفر</span>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>نرخ تبدیل لید</span>
                        <span className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>⚡</span>
                      </div>
                      <div className={styles.kpiValue}>۷۶.۸٪</div>
                      <span className={`${styles.kpiTrend} ${styles.trendUp}`}>فوق‌العاده عالی</span>
                    </div>
                  </div>

                  {/* BREATHTAKING SaaS NEON GRAPH GRID */}
                  <div className={styles.chartsGrid}>
                    {/* Area SVG Chart for Revenue */}
                    <div className={styles.chartCard}>
                      <div className={styles.chartCardHeader}>
                        <h3>📊 نمودار زنده درآمدهای ثبت شده و کارگو</h3>
                        <span style={{ fontSize: '11px', color: 'var(--accent-amber)', fontWeight: 'bold' }}>بر اساس Tomans</span>
                      </div>
                      <div className={styles.svgChartContainer}>
                        <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="amberGlowGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent-amber)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                          {/* Grid Lines */}
                          <g className={styles.chartGridLines}>
                            <line x1="0" y1="40" x2="600" y2="40" />
                            <line x1="0" y1="90" x2="600" y2="90" />
                            <line x1="0" y1="140" x2="600" y2="140" />
                            <line x1="0" y1="190" x2="600" y2="190" />
                          </g>
                          {/* Area path */}
                          <path d="M 0,240 Q 100,80 200,120 T 400,60 T 600,40 L 600,240 Z" className={styles.chartAreaFill} />
                          {/* Line path */}
                          <path d="M 0,240 Q 100,80 200,120 T 400,60 T 600,40" className={styles.chartAreaLine} />
                          {/* Interactive Hover Dots */}
                          <circle cx="200" cy="120" r="5" className={styles.chartDot} />
                          <circle cx="400" cy="60" r="5" className={styles.chartDot} />
                          <circle cx="600" cy="40" r="5" className={styles.chartDot} />
                        </svg>
                      </div>
                    </div>

                    {/* Donut Category Chart */}
                    <div className={styles.chartCard}>
                      <div className={styles.chartCardHeader}>
                        <h3>🏢 دسته‌بندی‌های محبوب خرید امارات</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '30px' }}>
                        <svg width="150" height="150" className={styles.donutSvg}>
                          <circle cx="75" cy="75" r="55" className={styles.donutTrack} />
                          {/* Electronics Segment (45%) */}
                          <circle cx="75" cy="75" r="55" className={styles.donutSegment} stroke="var(--accent-amber)" strokeDasharray={`${(45 * 345.4) / 100} 345.4`} />
                          {/* Clothing Segment (30%) */}
                          <circle cx="75" cy="75" r="55" className={styles.donutSegment} stroke="var(--accent-blue)" strokeDasharray={`${(30 * 345.4) / 100} 345.4`} strokeDashoffset={`-${(45 * 345.4) / 100}`} />
                          {/* Laptops (25%) */}
                          <circle cx="75" cy="75" r="55" className={styles.donutSegment} stroke="var(--accent-green)" strokeDasharray={`${(25 * 345.4) / 100} 345.4`} strokeDashoffset={`-${((45 + 30) * 345.4) / 100}`} />
                        </svg>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-amber)' }}></span>
                            <span>الکترونیک و موبایل (۴۵٪)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                            <span>پوشاک و زارا (۳۰٪)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                            <span>لپ‌تاپ استوک (۲۵٪)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 2: ORDERS MANAGEMENT
                 ========================================================== */}
              {activeTab === 'orders' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>📥 مدیریت یکپارچه پیش‌فاکتورها و سفارشات</h2>
                      <p>تایید نهایی کالاها، ویرایش فاکتور ترخیص، افزودن بارکد و هماهنگی سریع در واتساپ</p>
                    </div>
                    
                    <div className={styles.searchBox}>
                      <span>🔍</span>
                      <input 
                        type="text" 
                        placeholder="جستجوی خریدار، شماره سفارش، یا محصول..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.saasTable}>
                      <thead>
                        <tr>
                          <th>کد سفارش</th>
                          <th>نام خریدار</th>
                          <th>محصول سفارش</th>
                          <th>مبلغ نهایی (تومان)</th>
                          <th>وضعیت پردازش</th>
                          <th>پرداخت</th>
                          <th>تاریخ ثبت</th>
                          <th>عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <>
                            <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setActiveOrderDetails(activeOrderDetails === order.id ? null : order.id)}>
                              <td style={{ fontWeight: '800', color: 'var(--accent-amber)', fontFamily: 'monospace' }}>
                                {order.id} {activeOrderDetails === order.id ? '▼' : '▶'}
                              </td>
                              <td>
                                <div style={{ fontWeight: '750' }}>{order.customerName}</div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>تلفن: {order.phone}</span>
                              </td>
                              <td>
                                <div>{order.productName}</div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>برند: {order.brand}</span>
                              </td>
                              <td style={{ fontWeight: '800' }}>{fmtToman(order.finalPrice)}</td>
                              <td>
                                <span className={`${styles.orderStatusBadge} ${styles[`status_${order.status}`]}`}>
                                  {order.status === 'new_request' ? 'درخواست جدید' :
                                   order.status === 'waiting_review' ? 'در انتظار بررسی' :
                                   order.status === 'price_calculated' ? 'قیمت‌گذاری شده' :
                                   order.status === 'confirmed' ? 'تایید مشتری' :
                                   order.status === 'purchased' ? 'خریداری شده' :
                                   order.status === 'uae_warehouse' ? 'دفتر دبی' :
                                   order.status === 'shipped_iran' ? 'ارسال به ایران' :
                                   order.status === 'delivered' ? 'تحویل شده' : 'لغو شده'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: order.paymentStatus === 'paid' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                  {order.paymentStatus === 'paid' ? '✓ پرداخت شده' : '✗ معلق'}
                                </span>
                              </td>
                              <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtDate(order.date)}</td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div className={styles.tableActionBtns}>
                                  <button onClick={() => setSelectedOrderForDrawer(order)} className={styles.editActionBtn}>✏️ ویرایش</button>
                                  <a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer" className={styles.whatsappLinkBtn} style={{ padding: '4px 10px' }}>💬 واتساپ</a>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Order details */}
                            {activeOrderDetails === order.id && (
                              <tr className={styles.expandedRow}>
                                <td colSpan="8">
                                  <div className={styles.orderExpandedDetails}>
                                    <div className={styles.expandedCol}>
                                      <h4>💵 جزئیات حسابرسی خرید</h4>
                                      <div className={styles.expandedSpecs}>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>قیمت درهم دبی:</span>
                                          <span className={styles.expandedSpecVal}>{order.priceAed} درهم</span>
                                        </div>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>نرخ تبدیل ارز:</span>
                                          <span className={styles.expandedSpecVal}>{fmtToman(settings.exchangeRate)} تومان</span>
                                        </div>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>هزینه کارگو پرواز:</span>
                                          <span className={styles.expandedSpecVal}>{fmtToman(order.shippingCost)} تومان</span>
                                        </div>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>کارمزد دبی خرید ({settings.commissionRate}%):</span>
                                          <span className={styles.expandedSpecVal}>{fmtToman(order.serviceFee)} تومان</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className={styles.expandedCol}>
                                      <h4>📍 آدرس تحویل و رهگیری بارگو</h4>
                                      <div className={styles.expandedSpecs}>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>آدرس ایران:</span>
                                          <span className={styles.expandedSpecVal}>{order.address}</span>
                                        </div>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>شماره رهگیری باربری:</span>
                                          <span className={styles.expandedSpecVal} style={{ fontFamily: 'monospace', color: 'var(--accent-amber)' }}>{order.trackingNumber || 'ثبت نشده'}</span>
                                        </div>
                                        <div className={styles.expandedSpecRow}>
                                          <span className={styles.expandedSpecLabel}>توضیحات مشتری:</span>
                                          <span className={styles.expandedSpecVal}>{order.notes || '---'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className={styles.expandedCol}>
                                      <h4>📝 یادداشت‌های ادمین و فاکتور</h4>
                                      <div className={styles.expandedSpecs}>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                          {order.internalNotes || 'هیچ یادداشتی ثبت نشده است.'}
                                        </p>
                                        {order.invoiceUrl && (
                                          <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                                            📄 فاکتور خرید امارات ضمیمه شده است.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 3: CUSTOMERS CRM
                 ========================================================== */}
              {activeTab === 'customers' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>👥 پنل ارتباط با مشتریان و CRM</h2>
                      <p>دسته‌بندی خودکار اعضا، پیگیری فاکتورهای پرداختی و نمایش تاریخچه خرید اختصاصی</p>
                    </div>

                    <div className={styles.searchBox}>
                      <span>🔍</span>
                      <input 
                        type="text" 
                        placeholder="جستجوی خریدار بر اساس نام، تلفن یا شهر..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.saasTable}>
                      <thead>
                        <tr>
                          <th>نام خریدار</th>
                          <th>شماره موبایل</th>
                          <th>پست الکترونیکی</th>
                          <th>شهر سکونت</th>
                          <th>کل فاکتورها</th>
                          <th>مجموع خرید (تومان)</th>
                          <th>سطح کاربری خریدار</th>
                          <th>عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map(cust => (
                          <tr key={cust.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCustomerForDrawer(selectedCustomerForDrawer?.id === cust.id ? null : cust)}>
                            <td style={{ fontWeight: '800' }}>{cust.name}</td>
                            <td style={{ fontFamily: 'monospace' }}>{cust.phone}</td>
                            <td>{cust.email}</td>
                            <td>{cust.city}</td>
                            <td style={{ fontWeight: 'bold' }}>{cust.totalOrders} بار</td>
                            <td style={{ color: '#fff', fontWeight: '800' }}>{fmtToman(cust.totalSpending)}</td>
                            <td>
                              <span className={`${styles.customerLevelBadge} ${styles[`level_${cust.level}`]}`}>
                                {cust.level === 'new' ? 'عضو جدید' :
                                 cust.level === 'regular' ? 'مشتری عادی' :
                                 cust.level === 'vip' ? 'مشتری VIP' : 'خرید عمده'}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <select 
                                  value={cust.level} 
                                  onChange={(e) => updateCustomerLevel(cust.id, e.target.value)}
                                  className={styles.statusSelect}
                                >
                                  <option value="new">عضو جدید</option>
                                  <option value="regular">مشتری عادی</option>
                                  <option value="vip">مشتری VIP</option>
                                  <option value="wholesale">خرید عمده</option>
                                </select>
                                <a href={`https://api.whatsapp.com/send?phone=98${cust.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" className={styles.whatsappLinkBtn} style={{ padding: '4px 10px' }}>💬 واتساپ</a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Expandable Order history logs of Selected Customer */}
                  {selectedCustomerForDrawer && (
                    <div className={styles.profileHistoryCard}>
                      <h3>📥 تاریخچه سفارش‌های اختصاصی خریدار: {selectedCustomerForDrawer.name}</h3>
                      <div className={styles.tableContainer} style={{ background: '#060709' }}>
                        <table className={styles.saasTable}>
                          <thead>
                            <tr>
                              <th>کد پیش‌فاکتور</th>
                              <th>کالای سفارش</th>
                              <th>برند</th>
                              <th>مبلغ خرید</th>
                              <th>وضعیت</th>
                              <th>تاریخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.filter(o => o.phone === selectedCustomerForDrawer.phone).map(order => (
                              <tr key={order.id}>
                                <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{order.id}</td>
                                <td>{order.productName}</td>
                                <td>{order.brand}</td>
                                <td style={{ fontWeight: '750' }}>{fmtToman(order.finalPrice)} تومان</td>
                                <td>
                                  <span className={`${styles.orderStatusBadge} ${styles[`status_${order.status}`]}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtDate(order.date)}</td>
                              </tr>
                            ))}
                            {orders.filter(o => o.phone === selectedCustomerForDrawer.phone).length === 0 && (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>سفارشی ثبت نشده است.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==========================================================
                 TAB 4: PRODUCT CATALOG
                 ========================================================== */}
              {activeTab === 'products' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>🛍️ مدیریت کاتالوگ و گالری محصولات سایت</h2>
                      <p>آپلود تصاویر کالا، ویرایش زنده قیمت درهم، موجودی و فعال/غیرفعال‌سازی سریع کالاها</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px' }}>
                    {/* Add Product Form Widget */}
                    <div className={styles.chartCard} style={{ height: 'fit-content' }}>
                      <h3 style={{ borderRightColor: 'var(--accent-amber)', fontSize: '14.5px', marginBottom: '20px' }}>📤 آپلود محصول جدید</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        alert('محصول جدید با موفقیت درج گردید.');
                      }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className={styles.formGroup}>
                          <label>نام کالا (فارسی):</label>
                          <input type="text" placeholder="مثال: ساعت مچی گوچی" className={styles.reviewInput} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label>برند کالا:</label>
                          <input type="text" placeholder="مثال: Gucci" className={styles.reviewInput} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label>قیمت کالا (درهم):</label>
                          <input type="number" placeholder="مثال: 450" className={styles.reviewInput} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label>آدرس تصویر کالا (Image URL):</label>
                          <input 
                            type="text" 
                            placeholder="https://images.unsplash.com/..." 
                            value={newProdImageInput}
                            onChange={e => setNewProdImageInput(e.target.value)}
                            className={styles.reviewInput} 
                          />
                        </div>
                        <div className={styles.fileUploadWrap} onClick={() => alert('شبیه‌ساز تصویر: آدرس تصویر را در فیلد بالا کپی کنید!')}>
                          <span className={styles.fileUploadIcon}>📸</span>
                          <span className={styles.fileUploadLabel}>انتخاب تصویر از گالری</span>
                        </div>
                        <button type="submit" className={styles.btnSolid}>انتشار در ویترین فروشگاه</button>
                      </form>
                    </div>

                    {/* Catalog List */}
                    <div className={styles.tableContainer}>
                      <table className={styles.saasTable}>
                        <thead>
                          <tr>
                            <th>تصویر کالا</th>
                            <th>نام کالا</th>
                            <th>برند</th>
                            <th>قیمت خرید دبی</th>
                            <th>قیمت تومانی</th>
                            <th>موجودی</th>
                            <th>ویترین فعال</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map(p => (
                            <tr key={p.id}>
                              <td>
                                <img src={p.image} alt={p.productName} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                              </td>
                              <td style={{ fontWeight: '800' }}>{p.productName}</td>
                              <td>{p.brand}</td>
                              <td>{p.priceAed} درهم</td>
                              <td>{fmtToman(p.priceAed * settings.exchangeRate)} تومان</td>
                              <td>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>✓ موجود در انبار</span>
                              </td>
                              <td>
                                <button className={styles.editActionBtn} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                  ✓ فعال
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 5: USED LAPTOP INVENTORY
                 ========================================================== */}
              {activeTab === 'laptops' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>💻 کنترل پنل انبار لپ‌تاپ‌های استوک وارداتی دبی</h2>
                      <p>ثبت مشخصات فنی ریز، چک‌لیست و فاکتور تست سلامت سخت‌افزاری، محاسبه خودکار حاشیه سود</p>
                    </div>
                    
                    <button onClick={() => setSelectedLaptopForDrawer({ brand: '', model: '', cpu: '', ram: '', storage: '', gpu: '', screenSize: '', purchasePriceAED: '', salePriceToman: '', condition: 'Excellent', status: 'Available', testedKeyboard: true, testedDisplay: true, testedBattery: true, testedCamera: true, testedUsb: true, testedWifi: true, chargerIncluded: true, boxIncluded: false, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' })} className={styles.btnSolid}>
                      ➕ افزودن لپ‌تاپ استوک جدید
                    </button>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.saasTable}>
                      <thead>
                        <tr>
                          <th>تصویر</th>
                          <th>برند و مدل لپ‌تاپ استوک</th>
                          <th>مشخصات فنی کوتاه (CPU / RAM)</th>
                          <th>قیمت خرید دبی</th>
                          <th>قیمت فروش ایران</th>
                          <th>سود خالص ناخالص</th>
                          <th>وضعیت قطعات</th>
                          <th>وضعیت انبار</th>
                          <th>عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLaptops.map(lap => (
                          <tr key={lap.id}>
                            <td>
                              <img src={lap.image} alt={lap.model} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
                            </td>
                            <td>
                              <div style={{ fontWeight: '800' }}>{lap.model}</div>
                              <span className={`${styles.gradeBadge} ${styles[`grade_${lap.condition}`]}`}>گرید {lap.condition}</span>
                            </td>
                            <td>
                              <div>{lap.cpu} | {lap.ram}</div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>حافظه: {lap.storage} | اندازه: {lap.screenSize}</span>
                            </td>
                            <td>{lap.purchasePriceAED} AED</td>
                            <td style={{ fontWeight: '800' }}>{fmtToman(lap.salePriceToman)} تومان</td>
                            <td style={{ fontWeight: '800', color: 'var(--accent-green)' }}>
                              {fmtToman(lap.profit)} تومان+
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '140px' }}>
                                {lap.testedKeyboard && <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '2px 5px', borderRadius: '4px' }}>⌨️ کیبورد</span>}
                                {lap.testedDisplay && <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '2px 5px', borderRadius: '4px' }}>🖥️ مانیتور</span>}
                                {lap.testedBattery && <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '2px 5px', borderRadius: '4px' }}>🔋 باتری</span>}
                                {lap.testedWifi && <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '2px 5px', borderRadius: '4px' }}>📶 وایفای</span>}
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.laptopStatusTag} ${styles[`status_${lap.status.toLowerCase()}`]}`}>
                                {lap.status === 'Available' ? '✓ موجود در انبار' :
                                 lap.status === 'Reserved' ? 'رزرو شده' : '✗ فروخته شده'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.tableActionBtns}>
                                <button onClick={() => setSelectedLaptopForDrawer(lap)} className={styles.editActionBtn}>✏️ تست سخت‌افزار / ویرایش</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 6: FINANCIAL MANAGEMENT
                 ========================================================== */}
              {activeTab === 'finance' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>💰 مدیریت مالی و ترازنامه سود ناخالص</h2>
                      <p>نمودار یکپارچه حسابرسی روزانه، هفتگی، ماهانه و سالانه کارگو هوایی و سرویس حق‌العمل</p>
                    </div>

                    <div className={styles.chartFilterWrap}>
                      <button onClick={() => setFinancePeriod('daily')} className={`${styles.chartFilterBtn} ${financePeriod === 'daily' ? styles.chartFilterBtnActive : ''}`}>روزانه</button>
                      <button onClick={() => setFinancePeriod('weekly')} className={`${styles.chartFilterBtn} ${financePeriod === 'weekly' ? styles.chartFilterBtnActive : ''}`}>هفتگی</button>
                      <button onClick={() => setFinancePeriod('monthly')} className={`${styles.chartFilterBtn} ${financePeriod === 'monthly' ? styles.chartFilterBtnActive : ''}`}>ماهانه</button>
                      <button onClick={() => setFinancePeriod('yearly')} className={`${styles.chartFilterBtn} ${financePeriod === 'yearly' ? styles.chartFilterBtnActive : ''}`}>سالانه</button>
                    </div>
                  </div>

                  <div className={styles.chartsGrid}>
                    {/* SVG Financial Area Chart */}
                    <div className={styles.chartCard}>
                      <div className={styles.chartCardHeader}>
                        <h3>📊 تراز سود خالص بر اساس فیلتر {financePeriod}</h3>
                      </div>
                      <div className={styles.svgChartContainer}>
                        <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none">
                          <g className={styles.chartGridLines}>
                            <line x1="0" y1="40" x2="600" y2="40" />
                            <line x1="0" y1="90" x2="600" y2="90" />
                            <line x1="0" y1="140" x2="600" y2="140" />
                            <line x1="0" y1="190" x2="600" y2="190" />
                          </g>
                          {/* Financial curves based on duration */}
                          {financePeriod === 'monthly' && (
                            <>
                              <path d="M 0,220 Q 150,140 300,90 T 600,60 L 600,240 L 0,240 Z" className={styles.chartAreaFill} />
                              <path d="M 0,220 Q 150,140 300,90 T 600,60" className={styles.chartAreaLine} />
                            </>
                          )}
                          {financePeriod === 'yearly' && (
                            <>
                              <path d="M 0,230 Q 150,180 300,100 T 600,40 L 600,240 L 0,240 Z" className={styles.chartAreaFill} />
                              <path d="M 0,230 Q 150,180 300,100 T 600,40" className={styles.chartAreaLine} />
                            </>
                          )}
                          {financePeriod !== 'monthly' && financePeriod !== 'yearly' && (
                            <>
                              <path d="M 0,200 Q 150,90 300,160 T 600,80 L 600,240 L 0,240 Z" className={styles.chartAreaFill} />
                              <path d="M 0,200 Q 150,90 300,160 T 600,80" className={styles.chartAreaLine} />
                            </>
                          )}
                        </svg>
                      </div>
                    </div>

                    {/* Gauges of Financial items */}
                    <div className={styles.chartCard}>
                      <div className={styles.chartCardHeader}>
                        <h3>📊 تفکیک اجزای مالی ترازنامه</h3>
                      </div>
                      <div className={styles.financialGauges}>
                        <div className={styles.gaugeItem}>
                          <div className={styles.gaugeHeader}>
                            <span className={styles.gaugeLabel}>مجموع درآمدهای ناخالص (Revenue):</span>
                            <span className={styles.gaugeValue}>{fmtToman(totalRevenue)} تومان</span>
                          </div>
                          <div className={styles.gaugeTrack}>
                            <div className={styles.gaugeFill} style={{ width: '100%', background: 'var(--accent-blue)' }} />
                          </div>
                        </div>

                        <div className={styles.gaugeItem}>
                          <div className={styles.gaugeHeader}>
                            <span className={styles.gaugeLabel}>سرویس حق‌العمل ({settings.commissionRate}%):</span>
                            <span className={styles.gaugeValue}>{fmtToman(netProfit)} تومان</span>
                          </div>
                          <div className={styles.gaugeTrack}>
                            <div className={styles.gaugeFill} style={{ width: `${(netProfit/totalRevenue)*100}%`, background: 'var(--accent-amber)' }} />
                          </div>
                        </div>

                        <div className={styles.gaugeItem}>
                          <div className={styles.gaugeHeader}>
                            <span className={styles.gaugeLabel}>هزینه‌های باربری هوایی کارگو:</span>
                            <span className={styles.gaugeValue}>{fmtToman(orders.reduce((acc, o) => acc + (o.shippingCost || 0), 0))} تومان</span>
                          </div>
                          <div className={styles.gaugeTrack}>
                            <div className={styles.gaugeFill} style={{ width: `${(orders.reduce((acc, o) => acc + (o.shippingCost || 0), 0)/totalRevenue)*100}%`, background: 'var(--accent-yellow)' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 7: PAYMENTS
                 ========================================================== */}
              {activeTab === 'payments' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>💳 مدیریت تراکنش‌ها و تأیید پرداخت پیش‌فاکتورها</h2>
                      <p>بررسی رسیدهای بانکی آپلود شده مشتریان شتاب، تایید مبالغ دریافتی و صدور تاییدیه خرید امارات</p>
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.saasTable}>
                      <thead>
                        <tr>
                          <th>کد پیش‌فاکتور</th>
                          <th>مشتری خریدار</th>
                          <th>مبلغ پرداخت نهایی</th>
                          <th>وضعیت تسویه فاکتور</th>
                          <th>سند بانکی ضمیمه شده</th>
                          <th>عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{order.id}</td>
                            <td>{order.customerName}</td>
                            <td style={{ fontWeight: '800' }}>{fmtToman(order.finalPrice)} تومان</td>
                            <td>
                              <span style={{ fontWeight: 'bold', color: order.paymentStatus === 'paid' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {order.paymentStatus === 'paid' ? '✓ تسویه نهایی شده' : '✗ در انتظار پرداخت'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📄 رسید بانکی تصویری ضمیمه است</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {order.paymentStatus !== 'paid' ? (
                                  <button onClick={() => {
                                    const list = orders.map(o => o.id === order.id ? { ...o, paymentStatus: 'paid' } : o);
                                    syncState('dubaiKharidOrders', list, setOrders);
                                    alert('تراکنش مالی با موفقیت تایید و تسویه گردید.');
                                  }} className={styles.editActionBtn} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                    ✓ تایید نهایی و تسویه
                                  </button>
                                ) : (
                                  <button onClick={() => {
                                    const list = orders.map(o => o.id === order.id ? { ...o, paymentStatus: 'pending' } : o);
                                    syncState('dubaiKharidOrders', list, setOrders);
                                  }} className={styles.deleteActionBtn}>
                                    ✗ لغو تایید
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 8: SHIPPING MANAGEMENT
                 ========================================================== */}
              {activeTab === 'shipping' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>✈️ مدیریت لجستیک، پروازهای کارگو و رهگیری مرسولات</h2>
                      <p>ویرایش خطوط هوایی، بارکد گمرک و به‌روزرسانی نوار وضعیت مکانی مرسوله‌های خریداران</p>
                    </div>
                  </div>

                  {orders.filter(o => o.trackingNumber).map(order => (
                    <div key={order.id} className={styles.chartCard} style={{ marginBottom: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontWeight: '800', color: 'var(--accent-amber)', fontSize: '15px' }}>📦 مرسوله {order.id}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '15px' }}>خریدار: {order.customerName} | کالا: {order.productName}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                          📟 کد رهگیری کارگو: {order.trackingNumber}
                        </div>
                      </div>

                      {/* Timeline Pipeline */}
                      <div className={styles.shippingTracker}>
                        <div className={`${styles.trackerStep} ${styles.trackerStepActive} ${styles.trackerStepDone}`}>
                          <div className={styles.trackerDot}>✓</div>
                          <span className={styles.trackerLabel}>تحویل دفتر دبی</span>
                        </div>
                        <div className={`${styles.trackerStep} ${
                          (order.status === 'shipped_iran' || order.status === 'delivered') ? `${styles.trackerStepActive} ${styles.trackerStepDone}` : ''
                        }`}>
                          <div className={styles.trackerDot}>✈️</div>
                          <span className={styles.trackerLabel}>پرواز کارگو هوایی</span>
                        </div>
                        <div className={`${styles.trackerStep} ${
                          order.status === 'delivered' ? `${styles.trackerStepActive} ${styles.trackerStepDone}` : ''
                        }`}>
                          <div className={styles.trackerDot}>📦</div>
                          <span className={styles.trackerLabel}>تحویل گمرک ایران</span>
                        </div>
                        <div className={`${styles.trackerStep} ${
                          order.status === 'delivered' ? `${styles.trackerStepActive}` : ''
                        }`}>
                          <div className={styles.trackerDot}>🏠</div>
                          <span className={styles.trackerLabel}>تحویل درب منزل</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ==========================================================
                 TAB 9: CUSTOMER REVIEWS
                 ========================================================== */}
              {activeTab === 'reviews' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>💬 مدیریت نظرات و دیدگاه‌های خریداران</h2>
                      <p>بازبینی نظرات مشتریان، درج پاسخ ادمین و تایید نهایی نمایش در صفحات محصولات اصلی</p>
                    </div>
                    
                    <div className={styles.searchBox}>
                      <span>🔍</span>
                      <input 
                        type="text" 
                        placeholder="جستجو در نظرات کاربران..."
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.saasTable}>
                      <thead>
                        <tr>
                          <th>نام خریدار</th>
                          <th>محصول مرجع</th>
                          <th>ستاره</th>
                          <th>متن نظر خریدار</th>
                          <th>پاسخ ادمین</th>
                          <th>وضعیت انتشار</th>
                          <th>عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviews.map(rev => (
                          <tr key={rev.id}>
                            <td style={{ fontWeight: '800' }}>{rev.userName}</td>
                            <td>{rev.productName}</td>
                            <td style={{ color: '#ff9d00', letterSpacing: '1px', fontWeight: 'bold' }}>
                              {'★'.repeat(rev.rating)}
                              {'☆'.repeat(5 - rev.rating)}
                            </td>
                            <td style={{ maxWidth: '280px', whiteSpace: 'normal', lineHeight: '1.5' }}>{rev.comment}</td>
                            <td style={{ maxWidth: '200px', whiteSpace: 'normal', color: 'var(--accent-amber)', fontSize: '12px' }}>
                              {rev.reply ? `💬 ${rev.reply}` : 'بدون پاسخ'}
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: rev.status === 'approved' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                                {rev.status === 'approved' ? '✓ منتشر شده' : '⌛ معلق'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.tableActionBtns}>
                                <button onClick={() => setSelectedReviewForDrawer(rev)} className={styles.editActionBtn}>✏️ پاسخ / مدیریت</button>
                                <button onClick={() => moderateReview(rev.id, 'approved')} className={styles.editActionBtn} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.2)' }}>تایید</button>
                                <button onClick={() => moderateReview(rev.id, 'rejected')} className={styles.deleteActionBtn}>حذف</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 10: CONTENT MANAGEMENT
                 ========================================================== */}
              {activeTab === 'content' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>📝 سیستم مدیریت محتوا و وبلاگ (CMS)</h2>
                      <p>ویرایش متون صفحه اصلی، مدیریت بنرهای تبلیغاتی فعال و مقالات بلاگ دبی خرید</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                    {/* Banners & Hero CMS */}
                    <div className={styles.chartCard}>
                      <h3 style={{ borderRightColor: 'var(--accent-amber)', fontSize: '14.5px', marginBottom: '20px' }}>🏠 ویرایش متون و بنرهای ویترین صفحه اصلی</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        localStorage.setItem('dubaiKharidContent', JSON.stringify(content));
                        alert('تغییرات محتوایی صفحه اصلی ذخیره شد.');
                      }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className={styles.formGroup}>
                          <label>عنوان اصلی هیرو (Hero Title):</label>
                          <input 
                            type="text" 
                            value={content.heroTitle} 
                            onChange={e => setContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                            className={styles.reviewInput} 
                            required 
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>زیرعنوان اصلی هیرو (Hero Subtitle):</label>
                          <textarea 
                            rows="2"
                            value={content.heroSubtitle} 
                            onChange={e => setContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                            className={styles.reviewInput} 
                            required 
                          />
                        </div>
                        <button type="submit" className={styles.btnSolid}>ذخیره تغییرات هیرو</button>
                      </form>
                    </div>

                    {/* Blog Posts CMS */}
                    <div className={styles.chartCard}>
                      <h3 style={{ borderRightColor: 'var(--accent-purple)', fontSize: '14.5px', marginBottom: '20px' }}>📝 مقالات فعال وبلاگ دبی خرید</h3>
                      <div className={styles.miniList}>
                        {content.blogPosts.map(post => (
                          <div key={post.id} className={styles.miniItem} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
                            <div>
                              <span className={styles.miniName} style={{ fontSize: '14px', fontWeight: 'bold' }}>{post.title}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>نویسنده: {post.author} | تاریخ: {post.date}</span>
                              <p style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '4px' }}>{post.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 11: PERMISSIONS & ROLES
                 ========================================================== */}
              {activeTab === 'roles' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>🔑 مدیریت سطوح دسترسی و نقش‌های پرسنل</h2>
                      <p>پیکربندی حریم خصوصی و مشخص کردن امکان دسترسی هر نقش به ماژول‌های حسابداری، سیستمی و مدیریت سفارشات</p>
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.saasTable}>
                      <thead>
                        <tr>
                          <th>نقش پرسنل</th>
                          <th>پیشخوان کلی</th>
                          <th>سفارشات</th>
                          <th>مشتریان CRM</th>
                          <th>کاتالوگ</th>
                          <th>انبار لپ‌تاپ</th>
                          <th>حسابداری مالی</th>
                          <th>پرداخت‌ها</th>
                          <th>تنظیمات سیستم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(rolePermissions).map(role => (
                          <tr key={role}>
                            <td style={{ fontWeight: '800', color: 'var(--accent-amber)' }}>{role}</td>
                            <td>{rolePermissions[role].includes('overview') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('orders') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('customers') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('products') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('laptops') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('finance') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('payments') ? '✓ مجاز' : '✗ مسدود'}</td>
                            <td>{rolePermissions[role].includes('settings') ? '✓ مجاز' : '✗ مسدود'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==========================================================
                 TAB 12: SYSTEM SETTINGS
                 ========================================================== */}
              {activeTab === 'settings' && (
                <div>
                  <div className={styles.moduleHeader}>
                    <div className={styles.titleArea}>
                      <h2>⚙️ تنظیمات عمومی و متغیرهای اصلی سیستم</h2>
                      <p>به‌روزرسانی زنده نرخ تبدیل ارز امارات (درهم به تومان)، کارمزد حق‌العمل و بازگردانی دیتابیس کارخانه</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                    {/* Settings Form */}
                    <div className={styles.chartCard}>
                      <h3 style={{ borderRightColor: 'var(--accent-amber)', fontSize: '14.5px', marginBottom: '20px' }}>⚙️ ویرایش پارامترهای سیستمی و نرخ ارز</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        localStorage.setItem('dubaiKharidSettings', JSON.stringify(settings));
                        alert('تنظیمات سیستمی و نرخ تسویه درهم با موفقیت به‌روزرسانی شد.');
                      }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className={styles.formGroup} style={{ maxWidth: '300px' }}>
                          <label>نرخ تبدیل ارز (درهم به تومان) *</label>
                          <input 
                            type="number" 
                            value={settings.exchangeRate} 
                            onChange={e => setSettings(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 0 }))}
                            className={styles.reviewInput} 
                            required 
                          />
                        </div>

                        <div className={styles.formGroup} style={{ maxWidth: '300px' }}>
                          <label>کارمزد پیش‌فرض دبی خرید (درصد) *</label>
                          <input 
                            type="number" 
                            value={settings.commissionRate} 
                            onChange={e => setSettings(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                            className={styles.reviewInput} 
                            required 
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>تلفن پشتیبانی واتساپ:</label>
                          <input 
                            type="text" 
                            value={settings.supportPhone} 
                            onChange={e => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                            className={styles.reviewInput} 
                          />
                        </div>

                        <button type="submit" className={styles.btnSolid} style={{ width: 'fit-content' }}>✓ به‌روزرسانی متغیرهای سیستمی</button>
                      </form>
                    </div>

                    {/* Reset settings box */}
                    <div className={styles.chartCard} style={{ border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.015)' }}>
                      <h3 style={{ borderRightColor: 'var(--accent-red)', color: 'var(--accent-red)', fontSize: '14.5px', marginBottom: '20px' }}>🚨 بخش ویژه بازیابی کارخانه</h3>
                      <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-light)', marginBottom: '25px' }}>
                        توجه: با بازگردانی اطلاعات، تمامی اطلاعات لیدهای معلق، انبار لپ‌تاپ‌های تست شده استوک، فاکتورهای ضمیمه و تراز مالی شبیه‌سازی شده حذف شده و رمز عبور پیش‌فرض پنل مدیریت (<strong>@Reza112233</strong>) در حافظه محلی ریست خواهد شد.
                      </p>
                      <button onClick={handleResetSystemSeeds} className={styles.exitBtn} style={{ width: 'fit-content' }}>
                        🗑️ پاک کردن دیتابیس لوکال و ریست کامل داده‌ها
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ==========================================================
         MODERATION & EDIT DRAWERS (Orders, Laptops, Reviews)
         ========================================================== */}
      
      {/* 1. Order editor drawer */}
      {selectedOrderForDrawer && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedOrderForDrawer(null)}>
          <div className={styles.drawerContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>✏️ مدیریت سفارش: {selectedOrderForDrawer.id}</h3>
              <button onClick={() => setSelectedOrderForDrawer(null)} className={styles.closeDrawerBtn}>✕</button>
            </div>
            
            <div className={styles.drawerBody}>
              {/* Customer WhatsApp contact */}
              <a href={getWhatsAppLink(selectedOrderForDrawer)} target="_blank" rel="noopener noreferrer" className={styles.whatsappCtaBtn}>
                💬 ارسال فاکتور هماهنگی در واتساپ خریدار
              </a>

              {/* Status workflow dropdown */}
              <div className={styles.formGroup}>
                <label>تغییر وضعیت پیشرفت سفارش:</label>
                <select 
                  value={selectedOrderForDrawer.status} 
                  onChange={(e) => updateOrderStatus(selectedOrderForDrawer.id, e.target.value)}
                  className={styles.inputField}
                >
                  <option value="new_request">New Request (درخواست جدید)</option>
                  <option value="waiting_review">Waiting For Review (در انتظار بررسی ادمین)</option>
                  <option value="price_calculated">Price Calculated (فاکتور صادر شد)</option>
                  <option value="confirmed">Customer Confirmed (تایید مشتری)</option>
                  <option value="purchased">Purchased (خریداری شده از امارات)</option>
                  <option value="uae_warehouse">In UAE Warehouse (تحویل انبار دبی)</option>
                  <option value="shipped_iran">Shipped To Iran (ارسال شده با کارگو هوایی)</option>
                  <option value="delivered">Delivered (تحویل شده نهایی در ایران)</option>
                  <option value="cancelled">Cancelled (لغو شده)</option>
                </select>
              </div>

              {/* Internal Notes input */}
              <div className={styles.formGroup}>
                <label>یادداشت‌های داخلی ادمین (غیر قابل مشاهده برای مشتری):</label>
                <textarea 
                  rows="3"
                  defaultValue={selectedOrderForDrawer.internalNotes}
                  onBlur={(e) => addOrderInternalNote(selectedOrderForDrawer.id, e.target.value)}
                  placeholder="نکات هماهنگی وزن، گمرک، هماهنگی تلفنی و..."
                  className={styles.textareaField}
                />
              </div>

              {/* Upload simulation panel */}
              <div className={styles.formGroup}>
                <label>کد پیگیری مرسوله باربری کارگو:</label>
                <input 
                  type="text" 
                  defaultValue={selectedOrderForDrawer.trackingNumber} 
                  onBlur={(e) => uploadOrderTrackingInvoice(selectedOrderForDrawer.id, e.target.value, null)}
                  placeholder="مثال: TRK-AE-19827" 
                  className={styles.inputField} 
                />
              </div>

              {/* Invoices asset file input mock */}
              <div className={styles.formGroup}>
                <label>آپلود فاکتور رسمی امارات (PDF / Image):</label>
                <div className={styles.fileUploadWrap} onClick={() => {
                  uploadOrderTrackingInvoice(selectedOrderForDrawer.id, null, 'invoice-file-attached.pdf');
                }}>
                  <span className={styles.fileUploadIcon}>📄</span>
                  <span className={styles.fileUploadLabel}>{selectedOrderForDrawer.invoiceUrl ? 'فاکتور ضمیمه شده است (کلیک برای ویرایش)' : 'آپلود سند فاکتور خرید'}</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrderForDrawer(null)} className={styles.btnSolid}>بستن و ذخیره تغییرات</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Laptop editor drawer */}
      {selectedLaptopForDrawer && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedLaptopForDrawer(null)}>
          <div className={styles.drawerContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>💻 مشخصات فنی و تاییدیه قطعات لپ‌تاپ</h3>
              <button onClick={() => setSelectedLaptopForDrawer(null)} className={styles.closeDrawerBtn}>✕</button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>برند دستگاه: *</label>
                  <input type="text" value={selectedLaptopForDrawer.brand} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, brand: e.target.value })} className={styles.reviewInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label>مدل دقیق لپ‌تاپ: *</label>
                  <input type="text" value={selectedLaptopForDrawer.model} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, model: e.target.value })} className={styles.reviewInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label>پردازنده (CPU):</label>
                  <input type="text" value={selectedLaptopForDrawer.cpu} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, cpu: e.target.value })} className={styles.reviewInput} />
                </div>
                <div className={styles.formGroup}>
                  <label>رم (RAM):</label>
                  <input type="text" value={selectedLaptopForDrawer.ram} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, ram: e.target.value })} className={styles.reviewInput} />
                </div>
                <div className={styles.formGroup}>
                  <label>حافظه ذخیره‌سازی:</label>
                  <input type="text" value={selectedLaptopForDrawer.storage} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, storage: e.target.value })} className={styles.reviewInput} />
                </div>
                <div className={styles.formGroup}>
                  <label>گرافیگ (GPU):</label>
                  <input type="text" value={selectedLaptopForDrawer.gpu} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, gpu: e.target.value })} className={styles.reviewInput} />
                </div>
                <div className={styles.formGroup}>
                  <label>اندازه صفحه نمایش:</label>
                  <input type="text" value={selectedLaptopForDrawer.screenSize} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, screenSize: e.target.value })} className={styles.reviewInput} />
                </div>
                <div className={styles.formGroup}>
                  <label>گرید ظاهری دستگاه:</label>
                  <select value={selectedLaptopForDrawer.condition} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, condition: e.target.value })} className={styles.selectField}>
                    <option value="Excellent">Excellent (در حد نو)</option>
                    <option value="Very Good">Very Good (خیلی تمیز)</option>
                    <option value="Good">Good (عادی تمیز)</option>
                    <option value="Fair">Fair (کارکرده)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>قیمت خرید دبی (AED): *</label>
                  <input type="number" value={selectedLaptopForDrawer.purchasePriceAED} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, purchasePriceAED: parseFloat(e.target.value) || 0 })} className={styles.reviewInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label>قیمت فروش ایران (تومان): *</label>
                  <input type="number" value={selectedLaptopForDrawer.salePriceToman} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, salePriceToman: parseFloat(e.target.value) || 0 })} className={styles.reviewInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label>وضعیت انبار:</label>
                  <select value={selectedLaptopForDrawer.status} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, status: e.target.value })} className={styles.selectField}>
                    <option value="Available">Available (موجود)</option>
                    <option value="Reserved">Reserved (رزرو شده)</option>
                    <option value="Sold">Sold (فروخته شده)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>آدرس تصویر کالا:</label>
                  <input type="text" value={selectedLaptopForDrawer.image} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, image: e.target.value })} className={styles.reviewInput} />
                </div>
              </div>

              {/* Hardware Test Checklist Checkboxes */}
              <div className={styles.formGroupFull} style={{ marginTop: '10px' }}>
                <label className={styles.formLabel}>📋 تاییدیه سلامت قطعات فنی سخت‌افزار (فاکتور تست):</label>
                <div className={styles.checklistGrid}>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.testedKeyboard} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, testedKeyboard: e.target.checked })} />
                    <span className={styles.checkItemText}>⌨️ تست صحت کیبورد</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.testedDisplay} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, testedDisplay: e.target.checked })} />
                    <span className={styles.checkItemText}>🖥️ تست سلامت نمایشگر</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.testedBattery} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, testedBattery: e.target.checked })} />
                    <span className={styles.checkItemText}>🔋 تست توان باتری</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.testedCamera} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, testedCamera: e.target.checked })} />
                    <span className={styles.checkItemText}>📷 تست صحت وبکم</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.testedUsb} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, testedUsb: e.target.checked })} />
                    <span className={styles.checkItemText}>🔌 تست درگاه‌های USB</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.testedWifi} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, testedWifi: e.target.checked })} />
                    <span className={styles.checkItemText}>📶 تست شبکه WiFi</span>
                  </label>
                </div>
              </div>

              {/* Accessories checklist checkboxes */}
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>📦 لوازم جانبی به همراه کالا:</label>
                <div style={{ display: 'flex', gap: '30px', padding: '10px 0' }}>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.chargerIncluded} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, chargerIncluded: e.target.checked })} />
                    <span className={styles.checkItemText}>🔋 شارژر فابریک کالا</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={selectedLaptopForDrawer.boxIncluded} onChange={e => setSelectedLaptopForDrawer({ ...selectedLaptopForDrawer, boxIncluded: e.target.checked })} />
                    <span className={styles.checkItemText}>📦 جعبه فابریک مرجع</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={() => setSelectedLaptopForDrawer(null)} className={styles.cancelReviewBtn}>انصراف</button>
              <button onClick={() => handleSaveLaptop(selectedLaptopForDrawer)} className={styles.btnSolid}>✓ ثبت و تایید سلامت لپ‌تاپ</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Review replying moderator drawer */}
      {selectedReviewForDrawer && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedReviewForDrawer(null)}>
          <div className={styles.drawerContainer} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className={styles.drawerHeader}>
              <h3>✏️ پاسخ ادمین به نظر کاربران</h3>
              <button onClick={() => setSelectedReviewForDrawer(null)} className={styles.closeDrawerBtn}>✕</button>
            </div>

            <div className={styles.drawerBody}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>👤 خریدار: {selectedReviewForDrawer.userName}</strong>
                <p style={{ fontSize: '12.5px', color: 'var(--text-light)', lineHeight: '1.5' }}>{selectedReviewForDrawer.comment}</p>
              </div>

              <div className={styles.formGroup}>
                <label>پاسخ ادمین دبی خرید (نمایش عمومی):</label>
                <textarea 
                  rows="4" 
                  value={selectedReviewForDrawer.reply} 
                  onChange={e => setSelectedReviewForDrawer({ ...selectedReviewForDrawer, reply: e.target.value })}
                  placeholder="پاسخ مدیریت را جهت نمایش در صفحه جزئیات کالا بنویسید..." 
                  className={styles.textareaField} 
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setSelectedReviewForDrawer(null)} className={styles.cancelReviewBtn}>انصراف</button>
              <button onClick={() => moderateReview(selectedReviewForDrawer.id, 'approved', selectedReviewForDrawer.reply)} className={styles.btnSolid}>تایید و ذخیره پاسخ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
