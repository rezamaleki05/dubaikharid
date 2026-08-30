'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminBrandSelector from '@/components/admin/AdminBrandSelector';
import AdminWarehouseGalleryField from '@/components/admin/AdminWarehouseGalleryField';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

const WAREHOUSE_CATEGORY_QUERY_MAP = Object.freeze({
  electronics: 'tech', clothing: 'fashion', pants: 'fashion', shoes: 'shoes', bags: 'shoes',
  accessories: 'accessories', watches_glasses: 'accessories', wallets_belts: 'shoes', trending: 'fashion',
});

const findWarehouseCategoryId = (categories, categoryKey) => {
  const query = WAREHOUSE_CATEGORY_QUERY_MAP[categoryKey] || categoryKey;
  return categories.find(category => category.query === query || category.id === categoryKey)?.id || '';
};

const getCategorySelectValue = (category, gender) => {
  if (gender === 'men') {
    if (category === 'clothing') return 'men_clothing';
    if (category === 'pants') return 'men_pants';
    if (category === 'shoes') return 'men_shoes';
    if (category === 'accessories') return 'men_accessories';
  }
  if (gender === 'women') {
    if (category === 'clothing') return 'women_clothing';
    if (category === 'pants') return 'women_pants';
    if (category === 'shoes') return 'women_shoes';
    if (category === 'accessories') return 'women_accessories';
  }
  if (gender === 'kids') {
    if (category === 'clothing') return 'kids_clothing';
    if (category === 'pants') return 'kids_pants';
    if (category === 'shoes') return 'kids_shoes';
  }
  if (category === 'electronics') return 'electronics';
  if (category === 'bags') return 'bags';
  if (category === 'watches_glasses') return 'watches_glasses';
  if (category === 'wallets_belts') return 'wallets_belts';
  return '';
};

const parseCategorySelectValue = (value) => {
  switch (value) {
    case 'electronics': return { category: 'electronics', gender: '' };
    case 'men_clothing': return { category: 'clothing', gender: 'men' };
    case 'men_pants': return { category: 'pants', gender: 'men' };
    case 'men_shoes': return { category: 'shoes', gender: 'men' };
    case 'men_accessories': return { category: 'accessories', gender: 'men' };
    case 'women_clothing': return { category: 'clothing', gender: 'women' };
    case 'women_pants': return { category: 'pants', gender: 'women' };
    case 'women_shoes': return { category: 'shoes', gender: 'women' };
    case 'women_accessories': return { category: 'accessories', gender: 'women' };
    case 'kids_clothing': return { category: 'clothing', gender: 'kids' };
    case 'kids_pants': return { category: 'pants', gender: 'kids' };
    case 'kids_shoes': return { category: 'shoes', gender: 'kids' };
    case 'bags': return { category: 'bags', gender: '' };
    case 'watches_glasses': return { category: 'watches_glasses', gender: '' };
    case 'wallets_belts': return { category: 'wallets_belts', gender: '' };
    default: return { category: '', gender: '' };
  }
};

const getWarehouseReportDate = () => new Date().toLocaleDateString('fa-IR');

const getWarehouseReportTime = () => new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

const formatWarehouseDateTime = value => {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ثبت نشده';
  return `${date.toLocaleDateString('fa-IR')} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
};

const movementAction = movement => {
  if (movement.type === 'INITIAL_STOCK') return 'ایجاد کالا';
  if (movement.type === 'STOCK_IN' || movement.quantityChange > 0) return 'افزایش موجودی';
  if (movement.type === 'STOCK_OUT' || movement.quantityChange < 0) return 'کاهش موجودی';
  if (movement.type === 'RESERVATION_ADJUSTMENT') return 'اصلاح رزرو';
  return 'اصلاح موجودی';
};

const mapMovementFromApi = movement => ({
  ...movement,
  action: movementAction(movement),
  qty: movement.quantityChange > 0 ? `+${movement.quantityChange}` : String(movement.quantityChange),
  date: formatWarehouseDateTime(movement.createdAt),
  user: movement.admin?.email || 'مدیر سایت',
});

const mapWarehouseFromApi = item => ({
  ...item,
  brand: item.brand?.name || '',
  category: item.categoryKey || item.category?.query || item.category?.name || '',
  lastUpdated: formatWarehouseDateTime(item.updatedAt),
  history: Array.isArray(item.movements) ? item.movements.map(mapMovementFromApi) : [],
  notes: Array.isArray(item.notes) ? item.notes.map(note => ({
    ...note,
    date: formatWarehouseDateTime(note.createdAt),
    user: note.admin?.email || 'مدیر سایت',
  })) : [],
});

async function readWarehouseApi(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'عملیات انبار با خطا مواجه شد.');
  return payload;
}

export default function AdminWarehousePage() {
  const { can } = useAdminAccess();
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [selectedWarehouseProductId, setSelectedWarehouseProductId] = useState('');
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [brands, setBrands] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState('همه');
  const [warehouseBrandFilter, setWarehouseBrandFilter] = useState('همه');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState('همه');
  const [warehouseFilterMode, setWarehouseFilterMode] = useState('all'); // all, lowstock, outofstock, reserved, overreserved
  
  // Modals state
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);
  const [editWarehouseForm, setEditWarehouseForm] = useState({
    id: '', name: '', publicNameEn: '', description: '', slug: '', isPublished: false, brandId: '', categoryId: '', category: '', gender: '', sku: '', price: '', stock: '', reserved: '', location: '', minStock: '', image: '', images: [], isBestSeller: false, hasDiscount: false, discountPercent: 0
  });
  
  const [warehouseAdjustStockOpen, setWarehouseAdjustStockOpen] = useState(false);
  const [warehouseAdjustStockType, setWarehouseAdjustStockType] = useState('increase'); // increase, decrease
  const [warehouseAdjustStockQty, setWarehouseAdjustStockQty] = useState('');
  const [warehouseAdjustStockReason, setWarehouseAdjustStockReason] = useState('');
  
  const [warehouseAddNoteOpen, setWarehouseAddNoteOpen] = useState(false);
  const [warehouseAddNoteText, setWarehouseAddNoteText] = useState('');
  const [warehouseReportOpen, setWarehouseReportOpen] = useState(false);
  const [activeWarehouseMenuId, setActiveWarehouseMenuId] = useState(null);
  const [addWarehouseForm, setAddWarehouseForm] = useState({
    name: '', publicNameEn: '', description: '', slug: '', isPublished: false, brandId: '', categoryId: '', category: '', gender: '', sku: '', price: '', stock: '0', reserved: '0', location: '', minStock: '5', image: '', images: [], isBestSeller: false, hasDiscount: false, discountPercent: 0
  });
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseLimit, setWarehouseLimit] = useState(10);
  const [warehousePagination, setWarehousePagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [warehouseStats, setWarehouseStats] = useState({ totalValue: 0, totalSellable: 0, totalReserved: 0, lowStockCount: 0, outOfStockCount: 0, overReservedCount: 0 });
  const [warehouseFilterOptions, setWarehouseFilterOptions] = useState({ brands: [], categories: [] });
  const [warehouseRecentHistory, setWarehouseRecentHistory] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [warehouseError, setWarehouseError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/brands', { cache: 'no-store' }).then(readWarehouseApi),
      fetch('/api/admin/categories', { cache: 'no-store' }).then(readWarehouseApi),
    ])
      .then(([brandData, categoryData]) => {
        setBrands(Array.isArray(brandData) ? brandData : []);
        const loadedCategories = Array.isArray(categoryData) ? categoryData : [];
        setCatalogCategories(loadedCategories);
      })
      .catch(error => {
        console.error('Error fetching warehouse brand/category options:', error);
        setBrands([]);
        setCatalogCategories([]);
      });
  }, []);

  const loadWarehouse = useCallback(async () => {
    setWarehouseLoading(true);
    setWarehouseError('');
    const params = new URLSearchParams({ page: String(warehousePage), limit: String(warehouseLimit), mode: warehouseFilterMode });
    if (warehouseSearchQuery.trim()) params.set('search', warehouseSearchQuery.trim());
    if (warehouseCategoryFilter !== 'همه') params.set('category', warehouseCategoryFilter);
    if (warehouseBrandFilter !== 'همه') params.set('brand', warehouseBrandFilter);
    if (warehouseStatusFilter !== 'همه') params.set('status', warehouseStatusFilter);
    try {
      const payload = await readWarehouseApi(await fetch(`/api/admin/warehouse?${params}`, { cache: 'no-store' }));
      const items = Array.isArray(payload.data) ? payload.data.map(mapWarehouseFromApi) : [];
      setWarehouseProducts(items);
      setWarehousePagination(payload.pagination || { page: 1, limit: warehouseLimit, total: 0, totalPages: 1 });
      setWarehouseStats(payload.stats || {});
      setWarehouseFilterOptions(payload.filters || { brands: [], categories: [] });
      setWarehouseRecentHistory(Array.isArray(payload.recentHistory) ? payload.recentHistory.map(mapMovementFromApi) : []);
      setSelectedWarehouseProductId(previous => (
        items.some(item => String(item.id) === String(previous)) ? previous : String(items[0]?.id || '')
      ));
    } catch (error) {
      setWarehouseError(error.message || 'دریافت اطلاعات انبار با خطا مواجه شد.');
      setWarehouseProducts([]);
    } finally {
      setWarehouseLoading(false);
    }
  }, [warehouseBrandFilter, warehouseCategoryFilter, warehouseFilterMode, warehouseLimit, warehousePage, warehouseSearchQuery, warehouseStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadWarehouse, 250);
    return () => clearTimeout(timer);
  }, [loadWarehouse]);

  const safeWarehouseProducts = Array.isArray(warehouseProducts) ? warehouseProducts : [];
  const safeBrands = Array.isArray(brands) ? brands : [];
  const activeProds = safeWarehouseProducts;

  const totalValue = Number(warehouseStats.totalValue) || 0;
  const totalSellable = Number(warehouseStats.totalSellable) || 0;
  const lowStockCount = Number(warehouseStats.lowStockCount) || 0;
  const totalReserved = Number(warehouseStats.totalReserved) || 0;
  const outOfStockCount = Number(warehouseStats.outOfStockCount) || 0;
  const overReservedCount = Number(warehouseStats.overReservedCount) || 0;

  const categories = ['همه', ...(warehouseFilterOptions.categories || [])];
  const warehouseFilterBrands = ['همه', ...(warehouseFilterOptions.brands || [])];

  const filteredProds = activeProds;
  const totalItemsCount = Number(warehousePagination.total) || 0;
  const totalPages = Number(warehousePagination.totalPages) || 1;
  const currentPage = Number(warehousePagination.page) || 1;
  const startIndex = totalItemsCount === 0 ? 0 : (currentPage - 1) * warehouseLimit;
  const endIndex = startIndex + warehouseProducts.length;
  const paginatedProds = activeProds;

  // Selected product
  const selectedProduct = safeWarehouseProducts.find(product => (
    String(product?.id ?? '') === String(selectedWarehouseProductId ?? '')
  )) || filteredProds[0] || null;

  // Stock adjustment handler
  const handleAdjustStockLocal = async (productId, type, qty, reason) => {
    if (!can(ADMIN_PERMISSIONS.WAREHOUSE_EDIT)) return;
    const amount = Number.parseInt(qty, 10);
    if (Number.isNaN(amount) || amount <= 0) return alert('مقدار نامعتبر است.');
    try {
      await readWarehouseApi(await fetch(`/api/admin/warehouse/${encodeURIComponent(productId)}/adjust`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity: amount, reason: String(reason ?? '').trim() }),
      }));
      setWarehouseAdjustStockOpen(false);
      setWarehouseAdjustStockQty('');
      setWarehouseAdjustStockReason('');
      await loadWarehouse();
      alert('موجودی با موفقیت بروزرسانی شد.');
    } catch (error) { alert(error.message); }
  };

  // Add note handler
  const handleAddNoteLocal = async (productId, text) => {
    if (!can(ADMIN_PERMISSIONS.WAREHOUSE_EDIT)) return;
    const noteText = String(text ?? '').trim();
    if (!noteText) return alert('متن یادداشت نمی‌تواند خالی باشد.');
    try {
      await readWarehouseApi(await fetch(`/api/admin/warehouse/${encodeURIComponent(productId)}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: noteText }),
      }));
      setWarehouseAddNoteOpen(false);
      setWarehouseAddNoteText('');
      await loadWarehouse();
      alert('یادداشت با موفقیت ثبت شد.');
    } catch (error) { alert(error.message); }
  };

  // Archive handler
  const handleArchiveProductLocal = async productId => {
    if (!can(ADMIN_PERMISSIONS.WAREHOUSE_EDIT)) return;
    if (!confirm('آیا از آرشیو کردن این کالا اطمینان دارید؟ (کالا از لیست فعال حذف خواهد شد)')) return;
    try {
      await readWarehouseApi(await fetch(`/api/admin/warehouse/${encodeURIComponent(productId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true }),
      }));
      setSelectedWarehouseProductId('');
      await loadWarehouse();
      alert('کالا آرشیو شد.');
    } catch (error) { alert(error.message); }
  };

  // Manual product submissions
  const handleAddWarehouseProductSubmit = async event => {
    event.preventDefault();
    if (!can(ADMIN_PERMISSIONS.WAREHOUSE_EDIT)) return;
    const name = String(addWarehouseForm?.name ?? '').trim();
    const price = String(addWarehouseForm?.price ?? '').trim();
    if (!name || !price) return alert('لطفاً فیلدهای ضروری را پر کنید.');

    try {
      const warehousePayload = { ...addWarehouseForm };
      warehousePayload.image = warehousePayload.images.find(image => image.isPrimary)?.url || warehousePayload.images[0]?.url || null;
      delete warehousePayload.categoryId;
      const created = await readWarehouseApi(await fetch('/api/admin/warehouse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(warehousePayload),
      }));
      setSelectedWarehouseProductId(created.id);
      setIsAddWarehouseOpen(false);
      setAddWarehouseForm({
        name: '', publicNameEn: '', description: '', slug: '', isPublished: false, brandId: '', categoryId: '', category: '', gender: '', sku: '', price: '', stock: '0', reserved: '0', location: '', minStock: '5', image: '', images: [], isBestSeller: false, hasDiscount: false, discountPercent: 0
      });
      setWarehousePage(1);
      await loadWarehouse();
      alert('کالا با موفقیت اضافه شد.');
    } catch (error) { alert(error.message); }
  };

  const handleEditWarehouseProductSubmit = async event => {
    event.preventDefault();
    if (!can(ADMIN_PERMISSIONS.WAREHOUSE_EDIT)) return;
    const name = String(editWarehouseForm?.name ?? '').trim();
    const price = String(editWarehouseForm?.price ?? '').trim();
    if (!name || !price) return alert('لطفاً فیلدهای ضروری را پر کنید.');

    try {
      await readWarehouseApi(await fetch(`/api/admin/warehouse/${encodeURIComponent(editWarehouseForm.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          name, brandId: editWarehouseForm?.brandId || null, category: String(editWarehouseForm?.category ?? ''), gender: String(editWarehouseForm?.gender ?? ''),
          sku: String(editWarehouseForm?.sku ?? ''), price, stock: Number(editWarehouseForm?.stock),
          reserved: Number(editWarehouseForm?.reserved), location: String(editWarehouseForm?.location ?? ''),
          minStock: Number(editWarehouseForm?.minStock),
          image: editWarehouseForm.images?.find(image => image.isPrimary)?.url || editWarehouseForm.images?.[0]?.url || null,
          images: (editWarehouseForm.images || []).map(image => ({ url: image.url, isPrimary: Boolean(image.isPrimary) })),
          publicNameEn: String(editWarehouseForm?.publicNameEn ?? '') || null,
          description: String(editWarehouseForm?.description ?? '') || null,
          slug: String(editWarehouseForm?.slug ?? '') || null,
          isPublished: Boolean(editWarehouseForm?.isPublished),
          isBestSeller: Boolean(editWarehouseForm?.isBestSeller), hasDiscount: Boolean(editWarehouseForm?.hasDiscount),
          discountPercent: Number(editWarehouseForm?.discountPercent) || 0,
        }),
      }));
      setIsEditWarehouseOpen(false);
      await loadWarehouse();
      alert('تغییرات کالا با موفقیت ذخیره شد.');
    } catch (error) { alert(error.message); }
  };

  // Helper for combining history log for reports
  const combinedHistory = warehouseRecentHistory;
  return (
    <AdminShell activeTab="warehouse">
      <div style={{ direction: 'rtl', textAlign: 'right' }}>
          
          {/* HEADER SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '950', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📦 مدیریت انبار ایران
              </h1>
              <p style={{ fontSize: '12.5px', color: '#8b92a5' }}>
                مدیریت و مانیتورینگ فیزیکی موجودی کالاها، مقادیر رزرو شده و تاریخچه تغییرات انبار ایران
              </p>
            </div>
            <button
              onClick={() => setIsAddWarehouseOpen(true)}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(248, 120, 32, 0.2)'
              }}
            >
              ➕ افزودن کالا
            </button>
          </div>

          {/* STATS GRID (Clickable Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            
            {/* Card 1: ارزش کل انبار */}
            <div
              onClick={() => {
                setWarehouseFilterMode('all');
                setWarehouseStatusFilter('همه');
              }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: warehouseFilterMode === 'all' ? '1px solid #f87820' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>ارزش کل انبار</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{totalValue.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: '#f87820', marginTop: '2px' }}>تومان</div>
              </div>
              <div style={{ background: 'rgba(248,120,32,0.08)', borderRadius: '8px', padding: '10px', color: '#f87820' }}>
                {AdminIcons.dollar(20)}
              </div>
            </div>

            {/* Card 2: موجودی قابل فروش */}
            <div
              onClick={() => setWarehouseFilterMode('sellable')}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: warehouseFilterMode === 'sellable' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>موجودی قابل فروش</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>{totalSellable.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>عدد</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '10px', color: '#10b981' }}>
                {AdminIcons.laptop(20)}
              </div>
            </div>

            {/* Card 3: کالاهای کم موجود */}
            <div
              onClick={() => setWarehouseFilterMode('lowstock')}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: warehouseFilterMode === 'lowstock' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>کم موجود</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b' }}>{lowStockCount.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>کالا</div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '8px', padding: '10px', color: '#f59e0b' }}>
                {AdminIcons.sliders(20)}
              </div>
            </div>

            {/* Card 4: کالاهای رزرو شده */}
            <div
              onClick={() => setWarehouseFilterMode('reserved')}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: warehouseFilterMode === 'reserved' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>رزرو شده</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{totalReserved.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>عدد</div>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: '8px', padding: '10px', color: '#3b82f6' }}>
                {AdminIcons.lock(20)}
              </div>
            </div>

          </div>

          {/* WARNINGS BAR */}
          <div style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '12px'
          }}>
            <div style={{ color: '#8b92a5', fontWeight: '700', marginLeft: '12px' }}>وضعیت هشدارها:</div>
            
            {lowStockCount > 0 && (
              <div
                onClick={() => setWarehouseFilterMode('lowstock')}
                style={{ color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ⚠️ {lowStockCount} کالا کم موجود
              </div>
            )}

            {outOfStockCount > 0 && (
              <div
                onClick={() => setWarehouseFilterMode('outofstock')}
                style={{ color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '12px' }}
              >
                ⚠️ {outOfStockCount} کالا ناموجود
              </div>
            )}

            {overReservedCount > 0 && (
              <div
                onClick={() => setWarehouseFilterMode('overreserved')}
                style={{ color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '12px' }}
              >
                ⚠️ {overReservedCount} کالا رزرو شده بیشتر از موجودی
              </div>
            )}

            {lowStockCount === 0 && outOfStockCount === 0 && overReservedCount === 0 && (
              <div style={{ color: '#10b981' }}>🟢 تمام کالاهای انبار در وضعیت نرمال و مطلوب قرار دارند.</div>
            )}
          </div>

          {/* QUICK OPERATIONS BAR & FILTERS BAR combined */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '12px 12px 0 0',
            padding: '16px',
            gap: '12px',
            alignItems: 'center',
            borderBottom: 'none'
          }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، SKU یا برند..."
                  value={warehouseSearchQuery ?? ''}
                  onChange={e => {
                    setWarehouseSearchQuery(e.target.value);
                    setWarehousePage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <span style={{ position: 'absolute', right: '10px', top: '10px', color: '#8b92a5' }}>
                  {AdminIcons.search(14)}
                </span>
              </div>

              <select
                value={warehouseCategoryFilter ?? ''}
                onChange={e => {
                  setWarehouseCategoryFilter(e.target.value);
                  setWarehousePage(1);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="همه" style={{ background: '#0c0d12' }}>دسته‌بندی: همه</option>
                {categories.filter(c => c !== 'همه').map(cat => (
                  <option key={cat} value={cat} style={{ background: '#0c0d12' }}>{cat}</option>
                ))}
              </select>

              <select
                value={warehouseBrandFilter ?? ''}
                onChange={e => {
                  setWarehouseBrandFilter(e.target.value);
                  setWarehousePage(1);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="همه" style={{ background: '#0c0d12' }}>برند: همه</option>
                {warehouseFilterBrands.filter(b => b !== 'همه').map(br => (
                  <option key={br} value={br} style={{ background: '#0c0d12' }}>{br}</option>
                ))}
              </select>

              <select
                value={warehouseStatusFilter ?? ''}
                onChange={e => {
                  setWarehouseStatusFilter(e.target.value);
                  setWarehousePage(1);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="همه" style={{ background: '#0c0d12' }}>وضعیت: همه</option>
                <option value="موجود" style={{ background: '#0c0d12' }}>موجود (سبز)</option>
                <option value="کم موجود" style={{ background: '#0c0d12' }}>کم موجود (نارنجی)</option>
                <option value="ناموجود" style={{ background: '#0c0d12' }}>ناموجود (قرمز)</option>
              </select>

              {warehouseFilterMode !== 'all' && (
                <button
                  onClick={() => setWarehouseFilterMode('all')}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(248,120,32,0.1)',
                    border: '1px solid rgba(248,120,32,0.2)',
                    borderRadius: '8px',
                    color: '#f87820',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  پاک کردن فیلتر کارت‌ها
                </button>
              )}
            </div>

            {/* Quick Operations buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (!selectedProduct) return alert('لطفاً ابتدا کالایی را از جدول انتخاب کنید.');
                  setWarehouseAdjustStockType('increase');
                  setWarehouseAdjustStockOpen(true);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📦 افزایش موجودی
              </button>
              <button
                onClick={() => {
                  if (!selectedProduct) return alert('لطفاً ابتدا کالایی را از جدول انتخاب کنید.');
                  setWarehouseAdjustStockType('decrease');
                  setWarehouseAdjustStockOpen(true);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📤 کاهش موجودی
              </button>
              <button
                onClick={() => setWarehouseReportOpen(true)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(248,120,32,0.1)',
                  border: '1px solid rgba(248,120,32,0.2)',
                  borderRadius: '8px',
                  color: '#f87820',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📊 گزارش انبار
              </button>
            </div>
          </div>

          {/* SPLIT LAYOUT */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* Left Column: Directory Table (65%) */}
            <div style={{ flex: 13, minWidth: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px', borderRadius: '0 0 12px 12px' }}>
              {warehouseLoading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8b92a5', fontSize: '13px' }}>
                  در حال دریافت اطلاعات انبار...
                </div>
              ) : warehouseError ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>
                  {warehouseError}
                </div>
              ) : paginatedProds.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8b92a5', fontSize: '13px' }}>
                  هیچ کالایی متناسب با فیلترها و جستجوی انبار یافت نشد.
                </div>
              ) : (
                <div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '12px 10px', color: '#8b92a5', width: '45%' }}>کلا</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5' }}>برند</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5' }}>دسته‌بندی</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>موجودی</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>رزرو</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>قابل فروش</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5' }}>قیمت (تومان)</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>وضعیت</th>
                          <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProds.map(prod => {
                          const stock = Number(prod?.stock) || 0;
                          const reserved = Number(prod?.reserved) || 0;
                          const minStock = Number(prod?.minStock) || 0;
                          const isSelected = prod?.id === selectedWarehouseProductId;
                          const isOutOf = stock === 0;
                          const isLow = stock > 0 && stock <= minStock;
                          const isAvailable = stock > minStock;
                          
                          return (
                            <tr
                              key={prod.id}
                              onClick={() => setSelectedWarehouseProductId(prod.id)}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(248,120,32,0.04)' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              <td style={{ padding: '12px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', background: '#222' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '800', color: isSelected ? '#f87820' : '#fff' }}>{prod.name}</div>
                                    <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>{prod.sku} • {prod.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px 10px', color: '#c0c8d8' }}>{prod.brand}</td>
                              <td style={{ padding: '12px 10px', color: '#c0c8d8' }}>{prod.category}</td>
                              <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>{prod.stock}</td>
                              <td style={{ padding: '12px 10px', textAlign: 'center', color: prod.reserved > 0 ? '#3b82f6' : '#8b92a5', fontWeight: prod.reserved > 0 ? 'bold' : 'normal' }}>
                                {prod.reserved}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'center', color: (prod.stock - prod.reserved) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {prod.stock - prod.reserved}
                              </td>
                              <td style={{ padding: '12px 10px', color: '#fff', fontWeight: '700' }}>{(Number(prod?.price) || 0).toLocaleString()}</td>
                              <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                {isAvailable && (
                                  <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '10.5px', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: 'bold' }}>
                                    موجود
                                  </span>
                                )}
                                {isLow && (
                                  <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '10.5px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontWeight: 'bold' }}>
                                    کم موجود
                                  </span>
                                )}
                                {isOutOf && (
                                  <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '10.5px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 'bold' }}>
                                    ناموجود
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setActiveWarehouseMenuId(activeWarehouseMenuId === prod.id ? null : prod.id)}
                                  style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '6px',
                                    color: '#c0c8d8',
                                    padding: '4px 8px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ⋮
                                </button>
                                
                                {/* Menu Dropdown */}
                                {activeWarehouseMenuId === prod.id && (
                                  <div style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '38px',
                                    zIndex: 100,
                                    background: '#0c0d12',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px',
                                    width: '130px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                                    padding: '6px'
                                  }}>
                                    <div
                                      onClick={() => {
                                        setSelectedWarehouseProductId(prod.id);
                                        setActiveWarehouseMenuId(null);
                                      }}
                                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      👁 مشاهده
                                    </div>
                                    <div
                                      onClick={() => {
                                        setEditWarehouseForm({
                                          ...prod,
                                          category: prod.category || '',
                                          isBestSeller: !!prod.isBestSeller,
                                          hasDiscount: !!prod.hasDiscount,
                                          discountPercent: prod.discountPercent || 0
                                        });
                                        setIsEditWarehouseOpen(true);
                                        setActiveWarehouseMenuId(null);
                                      }}
                                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      ✏️ ویرایش
                                    </div>
                                    <div
                                      onClick={() => {
                                        setSelectedWarehouseProductId(prod.id);
                                        setWarehouseAdjustStockType('increase');
                                        setWarehouseAdjustStockOpen(true);
                                        setActiveWarehouseMenuId(null);
                                      }}
                                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      ➕ افزایش موجودی
                                    </div>
                                    <div
                                      onClick={() => {
                                        setSelectedWarehouseProductId(prod.id);
                                        setWarehouseAdjustStockType('decrease');
                                        setWarehouseAdjustStockOpen(true);
                                        setActiveWarehouseMenuId(null);
                                      }}
                                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      ➖ کاهش موجودی
                                    </div>
                                    <div
                                      onClick={() => {
                                        setSelectedWarehouseProductId(prod.id);
                                        setWarehouseAddNoteOpen(true);
                                        setActiveWarehouseMenuId(null);
                                      }}
                                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#3b82f6', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      📝 ثبت یادداشت
                                    </div>
                                    <div
                                      onClick={() => {
                                        handleArchiveProductLocal(prod.id);
                                        setActiveWarehouseMenuId(null);
                                      }}
                                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#f59e0b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}
                                    >
                                      📦 آرشیو کالا
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
                    <div style={{ color: '#8b92a5' }}>
                      نمایش {totalItemsCount === 0 ? 0 : startIndex + 1} تا {Math.min(endIndex, totalItemsCount)} از {totalItemsCount} کالا
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => setWarehousePage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '4px',
                          color: currentPage === 1 ? '#444' : '#fff',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ‹
                      </button>
                      
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pg = idx + 1;
                        return (
                          <button
                            key={pg}
                            onClick={() => setWarehousePage(pg)}
                            style={{
                              padding: '4px 10px',
                              background: currentPage === pg ? '#f87820' : 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            {pg}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setWarehousePage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '4px',
                          color: currentPage === totalPages ? '#444' : '#fff',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ›
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>نمایش:</span>
                      <select
                        value={warehouseLimit}
                        onChange={e => {
                          setWarehouseLimit(parseInt(e.target.value));
                          setWarehousePage(1);
                        }}
                        style={{
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="5" style={{ background: '#0c0d12' }}>۵</option>
                        <option value="10" style={{ background: '#0c0d12' }}>۱۰</option>
                        <option value="20" style={{ background: '#0c0d12' }}>۲۰</option>
                        <option value="50" style={{ background: '#0c0d12' }}>۵۰</option>
                      </select>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Right Column: Details Sidebar (35%) */}
            <div style={{ width: '360px', flexShrink: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px' }}>
              {selectedProduct ? (
                <div>
                  {/* Title and image */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '950', color: '#fff' }}>جزئیات کالا</h3>
                    <span style={{
                      padding: '3px 8px', borderRadius: '50px', fontSize: '10px', fontWeight: 'bold',
                      background: selectedProduct.stock === 0 ? 'rgba(239,68,68,0.08)' : selectedProduct.stock <= selectedProduct.minStock ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                      color: selectedProduct.stock === 0 ? '#ef4444' : selectedProduct.stock <= selectedProduct.minStock ? '#f59e0b' : '#10b981'
                    }}>
                      {selectedProduct.stock === 0 ? 'ناموجود' : selectedProduct.stock <= selectedProduct.minStock ? 'کم موجود' : 'موجود'}
                    </span>
                  </div>

                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '180px', borderRadius: '10px', objectFit: 'cover', background: '#222', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.06)' }}
                  />

                  <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>{selectedProduct.name}</h2>

                  {/* Specs list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>برند:</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedProduct.brand}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>دسته‌بندی:</span>
                      <span style={{ color: '#fff' }}>{selectedProduct.category}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>SKU:</span>
                      <span style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedProduct.sku}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>قیمت (تومان):</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{(Number(selectedProduct?.price) || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>موجود انبار ایران:</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedProduct.stock} عدد</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>رزرو سفارشات:</span>
                      <span style={{ color: selectedProduct.reserved > 0 ? '#3b82f6' : '#fff' }}>{selectedProduct.reserved} عدد</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>موجودی قابل فروش:</span>
                      <span style={{ color: (selectedProduct.stock - selectedProduct.reserved) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                        {selectedProduct.stock - selectedProduct.reserved} عدد
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>محل نگهداری در انبار:</span>
                      <span style={{ color: '#fff' }}>{selectedProduct.location}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                      <span style={{ color: '#8b92a5' }}>آخرین بروزرسانی:</span>
                      <span style={{ color: '#8b92a5', fontSize: '11px' }}>{selectedProduct.lastUpdated || 'ثبت نشده'}</span>
                    </div>
                  </div>

                  {/* Sidebar Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    <button
                      onClick={() => {
                        setEditWarehouseForm({
                          ...selectedProduct,
                          category: selectedProduct.category || '',
                          isBestSeller: !!selectedProduct.isBestSeller,
                          hasDiscount: !!selectedProduct.hasDiscount,
                          discountPercent: selectedProduct.discountPercent || 0
                        });
                        setIsEditWarehouseOpen(true);
                      }}
                      style={{
                        width: '100%', padding: '10px', background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                        color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                      }}
                    >
                      ✏️ ویرایش کالا
                    </button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setWarehouseAdjustStockType('increase');
                          setWarehouseAdjustStockOpen(true);
                        }}
                        style={{
                          padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          color: '#10b981', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                        }}
                      >
                        ➕ افزایش
                      </button>
                      <button
                        onClick={() => {
                          setWarehouseAdjustStockType('decrease');
                          setWarehouseAdjustStockOpen(true);
                        }}
                        style={{
                          padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                        }}
                      >
                        ➖ کاهش
                      </button>
                    </div>

                    <button
                      onClick={() => setWarehouseAddNoteOpen(true)}
                      style={{
                        width: '100%', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
                      }}
                    >
                      📝 ثبت یادداشت کالا
                    </button>
                  </div>

                  {/* HISTORY LOG (Inside sidebar) */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12.5px', color: '#fff', marginBottom: '10px', fontWeight: 'bold' }}>🕒 تاریخچه تغییرات موجودی</h4>
                    {Array.isArray(selectedProduct?.history) && selectedProduct.history.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingLeft: '4px' }}>
                        {selectedProduct.history.map(hist => (
                          <div key={hist.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontWeight: '800', color: String(hist?.qty ?? '').startsWith('+') ? '#10b981' : '#ef4444' }}>{hist?.qty}</span>
                              <span style={{ color: '#fff', fontWeight: '700' }}>{hist.action}</span>
                            </div>
                            <div style={{ color: '#8b92a5', fontSize: '9.5px', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                              <span>توسط: {hist.user}</span>
                              <span>{hist.date}</span>
                            </div>
                            {hist.reason && (
                              <div style={{ color: '#f87820', fontSize: '10px', marginTop: '4px', background: 'rgba(248,120,32,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                علت: {hist.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#8b92a5', textAlign: 'center', padding: '12px' }}>
                        تغییراتی ثبت نشده است.
                      </div>
                    )}
                  </div>

                  {/* NOTES LOG (Inside sidebar) */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '12.5px', color: '#fff', marginBottom: '10px', fontWeight: 'bold' }}>📝 یادداشت‌های انبار</h4>
                    {Array.isArray(selectedProduct?.notes) && selectedProduct.notes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                        {selectedProduct.notes.map(note => (
                          <div key={note.id} style={{ background: 'rgba(248,120,32,0.03)', border: '1px solid rgba(248,120,32,0.1)', borderRadius: '6px', padding: '8px', fontSize: '11px' }}>
                            <div style={{ color: '#c0c8d8', lineHeight: '1.4', marginBottom: '4px' }}>{note.text}</div>
                            <div style={{ color: '#8b92a5', fontSize: '9px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>ثبت: {note.user}</span>
                              <span>{note.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#8b92a5', textAlign: 'center', padding: '12px' }}>
                        یادداشتی برای این کالا ثبت نشده است.
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>
                  برای نمایش جزئیات، یک کالا از جدول انتخاب کنید.
                </div>
              )}
            </div>

          </div>

          {/* MODAL: ADD PRODUCT */}
          {isAddWarehouseOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
              <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#fff' }}>➕ افزودن کالای فیزیکی جدید</h3>
                  <button onClick={() => setIsAddWarehouseOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b92a5', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>
                
                <form onSubmit={handleAddWarehouseProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                  
                  <div>
                    <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نام کالا (ضروری)</label>
                    <input
                      type="text"
                      required
                      value={addWarehouseForm?.name ?? ''}
                      onChange={e => setAddWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>دسته‌بندی (ضروری)</label>
                      <select
                        required
                        value={getCategorySelectValue(addWarehouseForm.category, addWarehouseForm.gender)}
                        onChange={e => {
                          const parsed = parseCategorySelectValue(e.target.value);
                          setAddWarehouseForm(prev => ({
                            ...prev,
                            category: parsed.category,
                            categoryId: findWarehouseCategoryId(catalogCategories, parsed.category),
                            gender: parsed.gender
                          }));
                        }}
                        style={{ width: '100%', padding: '8px 12px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      >
                        <option value="">انتخاب دسته‌بندی</option>
                        <option value="men_clothing">پوشاک مردانه</option>
                        <option value="men_pants">شلوار مردانه</option>
                        <option value="men_shoes">کفش مردانه</option>
                        <option value="men_accessories">اکسسوری مردانه</option>
                        <option value="women_clothing">پوشاک زنانه</option>
                        <option value="women_pants">شلوار زنانه</option>
                        <option value="women_shoes">کفش زنانه</option>
                        <option value="women_accessories">اکسسوری زنانه</option>
                        <option value="kids_clothing">پوشاک بچگانه</option>
                        <option value="kids_pants">شلوار و سرهمی بچگانه</option>
                        <option value="kids_shoes">کفش بچگانه</option>
                        <option value="electronics">الکترونیک غیرلپ‌تاپ</option>
                        <option value="bags">کیف و کوله عمومی</option>
                        <option value="watches_glasses">ساعت و عینک</option>
                        <option value="wallets_belts">کیف پول و کمربند</option>
                      </select>
                      <div style={{ marginTop: '6px', color: '#f59e0b', fontSize: '10.5px' }}>لپ‌تاپ را فقط از بخش Laptop Stock اضافه کنید.</div>
                    </div>
                    <AdminBrandSelector
                      brands={safeBrands}
                      categoryId={addWarehouseForm.categoryId}
                      value={addWarehouseForm.brandId}
                      onChange={brandId => setAddWarehouseForm(previous => ({ ...previous, brandId }))}
                      onBrandsChange={setBrands}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>SKU کالا</label>
                      <input
                        type="text"
                        placeholder="مثال: APP-AP2"
                        value={addWarehouseForm?.sku ?? ''}
                        onChange={e => setAddWarehouseForm(prev => ({ ...prev, sku: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>محل نگهداری در انبار</label>
                      <input
                        type="text"
                        placeholder="مثال: قفسه A2"
                        value={addWarehouseForm?.location ?? ''}
                        onChange={e => setAddWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>موجودی فیزیکی اولیه</label>
                      <input
                        type="number"
                        min="0"
                        value={addWarehouseForm?.stock ?? ''}
                        onChange={e => setAddWarehouseForm(prev => ({ ...prev, stock: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>حداقل موجودی (Low limit)</label>
                      <input
                        type="number"
                        min="1"
                        value={addWarehouseForm?.minStock ?? ''}
                        onChange={e => setAddWarehouseForm(prev => ({ ...prev, minStock: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>قیمت واحد (تومان - ضروری)</label>
                      <input
                        type="number"
                        required
                        value={addWarehouseForm?.price ?? ''}
                        onChange={e => setAddWarehouseForm(prev => ({ ...prev, price: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>رزرو شده اولیه</label>
                      <input
                        type="number"
                        min="0"
                        value={addWarehouseForm?.reserved ?? ''}
                        onChange={e => setAddWarehouseForm(prev => ({ ...prev, reserved: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نام انگلیسی / اصلی</label>
                      <input value={addWarehouseForm.publicNameEn} onChange={e => setAddWarehouseForm(prev => ({ ...prev, publicNameEn: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نامک عمومی (اختیاری)</label>
                      <input dir="ltr" value={addWarehouseForm.slug} onChange={e => setAddWarehouseForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="auto-generated" style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>توضیحات عمومی کالا</label>
                    <textarea rows="4" value={addWarehouseForm.description} onChange={e => setAddWarehouseForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', padding: '10px 12px', resize: 'vertical', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'inherit' }} />
                  </div>

                  <AdminWarehouseGalleryField
                    value={addWarehouseForm.images}
                    onChange={images => setAddWarehouseForm(previous => ({ ...previous, images }))}
                  />

                  {/* Best-seller & Discount toggles */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>تنظیمات نمایش در وبسایت</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={addWarehouseForm.isPublished} onChange={e => setAddWarehouseForm(prev => ({ ...prev, isPublished: e.target.checked }))} />
                        انتشار مستقیم در فروشگاه — موجودی قابل فروش: {Math.max(0, Number(addWarehouseForm.stock || 0) - Number(addWarehouseForm.reserved || 0))}
                      </label>
                      {/* isBestSeller */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAddWarehouseForm(prev => ({ ...prev, isBestSeller: !prev.isBestSeller }))}>
                        <div style={{
                          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                          background: addWarehouseForm.isBestSeller ? 'linear-gradient(135deg, #f87820, #d4590c)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px',
                            left: addWarehouseForm.isBestSeller ? '19px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ color: '#d4d8e8', fontSize: '12px', userSelect: 'none' }}>🔥 پرفروش (Best Seller) — نمایش در بخش پرفروش‌های سایت</span>
                      </div>

                      {/* hasDiscount */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAddWarehouseForm(prev => ({ ...prev, hasDiscount: !prev.hasDiscount, discountPercent: !prev.hasDiscount ? prev.discountPercent : 0 }))}>
                        <div style={{
                          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                          background: addWarehouseForm.hasDiscount ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px',
                            left: addWarehouseForm.hasDiscount ? '19px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ color: '#d4d8e8', fontSize: '12px', userSelect: 'none' }}>🏷️ دارای تخفیف — نمایش برچسب تخفیف روی کالا</span>
                      </div>

                      {/* discountPercent — shown only when hasDiscount is on */}
                      {addWarehouseForm.hasDiscount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', paddingRight: '46px' }}>
                          <label style={{ color: '#8b92a5', fontSize: '11px', whiteSpace: 'nowrap' }}>درصد تخفیف:</label>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={addWarehouseForm?.discountPercent ?? ''}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                              placeholder="مثال: 20"
                              style={{
                                width: '100%', padding: '7px 32px 7px 12px',
                                background: 'rgba(16, 185, 129, 0.07)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px', color: '#10b981', fontSize: '13px',
                                fontWeight: 'bold', outline: 'none'
                              }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontSize: '12px', fontWeight: 'bold', pointerEvents: 'none' }}>%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%', padding: '10px', marginTop: '10px',
                      background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                      color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    ثبت نهایی کالا در انبار
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: EDIT PRODUCT */}
          {isEditWarehouseOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
              <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#fff' }}>✏️ ویرایش کالای فیزیکی</h3>
                  <button onClick={() => setIsEditWarehouseOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b92a5', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>
                
                <form onSubmit={handleEditWarehouseProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                  
                  <div>
                    <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نام کالا (ضروری)</label>
                    <input
                      type="text"
                      required
                      value={editWarehouseForm?.name ?? ''}
                      onChange={e => setEditWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>دسته‌بندی (ضروری)</label>
                      <select
                        required
                        value={getCategorySelectValue(editWarehouseForm.category, editWarehouseForm.gender)}
                        onChange={e => {
                          const parsed = parseCategorySelectValue(e.target.value);
                          setEditWarehouseForm(prev => ({
                            ...prev,
                            category: parsed.category,
                            categoryId: findWarehouseCategoryId(catalogCategories, parsed.category),
                            gender: parsed.gender
                          }));
                        }}
                        style={{ width: '100%', padding: '8px 12px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      >
                        <option value="">انتخاب دسته‌بندی</option>
                        <option value="men_clothing">پوشاک مردانه</option>
                        <option value="men_pants">شلوار مردانه</option>
                        <option value="men_shoes">کفش مردانه</option>
                        <option value="men_accessories">اکسسوری مردانه</option>
                        <option value="women_clothing">پوشاک زنانه</option>
                        <option value="women_pants">شلوار زنانه</option>
                        <option value="women_shoes">کفش زنانه</option>
                        <option value="women_accessories">اکسسوری زنانه</option>
                        <option value="kids_clothing">پوشاک بچگانه</option>
                        <option value="kids_pants">شلوار و سرهمی بچگانه</option>
                        <option value="kids_shoes">کفش بچگانه</option>
                        <option value="electronics">الکترونیک غیرلپ‌تاپ</option>
                        <option value="bags">کیف و کوله عمومی</option>
                        <option value="watches_glasses">ساعت و عینک</option>
                        <option value="wallets_belts">کیف پول و کمربند</option>
                      </select>
                      <div style={{ marginTop: '6px', color: '#f59e0b', fontSize: '10.5px' }}>لپ‌تاپ را فقط از بخش Laptop Stock اضافه کنید.</div>
                    </div>
                    <AdminBrandSelector
                      brands={safeBrands}
                      categoryId={editWarehouseForm.categoryId}
                      value={editWarehouseForm.brandId}
                      onChange={brandId => setEditWarehouseForm(previous => ({ ...previous, brandId }))}
                      onBrandsChange={setBrands}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>SKU کالا</label>
                      <input
                        type="text"
                        value={editWarehouseForm?.sku ?? ''}
                        onChange={e => setEditWarehouseForm(prev => ({ ...prev, sku: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>محل نگهداری در انبار</label>
                      <input
                        type="text"
                        value={editWarehouseForm?.location ?? ''}
                        onChange={e => setEditWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>موجودی فیزیکی</label>
                      <input
                        type="number"
                        min="0"
                        value={editWarehouseForm?.stock ?? ''}
                        onChange={e => setEditWarehouseForm(prev => ({ ...prev, stock: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>حداقل موجودی (Low limit)</label>
                      <input
                        type="number"
                        min="1"
                        value={editWarehouseForm?.minStock ?? ''}
                        onChange={e => setEditWarehouseForm(prev => ({ ...prev, minStock: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>قیمت واحد (تومان)</label>
                      <input
                        type="number"
                        required
                        value={editWarehouseForm?.price ?? ''}
                        onChange={e => setEditWarehouseForm(prev => ({ ...prev, price: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>رزرو شده سفارشات</label>
                      <input
                        type="number"
                        min="0"
                        value={editWarehouseForm?.reserved ?? ''}
                        onChange={e => setEditWarehouseForm(prev => ({ ...prev, reserved: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نام انگلیسی / اصلی</label>
                      <input value={editWarehouseForm.publicNameEn || ''} onChange={e => setEditWarehouseForm(prev => ({ ...prev, publicNameEn: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نامک عمومی</label>
                      <input dir="ltr" value={editWarehouseForm.slug || ''} onChange={e => setEditWarehouseForm(prev => ({ ...prev, slug: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>توضیحات عمومی کالا</label>
                    <textarea rows="4" value={editWarehouseForm.description || ''} onChange={e => setEditWarehouseForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', padding: '10px 12px', resize: 'vertical', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'inherit' }} />
                  </div>

                  <AdminWarehouseGalleryField
                    value={editWarehouseForm.images}
                    onChange={images => setEditWarehouseForm(previous => ({ ...previous, images }))}
                  />

                  {/* Best-seller & Discount toggles */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>تنظیمات نمایش در وبسایت</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={Boolean(editWarehouseForm.isPublished)} onChange={e => setEditWarehouseForm(prev => ({ ...prev, isPublished: e.target.checked }))} />
                        انتشار مستقیم در فروشگاه — موجودی قابل فروش: {Math.max(0, Number(editWarehouseForm.stock || 0) - Number(editWarehouseForm.reserved || 0))}
                      </label>
                      {/* isBestSeller */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setEditWarehouseForm(prev => ({ ...prev, isBestSeller: !prev.isBestSeller }))}>
                        <div style={{
                          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                          background: editWarehouseForm.isBestSeller ? 'linear-gradient(135deg, #f87820, #d4590c)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px',
                            left: editWarehouseForm.isBestSeller ? '19px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ color: '#d4d8e8', fontSize: '12px', userSelect: 'none' }}>🔥 پرفروش (Best Seller) — نمایش در بخش پرفروش‌های سایت</span>
                      </div>

                      {/* hasDiscount */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setEditWarehouseForm(prev => ({ ...prev, hasDiscount: !prev.hasDiscount, discountPercent: !prev.hasDiscount ? prev.discountPercent : 0 }))}>
                        <div style={{
                          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                          background: editWarehouseForm.hasDiscount ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px',
                            left: editWarehouseForm.hasDiscount ? '19px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ color: '#d4d8e8', fontSize: '12px', userSelect: 'none' }}>🏷️ دارای تخفیف — نمایش برچسب تخفیف روی کالا</span>
                      </div>

                      {/* discountPercent — shown only when hasDiscount is on */}
                      {editWarehouseForm.hasDiscount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', paddingRight: '46px' }}>
                          <label style={{ color: '#8b92a5', fontSize: '11px', whiteSpace: 'nowrap' }}>درصد تخفیف:</label>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={editWarehouseForm?.discountPercent ?? ''}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                              placeholder="مثال: 20"
                              style={{
                                width: '100%', padding: '7px 32px 7px 12px',
                                background: 'rgba(16, 185, 129, 0.07)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px', color: '#10b981', fontSize: '13px',
                                fontWeight: 'bold', outline: 'none'
                              }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontSize: '12px', fontWeight: 'bold', pointerEvents: 'none' }}>%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%', padding: '10px', marginTop: '10px',
                      background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                      color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    ذخیره تغییرات
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: ADJUST STOCK */}
          {warehouseAdjustStockOpen && selectedProduct && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
              <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', width: '400px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#fff', marginBottom: '16px' }}>
                  {warehouseAdjustStockType === 'increase' ? '📦 ثبت افزایش موجودی فیزیکی' : '📤 ثبت کاهش موجودی فیزیکی'}
                </h3>
                
                <div style={{ fontSize: '12px', color: '#8b92a5', marginBottom: '12px' }}>
                  کالا: <strong style={{ color: '#fff' }}>{selectedProduct.name}</strong> • موجودی فعلی: <strong style={{ color: '#fff' }}>{selectedProduct.stock} عدد</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>تعداد کالا</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="تعداد تغییر..."
                      value={warehouseAdjustStockQty ?? ''}
                      onChange={e => setWarehouseAdjustStockQty(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>علت تغییر موجودی</label>
                    <input
                      type="text"
                      placeholder="مثال: فاکتور خرید، کسری فیزیکی، آسیب‌دیدگی..."
                      value={warehouseAdjustStockReason ?? ''}
                      onChange={e => setWarehouseAdjustStockReason(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleAdjustStockLocal(selectedProduct.id, warehouseAdjustStockType, warehouseAdjustStockQty, warehouseAdjustStockReason)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                        background: warehouseAdjustStockType === 'increase' ? '#10b981' : '#ef4444'
                      }}
                    >
                      تأیید و اعمال
                    </button>
                    <button
                      onClick={() => {
                        setWarehouseAdjustStockOpen(false);
                        setWarehouseAdjustStockQty('');
                        setWarehouseAdjustStockReason('');
                      }}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
                        background: 'transparent'
                      }}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: ADD NOTE */}
          {warehouseAddNoteOpen && selectedProduct && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
              <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', width: '400px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#fff', marginBottom: '12px' }}>📝 ثبت یادداشت برای کالا</h3>
                <div style={{ fontSize: '12px', color: '#8b92a5', marginBottom: '12px' }}>کالا: <strong style={{ color: '#fff' }}>{selectedProduct.name}</strong></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    placeholder="متن یادداشت انبار (مثال: کارتن آسیب دیده، نیاز به شمارش مجدد، منتظر ترخیص...)"
                    rows="4"
                    value={warehouseAddNoteText ?? ''}
                    onChange={e => setWarehouseAddNoteText(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px', resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleAddNoteLocal(selectedProduct.id, warehouseAddNoteText)}
                      style={{ flex: 1, padding: '10px', background: '#f87820', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ثبت یادداشت
                    </button>
                    <button
                      onClick={() => {
                        setWarehouseAddNoteOpen(false);
                        setWarehouseAddNoteText('');
                      }}
                      style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: WAREHOUSE REPORT */}
          {warehouseReportOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)' }}>
              <div style={{ background: '#08090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px', width: '850px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' }}>
                
                {/* Printable Area Wrapper */}
                <div id="warehousePrintableReport">
                  
                  {/* Report Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f87820', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: 0 }}>📊 گزارش جامع وضعیت انبار ایران</h2>
                      <p style={{ fontSize: '12px', color: '#8b92a5', margin: '4px 0 0 0' }}>دبی خرید • سامانه هوشمند مدیریت زنجیره تامین و انبار کالا</p>
                    </div>
                    <div style={{ textAlign: 'left', fontSize: '11px', color: '#8b92a5' }}>
                      <div>تاریخ گزارش: {getWarehouseReportDate()}</div>
                      <div>ساعت تهیه: {getWarehouseReportTime()}</div>
                      <div>کاربر گزارش‌گیرنده: مدیر سایت</div>
                    </div>
                  </div>

                  {/* Key Metrics cards inside report */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>ارزش کل موجودی انبار</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#f87820' }}>{totalValue.toLocaleString()} تومان</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>کل اقلام قابل فروش</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>{totalSellable} کالا</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>اقلام با موجودی بحرانی</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#f59e0b' }}>{lowStockCount} مورد</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>تعداد اقلام ناموجود</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444' }}>{outOfStockCount} مورد</div>
                    </div>
                  </div>

                  {/* List of Products */}
                  <h4 style={{ fontSize: '14px', color: '#fff', borderRight: '3px solid #f87820', paddingRight: '8px', marginBottom: '12px', fontWeight: 'bold' }}>📋 لیست قلم کالاهای انبار فعال</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right', marginBottom: '24px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '8px 10px', color: '#fff' }}>شناسه کالا / SKU</th>
                        <th style={{ padding: '8px 10px', color: '#fff' }}>نام محصول</th>
                        <th style={{ padding: '8px 10px', color: '#fff' }}>دسته‌بندی</th>
                        <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'center' }}>موجودی</th>
                        <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'center' }}>رزرو</th>
                        <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'center' }}>قابل فروش</th>
                        <th style={{ padding: '8px 10px', color: '#fff' }}>قیمت واحد</th>
                        <th style={{ padding: '8px 10px', color: '#fff' }}>محل قرارگیری</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProds.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 10px', color: '#f87820', fontWeight: 'bold' }}>{p.sku}</td>
                          <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 'bold' }}>{p.name}</td>
                          <td style={{ padding: '8px 10px', color: '#c0c8d8' }}>{p.category}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: p.stock === 0 ? '#ef4444' : '#fff' }}>{p.stock}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#3b82f6' }}>{p.reserved}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: (p.stock - p.reserved) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{p.stock - p.reserved}</td>
                          <td style={{ padding: '8px 10px' }}>{(Number(p?.price) || 0).toLocaleString()} تومان</td>
                          <td style={{ padding: '8px 10px', color: '#8b92a5' }}>{p.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Recent combined history logs */}
                  <h4 style={{ fontSize: '14px', color: '#fff', borderRight: '3px solid #f87820', paddingRight: '8px', marginBottom: '12px', fontWeight: 'bold' }}>🕒 وقایع و تغییرات اخیر انبار (تراکنش‌ها)</h4>
                  {combinedHistory.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>تاریخ و زمان</th>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>کالا</th>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>نوع تراکنش</th>
                          <th style={{ padding: '6px 10px', color: '#fff', textAlign: 'center' }}>تعداد</th>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>ثبت کننده</th>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>شرح علت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedHistory.slice(0, 15).map((log, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '6px 10px', color: '#8b92a5' }}>{log.date}</td>
                            <td style={{ padding: '6px 10px', color: '#fff' }}><strong>{log.productName}</strong> <span style={{ fontSize: '9px', color: '#8b92a5' }}>({log.sku})</span></td>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{
                                padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px',
                                background: log.action === 'افزایش موجودی' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                color: log.action === 'افزایش موجودی' ? '#10b981' : '#ef4444'
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', color: String(log?.qty ?? '').startsWith('+') ? '#10b981' : '#ef4444' }}>{log?.qty}</td>
                            <td style={{ padding: '6px 10px', color: '#c0c8d8' }}>{log.user}</td>
                            <td style={{ padding: '6px 10px', color: '#8b92a5' }}>{log.reason || 'ثبت دستی'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#8b92a5', textAlign: 'center', padding: '16px' }}>هیچ تراکنش ثبتی اخیراً وجود ندارد.</div>
                  )}

                </div>

                {/* Modal Footer actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                  <button
                    onClick={() => {
                      const printContent = document.getElementById('warehousePrintableReport')?.innerHTML;
                      if (!printContent) return;
                      document.body.innerHTML = printContent;
                      window.print();
                      // Reload page to restore react DOM bindings after printing
                      window.location.reload();
                    }}
                    style={{
                      padding: '10px 24px', background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                      color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    🖨 چاپ گزارش
                  </button>
                  <button
                    onClick={() => setWarehouseReportOpen(false)}
                    style={{
                      padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    بستن پنجره
                  </button>
                </div>

              </div>
            </div>
          )}
      </div>
    </AdminShell>
  );
}
