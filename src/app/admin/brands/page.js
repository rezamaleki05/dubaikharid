'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';

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

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // Add/Edit brand modal states
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [editBrandForm, setEditBrandForm] = useState({
    id: '', name: '', faName: '', cat: 'مد و پوشاک', url: '', img: '', fallback: '', hasImage: false
  });
  const [addBrandForm, setAddBrandForm] = useState({
    name: '', faName: '', cat: 'مد و پوشاک', url: '', img: '', fallback: '', hasImage: false
  });

  useEffect(() => {
    // Fetch Brands from database
    fetch('/api/admin/brands')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && !data.error) {
          setBrands(data.length > 0 ? data : DEFAULT_BRANDS_SEED);
        } else {
          setBrands(DEFAULT_BRANDS_SEED);
        }
      })
      .catch(e => {
        console.error('Error fetching brands:', e);
        setBrands(DEFAULT_BRANDS_SEED);
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
    if (brands.some(b => b.id === id)) {
      alert('این برند قبلا اضافه شده است.');
      return;
    }
    const newBrand = {
      id,
      name: (addBrandForm.name || '').trim(),
      faName: (addBrandForm.faName || '').trim() || (addBrandForm.name || '').trim(),
      cat: addBrandForm.cat || 'مد و پوشاک',
      url: (addBrandForm.url || '').trim(),
      img: (addBrandForm.img || '').trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&q=80',
      fallback: (addBrandForm.fallback || '').trim() || '🏷️',
      hasImage: !!(addBrandForm.img || '').trim()
    };

    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBrand)
      });
      if (!res.ok) throw new Error('Failed to create brand');
      const createdBrand = await res.json();

      const updated = [...brands, createdBrand];
      setBrands(updated);
      setIsAddBrandOpen(false);
      setAddBrandForm({
        name: '', faName: '', cat: 'مد و پوشاک', url: '', img: '', fallback: '', hasImage: false
      });
      alert('برند جدید با موفقیت ذخیره شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره برند در سرور.');
    }
  };

  const handleEditBrand = async (e) => {
    if (e) e.preventDefault();
    if (!(editBrandForm.name || '').trim()) return;

    const existingBrand = brands.find(b => b.id === editBrandForm.id) || {};
    const updateData = {
      name: (editBrandForm.name || '').trim(),
      faName: (editBrandForm.faName || '').trim() || (editBrandForm.name || '').trim(),
      cat: editBrandForm.cat || 'مد و پوشاک',
      url: (editBrandForm.url || '').trim(),
      img: (editBrandForm.img || '').trim() || existingBrand.img,
      fallback: (editBrandForm.fallback || '').trim() || existingBrand.fallback,
      hasImage: !!(editBrandForm.img || '').trim()
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
                setAddBrandForm({ name: '', faName: '', cat: 'مد و پوشاک', url: '', img: '', fallback: '🏷️', hasImage: false });
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
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px' }}>{brand.faName} • {brand.cat}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditBrandForm(brand);
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
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>دسته‌بندی</label>
                <select value={addBrandForm.cat || ''} onChange={e => setAddBrandForm({...addBrandForm, cat: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}>
                  <option value="مد و پوشاک">مد و پوشاک</option>
                  <option value="کیف و کفش">کیف و کفش</option>
                  <option value="ساعت و اکسسوری">ساعت و اکسسوری</option>
                  <option value="عطر و آرایشی">عطر و آرایشی</option>
                  <option value="تکنولوژی">تکنولوژی</option>
                  <option value="خانه و دکوراسیون">خانه و دکوراسیون</option>
                  <option value="ورزشی ( اسپورت )">ورزشی ( اسپورت )</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
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
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>دسته‌بندی</label>
                <select value={editBrandForm.cat || ''} onChange={e => setEditBrandForm({...editBrandForm, cat: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}>
                  <option value="مد و پوشاک">مد و پوشاک</option>
                  <option value="کیف و کفش">کیف و کفش</option>
                  <option value="ساعت و اکسسوری">ساعت و اکسسوری</option>
                  <option value="عطر و آرایشی">عطر و آرایشی</option>
                  <option value="تکنولوژی">تکنولوژی</option>
                  <option value="خانه و دکوراسیون">خانه و دکوراسیون</option>
                  <option value="ورزشی ( اسپورت )">ورزشی ( اسپورت )</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
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
