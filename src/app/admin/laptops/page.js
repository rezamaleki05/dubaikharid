'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const DEFAULT_BRANDS_SEED = [
  { id: 'gucci', name: 'Gucci', faName: 'گوچی', cat: 'مد و پوشاک', hasImage: false, fallback: 'GUCCI', url: 'https://www.gucci.com/ae/en/' },
  { id: 'lv', name: 'Louis Vuitton', faName: 'لویی ویتون', cat: 'مد و پوشاک', hasImage: false, fallback: 'LV', url: 'https://ae.louisvuitton.com/eng-ae/homepage' },
  { id: 'chanel', name: 'Chanel', faName: 'شنل', cat: 'مد و پوشاک', hasImage: false, fallback: 'CHANEL', url: 'https://www.chanel.com/ae/' },
  { id: 'prada', name: 'Prada', faName: 'پرادا', cat: 'کیف و کفش', hasImage: false, fallback: 'PRADA', url: 'https://www.prada.com/ae/en.html' },
  { id: 'dior', name: 'Dior', faName: 'دیور', cat: 'مد و پوشاک', hasImage: false, fallback: 'DIOR', url: 'https://www.dior.com/en_ae' },
  { id: 'hermes', name: 'Hermès', faName: 'هرمس', cat: 'کیف و کفش', hasImage: false, fallback: 'HERMÈS', url: 'https://www.hermes.com/ae/en/' },
  { id: 'aldo', name: 'Aldo', faName: 'آلدو', cat: 'کیف و کفش', hasImage: true, img: '/images/logo/aldo.png', url: 'https://aldoshoes.me/ae/en/' },
  { id: 'rolex', name: 'Rolex', faName: 'رولکس', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'ROLEX', url: 'https://www.rolex.com' },
  { id: 'cartier', name: 'Cartier', faName: 'کارتیر', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'Cartier', url: 'https://www.cartier.ae/en-ae' },
  { id: 'burberry', name: 'Burberry', faName: 'بربری', cat: 'مد و پوشاک', hasImage: false, fallback: 'BURBERRY', url: 'https://ae.burberry.com' },
  { id: 'fendi', name: 'Fendi', faName: 'فندی', cat: 'مد و پوشاک', hasImage: false, fallback: 'FENDI', url: 'https://www.fendi.com/ae-en/' },
  { id: 'balenciaga', name: 'Balenciaga', faName: 'بالنسیاگا', cat: 'مد و پوشاک', hasImage: false, fallback: 'BALENCIAGA', url: 'https://www.balenciaga.com/en-ae' },
  { id: 'saintlaurent', name: 'Saint Laurent', faName: 'سن لورن', cat: 'مد و پوشاک', hasImage: false, fallback: 'YSL', url: 'https://www.ysl.com/en-ae' },
  { id: 'nike', name: 'Nike', faName: 'نایک نایکی', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/NIKE.svg', url: 'https://www.nike.com/ae/' },
  { id: 'adidas', name: 'Adidas', faName: 'آدیداس ادیداس', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/adidas.png', url: 'https://www.adidas.ae' },
  { id: 'shein', name: 'Shein', faName: 'شی این', cat: 'مد و پوشاک', hasImage: true, img: '/images/logo/Shein.png', url: 'https://m.shein.com/ae' },
  { id: 'apple', name: 'Apple', faName: 'اپل', cat: 'تکنولوژی', hasImage: false, fallback: '', url: 'https://www.apple.com/ae/' },
  { id: 'samsung', name: 'Samsung', faName: 'سامسونگ', cat: 'تکنولوژی', hasImage: false, fallback: 'SAMSUNG', url: 'https://www.samsung.com/ae/' },
  { id: 'sephora', name: 'Sephora', faName: 'سفورا', cat: 'عطر و آرایشی', hasImage: false, fallback: 'SEPHORA', url: 'https://www.sephora.ae' },
  { id: 'dyson', name: 'Dyson', faName: 'دایسون', cat: 'خانه و دکوراسیون', hasImage: false, fallback: 'dyson', url: 'https://www.dyson.ae/en-AE' },
  { id: 'zara', name: 'Zara', faName: 'زارا', cat: 'مد و پوشاک', hasImage: false, fallback: 'ZARA', url: 'https://www.zara.com/ae/en/' },
  { id: 'mango', name: 'Mango', faName: 'مانگو', cat: 'مد و پوشاک', hasImage: false, fallback: 'MANGO', url: 'https://shop.mango.com/ae' },
  { id: 'hm', name: 'H&M', faName: 'اچ اند ام', cat: 'مد و پوشاک', hasImage: false, fallback: 'H&M', url: 'https://ae.hm.com/en/' }
];

function StockLaptopsContent() {
  const { settings } = useSiteSettings();
  const aedRate = Number(settings.aedRate) || 0;
  const [brands, setBrands] = useState([]);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(null);
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [laptopsLoading, setLaptopsLoading] = useState(true);
  const [laptopsError, setLaptopsError] = useState('');
  const [laptopsPage, setLaptopsPage] = useState(1);
  const [laptopsPagination, setLaptopsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [laptopsStats, setLaptopsStats] = useState({ total: 0, available: 0, reserved: 0, sold: 0, inactive: 0, soldRevenueToman: '0', soldCostAed: '0', monthly: [] });
  const [laptopFilterBrands, setLaptopFilterBrands] = useState([]);

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
  const [selectedLaptopId, setSelectedLaptopId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('specs'); // 'specs' | 'tests' | 'accessories' | 'info'
  const [laptopStatusFilter, setLaptopStatusFilter] = useState('همه');
  const [laptopRamFilter, setLaptopRamFilter] = useState('همه');
  const [laptopCpuFilter, setLaptopCpuFilter] = useState('همه');
  const [isMonthlyProfitExpanded, setIsMonthlyProfitExpanded] = useState(false);

  const emptyLaptopForm = () => ({
    brand: 'Apple', model: '', serial: '', cpu: '', ram: '8', storageSize: '', storageType: 'GB SSD',
    storage2Size: '0', storage2Type: 'none', gpu: '', screenSize: '', manufactureYear: '', color: '',
    batteryHealth: '', weight: '1.24', buyingPrice: '', extraCosts: '0', sellingPrice: '', internalNotes: '',
    customerNotes: '', hardwareTests: { keyboard: false, speaker: false, display: false, usb: false, battery: false, wifi: false, camera: false, charge: false },
    accessories: { charger: false, box: false }, physicalStatus: 'good', stockStatus: 'available', dateEntered: '',
    internalSku: '', warrantyDays: '', warrantyExpiry: '', lastService: '', nextService: ''
  });

  const resetLaptopForm = () => {
    setLaptopForm(emptyLaptopForm());
    setLaptopImages([]);
    setShowCustomModelInput(false);
    setShowCustomCpuInput(false);
    setShowCustomGpuInput(false);
    setShowCustomColorInput(false);
    setCustomModel('');
    setCustomCpu('');
    setCustomGpu('');
    setCustomColor('');
  };

  // API responses include rawSpecs; this fallback only preserves real fields if a partial response is supplied.
  const parseProductToForm = (product) => {
    if (product.rawSpecs) return { ...emptyLaptopForm(), ...product.rawSpecs };
    return {
      ...emptyLaptopForm(),
      brand: product.brand || '', model: product.model || '', serial: product.serial || '', cpu: product.cpu || '',
      ram: String(product.ram || '').replace(/\s*GB$/i, ''), gpu: product.gpu || '',
      screenSize: String(product.screen || '').replace(/[^\d.]/g, ''), weight: product.weight ? String(product.weight) : '',
      sellingPrice: product.priceToman ? String(product.priceToman) : '', customerNotes: product.description || '',
      stockStatus: product.stockStatus || 'available', internalSku: product.internalSku || '',
    };
  };


  // Custom high-parity Stock Laptop Form states
  const [laptopForm, setLaptopForm] = useState(emptyLaptopForm);

  const [laptopImages, setLaptopImages] = useState([]);



  const fetchLaptops = useCallback(async ({ page = laptopsPage, signal } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (laptopSearchQuery.trim()) params.set('search', laptopSearchQuery.trim());
    if (laptopBrandFilter !== 'همه') params.set('brand', laptopBrandFilter);
    if (laptopStatusFilter !== 'همه') params.set('status', laptopStatusFilter);
    if (laptopRamFilter !== 'همه') params.set('ram', laptopRamFilter);
    if (laptopCpuFilter !== 'همه') params.set('cpu', laptopCpuFilter);
    setLaptopsLoading(true);
    setLaptopsError('');
    try {
      const response = await fetch(`/api/admin/laptops?${params}`, { cache: 'no-store', signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.');
      setUploadedProducts(Array.isArray(payload.data) ? payload.data : []);
      setLaptopsPagination(payload.pagination || { page, limit: 20, total: 0, totalPages: 1 });
      setLaptopsStats(payload.stats || { total: 0, available: 0, reserved: 0, sold: 0, inactive: 0, soldRevenueToman: '0', soldCostAed: '0', monthly: [] });
      setLaptopFilterBrands(payload.filters?.brands || []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setLaptopsError(error.message || 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.');
        setUploadedProducts([]);
      }
    } finally {
      if (!signal?.aborted) setLaptopsLoading(false);
    }
  }, [laptopBrandFilter, laptopCpuFilter, laptopRamFilter, laptopSearchQuery, laptopStatusFilter, laptopsPage]);

  useEffect(() => {
    fetch('/api/admin/brands')
      .then(response => response.json())
      .then(data => {
        setBrands(Array.isArray(data) && data.length > 0 ? data : DEFAULT_BRANDS_SEED);
      })
      .catch(error => {
        console.error('Error fetching brands:', error);
        setBrands(DEFAULT_BRANDS_SEED);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => fetchLaptops({ signal: controller.signal }), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchLaptops]);

  const handleExportLaptopsExcel = () => {
    const list = getFilteredAdminLaptops();
    if (list.length === 0) {
      alert('هیچ لپ‌تاپی برای خروجی اکسل یافت نشد.');
      return;
    }

    const headers = [
      'شناسه محصول',
      'مدل لپ‌تاپ',
      'برند',
      'پردازنده (CPU)',
      'رم (RAM)',
      'حافظه اصلی',
      'کارت گرافیک (GPU)',
      'قیمت خرید (درهم)',
      'قیمت فروش (تومان)',
      'سود (تومان)',
      'وضعیت موجودی'
    ];
    const csvRows = [headers.join(',')];

    list.forEach(p => {
      const parsed = parseProductToForm(p);
      let priceToman = 0;
      if (p.rawSpecs && p.rawSpecs.sellingPrice) {
        priceToman = parseFloat(p.rawSpecs.sellingPrice);
      } else {
        priceToman = p.priceAed * aedRate;
      }
      const buyingVal = parseFloat(parsed.buyingPrice) || 0;
      const extraVal = parseFloat(parsed.extraCosts) || 0;
      const costDirhams = buyingVal + extraVal;
      const costToman = costDirhams * aedRate;
      const profitToman = priceToman - costToman;

      const statusValue = p.stockStatus || 'available';
      let statusText = 'موجود';
      if (statusValue === 'reserved') statusText = 'رزرو شده';
      else if (statusValue === 'sold') statusText = 'فروخته شده';
      else if (statusValue === 'unavailable') statusText = 'ناموجود';

      const row = [
        p.id,
        `${parsed.brand} ${parsed.model}`,
        parsed.brand,
        parsed.cpu,
        `${parsed.ram}GB`,
        `${parsed.storageSize}${parsed.storageType}`,
        parsed.gpu,
        buyingVal,
        Math.round(priceToman),
        Math.round(profitToman),
        statusText
      ];
      csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dubaikharid-stock-laptops-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('فایل گزارش اکسل لپ‌تاپ‌های استوک با موفقیت دانلود شد.');
  };

  const handleSaveLaptop = async () => {
    try {
      const response = await fetch(editingLaptopId ? `/api/admin/laptops/${editingLaptopId}` : '/api/admin/laptops', {
        method: editingLaptopId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...laptopForm, images: laptopImages }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ذخیره لپ‌تاپ با خطا مواجه شد.');
      alert(editingLaptopId ? 'تغییرات لپ‌تاپ با موفقیت ذخیره شد!' : 'لپ‌تاپ جدید با موفقیت ذخیره شد و به کاتالوگ فروشگاه دبی خرید افزوده گردید!');
      setLaptopViewMode('list');
      setEditingLaptopId(null);
      resetLaptopForm();
      setLaptopsPage(1);
      await fetchLaptops({ page: 1 });
    } catch (err) {
      console.error(err);
      alert(err.message || 'ذخیره لپ‌تاپ با خطا مواجه شد.');
    }
  };

  const handleDeleteLaptop = async (laptopId) => {
    if (!confirm('آیا از حذف این لپ‌تاپ مطمئن هستید؟')) return;
    try {
      const response = await fetch(`/api/admin/laptops/${laptopId}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'بایگانی لپ‌تاپ با خطا مواجه شد.');
      alert('لپ‌تاپ با موفقیت حذف گردید.');
      await fetchLaptops();
    } catch (error) {
      console.error(error);
      alert(error.message || 'بایگانی لپ‌تاپ با خطا مواجه شد.');
    }
  };

  // Triggers editing view with pre-filled state parsed from the laptop object
  const triggerEditLaptop = (laptop) => {
    const parsedForm = parseProductToForm(laptop);
    setLaptopForm(parsedForm);
    if (laptop.rawSpecs && laptop.rawSpecs.images) {
      setLaptopImages(laptop.rawSpecs.images);
    } else {
      setLaptopImages(laptop.image ? [laptop.image] : []);
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



  const getFilteredAdminLaptops = () => uploadedProducts;
  const metrics = {
    total: laptopsStats.total,
    available: laptopsStats.available,
    reserved: laptopsStats.reserved,
    sold: laptopsStats.sold,
    profit: Math.max(0, Number(laptopsStats.soldRevenueToman || 0) - Number(laptopsStats.soldCostAed || 0) * aedRate),
  };
  const activeLaptopsList = uploadedProducts;
  const selectedLaptop = activeLaptopsList.find(p => p.id === selectedLaptopId) || activeLaptopsList[0];
  const monthlyProfitRows = (laptopsStats.monthly || []).map(row => ({
    ...row,
    profit: Math.max(0, Number(row.revenueToman || 0) - Number(row.costAed || 0) * aedRate),
  }));
  const monthlyProfitPeak = Math.max(0, ...monthlyProfitRows.map(row => row.profit));
  const monthlyProfitScale = Math.max(1, monthlyProfitPeak);
  const monthlyProfitPoints = monthlyProfitRows.map((row, index) => ({
    ...row,
    x: 40 + index * 88,
    y: 130 - (row.profit / monthlyProfitScale) * 110,
  }));
  const monthlyProfitLine = monthlyProfitPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const monthlyProfitArea = monthlyProfitPoints.length ? `${monthlyProfitLine} L ${monthlyProfitPoints.at(-1).x} 130 L 40 130 Z` : '';

  // Remove thumbnail image
  const handleRemoveImage = (idx) => {
    setLaptopImages(prev => prev.filter((_, i) => i !== idx));
  };



  const buyingVal = parseFloat(laptopForm.buyingPrice) || 0;
  const extraVal = parseFloat(laptopForm.extraCosts) || 0;
  const sellingVal = parseFloat(laptopForm.sellingPrice) || 0;
  const calculatedCostToman = (buyingVal + extraVal) * aedRate;
  const calculatedProfit = sellingVal - calculatedCostToman;

  const fmtToman = (value) => Math.round(parseFloat(value)).toLocaleString('fa-IR');

  return (
      <div className={styles.laptopsModernPage}>
        {laptopViewMode === 'list' ? (
          <div className={styles.laptopsListView}>
            {/* Mockup Header Row */}
            <div className={`${styles.pageTitleSection} ${styles.laptopsPageHeader}`} style={{ marginBottom: '24px' }}>
              <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={styles.laptopsTitleIcon} style={{ fontSize: '28px', color: '#f87820' }}>{AdminIcons.laptop(28)}</span>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>لپ‌تاپ‌های استوک</h1>
                  <p style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت موجودی و فروش لپ‌تاپ‌های کارکرده</p>
                </div>
              </div>

              <div className={`${styles.titleActionBtns} ${styles.laptopsHeaderActions}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={handleExportLaptopsExcel} 
                  className={styles.laptopsExportButton}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', height: '28px' }}
                >
                  <span style={{ fontSize: '10px' }}>{AdminIcons.chart(10)}</span>
                  <span>خروجی اکسل</span>
                </button>
                <button 
                  type="button" 
                  onClick={triggerAddLaptop} 
                  className={styles.laptopsPrimaryButton}
                  style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '6px', padding: '4px 10px', fontWeight: '700', fontSize: '11px', height: '28px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer' }}
                >
                  <span>{AdminIcons.plus(10)}</span>
                  <span>افزودن لپ‌تاپ جدید</span>
                </button>
              </div>
            </div>

            {/* Mockup Metric Cards Row */}
            <div className={styles.laptopsMetricsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
              {/* Card 1: Total */}
              <div className={`${styles.cardPanel} ${styles.laptopsMetricCard}`} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #a855f7' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#a855f7' }}>{AdminIcons.laptop(18)}</div>
                <div>
                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>کل لپ‌تاپ‌ها</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.total}</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Available */}
              <div className={`${styles.cardPanel} ${styles.laptopsMetricCard}`} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #2ecc71' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2ecc71' }}>{AdminIcons.circle(18)}</div>
                <div>
                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>موجود</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.available}</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Reserved */}
              <div className={`${styles.cardPanel} ${styles.laptopsMetricCard}`} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #ff9d00' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 157, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ff9d00' }}>{AdminIcons.lock(18)}</div>
                <div>
                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>رزرو شده</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.reserved}</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Sold */}
              <div className={`${styles.cardPanel} ${styles.laptopsMetricCard}`} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#3b82f6' }}>{AdminIcons.bag(18)}</div>
                <div>
                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>فروخته شده</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.sold}</strong>
                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Total Profit */}
              <div className={`${styles.cardPanel} ${styles.laptopsMetricCard}`} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #2ecc71' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2ecc71' }}>{AdminIcons.bank(18)}</div>
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
            <div className={styles.laptopsWorkspace} style={{ display: 'grid', gridTemplateColumns: '7fr 3.2fr', gap: '20px', marginBottom: '25px', alignItems: 'start' }}>
              
              {/* LEFT COLUMN: LIST TABLE & FILTERS */}
              <div className={`${styles.cardPanel} ${styles.laptopsTableCard}`} style={{ padding: '0', overflow: 'hidden' }}>
                
                {/* Filter Area */}
                <div className={styles.laptopsFilterBar} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff', marginLeft: 'auto' }}>لیست لپ‌تاپ‌ها</span>
                  
                  {/* Search keyword */}
                  <div className={styles.laptopsSearchBox} style={{ position: 'relative', width: '180px' }}>
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#8b92a5', fontSize: '11px' }}>{AdminIcons.search(11)}</span>
                    <input 
                      type="text" 
                      placeholder="جستجو (مدل، برند، پردازنده...)" 
                      value={laptopSearchQuery}
                      onChange={(e) => { setLaptopSearchQuery(e.target.value); setLaptopsPage(1); }}
                      className={styles.searchInput}
                      style={{ width: '100%', padding: '5px 26px 5px 10px', fontSize: '11px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>

                  {/* Dropdown Brand */}
                  <select 
                    value={laptopBrandFilter} 
                    onChange={(e) => { setLaptopBrandFilter(e.target.value); setLaptopsPage(1); }}
                    className={styles.selectField}
                    style={{ width: '90px', padding: '4px 6px', fontSize: '11px' }}
                  >
                    <option value="همه">برند</option>
                    {laptopFilterBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>

                  {/* Dropdown Status */}
                  <select 
                    value={laptopStatusFilter} 
                    onChange={(e) => { setLaptopStatusFilter(e.target.value); setLaptopsPage(1); }}
                    className={styles.selectField}
                    style={{ width: '90px', padding: '4px 6px', fontSize: '11px' }}
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
                    onChange={(e) => { setLaptopRamFilter(e.target.value); setLaptopsPage(1); }}
                    className={styles.selectField}
                    style={{ width: '70px', padding: '4px 6px', fontSize: '11px' }}
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
                    onChange={(e) => { setLaptopCpuFilter(e.target.value); setLaptopsPage(1); }}
                    className={styles.selectField}
                    style={{ width: '90px', padding: '4px 6px', fontSize: '11px' }}
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
                      setLaptopsPage(1);
                    }}
                    className={styles.cancelFormBtn}
                    style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', borderRadius: '6px' }}
                  >
                    <span>{AdminIcons.sliders(12)}</span> فیلتر
                  </button>
                </div>

                {/* Main Table */}
                <div className={styles.laptopsTableScroller} style={{ overflowX: 'auto' }}>
                  <table className={styles.adminTable} style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <th style={{ padding: '12px 15px', textAlign: 'center', width: '60px' }}>تصویر</th>
                        <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>مدل</th>
                        <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>پردازنده</th>
                        <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>کارت گرافیک</th>
                        <th style={{ textAlign: 'left', fontSize: '11.5px', color: '#8b92a5' }}>قیمت فروش (تومان)</th>
                        <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5' }}>وضعیت</th>
                        <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5', width: '100px' }}>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laptopsLoading && (
                        <tr><td colSpan="7" style={{ padding: '36px 15px', textAlign: 'center', color: '#8b92a5' }}>در حال بارگذاری لپ‌تاپ‌ها...</td></tr>
                      )}
                      {!laptopsLoading && laptopsError && (
                        <tr><td colSpan="7" style={{ padding: '36px 15px', textAlign: 'center', color: '#ff6b6b' }}>{laptopsError}</td></tr>
                      )}
                      {!laptopsLoading && !laptopsError && activeLaptopsList.length === 0 && (
                        <tr><td colSpan="7" style={{ padding: '36px 15px', textAlign: 'center', color: '#8b92a5' }}>هیچ لپ‌تاپی پیدا نشد.</td></tr>
                      )}
                      {!laptopsLoading && !laptopsError && activeLaptopsList.map((laptop) => {
                        const parsedSpecs = parseProductToForm(laptop);
                        const isSelected = selectedLaptop && selectedLaptop.id === laptop.id;
                        
                        let priceToman = 0;
                        if (laptop.rawSpecs && laptop.rawSpecs.sellingPrice) {
                          priceToman = parseFloat(laptop.rawSpecs.sellingPrice);
                        } else {
                          priceToman = laptop.priceAed * aedRate;
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
                            <td style={{ padding: '18px 15px', textAlign: 'center' }}>
                              {laptop.image ? <img 
                                src={laptop.image} alt={laptop.name}
                                style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                              /> : <span style={{ width: '40px', height: '40px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', color: '#8b92a5' }}>{AdminIcons.laptop(18)}</span>}
                            </td>
                            <td style={{ padding: '18px 10px', fontSize: '12px' }}>
                              <div style={{ fontWeight: '700', color: '#fff' }}>{parsedSpecs.brand} {parsedSpecs.model}</div>
                              <div style={{ fontSize: '10.5px', fontWeight: '300', color: '#8b92a5', marginTop: '4px' }}>
                                رم: {parsedSpecs.ram}GB | حافظه: {parsedSpecs.storageSize}{parsedSpecs.storageType}
                              </div>
                            </td>
                            <td style={{ padding: '18px 10px', fontSize: '11.5px', color: '#c4c8d4' }}>{parsedSpecs.cpu}</td>
                            <td style={{ padding: '18px 10px', fontSize: '11.5px', color: '#8b92a5' }}>{parsedSpecs.gpu}</td>
                            <td style={{ padding: '18px 10px', fontWeight: '700', color: '#fff', fontSize: '12.5px', textAlign: 'left', fontFamily: 'var(--font-vazirmatn)' }}>
                              {Math.round(priceToman).toLocaleString('fa-IR')}
                            </td>
                            <td style={{ padding: '18px 10px', textAlign: 'center' }}>
                              <span 
                                className={styles.statusTag}
                                style={{ ...badgeStyle, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}
                              >
                                {badgeText}
                              </span>
                            </td>
                            <td style={{ padding: '18px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => setSelectedLaptopId(laptop.id)}
                                  className={styles.laptopIconButton}
                                  style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '13px' }}
                                  title="مشاهده جزئیات"
                                >
                                  {AdminIcons.eye(13)}
                                </button>
                                <button 
                                  onClick={() => triggerEditLaptop(laptop)}
                                  className={styles.laptopIconButton}
                                  style={{ background: 'transparent', border: 'none', color: '#f87820', cursor: 'pointer', fontSize: '13px' }}
                                  title="ویرایش"
                                >
                                  {AdminIcons.edit(13)}
                                </button>
                                <button 
                                  onClick={() => handleDeleteLaptop(laptop.id)}
                                  className={styles.laptopIconButton}
                                  style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '13px' }}
                                  title="حذف"
                                >
                                  {AdminIcons.trash(13)}
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
                <div className={styles.laptopsPagination} style={{ padding: '15px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8b92a5' }}>
                    <span>نمایش {laptopsPagination.total === 0 ? 0 : ((laptopsPagination.page - 1) * laptopsPagination.limit) + 1} تا {Math.min(laptopsPagination.page * laptopsPagination.limit, laptopsPagination.total)} از {laptopsPagination.total} نتیجه</span>
                  </div>

                  {/* Page Numbers */}
                  <div style={{ display: 'flex', gap: '6px', direction: 'ltr' }}>
                    <button disabled={laptopsPage <= 1 || laptopsLoading} onClick={() => setLaptopsPage(page => Math.max(1, page - 1))} style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: laptopsPage <= 1 ? 'not-allowed' : 'pointer', opacity: laptopsPage <= 1 ? 0.4 : 1 }}>&lt;</button>
                    <button style={{ border: 'none', background: '#f87820', minWidth: '26px', height: '26px', padding: '0 7px', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>{laptopsPagination.page}</button>
                    <button disabled={laptopsPage >= laptopsPagination.totalPages || laptopsLoading} onClick={() => setLaptopsPage(page => Math.min(laptopsPagination.totalPages, page + 1))} style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: laptopsPage >= laptopsPagination.totalPages ? 'not-allowed' : 'pointer', opacity: laptopsPage >= laptopsPagination.totalPages ? 0.4 : 1 }}>&gt;</button>
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
                  priceToman = selectedLaptop.priceAed * aedRate;
                }

                const buyingVal = parseFloat(parsed.buyingPrice) || 0;
                const extraVal = parseFloat(parsed.extraCosts) || 0;
                const costDirhams = buyingVal + extraVal;
                const costToman = costDirhams * aedRate;
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
                const imagesToUse = (selectedLaptop.rawSpecs && selectedLaptop.rawSpecs.images?.length) 
                  ? selectedLaptop.rawSpecs.images 
                  : (selectedLaptop.image ? [selectedLaptop.image] : []);

                return (
                  <div className={`${styles.cardPanel} ${styles.laptopsDetailsCard}`} style={{ padding: '20px', position: 'sticky', top: '80px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
                    {/* Details Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>جزئیات لپ‌تاپ</span>
                      <button 
                        onClick={() => setSelectedLaptopId(null)}
                        className={styles.laptopIconButton}
                        aria-label="بستن جزئیات لپ‌تاپ"
                        style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}
                      >
                        {AdminIcons.close(14)}
                      </button>
                    </div>

                    {/* Gallery Split Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '4fr 1.2fr', gap: '10px', marginBottom: '15px' }}>
                      {/* Main Active Picture */}
                      <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {imagesToUse[0] ? <img src={imagesToUse[0]} alt="Laptop main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#8b92a5' }}>{AdminIcons.laptop(30)}</span>}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '750', color: '#fff' }}>{parsed.brand} {parsed.model}</span>
                      <span style={{ ...badgeStyle, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>{badgeText}</span>
                    </div>

                    {/* Financial Specs Box */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '15px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9.5px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>قیمت خرید</span>
                        <strong style={{ fontSize: '11px', color: '#fff', fontFamily: 'var(--font-vazirmatn)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {Math.round(costToman).toLocaleString('fa-IR')}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '9.5px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>قیمت فروش</span>
                        <strong style={{ fontSize: '11px', color: 'var(--admin-orange)', fontFamily: 'var(--font-vazirmatn)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {Math.round(priceToman).toLocaleString('fa-IR')}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9.5px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>سود معامله</span>
                        <strong style={{ fontSize: '11px', color: '#2ecc71', fontFamily: 'var(--font-vazirmatn)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {Math.round(profitToman).toLocaleString('fa-IR')}
                        </strong>
                      </div>
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
                    <div style={{ minHeight: '230px', maxHeight: '300px', overflowY: 'auto', paddingRight: '6px', paddingLeft: '14px', fontSize: '12px' }} dir="rtl">
                      
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
                                <span style={{ color: passed ? '#2ecc71' : '#ff4d4d', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{passed ? <>{AdminIcons.check(12)} تایید شده</> : <>{AdminIcons.close(12)} خطا</>}</span>
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
                                {parsed.accessories?.charger ? '{AdminIcons.check(11)} شارژر اصلی دبی' : '{AdminIcons.close(11)} فاقد شارژر اصلی'}
                              </span>
                              <span style={{ color: parsed.accessories?.box ? '#2ecc71' : '#8b92a5' }}>
                                {parsed.accessories?.box ? '{AdminIcons.check(11)} کارتن اورجینال' : '{AdminIcons.close(11)} فاقد کارتن'}
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
                        {AdminIcons.printer(12)} چاپ برچسب
                      </button>
                      <button 
                        onClick={() => triggerEditLaptop(selectedLaptop)}
                        className={styles.saveFormBtn}
                        style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', borderRadius: '8px', color: '#fff', justifyContent: 'center', fontWeight: 'bold' }}
                      >
                        {AdminIcons.edit(13)} ویرایش
                      </button>
                      <button 
                        onClick={() => handleDeleteLaptop(selectedLaptop.id)}
                        className={styles.cancelFormBtn}
                        style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px', color: '#ff4d4d', justifyContent: 'center', background: 'rgba(255, 77, 77, 0.05)' }}
                      >
                        {AdminIcons.trash(13)} حذف
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

            {/* Collapsible Monthly Profit Line Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              
              {/* LEFT CHART: MONTHLY PROFIT LINE CHART */}
              <div 
                className={`${styles.cardPanel} ${styles.laptopsProfitCard}`} 
                onClick={() => setIsMonthlyProfitExpanded(!isMonthlyProfitExpanded)}
                style={{ 
                  padding: '20px', 
                  cursor: 'pointer', 
                  height: isMonthlyProfitExpanded ? '270px' : '65px', 
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', minHeight: '25px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {AdminIcons.trendingUp(14)} سود ماهانه لپ‌تاپ‌های استوک
                    {!isMonthlyProfitExpanded && (
                      <span style={{ fontSize: '11px', color: '#2ecc71', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)', marginRight: '10px' }}>
                        (کل سود انبار: {Math.round(metrics.profit).toLocaleString('fa-IR')} تومان)
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{isMonthlyProfitExpanded ? AdminIcons.chevronUp(12) : AdminIcons.chevronDown(12)}</span>
                    <span style={{ fontSize: '9px', color: '#8b92a5' }}>۶ ماه اخیر</span>
                  </span>
                </div>
                
                <div style={{ 
                  opacity: isMonthlyProfitExpanded ? 1 : 0, 
                  transition: 'opacity 0.3s ease',
                  pointerEvents: isMonthlyProfitExpanded ? 'auto' : 'none',
                  position: 'relative', 
                  height: '180px', 
                  width: '100%', 
                  direction: 'ltr',
                  marginTop: '5px'
                }} onClick={(e) => e.stopPropagation()}>
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

                    <text x="6" y="14" fill="#8b92a5" fontSize="8" textAnchor="start">{Math.round(monthlyProfitPeak).toLocaleString('fa-IR')}</text>
                    <text x="10" y="134" fill="#8b92a5" fontSize="8" textAnchor="start">۰</text>

                    <path 
                      d={monthlyProfitArea}
                      fill="url(#areaGrad)" 
                    />

                    <path 
                      d={monthlyProfitLine}
                      fill="none" 
                      stroke="#f87820" 
                      strokeWidth="3.5" 
                      filter="url(#glow)" 
                      strokeLinecap="round"
                    />

                    {monthlyProfitPoints.map(point => (
                      <React.Fragment key={point.key}>
                        <circle cx={point.x} cy={point.y} r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                        <text x={point.x} y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">{point.label}</text>
                      </React.Fragment>
                    ))}
                  </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
          <div className={styles.laptopsFormView}>
            <div className={`${styles.pageTitleSection} ${styles.laptopsPageHeader}`}>
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
                  <span>{AdminIcons.close(12)}</span> انصراف
                </button>
                <button type="button" onClick={handleSaveLaptop} className={styles.saveFormBtn}>
                  <span>{AdminIcons.check(12)}</span> {editingLaptopId ? 'بروزرسانی لپ‌تاپ' : 'ذخیره لپ‌تاپ'}
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
                <span className={styles.cardHeaderIcon}>{AdminIcons.user(16)}</span>
                <h2>اطلاعات اصلی</h2>
              </div>

              <div className={styles.formFieldsGrid4}>
                <div className={styles.formGroup} style={{ position: 'relative' }}>
                  <label>برند <span className={styles.requiredStar}>*</span></label>
                  <input
                    type="text"
                    required
                    value={laptopForm.brand}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLaptopForm(prev => ({ ...prev, brand: val }));
                      setBrandDropdownOpen('laptopForm');
                    }}
                    onFocus={() => setBrandDropdownOpen('laptopForm')}
                    onBlur={() => setTimeout(() => setBrandDropdownOpen(null), 200)}
                    className={styles.inputField}
                  />
                  {brandDropdownOpen === 'laptopForm' && (() => {
                    const searchVal = laptopForm.brand || '';
                    const filtered = brands.filter(b => 
                      !searchVal || 
                      b?.name?.toLowerCase().includes(searchVal.toLowerCase()) || 
                      b?.faName?.toLowerCase().includes(searchVal.toLowerCase())
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#141622',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        marginTop: '4px'
                      }}>
                        {filtered.map((b, idx) => (
                          <div
                            key={`${b.id || idx}-${idx}`}
                            onMouseDown={() => {
                              handleBrandChange(b.name);
                              setBrandDropdownOpen(null);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              fontSize: '12px',
                              color: '#fff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              background: 'rgba(255,255,255,0.01)'
                            }}
                          >
                            <span style={{ fontWeight: 'bold' }}>{b.name}</span>
                            <span style={{ color: '#8b92a5', fontSize: '11px' }}>{b.faName || ''}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
                <span className={styles.cardHeaderIcon}>{AdminIcons.camera(16)}</span>
                <h2>تصاویر محصول</h2>
              </div>

              <div className={styles.uploaderBoxGrid}>
                <div className={styles.dragDropArea}>
                  <span className={styles.uploadIcon}>{AdminIcons.cloud(16)}</span>
                  <p>
                    برای آپلود تصویر کلیک کنید<br/>
                    <span style={{ fontSize: '8.5px', color: '#555' }}>یا فایل‌ها را اینجا بکشید و رها کنید<br/>فرمت‌های مجاز: JPG, PNG, WebP | حداکثر 10MB</span>
                  </p>
                </div>

                {/* Render Laptop mock image thumbnails with delete controls */}
                {laptopImages.map((imgUrl, idx) => (
                  <div key={idx} className={styles.imageThumbCard}>
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                    <button type="button" onClick={() => handleRemoveImage(idx)} className={styles.removeThumbBtn} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {AdminIcons.close(10)}
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
                <span className={styles.cardHeaderIcon}>{AdminIcons.edit(13)}</span>
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
                <span className={styles.cardHeaderIcon}>{AdminIcons.settings(16)}</span>
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
                <span className={styles.cardHeaderIcon}>{AdminIcons.package(16)}</span>
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

  );
}

export default function AdminLaptopsPage() {
  return (
    <AdminShell activeTab="stock_laptops">
      <StockLaptopsContent />
    </AdminShell>
  );
}
