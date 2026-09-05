'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminShell, { useAdminShellData } from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import AdminProductConfigurator from '@/components/admin/products/AdminProductConfigurator';
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
  const [productConfigurator, setProductConfigurator] = useState(null);
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
      const response = await fetch(`/api/fetch-product?url=${encodeURIComponent(productLinkInput.trim())}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      const product = payload.success ? payload : payload.product;
      if (!product && !payload.success) throw new Error(payload.error === 'UNSUPPORTED_STORE'
        ? 'لطفاً یک لینک معتبر از آمازون امارات، نون یا نمشی وارد نمایید.'
        : 'اطلاعات محصول از لینک دریافت نشد.');

      const matchedBrand = brands.find(item => item.name.toLowerCase() === String(product.brand || '').toLowerCase());
      const matchedStore = stores.find(item => {
        try { return product.store && new URL(item.url || 'https://invalid.local').hostname.includes(product.store); }
        catch { return item.name.toLowerCase().includes(String(product.store || '').split('.')[0].toLowerCase()); }
      });
      const matchedCategory = categories.find(item => item.query === product.category || item.name.includes(product.category || ''));
      setProductConfigurator({ mode: 'add', seed: {
        nameFa: '',
        nameEn: product.nameEn || product.title || '',
        description: product.description || '',
        brandId: matchedBrand?.id || '',
        categoryId: matchedCategory?.id || '',
        storeId: matchedStore?.id || '',
        priceAed: product.priceAed ?? '',
        weight: String(product.weight || 1),
        originalLink: product.sourceUrl || productLinkInput.trim(),
        image: product.imageUrl || '',
        gender: '',
        discountPercent: '0',
        hasDiscount: false,
        isBestSeller: false,
      } });
      setProductLinkInput('');
      if (payload.error === 'PRICE_NOT_FOUND') {
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
    setProductConfigurator({ mode: 'edit', productId: prod.id });
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
                🌐 مدیریت محصولات
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#8b92a5' }}>
                مدیریت محصولات سفارش از دبی و موجود در ایران، ویژگی‌ها و تنوع‌های قابل فروش
              </p>
            </div>
            
            {can(ADMIN_PERMISSIONS.PRODUCTS_CREATE) && <button 
              onClick={() => setProductConfigurator({
                mode: 'add',
                seed: { storeId: stores[0]?.id || '', weight: '1' },
              })}
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
                      {can(ADMIN_PERMISSIONS.PRODUCTS_EDIT) && selectedProduct.supplyMode === 'EXTERNAL_DUBAI' && <button
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

          {productConfigurator && (
            <AdminProductConfigurator
              mode={productConfigurator.mode}
              productId={productConfigurator.productId}
              seed={productConfigurator.seed}
              brands={safeBrands}
              categories={categories}
              stores={stores}
              onBrandsChange={setBrands}
              onClose={() => setProductConfigurator(null)}
              onSaved={async payload => {
                setSelectedAdminProductId(payload.product.id);
                setProductConfigurator(null);
                await loadProducts(productConfigurator.mode === 'edit' ? pagination.page : 1);
                alert(productConfigurator.mode === 'edit'
                  ? 'محصول و تنوع‌ها با موفقیت ویرایش شدند.'
                  : 'محصول و تنوع‌ها با موفقیت ثبت شدند.');
              }}
            />
          )}
      </div>
    </AdminShell>
  );
}
