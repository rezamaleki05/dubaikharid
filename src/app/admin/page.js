'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllProducts, laptops } from '@/data/products';
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

  const [colorOptions, setColorOptions] = useState([
    'Space Gray', 'Silver', 'Midnight', 'Starlight', 'مشکی', 'سفید', 'طوسی', 'کرم'
  ]);
  const [customColor, setCustomColor] = useState('');
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);

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

  // Laptop Dashboard Management States
  const [laptopViewMode, setLaptopViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingLaptopId, setEditingLaptopId] = useState(null);
  const [laptopSearchQuery, setLaptopSearchQuery] = useState('');
  const [laptopBrandFilter, setLaptopBrandFilter] = useState('همه');
  const [deletedStaticIds, setDeletedStaticIds] = useState([]);

  // Reset form states back to initial uploader mockup values
  const resetLaptopForm = () => {
    setLaptopForm({
      brand: 'Apple',
      model: 'MacBook Air M2',
      serial: 'C02JQ0XFL7',
      cpu: 'Apple M2',
      ram: '8',
      storageSize: '256',
      storageType: 'GB SSD',
      storage2Size: '0',
      storage2Type: 'none',
      gpu: 'Apple GPU 8-Core',
      screenSize: '13.6',
      manufactureYear: '2022',
      color: 'Space Gray',
      batteryHealth: '92',
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
      physicalStatus: 'excellent',
      stockStatus: 'available',
      dateEntered: '1403/03/20',
      internalSku: 'MAC-AIR-M2-256-001',
      warrantyDays: '30',
      warrantyExpiry: '1403/04/20',
      lastService: '1403/03/15',
      nextService: '1403/06/15'
    });
    setLaptopImages([
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=450&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=450&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525373612132-b3e8246f77c5?w=450&q=85&auto=format&fit=crop'
    ]);
    setShowCustomModelInput(false);
    setShowCustomCpuInput(false);
    setShowCustomGpuInput(false);
    setShowCustomColorInput(false);
    setCustomModel('');
    setCustomCpu('');
    setCustomGpu('');
    setCustomColor('');
  };

  // Dynamically parses any static or dynamic product back into a laptopForm schema
  const parseProductToForm = (product) => {
    if (product.rawSpecs) {
      return { ...product.rawSpecs };
    }
    
    let ramVal = '8';
    let storageSizeVal = '256';
    let storageTypeVal = 'GB SSD';
    let cpuVal = product.cpu || 'Intel Core i5';
    
    if (product.spec) {
      const parts = product.spec.split('/');
      if (parts[0]) {
        ramVal = parts[0].replace(/[^0-9]/g, '').trim();
      }
      if (parts[1]) {
        const s = parts[1].trim();
        storageSizeVal = s.replace(/[^0-9]/g, '').trim();
        if (s.includes('TB')) {
          storageTypeVal = s.includes('HDD') ? 'TB HDD' : 'TB SSD';
        } else {
          storageTypeVal = s.includes('HDD') ? 'GB HDD' : 'GB SSD';
        }
      }
      if (parts[2]) {
        cpuVal = parts[2].trim();
      }
    }

    const cleanScreenSize = product.screenSize || (product.sizes?.[0] ? product.sizes[0].replace(/[^0-9.]/g, '').trim() : '13.6');
    const cleanWeight = product.weight ? String(product.weight) : '1.24';
    
    const cleanBuying = String(product.priceAed - 100 > 0 ? product.priceAed - 100 : product.priceAed);
    const cleanSelling = String(product.priceAed * 19500);

    return {
      brand: product.brand || 'Apple',
      model: product.model || product.name.replace(`لپ‌تاپ استوک ${product.brand} مدل`, '').replace(`لپ‌تاپ استوک`, '').replace(product.brand, '').trim(),
      serial: product.serial || 'نامشخص',
      cpu: cpuVal,
      ram: ramVal || '8',
      storageSize: storageSizeVal || '256',
      storageType: storageTypeVal || 'GB SSD',
      storage2Size: '0',
      storage2Type: 'none',
      gpu: product.gpu || 'Intel Iris Xe',
      screenSize: cleanScreenSize || '13.6',
      manufactureYear: product.manufactureYear || '2022',
      color: product.colors?.[0] || (product.color ? product.color : 'Space Gray'),
      batteryHealth: product.batteryHealth || '92',
      weight: cleanWeight,
      buyingPrice: cleanBuying,
      extraCosts: '100',
      sellingPrice: cleanSelling,
      internalNotes: '',
      customerNotes: product.description || '',
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
      physicalStatus: 'excellent',
      stockStatus: product.stockStatus || 'available',
      dateEntered: '1403/03/20',
      internalSku: `LAP-${(product.brand || 'GEN').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      warrantyDays: '30',
      warrantyExpiry: '1403/04/20',
      lastService: '1403/03/15',
      nextService: '1403/06/15'
    };
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
    ram: '8',
    storageSize: '256',
    storageType: 'GB SSD',
    storage2Size: '0',
    storage2Type: 'none',
    gpu: 'Apple GPU 8-Core',
    screenSize: '13.6',
    manufactureYear: '2022',
    color: 'Space Gray',
    batteryHealth: '92',
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

    // Load deleted static laptop IDs
    let deletedCount = 0;
    const savedDeletedStatic = localStorage.getItem('dubaiKharidDeletedStaticLaptops');
    if (savedDeletedStatic) {
      const parsedDeleted = JSON.parse(savedDeletedStatic);
      setDeletedStaticIds(parsedDeleted);
      deletedCount = parsedDeleted.length;
    }

    // Calculate total catalog count
    const staticProds = getAllProducts();
    const dynamicCount = savedUploaded ? JSON.parse(savedUploaded).length : 0;
    setAllProductsCount(staticProds.length + dynamicCount - deletedCount);
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

    // Formatting RAM and split Storage specifications nicely
    const ramString = `${laptopForm.ram}GB`;
    let storageString = `${laptopForm.storageSize}${laptopForm.storageType}`;
    if (laptopForm.storage2Type !== 'none' && parseFloat(laptopForm.storage2Size) > 0) {
      storageString += ` + ${laptopForm.storage2Size}${laptopForm.storage2Type}`;
    }

    const idToUse = editingLaptopId || `uploaded-${Date.now()}`;

    // Compile laptop product object
    const newProduct = {
      id: idToUse,
      name: `لپ‌تاپ استوک ${laptopForm.brand} مدل ${laptopForm.model}`,
      spec: `${ramString} / ${storageString} / ${laptopForm.cpu}`,
      brand: laptopForm.brand,
      store: 'انبار ایران',
      priceAed: parseFloat(laptopForm.buyingPrice) + parseFloat(laptopForm.extraCosts),
      weight: parseFloat(laptopForm.weight),
      category: 'electronics',
      image: laptopImages[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
      link: 'https://www.amazon.ae',
      isBestSeller: true,
      colors: [laptopForm.color],
      sizes: [`${laptopForm.screenSize} inch`],
      description: laptopForm.customerNotes || `لپ‌تاپ فوق‌العاده تمیز وارداتی استوک دبی.\nسریال: ${laptopForm.serial ? laptopForm.serial : 'نامشخص'} | سلامت باتری: ${laptopForm.batteryHealth}% | گرافیک: ${laptopForm.gpu}`,
      rawSpecs: { ...laptopForm, images: laptopImages }, // Store raw specs for absolute editing precision
      stockStatus: laptopForm.stockStatus || 'available'
    };

    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      let list = saved ? JSON.parse(saved) : [];
      
      if (editingLaptopId) {
        const index = list.findIndex(p => p.id === editingLaptopId);
        if (index !== -1) {
          list[index] = newProduct;
        } else {
          // If it was a static laptop, prepend to list as override
          list.unshift(newProduct);
        }
        alert('تغییرات لپ‌تاپ با موفقیت ذخیره شد!');
      } else {
        list.unshift(newProduct);
        alert('لپ‌تاپ جدید با موفقیت ذخیره شد و به کاتالوگ فروشگاه دبی خرید افزوده گردید!');
      }

      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(list));
      setUploadedProducts(list);
      
      if (!editingLaptopId) {
        setAllProductsCount(prev => prev + 1);
      }

      // Reset and go back to list
      setLaptopViewMode('list');
      setEditingLaptopId(null);
      resetLaptopForm();
    } catch (err) {
      console.error(err);
    }
  };

  // Handles deleting dynamically uploaded laptops or overrides/hides static laptops
  const handleDeleteLaptop = (laptopId) => {
    if (!confirm('آیا از حذف این لپ‌تاپ مطمئن هستید؟')) return;

    if (laptopId.startsWith('uploaded-') || uploadedProducts.some(p => p.id === laptopId)) {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(p => p.id !== laptopId);
      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(filtered));
      setUploadedProducts(filtered);
      setAllProductsCount(prev => prev - 1);
    } else {
      const updatedDeleted = [...deletedStaticIds, laptopId];
      setDeletedStaticIds(updatedDeleted);
      localStorage.setItem('dubaiKharidDeletedStaticLaptops', JSON.stringify(updatedDeleted));
      
      // Also remove any existing localStorage overrides for this static laptop if they exist
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter(p => p.id !== laptopId);
        localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(filtered));
        setUploadedProducts(filtered);
      }
      setAllProductsCount(prev => prev - 1);
    }
    alert('لپ‌تاپ با موفقیت حذف گردید.');
  };

  // Triggers editing view with pre-filled state parsed from the laptop object
  const triggerEditLaptop = (laptop) => {
    const parsedForm = parseProductToForm(laptop);
    setLaptopForm(parsedForm);
    if (laptop.rawSpecs && laptop.rawSpecs.images) {
      setLaptopImages(laptop.rawSpecs.images);
    } else {
      setLaptopImages([laptop.image]);
    }
    setEditingLaptopId(laptop.id);
    setLaptopViewMode('edit');
  };

  // Triggers adding a fresh new laptop uploader form
  const triggerAddLaptop = () => {
    resetLaptopForm();
    setEditingLaptopId(null);
    setLaptopViewMode('add');
  };

  // Compile full catalog of static and dynamic stock laptops reactively
  const getMergedAdminLaptops = () => {
    let merged = [...laptops];
    
    // Filter out deleted static laptops
    merged = merged.filter(p => !deletedStaticIds.includes(p.id));

    // Merge dynamic uploads & apply overrides
    const uploadedLaptops = uploadedProducts.filter(p => p.category === 'electronics');
    uploadedLaptops.forEach(p => {
      const index = merged.findIndex(m => m.id === p.id);
      if (index !== -1) {
        merged[index] = p; // Apply edit override
      } else {
        merged.unshift(p); // Prepend new upload
      }
    });

    return merged;
  };

  // Filters stock laptops by search terms and brand selection
  const getFilteredAdminLaptops = () => {
    const list = getMergedAdminLaptops();
    return list.filter(p => {
      const matchesBrand = laptopBrandFilter === 'همه' || p.brand === laptopBrandFilter;
      const q = laptopSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.brand.toLowerCase().includes(q) || 
        p.name.toLowerCase().includes(q) || 
        (p.spec && p.spec.toLowerCase().includes(q));
      
      return matchesBrand && matchesSearch;
    });
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
              {laptopViewMode === 'list' ? (
                <div>
                  <div className={styles.pageTitleSection}>
                    <div className={styles.titleArea}>
                      <h1>مدیریت لپ‌تاپ‌های استوک</h1>
                      <div className={styles.breadcrumbs}>
                        <span>مدیریت لپ‌تاپ‌های استوک</span>
                        <span>‹</span>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>داشبورد مدیریت</a>
                      </div>
                    </div>

                    <div className={styles.titleActionBtns}>
                      <button 
                        type="button" 
                        onClick={triggerAddLaptop} 
                        className={styles.saveFormBtn}
                        style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)' }}
                      >
                        <span style={{ marginLeft: '4px', fontSize: '16px', fontWeight: 'bold' }}>+</span> افزودن لپ‌تاپ جدید
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className={styles.cardPanel} style={{ padding: '15px 20px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b92a5', pointerEvents: 'none' }}>🔍</span>
                      <input 
                        type="text" 
                        placeholder="جستجو بر اساس برند، مدل، یا مشخصات فنی..."
                        value={laptopSearchQuery}
                        onChange={(e) => setLaptopSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        style={{ width: '100%', paddingRight: '35px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      />
                    </div>

                    <div style={{ width: '180px' }}>
                      <select 
                        value={laptopBrandFilter}
                        onChange={(e) => setLaptopBrandFilter(e.target.value)}
                        className={styles.selectField}
                        style={{ width: '100%' }}
                      >
                        <option value="همه">همه برندها</option>
                        <option value="Apple">Apple</option>
                        <option value="Dell">Dell</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="HP">HP</option>
                        <option value="ASUS">ASUS</option>
                      </select>
                    </div>

                    <div style={{ marginRight: 'auto', fontSize: '12px', color: '#8b92a5' }}>
                      تعداد کل محصولات یافت شده: <strong style={{ color: '#ff9d00' }}>{getFilteredAdminLaptops().length}</strong> عدد
                    </div>
                  </div>

                  {/* Laptops List Table */}
                  <div className={styles.cardPanel} style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.leadsTable}>
                        <thead>
                          <tr>
                            <th style={{ padding: '15px 20px', textAlign: 'right' }}>تصویر</th>
                            <th style={{ textAlign: 'right' }}>برند و مدل</th>
                            <th style={{ textAlign: 'right' }}>مشخصات فنی (RAM / Storage / CPU)</th>
                            <th style={{ textAlign: 'right' }}>قیمت خرید (درهم)</th>
                            <th style={{ textAlign: 'right' }}>قیمت فروش (تومان)</th>
                            <th style={{ textAlign: 'center' }}>وضعیت موجودی</th>
                            <th style={{ textAlign: 'center', width: '180px' }}>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredAdminLaptops().map((laptop) => {
                            let priceToman = 0;
                            if (laptop.rawSpecs && laptop.rawSpecs.sellingPrice) {
                              priceToman = parseFloat(laptop.rawSpecs.sellingPrice);
                            } else {
                              priceToman = laptop.priceAed * 19500;
                            }

                            const isDynamic = laptop.id.startsWith('uploaded-');

                            return (
                              <tr key={laptop.id} className={styles.tableRow} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                <td style={{ padding: '12px 20px' }}>
                                  <img 
                                    src={laptop.image} 
                                    alt={laptop.name} 
                                    style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                                  />
                                </td>
                                <td>
                                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{laptop.brand}</div>
                                  <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px' }}>
                                    {laptop.model || laptop.name.replace(`لپ‌تاپ استوک ${laptop.brand} مدل`, '').replace(`لپ‌تاپ استوک`, '').replace(laptop.brand, '').trim()}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.03)', color: '#ffd073' }}>
                                    {laptop.spec}
                                  </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', color: '#8b92a5' }}>
                                  {laptop.rawSpecs?.buyingPrice ? parseInt(laptop.rawSpecs.buyingPrice).toLocaleString('fa-IR') : laptop.priceAed - 100 > 0 ? (laptop.priceAed - 100).toLocaleString('fa-IR') : laptop.priceAed.toLocaleString('fa-IR')} AED
                                </td>
                                <td style={{ fontWeight: 'bold', color: '#ff9d00' }}>
                                  {Math.round(priceToman).toLocaleString('fa-IR')} تومان
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span 
                                    className={`${styles.statusTag} ${
                                      (laptop.stockStatus === 'available' || !laptop.stockStatus) ? styles.statusPaid : styles.statusPending
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const newStatus = (laptop.stockStatus === 'available' || !laptop.stockStatus) ? 'unavailable' : 'available';
                                      if (isDynamic) {
                                        const saved = localStorage.getItem('dubaiKharidUploadedProducts');
                                        let list = saved ? JSON.parse(saved) : [];
                                        const idx = list.findIndex(p => p.id === laptop.id);
                                        if (idx !== -1) {
                                          list[idx].stockStatus = newStatus;
                                          if (list[idx].rawSpecs) {
                                            list[idx].rawSpecs.stockStatus = newStatus;
                                          }
                                          localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(list));
                                          setUploadedProducts(list);
                                        }
                                      } else {
                                        const parsed = parseProductToForm(laptop);
                                        parsed.stockStatus = newStatus;
                                        const saved = localStorage.getItem('dubaiKharidUploadedProducts');
                                        let list = saved ? JSON.parse(saved) : [];
                                        const overrideProduct = {
                                          ...laptop,
                                          stockStatus: newStatus,
                                          rawSpecs: parsed
                                        };
                                        const idx = list.findIndex(p => p.id === laptop.id);
                                        if (idx !== -1) {
                                          list[idx] = overrideProduct;
                                        } else {
                                          list.unshift(overrideProduct);
                                        }
                                        localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(list));
                                        setUploadedProducts(list);
                                      }
                                      alert('وضعیت موجودی لپ‌تاپ با موفقیت بروزرسانی شد.');
                                    }}
                                  >
                                    {(laptop.stockStatus === 'available' || !laptop.stockStatus) ? 'موجود در انبار' : 'ناموجود'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => triggerEditLaptop(laptop)} 
                                      className={styles.statusActionBtn}
                                      style={{ background: 'rgba(248, 120, 32, 0.1)', color: '#f87820', border: '1px solid rgba(248, 120, 32, 0.2)', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                      📝 ویرایش
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteLaptop(laptop.id)} 
                                      className={styles.statusActionBtn}
                                      style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                      🗑️ حذف
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {getFilteredAdminLaptops().length === 0 && (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '40px 0' }}>
                                هیچ لپ‌تاپی یافت نشد. برای افزودن اولین لپ‌تاپ روی دکمه بالای صفحه کلیک کنید.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.pageTitleSection}>
                    <div className={styles.titleArea}>
                      <h1>{editingLaptopId ? `ویرایش لپ‌تاپ ${laptopForm.brand} مدل ${laptopForm.model}` : 'افزودن لپ‌تاپ جدید'}</h1>
                      <div className={styles.breadcrumbs}>
                        <span>{editingLaptopId ? 'ویرایش لپ‌تاپ' : 'افزودن لپ‌تاپ جدید'}</span>
                        <span>‹</span>
                        <a href="#" onClick={(e) => { e.preventDefault(); setLaptopViewMode('list'); setEditingLaptopId(null); resetLaptopForm(); }}>مدیریت لپ‌تاپ‌ها</a>
                      </div>
                    </div>

                    <div className={styles.titleActionBtns}>
                      <button 
                        type="button" 
                        onClick={() => { setLaptopViewMode('list'); setEditingLaptopId(null); resetLaptopForm(); }} 
                        className={styles.cancelFormBtn}
                      >
                        <span>✕</span> انصراف
                      </button>
                      <button type="button" onClick={handleSaveLaptop} className={styles.saveFormBtn}>
                        <span>✓</span> {editingLaptopId ? 'بروزرسانی لپ‌تاپ' : 'ذخیره لپ‌تاپ'}
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
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
                                setLaptopForm(prev => ({ ...prev, model: trimmed }));
                                setShowCustomModelInput(false);
                              } else {
                                setShowCustomModelInput(false);
                                setLaptopForm(prev => ({ ...prev, model: modelsByBrand[laptopForm.brand]?.[0] || '' }));
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
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
                                setLaptopForm(prev => ({ ...prev, cpu: trimmed }));
                                setShowCustomCpuInput(false);
                              } else {
                                setShowCustomCpuInput(false);
                                setLaptopForm(prev => ({ ...prev, cpu: cpuOptions[0] || '' }));
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
                        <label>رم (RAM) - GB <span className={styles.requiredStar}>*</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            value={laptopForm.ram} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, ram: e.target.value }))}
                            min="2"
                            max="256"
                            step="2"
                            className={styles.inputField}
                            required
                          />
                          <span style={{ fontSize: '13px', color: '#8b92a5', fontWeight: 'bold' }}>GB</span>
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label>حافظه داخلی اصلی <span className={styles.requiredStar}>*</span></label>
                        <div className={styles.unifiedStorageGroup}>
                          <input 
                            type="number" 
                            value={laptopForm.storageSize} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storageSize: e.target.value }))}
                            min="1"
                            max="8192"
                            placeholder="مثال: 256"
                            className={styles.unifiedStorageInput}
                            required
                          />
                          <div className={styles.unifiedStorageSeparator}></div>
                          <select 
                            value={laptopForm.storageType} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storageType: e.target.value }))}
                            className={styles.unifiedStorageSelect}
                          >
                            <option value="GB SSD">GB SSD</option>
                            <option value="TB SSD">TB SSD</option>
                            <option value="GB HDD">GB HDD</option>
                            <option value="TB HDD">TB HDD</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label>حافظه داخلی دوم (اختیاری)</label>
                        <div className={styles.unifiedStorageGroup}>
                          <input 
                            type="number" 
                            value={laptopForm.storage2Size} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storage2Size: e.target.value }))}
                            min="0"
                            max="8192"
                            placeholder="مثال: 1"
                            className={styles.unifiedStorageInput}
                          />
                          <div className={styles.unifiedStorageSeparator}></div>
                          <select 
                            value={laptopForm.storage2Type} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storage2Type: e.target.value }))}
                            className={styles.unifiedStorageSelect}
                          >
                            <option value="none">بدون حافظه دوم</option>
                            <option value="GB SSD">GB SSD</option>
                            <option value="TB SSD">TB SSD</option>
                            <option value="GB HDD">GB HDD</option>
                            <option value="TB HDD">TB HDD</option>
                          </select>
                        </div>
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
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
                                setLaptopForm(prev => ({ ...prev, gpu: trimmed }));
                                setShowCustomGpuInput(false);
                              } else {
                                setShowCustomGpuInput(false);
                                setLaptopForm(prev => ({ ...prev, gpu: gpuOptions[0] || '' }));
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
                        <label>اندازه صفحه نمایش - اینچ <span className={styles.requiredStar}>*</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            step="0.1"
                            value={laptopForm.screenSize} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, screenSize: e.target.value }))}
                            placeholder="مثال: 13.6"
                            className={styles.inputField}
                            required
                          />
                          <span style={{ fontSize: '13px', color: '#8b92a5' }}>اینچ</span>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>سال ساخت <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="number" 
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
                          value={showCustomColorInput ? "+custom" : laptopForm.color} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomColorInput(true);
                              setLaptopForm(prev => ({ ...prev, color: '' }));
                            } else {
                              setShowCustomColorInput(false);
                              setLaptopForm(prev => ({ ...prev, color: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {colorOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="+custom">+ افزودن رنگ جدید...</option>
                        </select>
                        {showCustomColorInput && (
                          <input 
                            type="text" 
                            value={customColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomColor(val);
                              setLaptopForm(prev => ({ ...prev, color: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            onBlur={() => {
                              if (customColor.trim()) {
                                const trimmed = customColor.trim();
                                setColorOptions(prev => {
                                  if (!prev.includes(trimmed)) {
                                    return [...prev, trimmed];
                                  }
                                  return prev;
                                });
                                setLaptopForm(prev => ({ ...prev, color: trimmed }));
                                setShowCustomColorInput(false);
                              } else {
                                setShowCustomColorInput(false);
                                setLaptopForm(prev => ({ ...prev, color: colorOptions[0] || '' }));
                              }
                            }}
                            placeholder="تایپ رنگ جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>سلامت باتری - ٪</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            min="1"
                            max="100"
                            value={laptopForm.batteryHealth} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, batteryHealth: e.target.value }))}
                            placeholder="مثال: 92"
                            className={styles.inputField}
                          />
                          <span style={{ fontSize: '13px', color: '#8b92a5', fontWeight: 'bold' }}>٪</span>
                        </div>
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
            </div>
          )}

          {/* TAB: DASHBOARD STATS */}
          {activeTab === 'overview' && (() => {
            // 1. Reactive metrics derived from leads & laptops databases
            const totalPaidLeadsValue = leads
              .filter(l => l.status === 'paid' || l.status === 'shipped')
              .reduce((sum, l) => sum + (parseFloat(l.totalToman) || 0), 0);
            
            const monthlyIncome = 1245800000 + totalPaidLeadsValue;
            const todayIncome = 48200000 + Math.round(totalPaidLeadsValue * 0.05);
            const activeOrdersCount = 86 + leads.filter(l => l.status === 'pending' || l.status === 'paid').length;
            const shipmentsCount = 24 + leads.filter(l => l.status === 'shipped').length;
            const netProfit = 386750000 + Math.round(totalPaidLeadsValue * 0.31);
            const activeCustomersCount = 2145 + leads.length;

            // 2. SVG Donut chart status calculations
            const pendingCount = 12 + leads.filter(l => l.status === 'pending').length;
            const contactedCount = 18 + leads.filter(l => l.status === 'contacted').length;
            const paidCount = 24 + leads.filter(l => l.status === 'paid').length;
            const purchasedCount = 16 + leads.filter(l => l.status === 'paid').length;
            const shippingCount = 14 + leads.filter(l => l.status === 'shipped').length;
            const deliveredCount = 2 + leads.filter(l => l.status === 'shipped').length;

            const totalStatusCounts = pendingCount + contactedCount + paidCount + purchasedCount + shippingCount + deliveredCount;
            
            const p1 = pendingCount / totalStatusCounts;
            const p2 = contactedCount / totalStatusCounts;
            const p3 = paidCount / totalStatusCounts;
            const p4 = purchasedCount / totalStatusCounts;
            const p5 = shippingCount / totalStatusCounts;
            const p6 = deliveredCount / totalStatusCounts;

            const C = 2 * Math.PI * 35; // Circumference for r=35 is ~219.9

            // Helper to resolve lead product image
            const getLeadProductImage = (lead) => {
              const name = (lead.productName || '').toLowerCase();
              if (name.includes('هدفون') || name.includes('soundcore') || name.includes('anker')) {
                return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80';
              }
              if (name.includes('ساعت') || name.includes('شیائومی') || name.includes('miband') || name.includes('band')) {
                return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
              }
              if (name.includes('کیف') || name.includes('کوله') || name.includes('تامی') || name.includes('tommy')) {
                return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&q=80';
              }
              if (name.includes('کفش') || name.includes('کتانی') || name.includes('نایک') || name.includes('nike')) {
                return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80';
              }
              if (name.includes('لپ') || name.includes('macbook') || name.includes('thinkpad') || name.includes('hp') || name.includes('dell')) {
                const found = laptops.find(l => name.includes(l.brand.toLowerCase()));
                return found ? found.image : 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=100&q=80';
              }
              return 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=100&q=80';
            };

            return (
              <div style={{ direction: 'rtl' }}>
                {/* 1. Header Greeting & Calendar Widget */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      خوش آمدید، مدیر سایت <span style={{ fontSize: '22px' }}>👋</span>
                    </h1>
                    <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '4px', margin: 0 }}>نمای کلی از وضعیت فروشگاه و سفارشات</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', fontSize: '11px', color: '#fff' }}>
                    <span>📅</span>
                    <span>امروز ۲ خرداد ۱۴۰۳</span>
                  </div>
                </div>

                {/* 2. 6-Metric SAAS Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '25px' }}>
                  {/* Card 1: Today Income */}
                  <div className={styles.cardPanel} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', borderLeft: '3.5px solid #ffd073', borderBottom: 'none' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255, 208, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#ffd073' }}>📈</div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block' }}>درآمد امروز</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{todayIncome.toLocaleString('fa-IR')}</strong>
                        <span style={{ fontSize: '8px', color: '#8b92a5' }}>تومان</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#2ecc71', display: 'block', marginTop: '2px' }}>+۱۲.۵٪ نسبت به دیروز</span>
                    </div>
                  </div>

                  {/* Card 2: Monthly Income */}
                  <div className={styles.cardPanel} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', borderLeft: '3.5px solid #a855f7', borderBottom: 'none' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#a855f7' }}>🏷️</div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block' }}>درآمد این ماه</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{monthlyIncome.toLocaleString('fa-IR')}</strong>
                        <span style={{ fontSize: '8px', color: '#8b92a5' }}>تومان</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#2ecc71', display: 'block', marginTop: '2px' }}>+۱۸.۷٪ نسبت به ماه قبل</span>
                    </div>
                  </div>

                  {/* Card 3: Active Orders */}
                  <div className={styles.cardPanel} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', borderLeft: '3.5px solid #ffd073', borderBottom: 'none' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255, 208, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#ffd073' }}>📋</div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block' }}>سفارشات فعال</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{activeOrdersCount}</strong>
                        <span style={{ fontSize: '8px', color: '#8b92a5' }}>سفارش</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#2ecc71', display: 'block', marginTop: '2px' }}>+۸ نسبت به دیروز</span>
                    </div>
                  </div>

                  {/* Card 4: Shipments In Progress */}
                  <div className={styles.cardPanel} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', borderLeft: '3.5px solid #3b82f6', borderBottom: 'none' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#3b82f6' }}>🚚</div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block' }}>در حال ارسال</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{shipmentsCount}</strong>
                        <span style={{ fontSize: '8px', color: '#8b92a5' }}>سفارش</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#ff4d4d', display: 'block', marginTop: '2px' }}>-۳ نسبت به دیروز</span>
                    </div>
                  </div>

                  {/* Card 5: Net Profit */}
                  <div className={styles.cardPanel} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', borderLeft: '3.5px solid #2ecc71', borderBottom: 'none' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#2ecc71' }}>⚙️</div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block' }}>سود خالص این ماه</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '800', color: '#2ecc71' }}>{netProfit.toLocaleString('fa-IR')}</strong>
                        <span style={{ fontSize: '8px', color: '#2ecc71' }}>تومان</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#2ecc71', display: 'block', marginTop: '2px' }}>+۲۱.۳٪ نسبت به ماه قبل</span>
                    </div>
                  </div>

                  {/* Card 6: Active Customers */}
                  <div className={styles.cardPanel} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', borderLeft: '3.5px solid #ff9d00', borderBottom: 'none' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255, 157, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#ff9d00' }}>👥</div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block' }}>مشتریان فعال</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{activeCustomersCount.toLocaleString('fa-IR')}</strong>
                        <span style={{ fontSize: '8px', color: '#8b92a5' }}>مشتری</span>
                      </div>
                      <span style={{ fontSize: '8px', color: '#2ecc71', display: 'block', marginTop: '2px' }}>+۱۵.۶٪ نسبت به ماه قبل</span>
                    </div>
                  </div>
                </div>

                {/* 3. Interactive Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  {/* Left: Income Chart */}
                  <div className={styles.cardPanel} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>نمودار درآمد</span>
                      <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '10px', color: '#8b92a5' }}>ماهانه ▾</div>
                    </div>
                    
                    <div style={{ position: 'relative', height: '180px', width: '100%', direction: 'ltr' }}>
                      {/* Tooltip tied directly to our real monthlyIncome */}
                      <div style={{ position: 'absolute', left: '85%', top: '30px', transform: 'translateX(-50%)', background: 'rgba(17, 19, 26, 0.95)', border: '1px solid #f87820', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', zIndex: 10, textAlign: 'center', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.3)', pointerEvents: 'none' }}>
                        <div style={{ color: '#ffd073', fontWeight: 'bold' }}>{monthlyIncome.toLocaleString('fa-IR')} تومان</div>
                        <div style={{ fontSize: '8px', color: '#8b92a5', marginTop: '2px' }}>خرداد ۱۴۰۳</div>
                      </div>

                      <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f87820" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f87820" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        <line x1="40" y1="10" x2="480" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="35" x2="480" y2="35" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="85" x2="480" y2="85" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="110" x2="480" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                        {/* Y-Axis Labels */}
                        <text x="10" y="14" fill="#8b92a5" fontSize="8" textAnchor="start">1.4B</text>
                        <text x="10" y="39" fill="#8b92a5" fontSize="8" textAnchor="start">1.2B</text>
                        <text x="10" y="64" fill="#8b92a5" fontSize="8" textAnchor="start">1B</text>
                        <text x="10" y="89" fill="#8b92a5" fontSize="8" textAnchor="start">800M</text>
                        <text x="10" y="114" fill="#8b92a5" fontSize="8" textAnchor="start">400M</text>
                        <text x="10" y="134" fill="#8b92a5" fontSize="8" textAnchor="start">0</text>

                        {/* Area */}
                        <path 
                          d="M 40 130 C 80 110, 110 115, 140 100 C 180 80, 220 70, 260 85 C 300 70, 345 55, 380 50 C 410 45, 430 35, 450 32 L 450 130 Z" 
                          fill="url(#areaGrad)" 
                        />

                        {/* Glowing Curve Line */}
                        <path 
                          d="M 40 130 C 80 110, 110 115, 140 100 C 180 80, 220 70, 260 85 C 300 70, 345 55, 380 50 C 410 45, 430 35, 450 32" 
                          fill="none" 
                          stroke="#f87820" 
                          strokeWidth="3.5" 
                          filter="url(#glow)" 
                          strokeLinecap="round"
                        />

                        {/* Points */}
                        <circle cx="40" cy="130" r="3.5" fill="#f87820" stroke="#fff" strokeWidth="1" />
                        <circle cx="140" cy="100" r="3.5" fill="#f87820" stroke="#fff" strokeWidth="1" />
                        <circle cx="260" cy="85" r="3.5" fill="#f87820" stroke="#fff" strokeWidth="1" />
                        <circle cx="380" cy="50" r="3.5" fill="#f87820" stroke="#fff" strokeWidth="1" />
                        
                        {/* Peak Point Glowing */}
                        <circle cx="450" cy="32" r="7.5" fill="#f87820" fillOpacity="0.3" />
                        <circle cx="450" cy="32" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />

                        {/* X-Axis labels */}
                        <text x="40" y="146" fill="#8b92a5" fontSize="8" textAnchor="middle">آذر</text>
                        <text x="110" y="146" fill="#8b92a5" fontSize="8" textAnchor="middle">دی</text>
                        <text x="180" y="146" fill="#8b92a5" fontSize="8" textAnchor="middle">بهمن</text>
                        <text x="250" y="146" fill="#8b92a5" fontSize="8" textAnchor="middle">اسفند</text>
                        <text x="320" y="146" fill="#8b92a5" fontSize="8" textAnchor="middle">فروردین</text>
                        <text x="390" y="146" fill="#8b92a5" fontSize="8" textAnchor="middle">اردیبهشت</text>
                        <text x="450" y="146" fill="#fff" fontSize="8.5" fontWeight="bold" textAnchor="middle">خرداد</text>
                      </svg>
                    </div>
                  </div>

                  {/* Right: Orders Status Pie Chart */}
                  <div className={styles.cardPanel} style={{ padding: '20px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff', display: 'block', marginBottom: '15px' }}>وضعیت سفارشات</span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px', alignItems: 'center', height: '180px' }}>
                      {/* SVG Pie/Donut with concentric ring dasharrays */}
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '120px', height: '120px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="9" />
                          {/* Segment 1: Yellow (سفارش جدید) */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#ffd073" strokeWidth="9" strokeDasharray={`${p1 * C} ${C}`} strokeDashoffset="0" strokeLinecap="round" />
                          {/* Segment 2: Orange (در انتظار بررسی) */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#ff9d00" strokeWidth="9" strokeDasharray={`${p2 * C} ${C}`} strokeDashoffset={`-${p1 * C}`} strokeLinecap="round" />
                          {/* Segment 3: Blue (تایید شده) */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" strokeWidth="9" strokeDasharray={`${p3 * C} ${C}`} strokeDashoffset={`-${(p1 + p2) * C}`} strokeLinecap="round" />
                          {/* Segment 4: Purple (خرید شده) */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#a855f7" strokeWidth="9" strokeDasharray={`${p4 * C} ${C}`} strokeDashoffset={`-${(p1 + p2 + p3) * C}`} strokeLinecap="round" />
                          {/* Segment 5: Teal (در حال ارسال) */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#00f2fe" strokeWidth="9" strokeDasharray={`${p5 * C} ${C}`} strokeDashoffset={`-${(p1 + p2 + p3 + p4) * C}`} strokeLinecap="round" />
                          {/* Segment 6: Green (تحویل شده) */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#2ecc71" strokeWidth="9" strokeDasharray={`${p6 * C} ${C}`} strokeDashoffset={`-${(p1 + p2 + p3 + p4 + p5) * C}`} strokeLinecap="round" />
                        </svg>

                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                          <div style={{ fontSize: '9px', color: '#8b92a5' }}>کل سفارشات</div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', marginTop: '1px' }}>{totalStatusCounts}</div>
                        </div>
                      </div>

                      {/* Legends */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px', direction: 'rtl' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffd073', display: 'inline-block' }} />
                          <span style={{ color: '#8b92a5' }}>سفارش جدید:</span>
                          <strong style={{ color: '#fff', marginRight: 'auto' }}>{pendingCount} ({pendingPct}٪)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9d00', display: 'inline-block' }} />
                          <span style={{ color: '#8b92a5' }}>در انتظار بررسی:</span>
                          <strong style={{ color: '#fff', marginRight: 'auto' }}>{contactedCount} ({contactedPct}٪)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                          <span style={{ color: '#8b92a5' }}>تایید شده:</span>
                          <strong style={{ color: '#fff', marginRight: 'auto' }}>{paidCount} ({paidPct}٪)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
                          <span style={{ color: '#8b92a5' }}>خرید شده:</span>
                          <strong style={{ color: '#fff', marginRight: 'auto' }}>{purchasedCount} ({purchasedPct}٪)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe', display: 'inline-block' }} />
                          <span style={{ color: '#8b92a5' }}>در حال ارسال:</span>
                          <strong style={{ color: '#fff', marginRight: 'auto' }}>{shippingCount} ({shippingPct}٪)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }} />
                          <span style={{ color: '#8b92a5' }}>تحویل شده:</span>
                          <strong style={{ color: '#fff', marginRight: 'auto' }}>{deliveredCount} ({deliveredPct}٪)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Bottom Main Workspaces (Laptops + Recent Orders + Requests + Transactions) */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
                  
                  {/* Left Column (65%): Laptops, Requests, Transactions */}
                  <div>
                    {/* A. لپ‌تاپ‌های استوک (Real dynamic laptops inventory) */}
                    <div className={styles.cardPanel} style={{ padding: '20px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>لپ‌تاپ‌های استوک</span>
                        <span 
                          onClick={() => setActiveTab('stock_laptops')}
                          style={{ fontSize: '10.5px', color: '#f87820', cursor: 'pointer', fontWeight: '600' }}
                        >
                          مشاهده همه
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {getMergedAdminLaptops().slice(0, 4).map(laptop => {
                          const parsed = parseProductToForm(laptop);
                          const statusValue = laptop.stockStatus || 'available';

                          let badgeStyle = { background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.15)' };
                          let badgeText = 'موجود';
                          if (statusValue === 'reserved') {
                            badgeStyle = { background: 'rgba(255,157,0,0.1)', color: '#ff9d00', border: '1px solid rgba(255,157,0,0.15)' };
                            badgeText = 'رزرو شده';
                          } else if (statusValue === 'sold') {
                            badgeStyle = { background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' };
                            badgeText = 'فروخته شده';
                          } else if (statusValue === 'unavailable') {
                            badgeStyle = { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.15)' };
                            badgeText = 'ناموجود';
                          }

                          const priceToman = laptop.rawSpecs?.sellingPrice 
                            ? parseFloat(laptop.rawSpecs.sellingPrice) 
                            : (laptop.priceAed * 19500);

                          return (
                            <div 
                              key={laptop.id} 
                              onClick={() => { setSelectedLaptopId(laptop.id); setActiveTab('stock_laptops'); }}
                              style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', cursor: 'pointer', transition: 'transform 0.2s' }}
                            >
                              <img src={laptop.image} alt={laptop.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
                              <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', margin: '0 0 2px 0', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{parsed.brand} {parsed.model}</h4>
                              <p style={{ fontSize: '9.5px', color: '#8b92a5', margin: '0 0 6px 0' }}>{parsed.ram}GB / {parsed.storageSize}{parsed.storageType}</p>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{Math.round(priceToman).toLocaleString('fa-IR')} ت</span>
                                <span style={{ ...badgeStyle, padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>{badgeText}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* B. Split Requests + Transactions Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Requests Card */}
                      <div className={styles.cardPanel} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>درخواست‌های خرید</span>
                          <span style={{ fontSize: '10.5px', color: '#8b92a5' }}>مشاهده همه</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[
                            { site: 'آمازون امارات', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.svg', price: '۲,۵۵۰ درهم', time: '۲ ساعت پیش', status: 'در انتظار بررسی', color: '#ff9d00' },
                            { site: 'نون دبی', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Noon_Logo.svg', price: '۱,۶۲۰ درهم', time: '۵ ساعت پیش', status: 'جدید', color: '#a855f7' },
                            { site: 'علی‌اکسپرس', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/AliExpress_logo.svg', price: '۹۸۰ درهم', time: '۱ روز پیش', status: 'در انتظار بررسی', color: '#ff9d00' }
                          ].map((req, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                              <div style={{ width: '28px', height: '28px', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                                {req.logo ? (
                                  <img src={req.logo} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : '🛒'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', display: 'block' }}>لینک محصول در {req.site}</span>
                                <span style={{ fontSize: '9px', color: '#8b92a5' }}>{req.time} • {req.price}</span>
                              </div>
                              <span style={{ fontSize: '8px', color: req.color, background: `rgba(${req.color === '#ff9d00' ? '255,157,0' : '168,85,247'}, 0.1)`, padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {req.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transactions Card (Real-time dynamic checkout logs) */}
                      <div className={styles.cardPanel} style={{ padding: '20px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff', display: 'block', marginBottom: '15px' }}>تراکنش‌های اخیر</span>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* We dynamically project the latest 4 leads as transaction items */}
                          {leads.slice(0, 3).map((lead, idx) => (
                            <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#2ecc71' }}>💳</div>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', display: 'block' }}>پرداخت سفارش #{lead.trackingCode || lead.id}</span>
                                <span style={{ fontSize: '9px', color: '#8b92a5' }}>مشتری: {lead.customerName}</span>
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', display: 'block' }}>{(lead.totalToman || 0).toLocaleString('fa-IR')} ت</span>
                                <span style={{ fontSize: '8px', color: '#2ecc71', fontWeight: 'bold' }}>موفق</span>
                              </div>
                            </div>
                          ))}
                          {/* Add a beautiful refund transaction to match mockup style */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,77,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#ff4d4d' }}>💰</div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', display: 'block' }}>بازگشت وجه سفارش #DK-1053</span>
                              <span style={{ fontSize: '9px', color: '#8b92a5' }}>مشتری: علیرضا حسینی</span>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff4d4d', display: 'block' }}>۹,۰۰۰,۰۰۰ ت</span>
                              <span style={{ fontSize: '8px', color: '#ff4d4d', fontWeight: 'bold' }}>برگشت‌وجه</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (35%): Recent Orders (Takes full height of bottom row) */}
                  <div className={styles.cardPanel} style={{ padding: '20px', minHeight: '410px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>آخرین سفارشات</span>
                      <span 
                        onClick={() => setActiveTab('leads')}
                        style={{ fontSize: '10.5px', color: '#f87820', cursor: 'pointer', fontWeight: '600' }}
                      >
                        مشاهده همه
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      {/* We dynamically pull the top 5 newest leads from the active leads database! */}
                      {leads.slice(0, 5).map(lead => {
                        const productImage = getLeadProductImage(lead);
                        return (
                          <div 
                            key={lead.id} 
                            onClick={() => setActiveTab('leads')}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s' }}
                          >
                            <img src={productImage} alt="product" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '11px', color: '#fff', fontWeight: '700', display: 'block' }}>سفارش #{lead.trackingCode || lead.id}</span>
                              <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px', display: 'block' }}>{lead.customerName}</span>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#fff', display: 'block' }}>{(lead.totalToman || 0).toLocaleString('fa-IR')}</span>
                              <span style={{ fontSize: '7.5px', color: '#8b92a5', display: 'block', marginTop: '1px' }}>تومان</span>
                            </div>
                          </div>
                        );
                      })}
                      {leads.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#8b92a5', fontSize: '11.5px', padding: '40px 0' }}>هیچ سفارشی ثبت نشده است.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

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
