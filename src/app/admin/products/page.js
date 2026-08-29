'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminShell, { useAdminShellData } from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import AdminBrandSelector from '@/components/admin/AdminBrandSelector';
import AdminProductImageField, { createProductImageState } from '@/components/admin/AdminProductImageField';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { calculateProductPricing } from '@/lib/pricing';

const EMPTY_PAGINATION = { page: 1, limit: 20, total: 0, totalPages: 1 };

const mapProductFromApi = product => ({
  ...product,
  brand: product?.brand?.name || '',
  category: product?.category?.query || product?.category?.name || '',
  categoryName: product?.category?.name || '',
  sourceStore: product?.store?.name || '',
  foreignStatus: product?.status || 'active',
  lastUpdated: product?.updatedAt,
});

async function readApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'عملیات با خطا مواجه شد.');
  return payload;
}

async function uploadProductImage(imageState) {
  if (imageState.method === 'url') {
    const value = imageState.url.trim() || null;
    return { value, changed: value !== (imageState.existingUrl || null) };
  }
  if (imageState.file) {
    const formData = new FormData();
    formData.set('file', imageState.file);
    const uploaded = await readApiResponse(await fetch('/api/admin/products/upload', {
      method: 'POST',
      body: formData,
    }));
    return { value: uploaded.url, changed: true };
  }
  if (imageState.removed) return { value: null, changed: Boolean(imageState.existingUrl) };
  return { value: imageState.existingUrl || null, changed: false };
}

function ProductSalesCount() {
  const { leads } = useAdminShellData();
  const safeLeads = Array.isArray(leads) ? leads : [];
  const salesCountThisMonth = safeLeads.filter(lead => (
    ['processing', 'purchased', 'noon_dubai', 'warehouse_dubai', 'shipped', 'delivered']
      .includes(lead?.status)
  )).length;

  return <>{salesCountThisMonth} سفارش</>;
}

export default function AdminProductsPage() {
  const { can } = useAdminAccess();
  const { settings: siteCtxSettings } = useSiteSettings();
  const [selectedAdminProductId, setSelectedAdminProductId] = useState(null);
  const [productLinkInput, setProductLinkInput] = useState('');
  const [isFetchingProductLink, setIsFetchingProductLink] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editProductForm, setEditProductForm] = useState({
    id: '', name: '', description: '', brandId: '', priceAed: '', weight: '', storeId: '', originalLink: '', foreignStatus: 'active',
    image: '', gender: '', category: '', discountPercent: 0, isBestSeller: false
  });
  const [isAddProductManualOpen, setIsAddProductManualOpen] = useState(false);
  const [addProductManualForm, setAddProductManualForm] = useState({
    name: '', description: '', brandId: '', priceAed: '', weight: '1.0', storeId: '', originalLink: '', image: '',
    category: '', gender: '', discountPercent: 0, hasDiscount: false, isBestSeller: false
  });
  const [editProductImage, setEditProductImage] = useState(() => createProductImageState());
  const [addProductImage, setAddProductImage] = useState(() => createProductImageState());
  const [productImageUploading, setProductImageUploading] = useState('');
  const [adminProducts, setAdminProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('همه');
  const [productBrandFilter, setProductBrandFilter] = useState('همه');
  const [productCategoryFilter, setProductCategoryFilter] = useState('همه');
  const [productStoreFilter, setProductStoreFilter] = useState('همه');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');

  const loadProducts = useCallback(async (requestedPage = 1) => {
    setIsLoadingProducts(true);
    setProductsError('');
    const params = new URLSearchParams({ page: String(requestedPage), limit: '20' });
    if (productSearchQuery.trim()) params.set('search', productSearchQuery.trim());
    if (productStatusFilter !== 'همه') params.set('status', productStatusFilter);
    if (productBrandFilter !== 'همه') params.set('brandId', productBrandFilter);
    if (productCategoryFilter !== 'همه') params.set('categoryId', productCategoryFilter);
    if (productStoreFilter !== 'همه') params.set('storeId', productStoreFilter);

    try {
      const payload = await readApiResponse(await fetch(`/api/admin/products?${params}`, { cache: 'no-store' }));
      setAdminProducts(Array.isArray(payload.data) ? payload.data.map(mapProductFromApi) : []);
      setPagination(payload.pagination || EMPTY_PAGINATION);
      setStatusCounts(payload.statusCounts || {});
      setBrands(payload.filters?.brands || []);
      setCategories(payload.filters?.categories || []);
      setStores(payload.filters?.stores || []);
    } catch (error) {
      setProductsError(error.message || 'دریافت محصولات با خطا مواجه شد.');
      setAdminProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productBrandFilter, productCategoryFilter, productSearchQuery, productStatusFilter, productStoreFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(1), 250);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const getProductSourceStore = product => product?.sourceStore || '—';
  const getProductAedPrice = product => Number(product?.priceAed);
  const getProductWeight = product => Number(product?.weight);
  const getProductForeignStatus = product => product?.foreignStatus || 'active';
  const getProductLastUpdated = product => product?.lastUpdated
    ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(new Date(product.lastUpdated))
    : '—';
  const getProductOriginalLink = product => product?.originalLink || '';

  const handleDeleteProduct = async prodId => {
    if (!can(ADMIN_PERMISSIONS.PRODUCTS_DELETE)) return;
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
    try {
      await readApiResponse(await fetch(`/api/admin/products/${encodeURIComponent(prodId)}`, { method: 'DELETE' }));
      setSelectedAdminProductId(null);
      await loadProducts(pagination.page);
      alert('محصول با موفقیت غیرفعال گردید.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFetchProductFromLink = async () => {
    if (!productLinkInput.trim()) return;
    setIsFetchingProductLink(true);
    try {
      const response = await fetch('/api/product-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productLinkInput.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error === 'UNSUPPORTED_STORE'
        ? 'لطفاً یک لینک معتبر از آمازون امارات، نون یا نمشی وارد نمایید.'
        : 'اطلاعات محصول از لینک دریافت نشد.');
      const product = payload.fields || {};

      const matchedBrand = brands.find(item => item.name.toLowerCase() === String(product.brand || '').toLowerCase());
      const matchedStore = stores.find(item => {
        try {
          const storeHost = new URL(item.url || 'https://invalid.local').hostname.replace(/^www\./, '');
          const productHost = new URL(payload.canonicalUrl).hostname.replace(/^www\./, '');
          return storeHost === productHost || storeHost.endsWith(`.${productHost}`) || productHost.endsWith(`.${storeHost}`);
        }
        catch { return item.name.toLowerCase().includes(String(payload.sourceLabel || payload.source || '').toLowerCase()); }
      });
      const matchedCategory = payload.confidence?.categorySuggestion === 'high'
        ? categories.find(item => item.query === product.categorySuggestion || item.name.includes(product.categorySuggestion || ''))
        : null;
      setAddProductManualForm({
        name: product.title || '',
        description: '',
        brandId: matchedBrand?.id || '',
        category: matchedCategory?.id || '',
        storeId: matchedStore?.id || '',
        priceAed: product.priceAed ?? '',
        weight: '1.0',
        originalLink: payload.canonicalUrl || productLinkInput.trim(),
        image: product.imageUrl || '',
        gender: '',
        discountPercent: 0,
        hasDiscount: false,
        isBestSeller: false,
      });
      setAddProductImage(createProductImageState(product.imageUrl || '', 'url'));
      setIsAddProductManualOpen(true);
      setProductLinkInput('');
      if (product.priceAed == null) {
        alert('قیمت واقعی پیدا نشد. لطفاً قیمت را پس از بررسی دستی وارد کنید.');
      }
    } catch (error) {
      alert(error.message || 'دریافت اطلاعات محصول با خطا مواجه شد.');
    } finally {
      setIsFetchingProductLink(false);
    }
  };

  const handlePromptUpdatePrice = async prod => {
    const currentPrice = getProductAedPrice(prod);
    const newPrice = prompt(`قیمت جدید محصول به درهم (AED) را وارد کنید (قیمت فعلی: ${currentPrice} AED):`, currentPrice);
    if (newPrice === null) return;
    try {
      await readApiResponse(await fetch(`/api/admin/products/${encodeURIComponent(prod.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceAed: newPrice }),
      }));
      await loadProducts(pagination.page);
      alert('قیمت با موفقیت بروزرسانی شد.');
    } catch (error) { alert(error.message); }
  };

  const handleToggleHide = async prodId => {
    const product = adminProducts.find(item => item.id === prodId);
    const status = getProductForeignStatus(product) === 'hidden' ? 'active' : 'hidden';
    try {
      await readApiResponse(await fetch(`/api/admin/products/${encodeURIComponent(prodId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      }));
      await loadProducts(pagination.page);
    } catch (error) { alert(error.message); }
  };

  const handleEditClick = prod => {
    if (!can(ADMIN_PERMISSIONS.PRODUCTS_EDIT)) return;
    setEditProductForm({
      id: prod.id, name: prod.name, description: prod.description || '', brandId: prod.brandId || '', category: prod.categoryId || '',
      storeId: prod.storeId || '', priceAed: getProductAedPrice(prod), weight: getProductWeight(prod),
      originalLink: getProductOriginalLink(prod), foreignStatus: getProductForeignStatus(prod), image: prod.image || '',
      gender: prod.gender || '', discountPercent: prod.discountPercent || 0, isBestSeller: !!prod.isBestSeller,
    });
    setEditProductImage(createProductImageState(prod.image || ''));
    setIsEditProductModalOpen(true);
  };

  const handleEditProductSubmitLocal = async event => {
    event.preventDefault();
    let imageResult;
    setProductImageUploading('edit');
    try {
      imageResult = await uploadProductImage(editProductImage);
    } catch (error) {
      setEditProductImage(previous => ({ ...previous, error: error.message || 'آپلود تصویر با خطا مواجه شد.' }));
      setProductImageUploading('');
      return;
    }
    setProductImageUploading('');
    try {
      const imageUpdate = imageResult.changed ? { image: imageResult.value } : {};
      await readApiResponse(await fetch(`/api/admin/products/${encodeURIComponent(editProductForm.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          name: editProductForm.name, description: editProductForm.description || null,
          brandId: editProductForm.brandId, categoryId: editProductForm.category,
          storeId: editProductForm.storeId, priceAed: editProductForm.priceAed, weight: editProductForm.weight,
          originalLink: editProductForm.originalLink || null, ...imageUpdate,
          status: editProductForm.foreignStatus, gender: editProductForm.gender || null,
          discountPercent: Number(editProductForm.discountPercent) || 0, isBestSeller: !!editProductForm.isBestSeller,
          hasDiscount: Number(editProductForm.discountPercent) > 0,
        }),
      }));
      setIsEditProductModalOpen(false);
      await loadProducts(pagination.page);
      alert('محصول با موفقیت ویرایش شد.');
    } catch (error) { alert(error.message); }
  };

  const handleManualAddProductSubmit = async event => {
    event.preventDefault();
    let imageResult;
    setProductImageUploading('add');
    try {
      imageResult = await uploadProductImage(addProductImage);
    } catch (error) {
      setAddProductImage(previous => ({ ...previous, error: error.message || 'آپلود تصویر با خطا مواجه شد.' }));
      setProductImageUploading('');
      return;
    }
    setProductImageUploading('');
    try {
      const created = await readApiResponse(await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          name: addProductManualForm.name, description: addProductManualForm.description || null,
          brandId: addProductManualForm.brandId, categoryId: addProductManualForm.category,
          storeId: addProductManualForm.storeId, priceAed: addProductManualForm.priceAed, weight: addProductManualForm.weight,
          originalLink: addProductManualForm.originalLink || null, image: imageResult.value,
          gender: addProductManualForm.gender || null, hasDiscount: !!addProductManualForm.hasDiscount,
          discountPercent: addProductManualForm.hasDiscount ? (Number(addProductManualForm.discountPercent) || 0) : 0,
          isBestSeller: !!addProductManualForm.isBestSeller,
        }),
      }));
      setSelectedAdminProductId(created.id);
      setIsAddProductManualOpen(false);
      await loadProducts(1);
      alert('محصول با موفقیت به صورت دستی اضافه شد.');
    } catch (error) { alert(error.message); }
  };

              const safeAdminProducts = Array.isArray(adminProducts) ? adminProducts : [];
              const safeBrands = Array.isArray(brands) ? brands : [];
              const totalForeignProducts = pagination.total;
              const activeProducts = statusCounts.active || 0;
              const brokenLinks = statusCounts.broken_link || 0;
              const needsUpdate = statusCounts.needs_update || 0;
              const sortedProds = safeAdminProducts;
  
              const selectedProduct = safeAdminProducts.find(p => p?.id === selectedAdminProductId) || sortedProds[0] || null;
  
              // Price Breakdown Calculations
              const getPriceBreakdown = (prod) => {
                if (!prod) return null;
                const priceAed = getProductAedPrice(prod);
                const weight = parseFloat(getProductWeight(prod)) || 1.0;
                let pricing;
                try { pricing = calculateProductPricing({ priceAed, weight }, siteCtxSettings); } catch { return null; }
                return {
                  priceAed,
                  weight,
                  roundedWeight: pricing.billableWeight,
                  shippingCost: pricing.shippingAed,
                  commissionCost: pricing.commissionAed,
                  aedRateValue: pricing.exchangeRate,
                  finalPriceToman: pricing.totalToman,
                  commissionPct: pricing.commissionPercent,
                };
              };
  
              const selectedBreakdown = getPriceBreakdown(selectedProduct);
  return (
    <AdminShell activeTab="products">
      <div style={{ fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
          
          {/* Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌐 مدیریت محصولات خارجی
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#8b92a5' }}>
                کنترل و نظارت بر روی محصولات استخراج‌شده از فروشگاه‌های امارات (پشتیبانی، قیمت‌گذاری و سودآوری)
              </p>
            </div>
            
            {can(ADMIN_PERMISSIONS.PRODUCTS_CREATE) && <button 
              onClick={() => {
                setAddProductManualForm({
                  name: '', description: '', brandId: '', priceAed: '', weight: '1.0', storeId: stores[0]?.id || '',
                  originalLink: '', image: '', category: '', gender: '', discountPercent: 0,
                  hasDiscount: false, isBestSeller: false,
                });
                setAddProductImage(createProductImageState());
                setIsAddProductManualOpen(true);
              }}
              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--admin-orange), #ff9d00)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ➕ افزودن دستی محصول
            </button>}
          </div>

          {/* 5 Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>کل محصولات خارجی</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{totalForeignProducts} محصول</div>
              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>در کل آرشیو کاتالوگ</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>محصولات فعال</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>{activeProducts} کالا</div>
              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>نمایش فعال روی وبسایت</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>لینک‌های خراب</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>{brokenLinks} مورد</div>
              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>خطای ۴۰۴ مبدا امارات</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>نیاز به بروزرسانی قیمت</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b' }}>{needsUpdate} کالا</div>
              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>تغییر قیمت در سایت مبدا</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>تعداد فروش این ماه</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#f87820' }}><ProductSalesCount /></div>
              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>ثبت و نهایی شده در سیستم</div>
            </div>
          </div>

          {/* Main Split Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1.3fr', gap: '24px', direction: 'rtl' }}>
            
            {/* Left Column: Search & Directory Table */}
            <div>
              {/* Filters bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="جستجو در نام، برند یا فروشگاه..."
                  value={productSearchQuery || ""}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12.5px', outline: 'none' }}
                />
                
                <select
                  value={productStatusFilter || ""}
                  onChange={e => setProductStatusFilter(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="همه" style={{ background: '#1c1d24' }}>همه وضعیت‌ها</option>
                  <option value="active" style={{ background: '#1c1d24' }}>🟢 فعال</option>
                  <option value="needs_update" style={{ background: '#1c1d24' }}>🟡 نیاز به بروزرسانی قیمت</option>
                  <option value="broken_link" style={{ background: '#1c1d24' }}>🔴 لینک خراب</option>
                  <option value="hidden" style={{ background: '#1c1d24' }}>⚫ مخفی</option>
                </select>

                <select
                  value={productBrandFilter || ""}
                  onChange={e => setProductBrandFilter(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="همه" style={{ background: '#1c1d24' }}>همه برندها</option>
                  {brands.map(brand => <option key={brand.id} value={brand.id} style={{ background: '#1c1d24' }}>{brand.name}</option>)}
                </select>

                <select
                  value={productCategoryFilter}
                  onChange={e => setProductCategoryFilter(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="همه" style={{ background: '#1c1d24' }}>همه دسته‌بندی‌ها</option>
                  {categories.map(category => <option key={category.id} value={category.id} style={{ background: '#1c1d24' }}>{category.name}</option>)}
                </select>

                <select
                  value={productStoreFilter}
                  onChange={e => setProductStoreFilter(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="همه" style={{ background: '#1c1d24' }}>همه فروشگاه‌ها</option>
                  {stores.map(store => <option key={store.id} value={store.id} style={{ background: '#1c1d24' }}>{store.name}</option>)}
                </select>
              </div>

              {/* Table */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>تصویر</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>نام محصول</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>برند</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>فروشگاه مبدا</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>قیمت اصلی (AED)</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>وزن (KG)</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>وضعیت</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>آخرین بروزرسانی</th>
                      <th style={{ padding: '12px 16px', color: '#8b92a5' }}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProducts ? (
                      <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#8b92a5' }}>در حال دریافت محصولات...</td></tr>
                    ) : productsError ? (
                      <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{productsError}</td></tr>
                    ) : sortedProds.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#8b92a5' }}>هیچ محصولی با مشخصات جستجو شده یافت نشد.</td>
                      </tr>
                    ) : (
                      sortedProds.map(p => {
                        const store = getProductSourceStore(p);
                        const priceAed = getProductAedPrice(p);
                        const weight = getProductWeight(p);
                        const statusVal = getProductForeignStatus(p);
                        const isSelected = selectedProduct && selectedProduct.id === p.id;
                        
                        return (
                          <tr 
                            key={p.id}
                            onClick={() => setSelectedAdminProductId(p.id)}
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.04)', 
                              cursor: 'pointer', 
                              background: isSelected ? 'rgba(248,120,32,0.06)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                            onMouseOver={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                            onMouseOut={e => { if(!isSelected) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <img src={p.image} alt={p.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }} />
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                            <td style={{ padding: '12px 16px', color: '#c0c8d8' }}>{p.brand}</td>
                            <td style={{ padding: '12px 16px', color: '#8b92a5' }}>
                              <span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{store}</span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 'bold' }}>{priceAed} AED</td>
                            <td style={{ padding: '12px 16px', color: '#c0c8d8' }}>{weight} kg</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 'bold',
                                background: statusVal === 'active' ? 'rgba(16,185,129,0.1)' : statusVal === 'needs_update' ? 'rgba(245,158,11,0.1)' : statusVal === 'broken_link' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                                color: statusVal === 'active' ? '#10b981' : statusVal === 'needs_update' ? '#f59e0b' : statusVal === 'broken_link' ? '#ef4444' : '#9ca3af'
                              }}>
                                {statusVal === 'active' ? 'فعال' : statusVal === 'needs_update' ? 'بروزرسانی قیمت' : statusVal === 'broken_link' ? 'لینک خراب' : 'مخفی'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#8b92a5' }}>{getProductLastUpdated(p)}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                {can(ADMIN_PERMISSIONS.PRODUCTS_EDIT) && <button 
                                  onClick={() => handleEditClick(p)} 
                                  style={{ padding: '4px 8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#c0c8d8', cursor: 'pointer', fontSize: '10px' }}
                                  title="ویرایش محصول"
                                >
                                  ویرایش
                                </button>}
                                {can(ADMIN_PERMISSIONS.PRODUCTS_DELETE) && <button 
                                  onClick={() => handleDeleteProduct(p.id)} 
                                  style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}
                                  title="حذف"
                                >
                                  حذف
                                </button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', color: '#8b92a5', fontSize: '11px' }}>
                <span>صفحه {pagination.page} از {pagination.totalPages} — {pagination.total} محصول</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" disabled={pagination.page <= 1 || isLoadingProducts} onClick={() => loadProducts(pagination.page - 1)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', opacity: pagination.page <= 1 ? 0.45 : 1 }}>قبلی</button>
                  <button type="button" disabled={pagination.page >= pagination.totalPages || isLoadingProducts} onClick={() => loadProducts(pagination.page + 1)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', opacity: pagination.page >= pagination.totalPages ? 0.45 : 1 }}>بعدی</button>
                </div>
              </div>
            </div>

            {/* Right Column: Importer Widget & Sidebar details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Importer Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(248, 120, 32, 0.15)', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📥 افزودن محصول از لینک
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={productLinkInput || ""}
                    onChange={e => setProductLinkInput(e.target.value)}
                    placeholder="لینک کالا از Amazon.ae یا Noon یا Namshi..." 
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '11px', outline: 'none' }}
                  />
                  <button 
                    onClick={handleFetchProductFromLink}
                    disabled={isFetchingProductLink}
                    style={{ 
                      width: '100%', 
                      padding: '9px', 
                      background: 'linear-gradient(135deg, var(--admin-orange), #e65f00)', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      fontWeight: 'bold', 
                      cursor: 'pointer', 
                      fontSize: '11.5px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isFetchingProductLink ? 'در حال استخراج اطلاعات...' : 'دریافت اطلاعات'}
                  </button>
                </div>
                
                <span style={{ display: 'block', fontSize: '9.5px', color: '#8b92a5', marginTop: '6px', textAlign: 'center' }}>
                  سیستم به طور خودکار نام، برند، تصویر و قیمت درهم را استخراج می‌کند.
                </span>
              </div>

              {/* Details Panel Sidebar */}
              {selectedProduct ? (
                <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    📋 جزئیات محصول خارجی
                  </h3>
                  
                  {/* Img and name header */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', lineHeight: '1.4' }}>{selectedProduct.name}</span>
                      <span style={{ fontSize: '11px', color: '#8b92a5' }}>برند: {selectedProduct.brand}</span>
                    </div>
                  </div>

                  {/* Cost Calculator Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b92a5' }}>فروشگاه مبدا:</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{getProductSourceStore(selectedProduct)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b92a5' }}>قیمت اصلی به درهم:</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedBreakdown?.priceAed} AED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b92a5' }}>وزن محصول:</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedBreakdown?.weight} KG</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                      <span style={{ color: '#8b92a5' }}>هزینه ارسال مبدا تا تهران:</span>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedBreakdown?.shippingCost.toFixed(0)} AED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b92a5' }}>کارمزد خرید ({selectedBreakdown?.commissionPct}%):</span>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedBreakdown?.commissionCost.toFixed(0)} AED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b92a5' }}>نرخ فعلی درهم (تومان):</span>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedBreakdown?.aedRateValue.toLocaleString()} تومان</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--admin-orange)', fontWeight: 'bold' }}>قیمت نهایی مصرف‌کننده:</span>
                      <span style={{ color: 'var(--admin-orange)', fontWeight: '900' }}>{selectedBreakdown?.finalPriceToman.toLocaleString()} تومان</span>
                    </div>
                  </div>

                  {/* Order stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginBottom: '16px', fontSize: '11px', color: '#8b92a5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>تعداد سفارش ثبت شده:</span>
                      <span style={{ color: '#fff' }}>—</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>تعداد فروش موفق:</span>
                      <span style={{ color: '#fff' }}>—</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>آخرین سفارش ثبت‌شده:</span>
                      <span style={{ color: '#fff' }}>—</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {can(ADMIN_PERMISSIONS.PRODUCTS_EDIT) && <button 
                        onClick={() => handleEditClick(selectedProduct)}
                        style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✏️ ویرایش محصول
                      </button>}
                      {can(ADMIN_PERMISSIONS.PRODUCTS_EDIT) && <button 
                        onClick={() => handlePromptUpdatePrice(selectedProduct)}
                        style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        💰 بروزرسانی قیمت
                      </button>}
                    </div>
                    
                    <button 
                      onClick={() => getProductOriginalLink(selectedProduct) && window.open(getProductOriginalLink(selectedProduct), '_blank', 'noopener,noreferrer')}
                      disabled={!getProductOriginalLink(selectedProduct)}
                      style={{ width: '100%', padding: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🔗 مشاهده لینک اصلی محصول
                    </button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {can(ADMIN_PERMISSIONS.PRODUCTS_EDIT) && <button 
                        onClick={() => handleToggleHide(selectedProduct.id)}
                        style={{ padding: '8px', background: getProductForeignStatus(selectedProduct) === 'hidden' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)', border: getProductForeignStatus(selectedProduct) === 'hidden' ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: getProductForeignStatus(selectedProduct) === 'hidden' ? '#10b981' : '#c0c8d8', fontSize: '11px', cursor: 'pointer' }}
                      >
                        {getProductForeignStatus(selectedProduct) === 'hidden' ? '👁️ نمایش مجدد' : '👁️‍🗨️ مخفی کردن'}
                      </button>}
                      {can(ADMIN_PERMISSIONS.PRODUCTS_DELETE) && <button 
                        onClick={() => handleDeleteProduct(selectedProduct.id)}
                        style={{ padding: '8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ❌ حذف محصول
                      </button>}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>
                  محصولی جهت نمایش انتخاب نشده است.
                </div>
              )}
            </div>
          </div>

          {isEditProductModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
              <div style={{ background: '#0f111a', border: '1px solid rgba(248,120,32,0.2)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', margin: 0 }}>✏️ ویرایش اطلاعات محصول خارجی</h2>
                  <button onClick={() => setIsEditProductModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8b92a5', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>
                
                <form onSubmit={handleEditProductSubmitLocal} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>نام محصول:</label>
                    <input 
                      type="text" 
                      required
                      value={editProductForm.name || ""}
                      onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})}
                      style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>توضیحات محصول:</label>
                    <textarea
                      rows={7}
                      maxLength={20000}
                      value={editProductForm.description || ''}
                      onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                      placeholder="توضیحات کامل محصول را وارد کنید..."
                      style={{ minHeight: '160px', resize: 'vertical', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', lineHeight: '1.8', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>دسته‌بندی (ضروری):</label>
                    <select required value={editProductForm.category} onChange={e => setEditProductForm(previous => ({ ...previous, category: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}>
                      <option value="">انتخاب دسته‌بندی</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <AdminBrandSelector
                      brands={safeBrands}
                      categoryId={editProductForm.category}
                      value={editProductForm.brandId}
                      onChange={brandId => setEditProductForm(previous => ({ ...previous, brandId }))}
                      onBrandsChange={setBrands}
                      disabled={productImageUploading === 'edit'}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#8b92a5' }}>فروشگاه مبدا:</label>
                      <select 
                        required
                        value={editProductForm.storeId || ""}
                        onChange={(e) => setEditProductForm({...editProductForm, storeId: e.target.value})}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="" style={{ background: '#1c1d24' }}>انتخاب فروشگاه</option>
                        {stores.map(store => <option key={store.id} value={store.id} style={{ background: '#1c1d24' }}>{store.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#8b92a5' }}>قیمت به درهم (AED):</label>
                      <input 
                        type="number" 
                        required
                        min="0.1"
                        step="any"
                        value={editProductForm.priceAed || ""}
                        onChange={(e) => setEditProductForm({...editProductForm, priceAed: e.target.value})}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#8b92a5' }}>وزن (کیلوگرم):</label>
                      <input 
                        type="number" 
                        required
                        min="0.01"
                        step="any"
                        value={editProductForm.weight || ""}
                        onChange={(e) => setEditProductForm({...editProductForm, weight: e.target.value})}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>لینک اصلی محصول:</label>
                    <input 
                      type="text" 
                      required
                      value={editProductForm.originalLink || ""}
                      onChange={(e) => setEditProductForm({...editProductForm, originalLink: e.target.value})}
                      style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>

                  <AdminProductImageField
                    value={editProductImage}
                    onChange={setEditProductImage}
                    uploading={productImageUploading === 'edit'}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>ویژگی‌های نمایش محصول:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={editProductForm.gender === 'men'} 
                          onChange={(e) => setEditProductForm({...editProductForm, gender: e.target.checked ? 'men' : ''})} 
                        />
                        مردانه (Men)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={editProductForm.gender === 'women'} 
                          onChange={(e) => setEditProductForm({...editProductForm, gender: e.target.checked ? 'women' : ''})} 
                        />
                        زنانه (Women)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={editProductForm.gender === 'kids'} 
                          onChange={(e) => setEditProductForm({...editProductForm, gender: e.target.checked ? 'kids' : ''})} 
                        />
                        بچگانه (Kids)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={editProductForm.discountPercent > 0} 
                          onChange={(e) => setEditProductForm({...editProductForm, discountPercent: e.target.checked ? 20 : 0})} 
                        />
                        تخفیف خورده (Sale)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={editProductForm.isBestSeller === true} 
                          onChange={(e) => setEditProductForm({...editProductForm, isBestSeller: e.target.checked})} 
                        />
                        پرفروش‌ترین‌ها
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>وضعیت محصول:</label>
                    <select 
                      value={editProductForm.foreignStatus || ""}
                      onChange={(e) => setEditProductForm({...editProductForm, foreignStatus: e.target.value})}
                      style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="active" style={{ background: '#1c1d24' }}>🟢 فعال</option>
                      <option value="needs_update" style={{ background: '#1c1d24' }}>🟡 نیاز به بروزرسانی قیمت</option>
                      <option value="broken_link" style={{ background: '#1c1d24' }}>🔴 لینک خراب</option>
                      <option value="hidden" style={{ background: '#1c1d24' }}>⚫ مخفی</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setIsEditProductModalOpen(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '11.5px' }}>انصراف</button>
                    <button type="submit" disabled={productImageUploading === 'edit'} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--admin-orange), #ff9d00)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: productImageUploading === 'edit' ? 'wait' : 'pointer', fontSize: '11.5px' }}>{productImageUploading === 'edit' ? 'در حال آپلود…' : 'ذخیره تغییرات'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Product Manual Modal */}
          {isAddProductManualOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
              <div style={{ background: '#0f111a', border: '1px solid rgba(248,120,32,0.2)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', margin: 0 }}>➕ افزودن دستی محصول خارجی</h2>
                  <button onClick={() => setIsAddProductManualOpen(false)} style={{ background: 'none', border: 'none', color: '#8b92a5', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>
                
                <form onSubmit={handleManualAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>نام محصول:</label>
                    <input 
                      type="text" 
                      required
                      value={addProductManualForm.name || ""}
                      onChange={(e) => setAddProductManualForm({...addProductManualForm, name: e.target.value})}
                      placeholder="مثال: Apple Watch Ultra 2"
                      style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>توضیحات محصول:</label>
                    <textarea
                      rows={7}
                      maxLength={20000}
                      value={addProductManualForm.description || ''}
                      onChange={(e) => setAddProductManualForm({ ...addProductManualForm, description: e.target.value })}
                      placeholder="توضیحات کامل محصول را وارد کنید..."
                      style={{ minHeight: '160px', resize: 'vertical', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', lineHeight: '1.8', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>دسته‌بندی (ضروری):</label>
                    <select
                      required
                      value={addProductManualForm.category}
                      onChange={e => setAddProductManualForm(previous => ({ ...previous, category: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="" style={{ background: '#1c1f2a' }}>انتخاب دسته‌بندی</option>
                      {categories.map(category => <option key={category.id} value={category.id} style={{ background: '#1c1f2a' }}>{category.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <AdminBrandSelector
                      brands={safeBrands}
                      categoryId={addProductManualForm.category}
                      value={addProductManualForm.brandId}
                      onChange={brandId => setAddProductManualForm(previous => ({ ...previous, brandId }))}
                      onBrandsChange={setBrands}
                      disabled={productImageUploading === 'add'}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#8b92a5' }}>فروشگاه مبدا:</label>
                      <select 
                        required
                        value={addProductManualForm.storeId || ""}
                        onChange={(e) => setAddProductManualForm({...addProductManualForm, storeId: e.target.value})}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="" style={{ background: '#1c1d24' }}>انتخاب فروشگاه</option>
                        {stores.map(store => <option key={store.id} value={store.id} style={{ background: '#1c1d24' }}>{store.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#8b92a5' }}>قیمت به درهم (AED):</label>
                      <input 
                        type="number" 
                        required
                        min="0.1"
                        step="any"
                        value={addProductManualForm.priceAed || ""}
                        onChange={(e) => setAddProductManualForm({...addProductManualForm, priceAed: e.target.value})}
                        placeholder="مثال: 3199"
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#8b92a5' }}>وزن (کیلوگرم):</label>
                      <input 
                        type="number" 
                        required
                        min="0.01"
                        step="any"
                        value={addProductManualForm.weight || ""}
                        onChange={(e) => setAddProductManualForm({...addProductManualForm, weight: e.target.value})}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', color: '#8b92a5' }}>لینک اصلی محصول:</label>
                    <input 
                      type="text" 
                      value={addProductManualForm.originalLink || ""}
                      onChange={(e) => setAddProductManualForm({...addProductManualForm, originalLink: e.target.value})}
                      placeholder="مثال: https://www.amazon.ae/dp/..."
                      style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>

                  <AdminProductImageField
                    value={addProductImage}
                    onChange={setAddProductImage}
                    uploading={productImageUploading === 'add'}
                  />

                  {/* Best-seller & Discount toggles - warehouse style */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>تنظیمات نمایش در وبسایت</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* isBestSeller */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAddProductManualForm(prev => ({ ...prev, isBestSeller: !prev.isBestSeller }))}>
                        <div style={{
                          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                          background: addProductManualForm.isBestSeller ? 'linear-gradient(135deg, #f87820, #d4590c)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px',
                            left: addProductManualForm.isBestSeller ? '19px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ color: '#d4d8e8', fontSize: '12px', userSelect: 'none' }}>🔥 پرفروش (Best Seller) — نمایش در بخش پرفروش‌های سایت</span>
                      </div>

                      {/* hasDiscount */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAddProductManualForm(prev => ({ ...prev, hasDiscount: !prev.hasDiscount, discountPercent: !prev.hasDiscount ? prev.discountPercent : 0 }))}>
                        <div style={{
                          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                          background: addProductManualForm.hasDiscount ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px',
                            left: addProductManualForm.hasDiscount ? '19px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ color: '#d4d8e8', fontSize: '12px', userSelect: 'none' }}>🏷️ دارای تخفیف — نمایش برچسب تخفیف روی کالا</span>
                      </div>

                      {/* discountPercent — shown only when hasDiscount is on */}
                      {addProductManualForm.hasDiscount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', paddingRight: '46px' }}>
                          <label style={{ color: '#8b92a5', fontSize: '11px', whiteSpace: 'nowrap' }}>درصد تخفیف:</label>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={addProductManualForm.discountPercent || ""}
                              onChange={e => setAddProductManualForm(prev => ({ ...prev, discountPercent: e.target.value }))}
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

                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setIsAddProductManualOpen(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '11.5px' }}>انصراف</button>
                    <button type="submit" disabled={productImageUploading === 'add'} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--admin-orange), #ff9d00)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: productImageUploading === 'add' ? 'wait' : 'pointer', fontSize: '11.5px' }}>{productImageUploading === 'add' ? 'در حال آپلود…' : 'ثبت محصول'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AdminShell>
  );
}
