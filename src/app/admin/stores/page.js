'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';

const DEFAULT_STORES_SEED = [
  { id: 'noon', name: 'Noon', desc: 'فروشگاه آنلاین چندمنظوره با ارسال سریع در دبی', url: 'https://www.noon.com/uae-en/', hasImage: true, img: '/images/logo/Noon.webp' },
  { id: 'namshi', name: 'Namshi', desc: 'مد و پوشاک، کیف، کفش و اکسسوری', url: 'https://www.namshi.com/uae-en/', hasImage: false, fallback: 'NAMSHI' },
  { id: 'ounass', name: 'Ounass', desc: 'فروشگاه لوکس برندهای جهانی', url: 'https://www.ounass.ae', hasImage: false, fallback: 'OUNASS' },
  { id: 'amazon', name: 'Amazon.ae', desc: 'خرید انواع کالا با ارسال سریع به امارات و دبی', url: 'https://www.amazon.ae', hasImage: true, img: '/images/logo/amazon.png' },
  { id: '6thstreet', name: '6thStreet', desc: 'مد و فشن با بهترین برندها', url: 'https://www.6thstreet.com/ae/en/', hasImage: false, fallback: '6thSTREET' },
  { id: 'modanisa', name: 'Modanisa', desc: 'فروشگاه آنلاین پوشاک مناسب بانوان', url: 'https://www.modanisa.com/en/', hasImage: false, fallback: 'modanisa' }
];

export default function AdminStoresPage() {
  const [stores, setStores] = useState([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // Add/Edit store modal states
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [editStoreForm, setEditStoreForm] = useState({
    id: '', name: '', desc: '', url: '', img: '', fallback: '', hasImage: false
  });
  const [addStoreForm, setAddStoreForm] = useState({
    name: '', desc: '', url: '', img: '', fallback: '', hasImage: false
  });

  useEffect(() => {
    // Fetch Stores from database
    fetch('/api/admin/stores')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && !data.error) {
          setStores(data.length > 0 ? data : DEFAULT_STORES_SEED);
        } else {
          setStores(DEFAULT_STORES_SEED);
        }
      })
      .catch(e => {
        console.error('Error fetching stores:', e);
        setStores(DEFAULT_STORES_SEED);
      });
  }, []);

  const handleAddStore = async (e) => {
    if (e) e.preventDefault();
    if (!(addStoreForm.name || '').trim()) {
      alert('لطفا نام انگلیسی فروشگاه را وارد کنید.');
      return;
    }
    const id = (addStoreForm.name || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (stores.some(s => s.id === id)) {
      alert('این فروشگاه قبلا اضافه شده است.');
      return;
    }
    const newStore = {
      id,
      name: (addStoreForm.name || '').trim(),
      desc: (addStoreForm.desc || '').trim() || (addStoreForm.name || '').trim(),
      url: (addStoreForm.url || '').trim(),
      img: (addStoreForm.img || '').trim(),
      fallback: (addStoreForm.fallback || '').trim() || '🏬',
      hasImage: !!(addStoreForm.img || '').trim()
    };
    
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
      });
      if (!res.ok) throw new Error('Failed to create store');
      const createdStore = await res.json();
      
      const updated = [...stores, createdStore];
      setStores(updated);
      setIsAddStoreOpen(false);
      setAddStoreForm({
        name: '', desc: '', url: '', img: '', fallback: '', hasImage: false
      });
      alert('فروشگاه جدید با موفقیت ذخیره شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره فروشگاه در سرور.');
    }
  };

  const handleEditStore = async (e) => {
    if (e) e.preventDefault();
    if (!(editStoreForm.name || '').trim()) return;
    
    const existingStore = stores.find(s => s.id === editStoreForm.id) || {};
    const updateData = {
      name: (editStoreForm.name || '').trim(),
      desc: (editStoreForm.desc || '').trim() || (editStoreForm.name || '').trim(),
      url: (editStoreForm.url || '').trim(),
      img: (editStoreForm.img || '').trim() || existingStore.img,
      fallback: (editStoreForm.fallback || '').trim() || existingStore.fallback,
      hasImage: !!(editStoreForm.img || '').trim()
    };

    try {
      const res = await fetch(`/api/admin/stores/${editStoreForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Failed to update store');
      const savedStore = await res.json();
      
      const updated = stores.map(s => s.id === editStoreForm.id ? savedStore : s);
      setStores(updated);
      setIsEditStoreOpen(false);
      alert('فروشگاه با موفقیت ویرایش شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ویرایش فروشگاه.');
    }
  };

  const handleDeleteStore = async (id) => {
    if (!confirm('آیا از حذف این فروشگاه اطمینان دارید؟')) return;
    
    try {
      const res = await fetch(`/api/admin/stores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete store');
      
      const updated = stores.filter(s => s.id !== id);
      setStores(updated);
      alert('فروشگاه با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در حذف فروشگاه.');
    }
  };

  return (
    <AdminShell activeTab="stores">
        <div className={styles.contentPad}>
          <div className={styles.headerBar}>
            <h1 className={styles.pageTitle}>{AdminIcons.stores} فروشگاه‌های مرجع</h1>
            <p className={styles.pageSubtitle}>مدیریت فروشگاه‌های آنلاین خارجی</p>
          </div>
          
          <div className={styles.cardPanel} style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏬 فروشگاه‌های مرجع (امارات)
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(248,120,32,0.1)', color: '#f87820', fontWeight: '700' }}>{stores.length} فروشگاه</span>
              </h2>
              <button
                onClick={() => {
                  setAddStoreForm({ name: '', desc: '', url: '', img: '', fallback: '🏬', hasImage: false });
                  setIsAddStoreOpen(true);
                }}
                style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
              >
                + افزودن فروشگاه جدید
              </button>
            </div>

            {/* Store Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="جستجو در فروشگاه‌ها..."
                value={storeSearchQuery || ""}
                onChange={e => setStoreSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                  color: '#fff', fontSize: '12.5px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', paddingLeft: '4px' }}>
              {stores.filter(s => 
                (s.name || "").toLowerCase().includes((storeSearchQuery || "").toLowerCase()) || 
                (s.desc && s.desc.includes(storeSearchQuery || ""))
              ).map(store => (
                <div key={store.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden' }}>
                      {store.img && store.img.startsWith('http') ? (
                        <img src={store.img} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span>{store.fallback || '🏬'}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{store.name}</div>
                      <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px' }}>{store.desc} • <a href={store.url} target="_blank" rel="noopener noreferrer" style={{ color: '#f87820', textDecoration: 'none' }}>مشاهده سایت ↗</a></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditStoreForm(store);
                        setIsEditStoreOpen(true);
                      }}
                      style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#c0c8d8', cursor: 'pointer' }}
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteStore(store.id)}
                      style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              {stores.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>فروشگاهی تعریف نشده است.</div>
              )}
            </div>
          </div>
        </div>
      
      {/* MODALS */}
      {isAddStoreOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>➕ افزودن فروشگاه جدید</h3>
            <form onSubmit={handleAddStore}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام انگلیسی فروشگاه *</label>
                <input type="text" required value={addStoreForm.name || ""} onChange={e => setAddStoreForm({...addStoreForm, name: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام فارسی/توضیح کوتاه</label>
                <input type="text" value={addStoreForm.desc || ""} onChange={e => setAddStoreForm({...addStoreForm, desc: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>آدرس سایت فروشگاه (امارات)</label>
                <input type="url" value={addStoreForm.url || ""} onChange={e => setAddStoreForm({...addStoreForm, url: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} placeholder="https://www.amazon.ae/" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>تصویر لوگو فروشگاه (آدرس اینترنتی یا آپلود فایل)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={addStoreForm.img || ""}
                    onChange={e => setAddStoreForm({...addStoreForm, img: e.target.value})}
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
                            setAddStoreForm(prev => ({ ...prev, img: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {addStoreForm.img && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8b92a5' }}>پیش‌نمایش لوگو:</span>
                    <img src={addStoreForm.img} alt="Preview" style={{ height: '32px', maxWidth: '100px', objectFit: 'contain', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px' }} />
                    <button
                      type="button"
                      onClick={() => setAddStoreForm(prev => ({ ...prev, img: '' }))}
                      style={{ fontSize: '11px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      حذف تصویر
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddStoreOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>انصراف</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ذخیره فروشگاه</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Store Modal */}
      {isEditStoreOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>✏️ ویرایش فروشگاه {editStoreForm.name}</h3>
            <form onSubmit={handleEditStore}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام انگلیسی فروشگاه *</label>
                <input type="text" required value={editStoreForm.name || ""} onChange={e => setEditStoreForm({...editStoreForm, name: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام فارسی/توضیح کوتاه</label>
                <input type="text" value={editStoreForm.desc || ""} onChange={e => setEditStoreForm({...editStoreForm, desc: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>آدرس سایت فروشگاه (امارات)</label>
                <input type="url" value={editStoreForm.url || ""} onChange={e => setEditStoreForm({...editStoreForm, url: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>تصویر لوگو فروشگاه (آدرس اینترنتی یا آپلود فایل)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={editStoreForm.img || ""}
                    onChange={e => setEditStoreForm({...editStoreForm, img: e.target.value})}
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
                            setEditStoreForm(prev => ({ ...prev, img: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editStoreForm.img && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8b92a5' }}>پیش‌نمایش لوگو:</span>
                    <img src={editStoreForm.img} alt="Preview" style={{ height: '32px', maxWidth: '100px', objectFit: 'contain', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px' }} />
                    <button
                      type="button"
                      onClick={() => setEditStoreForm(prev => ({ ...prev, img: '' }))}
                      style={{ fontSize: '11px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      حذف تصویر
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditStoreOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>انصراف</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminShell>
  );
}
