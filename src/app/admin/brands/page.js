'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';

function BrandCategoryFields({ form, setForm, categories }) {
  return (
    <>
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>
          دسته‌بندی‌های مرتبط
        </label>
        <select
          multiple
          value={form.categoryIds}
          onChange={event => setForm(previous => ({
            ...previous,
            categoryIds: [...event.target.selectedOptions].map(option => option.value),
          }))}
          style={{ width: '100%', minHeight: '110px', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
        >
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <p style={{ margin: '5px 0 0', color: '#697084', fontSize: '10px' }}>برای انتخاب چند مورد از Ctrl یا Command استفاده کنید.</p>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px', color: '#d4d8e8', fontSize: '12px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={form.showInBrandDirectory}
          onChange={event => setForm(previous => ({ ...previous, showInBrandDirectory: event.target.checked }))}
        />
        نمایش در صفحه برندها
      </label>
    </>
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // Add/Edit brand modal states
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [editBrandForm, setEditBrandForm] = useState({
    id: '', name: '', faName: '', cat: '', url: '', img: '', fallback: '', hasImage: false,
    categoryIds: [], showInBrandDirectory: true
  });
  const [addBrandForm, setAddBrandForm] = useState({
    name: '', faName: '', cat: '', url: '', img: '', fallback: '', hasImage: false,
    categoryIds: [], showInBrandDirectory: true
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/brands', { cache: 'no-store' }).then(res => res.json()),
      fetch('/api/admin/categories', { cache: 'no-store' }).then(res => res.json()),
    ])
      .then(([brandData, categoryData]) => {
        setBrands(Array.isArray(brandData) ? brandData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      })
      .catch(e => {
        console.error('Error fetching brand management data:', e);
        setBrands([]);
        setCategories([]);
      });
  }, []);

  // CRUD Handlers
  const handleAddBrand = async (e) => {
    if (e) e.preventDefault();
    if (!(addBrandForm.name || '').trim()) {
      alert('لطفا نام انگلیسی برند را وارد کنید.');
      return;
    }
    const id = (addBrandForm.name || '').trim().toLowerCase().replace(/\s+/g, '-');
    const primaryCategory = categories.find(category => addBrandForm.categoryIds.includes(category.id));
    const newBrand = {
      id,
      name: (addBrandForm.name || '').trim(),
      faName: (addBrandForm.faName || '').trim() || (addBrandForm.name || '').trim(),
      cat: primaryCategory?.name || null,
      url: (addBrandForm.url || '').trim(),
      img: (addBrandForm.img || '').trim(),
      fallback: (addBrandForm.fallback || '').trim() || '🏷️',
      hasImage: !!(addBrandForm.img || '').trim(),
      categoryIds: addBrandForm.categoryIds,
      showInBrandDirectory: addBrandForm.showInBrandDirectory,
    };
    
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBrand)
      });
      if (!res.ok) throw new Error('Failed to create brand');
      const createdBrand = await res.json();
      
      const updated = [...brands.filter(brand => brand.id !== createdBrand.id), createdBrand];
      setBrands(updated);
      setIsAddBrandOpen(false);
      setAddBrandForm({
        name: '', faName: '', cat: '', url: '', img: '', fallback: '', hasImage: false,
        categoryIds: [], showInBrandDirectory: true
      });
      alert(createdBrand.alreadyExists
        ? 'این برند از قبل وجود داشت و اطلاعات موجود آن حفظ شد.'
        : 'برند جدید با موفقیت ذخیره شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره برند در سرور.');
    }
  };

  const handleEditBrand = async (e) => {
    if (e) e.preventDefault();
    if (!(editBrandForm.name || '').trim()) return;
    
    const existingBrand = brands.find(b => b.id === editBrandForm.id) || {};
    const primaryCategory = categories.find(category => editBrandForm.categoryIds.includes(category.id));
    const updateData = {
      name: (editBrandForm.name || '').trim(),
      faName: (editBrandForm.faName || '').trim() || (editBrandForm.name || '').trim(),
      cat: primaryCategory?.name || existingBrand.cat || null,
      url: (editBrandForm.url || '').trim(),
      img: (editBrandForm.img || '').trim() || existingBrand.img,
      fallback: (editBrandForm.fallback || '').trim() || existingBrand.fallback,
      hasImage: !!(editBrandForm.img || '').trim(),
      categoryIds: editBrandForm.categoryIds,
      showInBrandDirectory: editBrandForm.showInBrandDirectory,
    };

    try {
      const res = await fetch(`/api/admin/brands/${editBrandForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Failed to update brand');
      const savedBrand = await res.json();
      
      const updated = brands.map(b => b.id === editBrandForm.id ? savedBrand : b);
      setBrands(updated);
      setIsEditBrandOpen(false);
      alert('برند با موفقیت ویرایش شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ویرایش برند.');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!confirm('آیا از حذف این برند اطمینان دارید؟')) return;
    
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete brand');
      
      const updated = brands.filter(b => b.id !== id);
      setBrands(updated);
      alert('برند با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در حذف برند.');
    }
  };

  const filteredBrands = brands.filter(b => 
    (b.name || '').toLowerCase().includes((brandSearchQuery || '').toLowerCase()) || 
    (b.faName && b.faName.includes(brandSearchQuery))
  );

  return (
    <AdminShell activeTab="brands">
      <div style={{ direction: 'rtl' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px', color: '#f87820' }}>{AdminIcons.tag(24)}</span>
            مدیریت برندها
          </h1>
          <p style={{ fontSize: '12px', color: '#8b92a5', margin: 0 }}>افزودن، ویرایش و حذف برندهای رسمی کالا</p>
        </div>

        <div className={styles.cardPanel} style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              👟 برندهای تعریف‌شده
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(248,120,32,0.1)', color: '#f87820', fontWeight: '700' }}>{filteredBrands.length} برند</span>
            </h2>
            <button
              onClick={() => {
                setAddBrandForm({ name: '', faName: '', cat: '', url: '', img: '', fallback: '🏷️', hasImage: false, categoryIds: [], showInBrandDirectory: true });
                setIsAddBrandOpen(true);
              }}
              style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
            >
              + افزودن برند جدید
            </button>
          </div>

          {/* Brand Search */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="جستجو در برندها..."
              value={brandSearchQuery || ''}
              onChange={e => setBrandSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                color: '#fff', fontSize: '12.5px', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingLeft: '4px' }}>
            {filteredBrands.map(brand => (
              <div key={brand.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden' }}>
                    {brand.img && brand.img.startsWith('http') ? (
                      <img src={brand.img} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span>{brand.fallback || '🏷️'}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{brand.name}</div>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px' }}>
                      {brand.faName} • {brand.categories?.map(category => category.name).join('، ') || brand.cat || 'بدون دسته‌بندی'}
                    </div>
                    <div style={{ fontSize: '10px', color: brand.showInBrandDirectory ? '#10b981' : '#f59e0b', marginTop: '3px' }}>
                      {brand.showInBrandDirectory ? 'نمایش در صفحه برندها' : 'مخفی از صفحه برندها'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditBrandForm({
                        ...brand,
                        categoryIds: Array.isArray(brand.categories) ? brand.categories.map(category => category.id) : [],
                        showInBrandDirectory: brand.showInBrandDirectory !== false,
                      });
                      setIsEditBrandOpen(true);
                    }}
                    style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#c0c8d8', cursor: 'pointer' }}
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(brand.id)}
                    style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
            {filteredBrands.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#8b92a5', fontSize: '13px' }}>برندی تعریف نشده است.</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Brand Modal */}
      {isAddBrandOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>➕ افزودن برند جدید</h3>
            <form onSubmit={handleAddBrand}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام انگلیسی برند *</label>
                <input type="text" required value={addBrandForm.name || ''} onChange={e => setAddBrandForm({...addBrandForm, name: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام فارسی برند</label>
                <input type="text" value={addBrandForm.faName || ''} onChange={e => setAddBrandForm({...addBrandForm, faName: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <BrandCategoryFields form={addBrandForm} setForm={setAddBrandForm} categories={categories} />
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>آدرس سایت برند (مستقیم امارات)</label>
                <input type="url" value={addBrandForm.url || ''} onChange={e => setAddBrandForm({...addBrandForm, url: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} placeholder="https://www.nike.com/ae/" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>تصویر لوگو برند (آدرس اینترنتی یا آپلود فایل)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={addBrandForm.img || ''}
                    onChange={e => setAddBrandForm({...addBrandForm, img: e.target.value})}
                    style={{ flex: 1, padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12.5px' }}
                    placeholder="https://example.com/logo.png"
                  />
                  <label
                    style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)',
                      borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                    }}
                  >
                    📁 آپلود فایل
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setAddBrandForm(prev => ({ ...prev, img: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {addBrandForm.img && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8b92a5' }}>پیش‌نمایش لوگو:</span>
                    <img src={addBrandForm.img} alt="Preview" style={{ height: '32px', maxWidth: '100px', objectFit: 'contain', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px' }} />
                    <button
                      type="button"
                      onClick={() => setAddBrandForm(prev => ({ ...prev, img: '' }))}
                      style={{ fontSize: '11px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      حذف تصویر
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddBrandOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>انصراف</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ذخیره برند</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {isEditBrandOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>✏️ ویرایش برند {editBrandForm.name}</h3>
            <form onSubmit={handleEditBrand}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام انگلیسی برند *</label>
                <input type="text" required value={editBrandForm.name || ''} onChange={e => setEditBrandForm({...editBrandForm, name: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام فارسی برند</label>
                <input type="text" value={editBrandForm.faName || ''} onChange={e => setEditBrandForm({...editBrandForm, faName: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <BrandCategoryFields form={editBrandForm} setForm={setEditBrandForm} categories={categories} />
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>آدرس سایت برند (مستقیم امارات)</label>
                <input type="url" value={editBrandForm.url || ''} onChange={e => setEditBrandForm({...editBrandForm, url: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>تصویر لوگو برند (آدرس اینترنتی یا آپلود فایل)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={editBrandForm.img || ''}
                    onChange={e => setEditBrandForm({...editBrandForm, img: e.target.value})}
                    style={{ flex: 1, padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12.5px' }}
                    placeholder="https://example.com/logo.png"
                  />
                  <label
                    style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)',
                      borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                    }}
                  >
                    📁 آپلود فایل
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setEditBrandForm(prev => ({ ...prev, img: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editBrandForm.img && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8b92a5' }}>پیش‌نمایش لوگو:</span>
                    <img src={editBrandForm.img} alt="Preview" style={{ height: '32px', maxWidth: '100px', objectFit: 'contain', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px' }} />
                    <button
                      type="button"
                      onClick={() => setEditBrandForm(prev => ({ ...prev, img: '' }))}
                      style={{ fontSize: '11px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      حذف تصویر
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditBrandOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>انصراف</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
