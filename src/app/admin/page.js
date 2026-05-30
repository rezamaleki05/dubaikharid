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

  // Active section/tab (Matches the sidebar items, default is 'overview' for dashboard)
  const [activeTab, setActiveTab] = useState('overview');

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
  const [selectedLaptopId, setSelectedLaptopId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('specs'); // 'specs' | 'tests' | 'accessories' | 'info'
  const [laptopStatusFilter, setLaptopStatusFilter] = useState('همه');
  const [laptopRamFilter, setLaptopRamFilter] = useState('همه');
  const [laptopCpuFilter, setLaptopCpuFilter] = useState('همه');

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
      // 1. Filter by Brand
      const matchesBrand = laptopBrandFilter === 'همه' || p.brand === laptopBrandFilter;
      
      // 2. Filter by Status
      const statusValue = p.stockStatus || 'available';
      const matchesStatus = laptopStatusFilter === 'همه' || statusValue === laptopStatusFilter;
      
      // 3. Filter by RAM
      let matchesRam = true;
      if (laptopRamFilter !== 'همه') {
        const parsedSpecs = parseProductToForm(p);
        matchesRam = String(parsedSpecs.ram) === laptopRamFilter;
      }
      
      // 4. Filter by CPU
      let matchesCpu = true;
      if (laptopCpuFilter !== 'همه') {
        const parsedSpecs = parseProductToForm(p);
        matchesCpu = parsedSpecs.cpu.toLowerCase().includes(laptopCpuFilter.toLowerCase());
      }

      // 5. Search keyword
      const q = laptopSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.brand.toLowerCase().includes(q) || 
        p.name.toLowerCase().includes(q) || 
        (p.spec && p.spec.toLowerCase().includes(q));
      
      return matchesBrand && matchesStatus && matchesRam && matchesCpu && matchesSearch;
    });
  };

  const getReactiveMetrics = () => {
    let totalOffset = 0;
    let availableOffset = 0;
    let reservedOffset = 0;
    let soldOffset = 0;
    let profitOffset = 0;

    // 1. Account for deleted static laptops (which were all 'available' and had zero profit by default)
    deletedStaticIds.forEach(id => {
      const orig = laptops.find(l => l.id === id);
      if (orig) {
        availableOffset -= 1;
        totalOffset -= 1;
      }
    });

    // 2. Account for uploaded products (both new additions and static overrides)
    uploadedProducts.filter(p => p.category === 'electronics').forEach(p => {
      const isStatic = laptops.some(l => l.id === p.id);
      const statusValue = p.stockStatus || 'available';

      // Parse specs to calculate actual profit
      const parsed = parseProductToForm(p);
      const priceToman = p.rawSpecs?.sellingPrice ? parseFloat(p.rawSpecs.sellingPrice) : (p.priceAed * 19500);
      const buyingVal = parseFloat(parsed.buyingPrice) || 0;
      const extraVal = parseFloat(parsed.extraCosts) || 0;
      const costToman = (buyingVal + extraVal) * 16100;
      const profit = Math.max(0, priceToman - costToman);

      if (isStatic) {
        // Skip if deleted
        if (deletedStaticIds.includes(p.id)) return;

        // Static is 'available' by default. We subtract 1 from 'available' contribution,
        // then add back its new status contribution.
        availableOffset -= 1;
        if (statusValue === 'available') {
          availableOffset += 1;
        } else if (statusValue === 'reserved') {
          reservedOffset += 1;
        } else if (statusValue === 'sold') {
          soldOffset += 1;
          profitOffset += profit;
        }
      } else {
        // Completely new dynamic laptop addition
        totalOffset += 1;
        if (statusValue === 'available') {
          availableOffset += 1;
        } else if (statusValue === 'reserved') {
          reservedOffset += 1;
        } else if (statusValue === 'sold') {
          soldOffset += 1;
          profitOffset += profit;
        }
      }
    });

    return {
      total: Math.max(0, 128 + totalOffset),
      available: Math.max(0, 68 + availableOffset),
      reserved: Math.max(0, 15 + reservedOffset),
      sold: Math.max(0, 45 + soldOffset),
      profit: Math.max(0, 2145500000 + profitOffset)
    };
  };

  const metrics = getReactiveMetrics();

  const activeLaptopsList = getFilteredAdminLaptops();
  const selectedLaptop = activeLaptopsList.find(p => p.id === selectedLaptopId) || activeLaptopsList[0];

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
            <img src="/admin-avatar.png" alt="Admin Avatar" className={styles.profileAvatar} />
            <div className={styles.profileMeta}>
              <h3>مدیر سایت</h3>
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
              <img src="/admin-avatar.png" alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', marginLeft: '8px', objectFit: 'cover' }} />
              <span>مدیر سایت</span>
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
                  {/* Mockup Header Row */}
                  <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                    <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '28px', color: '#f87820' }}>💻</span>
                      <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>لپ‌تاپ‌های استوک</h1>
                        <p style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت موجودی و فروش لپ‌تاپ‌های کارکرده</p>
                      </div>
                    </div>

                    <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <button 
                        type="button" 
                        onClick={triggerAddLaptop} 
                        className={styles.saveFormBtn}
                        style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', fontSize: '13px' }}
                      >
                        + افزودن لپ‌تاپ جدید
                      </button>
                    </div>
                  </div>

                  {/* Mockup Metric Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
                    {/* Card 1: Total */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #a855f7' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#a855f7' }}>💻</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>کل لپ‌تاپ‌ها</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.total}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Available */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #2ecc71' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2ecc71' }}>🟢</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>موجود</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.available}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Reserved */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #ff9d00' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 157, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ff9d00' }}>🔒</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>رزرو شده</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.reserved}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Sold */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #3b82f6' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#3b82f6' }}>🛍️</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>فروخته شده</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.sold}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Total Profit */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #2ecc71' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2ecc71' }}>💰</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>سود کل</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '18px', fontWeight: '800', color: '#2ecc71' }}>{Math.round(metrics.profit).toLocaleString('fa-IR')}</strong>
                          <span style={{ fontSize: '9px', color: '#2ecc71' }}>تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Grid Workspace */}
                  <div style={{ display: 'grid', gridTemplateColumns: '7fr 3.2fr', gap: '20px', marginBottom: '25px', alignItems: 'start' }}>
                    
                    {/* LEFT COLUMN: LIST TABLE & FILTERS */}
                    <div className={styles.cardPanel} style={{ padding: '0', overflow: 'hidden' }}>
                      
                      {/* Filter Area */}
                      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '750', color: '#fff', marginLeft: 'auto' }}>لیست لپ‌تاپ‌ها</span>
                        
                        {/* Search keyword */}
                        <div style={{ position: 'relative', width: '200px' }}>
                          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8b92a5', fontSize: '12px' }}>🔍</span>
                          <input 
                            type="text" 
                            placeholder="جستجو (مدل، برند، پردازنده...)" 
                            value={laptopSearchQuery}
                            onChange={(e) => setLaptopSearchQuery(e.target.value)}
                            className={styles.searchInput}
                            style={{ width: '100%', padding: '6px 30px 6px 10px', fontSize: '11px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
                          />
                        </div>

                        {/* Dropdown Brand */}
                        <select 
                          value={laptopBrandFilter} 
                          onChange={(e) => setLaptopBrandFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '100px', padding: '5px', fontSize: '11px' }}
                        >
                          <option value="همه">برند</option>
                          <option value="Apple">Apple</option>
                          <option value="Dell">Dell</option>
                          <option value="Lenovo">Lenovo</option>
                          <option value="HP">HP</option>
                          <option value="ASUS">ASUS</option>
                        </select>

                        {/* Dropdown Status */}
                        <select 
                          value={laptopStatusFilter} 
                          onChange={(e) => setLaptopStatusFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '100px', padding: '5px', fontSize: '11px' }}
                        >
                          <option value="همه">وضعیت</option>
                          <option value="available">موجود</option>
                          <option value="reserved">رزرو شده</option>
                          <option value="sold">فروخته شده</option>
                          <option value="unavailable">ناموجود</option>
                        </select>

                        {/* Dropdown RAM */}
                        <select 
                          value={laptopRamFilter} 
                          onChange={(e) => setLaptopRamFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '80px', padding: '5px', fontSize: '11px' }}
                        >
                          <option value="همه">رم</option>
                          <option value="8">8GB</option>
                          <option value="16">16GB</option>
                          <option value="32">32GB</option>
                          <option value="64">64GB</option>
                        </select>

                        {/* Dropdown CPU */}
                        <select 
                          value={laptopCpuFilter} 
                          onChange={(e) => setLaptopCpuFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '100px', padding: '5px', fontSize: '11px' }}
                        >
                          <option value="همه">پردازنده</option>
                          <option value="Apple">Apple M</option>
                          <option value="Intel">Intel Core</option>
                          <option value="Ryzen">AMD Ryzen</option>
                        </select>

                        {/* Reset Filter Button */}
                        <button 
                          onClick={() => {
                            setLaptopSearchQuery('');
                            setLaptopBrandFilter('همه');
                            setLaptopStatusFilter('همه');
                            setLaptopRamFilter('همه');
                            setLaptopCpuFilter('همه');
                          }}
                          className={styles.cancelFormBtn}
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', borderRadius: '6px' }}
                        >
                          <span>⚙️</span> فیلتر
                        </button>
                      </div>

                      {/* Main Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className={styles.leadsTable} style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <th style={{ padding: '12px 15px', textAlign: 'center', width: '60px' }}>تصویر</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>مدل</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>پردازنده</th>
                              <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5' }}>رم</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>حافظه</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>کارت گرافیک</th>
                              <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5' }}>صفحه نمایش</th>
                              <th style={{ textAlign: 'left', fontSize: '11.5px', color: '#8b92a5' }}>قیمت فروش (تومان)</th>
                              <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5' }}>وضعیت</th>
                              <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5', width: '100px' }}>عملیات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeLaptopsList.map((laptop) => {
                              const parsedSpecs = parseProductToForm(laptop);
                              const isSelected = selectedLaptop && selectedLaptop.id === laptop.id;
                              
                              let priceToman = 0;
                              if (laptop.rawSpecs && laptop.rawSpecs.sellingPrice) {
                                priceToman = parseFloat(laptop.rawSpecs.sellingPrice);
                              } else {
                                priceToman = laptop.priceAed * 19500;
                              }

                              const statusValue = laptop.stockStatus || 'available';

                              // Status badges colors exactly matching mockup
                              let badgeStyle = { background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)' };
                              let badgeText = 'موجود';
                              
                              if (statusValue === 'reserved') {
                                badgeStyle = { background: 'rgba(255,157,0,0.1)', color: '#ff9d00', border: '1px solid rgba(255,157,0,0.2)' };
                                badgeText = 'رزرو شده';
                              } else if (statusValue === 'sold') {
                                badgeStyle = { background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
                                badgeText = 'فروخته شده';
                              } else if (statusValue === 'unavailable') {
                                badgeStyle = { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' };
                                badgeText = 'ناموجود';
                              }

                              return (
                                <tr 
                                  key={laptop.id} 
                                  onClick={() => setSelectedLaptopId(laptop.id)}
                                  className={styles.tableRow} 
                                  style={{ 
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)', 
                                    cursor: 'pointer',
                                    background: isSelected ? 'rgba(248,120,32,0.03)' : 'transparent',
                                    borderLeft: isSelected ? '2px solid #f87820' : 'none'
                                  }}
                                >
                                  <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                                    <img 
                                      src={laptop.image} 
                                      alt={laptop.name} 
                                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                                    />
                                  </td>
                                  <td style={{ fontWeight: '600', color: '#fff', fontSize: '12px' }}>
                                    {parsedSpecs.brand} {parsedSpecs.model}
                                  </td>
                                  <td style={{ fontSize: '11.5px', color: '#c4c8d4' }}>{parsedSpecs.cpu}</td>
                                  <td style={{ fontSize: '11.5px', color: '#fff', textAlign: 'center' }}>{parsedSpecs.ram}GB</td>
                                  <td style={{ fontSize: '11.5px', color: '#c4c8d4' }}>
                                    {parsedSpecs.storageSize}{parsedSpecs.storageType}
                                  </td>
                                  <td style={{ fontSize: '11.5px', color: '#8b92a5' }}>{parsedSpecs.gpu}</td>
                                  <td style={{ fontSize: '11.5px', color: '#c4c8d4', textAlign: 'center' }}>{parsedSpecs.screenSize} inch</td>
                                  <td style={{ fontWeight: '700', color: '#fff', fontSize: '12.5px', textAlign: 'left', fontFamily: 'monospace' }}>
                                    {Math.round(priceToman).toLocaleString('fa-IR')}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span 
                                      className={styles.statusTag}
                                      style={{ ...badgeStyle, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}
                                    >
                                      {badgeText}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button 
                                        onClick={() => setSelectedLaptopId(laptop.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '13px' }}
                                        title="مشاهده جزئیات"
                                      >
                                        👁️
                                      </button>
                                      <button 
                                        onClick={() => triggerEditLaptop(laptop)}
                                        style={{ background: 'transparent', border: 'none', color: '#f87820', cursor: 'pointer', fontSize: '13px' }}
                                        title="ویرایش"
                                      >
                                        📝
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteLaptop(laptop.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '13px' }}
                                        title="حذف"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8b92a5' }}>
                          <span>نمایش ۱ تا {activeLaptopsList.length} از {activeLaptopsList.length} نتیجه</span>
                        </div>

                        {/* Page Numbers */}
                        <div style={{ display: 'flex', gap: '6px', direction: 'ltr' }}>
                          <button style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>&lt;</button>
                          <button style={{ border: 'none', background: '#f87820', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>1</button>
                          <button style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>&gt;</button>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: STICKY LAPTOP DETAILS PANEL */}
                    {selectedLaptop ? (() => {
                      const parsed = parseProductToForm(selectedLaptop);
                      
                      let priceToman = 0;
                      if (selectedLaptop.rawSpecs && selectedLaptop.rawSpecs.sellingPrice) {
                        priceToman = parseFloat(selectedLaptop.rawSpecs.sellingPrice);
                      } else {
                        priceToman = selectedLaptop.priceAed * 19500;
                      }

                      const buyingVal = parseFloat(parsed.buyingPrice) || 0;
                      const extraVal = parseFloat(parsed.extraCosts) || 0;
                      const costDirhams = buyingVal + extraVal;
                      const costToman = costDirhams * 16100;
                      const profitToman = priceToman - costToman;

                      const statusValue = selectedLaptop.stockStatus || 'available';

                      // Status tag
                      let badgeStyle = { background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)' };
                      let badgeText = 'موجود';
                      if (statusValue === 'reserved') {
                        badgeStyle = { background: 'rgba(255,157,0,0.1)', color: '#ff9d00', border: '1px solid rgba(255,157,0,0.2)' };
                        badgeText = 'رزرو شده';
                      } else if (statusValue === 'sold') {
                        badgeStyle = { background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
                        badgeText = 'فروخته شده';
                      } else if (statusValue === 'unavailable') {
                        badgeStyle = { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' };
                        badgeText = 'ناموجود';
                      }

                      // Gallery list
                      const imagesToUse = (selectedLaptop.rawSpecs && selectedLaptop.rawSpecs.images) 
                        ? selectedLaptop.rawSpecs.images 
                        : [selectedLaptop.image];

                      return (
                        <div className={styles.cardPanel} style={{ padding: '20px', position: 'sticky', top: '80px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
                          {/* Details Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>جزئیات لپ‌تاپ</span>
                            <button 
                              onClick={() => setSelectedLaptopId(null)}
                              style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '14px' }}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Gallery Split Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '4fr 1.2fr', gap: '10px', marginBottom: '15px' }}>
                            {/* Main Active Picture */}
                            <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <img src={imagesToUse[0]} alt="Laptop main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            {/* Thumbnails vertical stack */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {imagesToUse.slice(1, 4).map((img, index) => (
                                <div key={index} style={{ height: '42px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                              {imagesToUse.length > 4 && (
                                <div style={{ height: '42px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: '#fff' }}>
                                  +{imagesToUse.length - 4}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Title and status row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '750', color: '#fff' }}>{parsed.brand} {parsed.model}</span>
                            <span style={{ ...badgeStyle, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>{badgeText}</span>
                          </div>

                          {/* Detail Tabs selector */}
                          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '15px', paddingBottom: '2px', direction: 'rtl' }}>
                            {[
                              { id: 'specs', name: 'مشخصات' },
                              { id: 'tests', name: 'تست‌ها' },
                              { id: 'accessories', name: 'لوازم جانبی' },
                              { id: 'info', name: 'اطلاعات' }
                            ].map((tab) => {
                              const isTabActive = activeDetailTab === tab.id;
                              return (
                                <button 
                                  key={tab.id}
                                  onClick={() => setActiveDetailTab(tab.id)}
                                  style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: isTabActive ? '#f87820' : '#8b92a5',
                                    borderBottom: isTabActive ? '2px solid #f87820' : 'none',
                                    fontSize: '11px',
                                    fontWeight: isTabActive ? 'bold' : 'normal',
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    marginLeft: '6px'
                                  }}
                                >
                                  {tab.name}
                                </button>
                              );
                            })}
                          </div>

                          {/* Tab Content Panels */}
                          <div style={{ minHeight: '230px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px', fontSize: '12px' }} dir="rtl">
                            
                            {/* TAB: SPECS TABLE */}
                            {activeDetailTab === 'specs' && (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {[
                                    { label: 'برند', value: parsed.brand },
                                    { label: 'مدل', value: parsed.model },
                                    { label: 'پردازنده', value: parsed.cpu },
                                    { label: 'رم (RAM)', value: `${parsed.ram}GB` },
                                    { label: 'حافظه اصلی', value: `${parsed.storageSize}${parsed.storageType}` },
                                    { label: 'کارت گرافیک', value: parsed.gpu },
                                    { label: 'اندازه صفحه نمایش', value: `${parsed.screenSize} inch` },
                                    { label: 'سال ساخت', value: parsed.manufactureYear },
                                    { label: 'رنگ', value: parsed.color },
                                    { label: 'وزن', value: `${parsed.weight} kg` },
                                    { label: 'قیمت خرید (درهم)', value: buyingVal.toLocaleString('fa-IR') },
                                    { label: 'قیمت فروش (تومان)', value: Math.round(priceToman).toLocaleString('fa-IR') },
                                    { label: 'سود (تومان)', value: Math.round(profitToman).toLocaleString('fa-IR'), isProfit: true }
                                  ].map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '6px 0', color: '#8b92a5' }}>{row.label}</td>
                                      <td style={{ 
                                        padding: '6px 0', 
                                        textAlign: 'left', 
                                        fontWeight: row.isProfit ? 'bold' : 'normal',
                                        color: row.isProfit ? '#2ecc71' : '#fff' 
                                      }}>
                                        {row.value}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {/* TAB: HARDWARE TESTS CHECKLIST */}
                            {activeDetailTab === 'tests' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(parsed.hardwareTests || {}).map(([key, passed]) => {
                                  const labelMap = {
                                    keyboard: 'صفحه کلید و تاچ‌پد',
                                    speaker: 'بلندگوها و خروجی صدا',
                                    display: 'صفحه نمایش و پیکسل‌ها',
                                    usb: 'پورت‌های USB / اتصالات',
                                    battery: 'شارژدهی و سلامت باتری',
                                    wifi: 'کارت شبکه Wi-Fi و بلوتوث',
                                    camera: 'وب‌کم و میکروفون دستگاه',
                                    charge: 'سیستم تغذیه و آداپتور'
                                  };
                                  return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                      <span style={{ color: '#c4c8d4' }}>{labelMap[key] || key}</span>
                                      <span style={{ color: passed ? '#2ecc71' : '#ff4d4d', fontWeight: 'bold' }}>{passed ? '✓ تایید شده' : '✕ خطا'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* TAB: ACCESSORIES */}
                            {activeDetailTab === 'accessories' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                  <h4 style={{ color: '#f87820', margin: '0 0 8px 0', fontSize: '12px' }}>اقلام همراه لپ‌تاپ</h4>
                                  <div style={{ display: 'flex', gap: '15px' }}>
                                    <span style={{ color: parsed.accessories?.charger ? '#2ecc71' : '#8b92a5' }}>
                                      {parsed.accessories?.charger ? '✓ شارژر اصلی دبی' : '✕ فاقد شارژر اصلی'}
                                    </span>
                                    <span style={{ color: parsed.accessories?.box ? '#2ecc71' : '#8b92a5' }}>
                                      {parsed.accessories?.box ? '✓ کارتن اورجینال' : '✕ فاقد کارتن'}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                  <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '12px' }}>وضعیت ظاهری و بدنه</h4>
                                  <span style={{ color: '#ffd073' }}>
                                    وضعیت بدنه: {
                                      parsed.physicalStatus === 'excellent' ? 'عالی (در حد نو)' :
                                      parsed.physicalStatus === 'very_good' ? 'خیلی خوب' :
                                      parsed.physicalStatus === 'good' ? 'خوب' : 'متوسط'
                                    }
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* TAB: EXTRA INFO */}
                            {activeDetailTab === 'info' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                  <div style={{ color: '#8b92a5', marginBottom: '4px' }}>گارانتی و پشتیبانی:</div>
                                  <strong style={{ color: '#ffd073' }}>{parsed.warrantyDays} روز مهلت تست و تعویض کالا</strong>
                                  <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '4px' }}>انقضا: {parsed.warrantyExpiry}</div>
                                </div>
                                {parsed.customerNotes && (
                                  <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <div style={{ color: '#8b92a5', marginBottom: '4px' }}>یادداشت مشتری (توضیحات):</div>
                                    <div style={{ color: '#fff', lineHeight: '1.5' }}>{parsed.customerNotes}</div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>

                          {/* Footer action buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '15px' }}>
                            <button 
                              onClick={() => alert('دستور چاپ برچسب بارکد برای پرینتر انبار ارسال شد.')}
                              className={styles.cancelFormBtn}
                              style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', justifyContent: 'center' }}
                            >
                              🖨️ چاپ برچسب
                            </button>
                            <button 
                              onClick={() => triggerEditLaptop(selectedLaptop)}
                              className={styles.saveFormBtn}
                              style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', borderRadius: '8px', color: '#fff', justifyContent: 'center', fontWeight: 'bold' }}
                            >
                              📝 ویرایش
                            </button>
                            <button 
                              onClick={() => handleDeleteLaptop(selectedLaptop.id)}
                              className={styles.cancelFormBtn}
                              style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px', color: '#ff4d4d', justifyContent: 'center', background: 'rgba(255, 77, 77, 0.05)' }}
                            >
                              🗑️ حذف
                            </button>
                          </div>

                        </div>
                      );
                    })() : (
                      <div className={styles.cardPanel} style={{ padding: '30px', textAlign: 'center', color: '#8b92a5' }}>
                        برای مشاهده جزئیات لپ‌تاپ، یکی از ردیف‌های جدول را انتخاب نمایید.
                      </div>
                    )}

                  </div>

                  {/* SVG Charts Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* LEFT CHART: MONTHLY PROFIT LINE CHART */}
                    <div className={styles.cardPanel} style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>سود ماهانه</span>
                        <span style={{ fontSize: '10px', color: '#8b92a5' }}>۶ ماه اخیر (۱۴۰۳)</span>
                      </div>
                      
                      <div style={{ position: 'relative', height: '180px', width: '100%', direction: 'ltr' }}>
                        {/* Interactive floating tooltip */}
                        <div style={{ position: 'absolute', left: '72%', top: '35px', transform: 'translateX(-50%)', background: 'rgba(17, 19, 26, 0.95)', border: '1px solid #f87820', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', zIndex: 10, textAlign: 'center', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.3)', pointerEvents: 'none' }}>
                          <div style={{ color: '#ffd073', fontWeight: 'bold' }}>۳۸۵,۵۰۰,۰۰۰</div>
                          <div style={{ fontSize: '8px', color: '#8b92a5', marginTop: '2px' }}>تومان</div>
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

                          <line x1="40" y1="10" x2="480" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="40" x2="480" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                          <text x="10" y="14" fill="#8b92a5" fontSize="8" textAnchor="start">500M</text>
                          <text x="10" y="44" fill="#8b92a5" fontSize="8" textAnchor="start">400M</text>
                          <text x="10" y="74" fill="#8b92a5" fontSize="8" textAnchor="start">300M</text>
                          <text x="10" y="104" fill="#8b92a5" fontSize="8" textAnchor="start">200M</text>
                          <text x="10" y="134" fill="#8b92a5" fontSize="8" textAnchor="start">100M</text>

                          <path 
                            d="M 40 130 Q 120 115 170 122 T 270 110 T 370 70 T 480 130 Z" 
                            fill="url(#areaGrad)" 
                          />

                          <path 
                            d="M 40 130 Q 120 115 170 122 T 270 110 T 370 70" 
                            fill="none" 
                            stroke="#f87820" 
                            strokeWidth="3.5" 
                            filter="url(#glow)" 
                            strokeLinecap="round"
                          />

                          <path 
                            d="M 370 70 Q 425 65 480 130" 
                            fill="none" 
                            stroke="rgba(248,120,32,0.3)" 
                            strokeWidth="2.5" 
                            strokeDasharray="4,4"
                          />

                          <circle cx="40" cy="130" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                          <circle cx="170" cy="122" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                          <circle cx="270" cy="110" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                          
                          <circle cx="370" cy="70" r="8" fill="#f87820" fillOpacity="0.3" />
                          <circle cx="370" cy="70" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />

                          <text x="40" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">فروردین</text>
                          <text x="120" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">اردیبهشت</text>
                          <text x="195" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">خرداد</text>
                          <text x="270" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">تیر</text>
                          <text x="370" y="146" fill="#fff" fontSize="9.5" fontWeight="bold" textAnchor="middle">مرداد</text>
                          <text x="480" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">شهریور</text>
                        </svg>
                      </div>
                    </div>

                    {/* RIGHT CHART: TOP BRANDS PIE DONUT CHART */}
                    <div className={styles.cardPanel} style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>برترین برندها</span>
                        <span style={{ fontSize: '10px', color: '#8b92a5' }}>سهم برندها از کل موجودی</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center', height: '180px' }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 100 100" style={{ width: '120px', height: '120px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="10" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#2ecc71" strokeWidth="10" strokeDasharray="88 163" strokeDashoffset="0" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="75.3 175.7" strokeDashoffset="-88" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#60a5fa" strokeWidth="10" strokeDasharray="55.2 195.8" strokeDashoffset="-163.3" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f87820" strokeWidth="10" strokeDasharray="22.6 228.4" strokeDashoffset="-218.5" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#ff4d4d" strokeWidth="10" strokeDasharray="10 241" strokeDashoffset="-241.1" strokeLinecap="round" />
                          </svg>

                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                            <div style={{ fontSize: '10px', color: '#8b92a5' }}>کل لپ‌تاپ‌ها</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>128</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', direction: 'rtl' }}>
                          {[
                            { name: 'Apple', count: 45, pct: '۳۵٪', color: '#2ecc71' },
                            { name: 'Dell', count: 38, pct: '۳۰٪', color: '#3b82f6' },
                            { name: 'Lenovo', count: 28, pct: '۲۲٪', color: '#60a5fa' },
                            { name: 'HP', count: 12, pct: '۹٪', color: '#f87820' },
                            { name: 'Asus', count: 5, pct: '۴٪', color: '#ff4d4d' }
                          ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                              <span style={{ color: '#fff', fontWeight: 'bold', minWidth: '45px' }}>{item.name}</span>
                              <span style={{ color: '#8b92a5', marginRight: 'auto' }}>{item.count} ({item.pct})</span>
                            </div>
                          ))}
                        </div>
                      </div>
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
                        <option value="reserved">رزرو شده</option>
                        <option value="sold">فروخته شده</option>
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

          {/* TAB: DASHBOARD STATS - FULL MOCKUP PARITY REDESIGN */}
          {activeTab === 'overview' && (() => {
            const totalRevenue = leads.filter(l => l.status === 'paid' || l.status === 'shipped').reduce((sum, l) => sum + (l.totalToman || 0), 0);
            const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;
            const contactedCount = leads.filter(l => l.status === 'contacted').length;
            const paidCount = leads.filter(l => l.status === 'paid').length;
            const shippedCount = leads.filter(l => l.status === 'shipped').length;
            const deliveredCount = leads.filter(l => l.status === 'delivered').length;
            const cancelledCount = leads.filter(l => l.status === 'cancelled').length;
            const totalOrders = leads.length;
            const activeOrders = leads.filter(l => l.status !== 'cancelled' && l.status !== 'delivered').length;
            const monthlyProfit = Math.round(totalRevenue * 0.31);

            // Bar chart data (Monthly revenue - mockup style)
            const barMonths = ['شهریور', 'مرداد', 'تیر', 'خرداد', 'اردیبهشت', 'فروردین', 'اسفند', 'بهمن', 'دی', 'آذر'];
            const barValues = [450, 680, 920, 1245, 830, 610, 780, 560, 420, 350];
            const maxBar = Math.max(...barValues);

            // Donut chart data
            const orderStatuses = [
              { label: 'سفارش جدید', count: 12 + pendingLeadsCount, pct: 14.0, color: '#f87820' },
              { label: 'در انتظار بررسی', count: 18 + contactedCount, pct: 20.9, color: '#ff9d00' },
              { label: 'تایید شده', count: 24, pct: 27.9, color: '#2ecc71' },
              { label: 'خرید شده', count: 16 + paidCount, pct: 18.6, color: '#3b82f6' },
              { label: 'در حال ارسال', count: 14 + shippedCount, pct: 16.3, color: '#a855f7' },
              { label: 'تحویل شده', count: 2 + deliveredCount, pct: 2.3, color: '#64748b' }
            ];

            // Recent transactions data 
            const recentTransactions = [
              { id: '#DK-1058', label: 'پرداخت سفارش', amount: '۳۸,۵۰۰,۰۰۰', status: 'موفق', color: '#2ecc71' },
              { id: '#DK-1057', label: 'پرداخت سفارش', amount: '۱۸,۲۰۰,۰۰۰', status: 'موفق', color: '#2ecc71' },
              { id: '#DK-1053', label: 'بازگشت وجه سفارش', amount: '۹,۵۰۰,۰۰۰', status: 'بازگشت وجه', color: '#ff9d00' },
              { id: '#DK-1056', label: 'پرداخت سفارش', amount: '۹,۸۰۰,۰۰۰', status: 'موفق', color: '#2ecc71' }
            ];

            // Purchase requests
            const purchaseRequests = [
              { icon: '🛒', store: 'لینک محصول در آمازون', price: '۳,۵۵۰ درهم', time: '۲ ساعت پیش', tag: 'در انتظار بررسی', tagColor: '#ff9d00', tagBg: 'rgba(255,157,0,0.1)' },
              { icon: '🛍️', store: 'لینک محصول در نون', price: '۱,۲۳۰ درهم', time: '۵ ساعت پیش', tag: 'تایید شده', tagColor: '#2ecc71', tagBg: 'rgba(46,204,113,0.1)' },
              { icon: '📦', store: 'لینک محصول در علی اکسپرس', price: '۹۸۰ درهم', time: 'دیروز', tag: 'در انتظار بررسی', tagColor: '#ff9d00', tagBg: 'rgba(255,157,0,0.1)' }
            ];

            return (
            <div>
              {/* Welcome Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0' }}>
                    خوش آمدید، مدیر سایت 👋
                  </h1>
                  <p style={{ fontSize: '13px', color: '#8b92a5', margin: 0 }}>
                    کلی از وضعیت فروشگاه و سفارشات
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b92a5', fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>📅</span>
                  <span>امروز {new Date().toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* 6-Metric Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '24px' }}>

                {/* Card 1: Today Revenue */}
                <div className={styles.cardPanel} style={{ padding: '18px 16px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>💵</div>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>درآمد امروز</span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <strong style={{ fontSize: '22px', fontWeight: '900', color: '#fff', display: 'block' }}>48,200,000</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>تومان</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>▲</span> +12.5% <span style={{ color: '#8b92a5' }}>نسبت به دیروز</span>
                  </div>
                </div>

                {/* Card 2: Monthly Revenue */}
                <div className={styles.cardPanel} style={{ padding: '18px 16px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(248,120,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>💰</div>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>درآمد این ماه</span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <strong style={{ fontSize: '20px', fontWeight: '900', color: '#fff', display: 'block' }}>1,245,800,000</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>تومان</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>▲</span> +18.7% <span style={{ color: '#8b92a5' }}>نسبت به ماه قبل</span>
                  </div>
                </div>

                {/* Card 3: Active Orders */}
                <div className={styles.cardPanel} style={{ padding: '18px 16px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📦</div>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>سفارشات فعال</span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <strong style={{ fontSize: '24px', fontWeight: '900', color: '#fff', display: 'block' }}>{86 + activeOrders}</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>سفارش</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>▲</span> +8 <span style={{ color: '#8b92a5' }}>نسبت به دیروز</span>
                  </div>
                </div>

                {/* Card 4: Shipping Orders */}
                <div className={styles.cardPanel} style={{ padding: '18px 16px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🚚</div>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>سفارشات در حال ارسال</span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <strong style={{ fontSize: '24px', fontWeight: '900', color: '#fff', display: 'block' }}>{24 + shippedCount}</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>سفارش</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>▼</span> -3 <span style={{ color: '#8b92a5' }}>نسبت به دیروز</span>
                  </div>
                </div>

                {/* Card 5: Monthly Net Profit */}
                <div className={styles.cardPanel} style={{ padding: '18px 16px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📈</div>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>سود خالص این ماه</span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <strong style={{ fontSize: '20px', fontWeight: '900', color: '#fff', display: 'block' }}>386,750,000</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>تومان</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>▲</span> +21.3% <span style={{ color: '#8b92a5' }}>نسبت به ماه قبل</span>
                  </div>
                </div>

                {/* Card 6: Active Customers */}
                <div className={styles.cardPanel} style={{ padding: '18px 16px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👥</div>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>مشتریان فعال</span>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <strong style={{ fontSize: '24px', fontWeight: '900', color: '#fff', display: 'block' }}>2,145</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>مشتری</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>▲</span> +15.6% <span style={{ color: '#8b92a5' }}>نسبت به ماه قبل</span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Revenue Chart + Order Status Donut + Latest Orders */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1fr', gap: '18px', marginBottom: '24px' }}>
                
                {/* Revenue Bar Chart */}
                <div className={styles.cardPanel} style={{ padding: '22px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>نمودار درآمد</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px', border: '1px solid rgba(248,120,32,0.3)', background: 'rgba(248,120,32,0.1)', color: '#f87820', cursor: 'pointer', fontWeight: 'bold' }}>ماهانه</button>
                      <button style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#8b92a5', cursor: 'pointer' }}>هفتگی</button>
                    </div>
                  </div>

                  {/* Tooltip for peak */}
                  <div style={{ position: 'relative', height: '220px', width: '100%', direction: 'ltr' }}>
                    <svg viewBox="0 0 520 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* Y-axis labels */}
                      <text x="5" y="18" fill="#8b92a5" fontSize="8" textAnchor="start">1.4B</text>
                      <text x="5" y="48" fill="#8b92a5" fontSize="8" textAnchor="start">1.2B</text>
                      <text x="5" y="78" fill="#8b92a5" fontSize="8" textAnchor="start">1B</text>
                      <text x="5" y="108" fill="#8b92a5" fontSize="8" textAnchor="start">800M</text>
                      <text x="5" y="138" fill="#8b92a5" fontSize="8" textAnchor="start">600M</text>
                      <text x="5" y="168" fill="#8b92a5" fontSize="8" textAnchor="start">400M</text>
                      <text x="5" y="195" fill="#8b92a5" fontSize="8" textAnchor="start">200M</text>

                      {/* Grid lines */}
                      {[15, 45, 75, 105, 135, 165, 190].map((y, i) => (
                        <line key={i} x1="35" y1={y} x2="510" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                      ))}

                      {/* Bars */}
                      {barValues.map((val, i) => {
                        const barH = (val / 1400) * 175;
                        const x = 45 + i * 48;
                        const isPeak = i === 3;
                        return (
                          <g key={i}>
                            <defs>
                              <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isPeak ? '#2ecc71' : '#f87820'} />
                                <stop offset="100%" stopColor={isPeak ? '#1a9c54' : '#c45a10'} />
                              </linearGradient>
                            </defs>
                            <rect
                              x={x}
                              y={190 - barH}
                              width="30"
                              height={barH}
                              rx="5"
                              ry="5"
                              fill={`url(#barGrad${i})`}
                              opacity={isPeak ? 1 : 0.7}
                            />
                          </g>
                        );
                      })}

                      {/* Tooltip on peak bar */}
                      <rect x="160" y="12" width="108" height="32" rx="6" fill="rgba(17,19,26,0.95)" stroke="#2ecc71" strokeWidth="1" />
                      <text x="214" y="25" fill="#ffd073" fontSize="9" fontWeight="bold" textAnchor="middle">1,245,800,000</text>
                      <text x="214" y="38" fill="#8b92a5" fontSize="7" textAnchor="middle">تومان - خرداد ۱۴۰۳</text>

                      {/* X-axis labels */}
                      {barMonths.map((m, i) => (
                        <text key={i} x={60 + i * 48} y="208" fill={i === 3 ? '#fff' : '#8b92a5'} fontSize="8" fontWeight={i === 3 ? 'bold' : 'normal'} textAnchor="middle">{m}</text>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Order Status Donut Chart */}
                <div className={styles.cardPanel} style={{ padding: '22px', borderRadius: '16px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>وضعیت سفارشات</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Donut SVG */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <svg viewBox="0 0 100 100" style={{ width: '140px', height: '140px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="12" />
                        {(() => {
                          const segments = orderStatuses;
                          const total = segments.reduce((s, seg) => s + seg.count, 0);
                          const C = 2 * Math.PI * 38;
                          let offset = 0;
                          return segments.map((seg, idx) => {
                            const dash = (seg.count / total) * C;
                            const el = (
                              <circle
                                key={idx}
                                cx="50"
                                cy="50"
                                r="38"
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="12"
                                strokeDasharray={`${dash} ${C - dash}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                              />
                            );
                            offset += dash;
                            return el;
                          });
                        })()}
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '9px', color: '#8b92a5' }}>مجموع</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>86</div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', direction: 'rtl', flex: 1 }}>
                      {orderStatuses.map((seg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                            <span style={{ color: '#c4c8d4' }}>{seg.label}</span>
                          </div>
                          <span style={{ color: '#8b92a5', fontSize: '10px' }}>{seg.count} ({seg.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Latest Orders */}
                <div className={styles.cardPanel} style={{ padding: '22px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>آخرین سفارشات</span>
                    <button onClick={() => setActiveTab('leads')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px', border: '1px solid rgba(248,120,32,0.2)', background: 'rgba(248,120,32,0.08)', color: '#f87820', cursor: 'pointer', fontWeight: 'bold' }}>مشاهده همه</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { code: '#DK-1058', name: 'علی محمدی', amount: '۲۸,۵۰۰,۰۰۰ تومان' },
                      { code: '#DK-1057', name: 'سارا احمدی', amount: '۱۸,۲۰۰,۰۰۰ تومان' },
                      { code: '#DK-1056', name: 'حسین رضایی', amount: '۹,۸۵۵,۰۰۰ تومان' },
                      { code: '#DK-1055', name: 'مریم حسنی', amount: '۱۲,۳۰۰,۰۰۰ تومان' },
                      { code: '#DK-1054', name: 'رضا مرادی', amount: '۱۵,۴۰۰,۰۰۰ تومان' }
                    ].concat(leads.slice(0, 2).map((l, i) => ({ code: l.id.slice(-8), name: l.customerName, amount: fmtToman(l.totalToman) + ' تومان' }))).slice(0, 5).map((order, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248,120,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📦</div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#fff' }}>سفارش {order.code}</div>
                            <div style={{ fontSize: '10px', color: '#8b92a5' }}>{order.name}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: '700', fontSize: '12px', color: '#fff' }}>{order.amount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Stock Laptops + Purchase Requests + Recent Transactions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '18px' }}>
                
                {/* Stock Laptops Carousel */}
                <div className={styles.cardPanel} style={{ padding: '22px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>لپتاپ های استوک</span>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>مشاهده همه</div>
                    </div>
                    <button style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '16px' }}>⋮</button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {(() => {
                      const allLaptops = getMergedAdminLaptops().slice(0, 4);
                      return allLaptops.map((laptop, idx) => {
                        const parsed = parseProductToForm(laptop);
                        const statusValue = laptop.stockStatus || 'available';
                        let statusLabel = 'موجود';
                        let statusColor = '#2ecc71';
                        let statusBg = 'rgba(46,204,113,0.1)';
                        if (statusValue === 'reserved') { statusLabel = 'رزرو شده'; statusColor = '#ff9d00'; statusBg = 'rgba(255,157,0,0.1)'; }
                        else if (statusValue === 'sold') { statusLabel = 'فروخته شده'; statusColor = '#3b82f6'; statusBg = 'rgba(59,130,246,0.1)'; }
                        let priceToman = laptop.rawSpecs?.sellingPrice ? parseFloat(laptop.rawSpecs.sellingPrice) : (laptop.priceAed * 19500);
                        return (
                          <div key={idx} style={{ minWidth: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', textAlign: 'center', cursor: 'pointer', flexShrink: 0 }} onClick={() => { setActiveTab('stock_laptops'); setSelectedLaptopId(laptop.id); }}>
                            <div style={{ width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={laptop.image} alt={laptop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '11px', color: '#fff', marginBottom: '3px' }}>{parsed.brand} {parsed.model}</div>
                            <div style={{ fontSize: '9px', color: '#8b92a5', marginBottom: '6px' }}>{parsed.ram}GB / {parsed.storageSize}{parsed.storageType}{parsed.gpu ? ' / ' + parsed.gpu.split(' ')[0] : ''}</div>
                            <div style={{ fontWeight: '800', fontSize: '11px', color: '#f87820', marginBottom: '6px' }}>قیمت: {Math.round(priceToman).toLocaleString('fa-IR')} تومان</div>
                            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: statusBg, color: statusColor, fontWeight: 'bold' }}>{statusLabel}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Purchase Requests */}
                <div className={styles.cardPanel} style={{ padding: '22px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>درخواست های خرید</span>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>مشاهده همه</div>
                    </div>
                    <button style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '16px' }}>⋮</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {purchaseRequests.map((req, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(248,120,32,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{req.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#fff' }}>{req.store}</div>
                          <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>{req.price} • {req.time}</div>
                        </div>
                        <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', background: req.tagBg, color: req.tagColor, fontWeight: 'bold', flexShrink: 0 }}>{req.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className={styles.cardPanel} style={{ padding: '22px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>تراکنش های اخیر</span>
                    <button style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '16px' }}>⋮</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recentTransactions.map((tx, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tx.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#fff' }}>{tx.id} {tx.label}</div>
                            <div style={{ fontSize: '11px', color: '#fff', fontWeight: '700', marginTop: '2px' }}>{tx.amount} تومان</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', background: tx.color === '#2ecc71' ? 'rgba(46,204,113,0.1)' : 'rgba(255,157,0,0.1)', color: tx.color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {tx.status === 'موفق' ? '✓' : '↩'} {tx.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Support Widget */}
              <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 100 }}>
                <div style={{ background: 'linear-gradient(135deg, #f87820, #ff5e00)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 8px 30px rgba(248,120,32,0.4)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '120px' }}>
                  <span style={{ fontSize: '28px' }}>🎧</span>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>پشتیبانی</strong>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>نیاز به کمک دارید؟</span>
                  <button style={{ marginTop: '4px', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>تماس با پشتیبانی</button>
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
