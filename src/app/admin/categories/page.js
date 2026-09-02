'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import CategoryAttributeManager from '@/components/admin/catalog/CategoryAttributeManager';
import attributeUi from '@/components/admin/catalog/CatalogAttributeAdmin.module.css';

const DEFAULT_CATEGORIES_SEED = [
  { id: 'cat-1', name: 'لپ‌تاپ', icon: '💻', count: '۵ مدل پرفروش', query: 'لپ تاپ' },
  { id: 'cat-2', name: 'موبایل', icon: '📱', count: '۱۲ مدل پرفروش', query: 'موبایل' },
  { id: 'cat-3', name: 'لوازم الکترونیک', icon: '🎧', count: '۸ مدل پرفروش', query: 'الکترونیک' },
  { id: 'cat-4', name: 'ساعت مچی', icon: '⌚', count: '۷ مدل پرفروش', query: 'ساعت' },
  { id: 'cat-5', name: 'کفش ورزشی', icon: '👟', count: '۱۵ مدل پرفروش', query: 'کفش' },
  { id: 'cat-6', name: 'کیف و اکسسوری', icon: '👜', count: '۱۰ مدل پرفروش', query: 'کیف' },
  { id: 'cat-7', name: 'زیبایی و سلامت', icon: '🧴', count: '۹ مدل پرفروش', query: 'آرایشی' },
  { id: 'cat-8', name: 'پوشاک و لباس', icon: '👕', count: '۱۴ مدل پرفروش', query: 'لباس' },
  { id: 'cat-9', name: 'کودک و سرگرمی', icon: '🧸', count: '۶ مدل پرفروش', query: 'کودک' }
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [attributeCategory, setAttributeCategory] = useState(null);

  // Add/Edit category modal states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editCategoryForm, setEditCategoryForm] = useState({
    id: '', name: '', icon: '', count: '', query: ''
  });
  const [addCategoryForm, setAddCategoryForm] = useState({
    name: '', icon: '', count: '', query: ''
  });

  useEffect(() => {
    // Fetch Categories from database
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && !data.error) {
          setCategories(data.length > 0 ? data : DEFAULT_CATEGORIES_SEED);
        } else {
          setCategories(DEFAULT_CATEGORIES_SEED);
        }
      })
      .catch(e => {
        console.error('Error fetching categories:', e);
        setCategories(DEFAULT_CATEGORIES_SEED);
      });
  }, []);

  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    if (!(addCategoryForm.name || '').trim()) {
      alert('لطفا نام دسته‌بندی را وارد کنید.');
      return;
    }
    const id = 'cat-' + Date.now();
    const newCat = {
      id,
      name: (addCategoryForm.name || '').trim(),
      icon: (addCategoryForm.icon || '').trim() || '🏷️',
      count: (addCategoryForm.count || '').trim() || '۰ مدل پرفروش',
      query: (addCategoryForm.query || '').trim() || (addCategoryForm.name || '').trim()
    };
    
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (!res.ok) throw new Error('Failed to create category');
      const createdCategory = await res.json();
      
      const updated = [...categories, createdCategory];
      setCategories(updated);
      setIsAddCategoryOpen(false);
      setAddCategoryForm({ name: '', icon: '', count: '', query: '' });
      alert('دسته‌بندی جدید با موفقیت ذخیره شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره دسته‌بندی.');
    }
  };

  const handleEditCategory = async (e) => {
    if (e) e.preventDefault();
    if (!(editCategoryForm.name || '').trim()) return;
    
    const existingCategory = categories.find(c => c.id === editCategoryForm.id) || {};
    const updateData = {
      name: (editCategoryForm.name || '').trim(),
      icon: (editCategoryForm.icon || '').trim() || existingCategory.icon,
      count: (editCategoryForm.count || '').trim() || existingCategory.count,
      query: (editCategoryForm.query || '').trim() || existingCategory.query
    };

    try {
      const res = await fetch(`/api/admin/categories/${editCategoryForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Failed to update category');
      const savedCategory = await res.json();
      
      const updated = categories.map(c => c.id === editCategoryForm.id ? savedCategory : c);
      setCategories(updated);
      setIsEditCategoryOpen(false);
      alert('دسته‌بندی با موفقیت ویرایش شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در ویرایش دسته‌بندی.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
    
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      alert('دسته‌بندی با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      alert('خطا در حذف دسته‌بندی.');
    }
  };

  return (
    <AdminShell activeTab="categories">
        <div className={styles.contentPad}>
          <div className={styles.headerBar}>
            <h1 className={styles.pageTitle}>{AdminIcons.folder(24)} دسته‌بندی‌ها</h1>
            <p className={styles.pageSubtitle}>مدیریت دسته‌بندی‌های سایت</p>
          </div>
          
          <div className={styles.cardPanel} style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏷️ دسته‌بندی‌های سایت
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(248,120,32,0.1)', color: '#f87820', fontWeight: '700' }}>{categories.length} دسته</span>
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                <Link href="/admin/attributes" className={attributeUi.secondaryButton} style={{ textDecoration: 'none' }}>
                  مدیریت ویژگی‌ها
                </Link>
                <button
                  onClick={() => {
                    setAddCategoryForm({ name: '', icon: '', count: '', query: '' });
                    setIsAddCategoryOpen(true);
                  }}
                  className={attributeUi.primaryButton}
                >
                  + افزودن دسته جدید
                </button>
              </div>
            </div>

            {/* Category Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="جستجو در دسته‌بندی‌ها..."
                value={categorySearchQuery || ""}
                onChange={e => setCategorySearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                  color: '#fff', fontSize: '12.5px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', paddingLeft: '4px' }}>
              {categories.filter(c => 
                (c.name || "").toLowerCase().includes((categorySearchQuery || "").toLowerCase()) || 
                (c.query && c.query.includes(categorySearchQuery || ""))
              ).map(category => (
                <div key={category.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden' }}>
                      <span>{category.icon || '🏷️'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{category.name}</div>
                      <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px' }}>{category.count} • {category.query}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setAttributeCategory(category)}
                      className={`${attributeUi.secondaryButton} ${attributeUi.categoryTrigger}`}
                    >
                      ویژگی‌ها
                    </button>
                    <button
                      onClick={() => {
                        setEditCategoryForm(category);
                        setIsEditCategoryOpen(true);
                      }}
                      style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#c0c8d8', cursor: 'pointer' }}
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>دسته‌بندی تعریف نشده است.</div>
              )}
            </div>
          </div>
        </div>
        
      {/* 5. Add Category Modal */}
      {isAddCategoryOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)', direction: 'rtl' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>➕ افزودن دسته‌بندی جدید</h3>
            <form onSubmit={handleAddCategory}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام دسته‌بندی *</label>
                <input type="text" required value={addCategoryForm.name || ""} onChange={e => setAddCategoryForm({...addCategoryForm, name: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>ایموجی / آیکون دسته‌بندی</label>
                <input type="text" value={addCategoryForm.icon || ""} onChange={e => setAddCategoryForm({...addCategoryForm, icon: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} placeholder="🏷️ یا 👟" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>توضیحات / تعداد (مثلا: ۱۲ مدل پرفروش)</label>
                <input type="text" value={addCategoryForm.count || ""} onChange={e => setAddCategoryForm({...addCategoryForm, count: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} placeholder="۰ مدل پرفروش" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>فیلتر کوئری جستجو در آمازون/سایت (نام انگلیسی دسته)</label>
                <input type="text" value={addCategoryForm.query || ""} onChange={e => setAddCategoryForm({...addCategoryForm, query: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} placeholder="shoes" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddCategoryOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>انصراف</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ذخیره دسته‌بندی</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Category Modal */}
      {isEditCategoryOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={styles.cardPanel} style={{ padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)', direction: 'rtl' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>✏️ ویرایش دسته‌بندی {editCategoryForm.name}</h3>
            <form onSubmit={handleEditCategory}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>نام دسته‌بندی *</label>
                <input type="text" required value={editCategoryForm.name || ""} onChange={e => setEditCategoryForm({...editCategoryForm, name: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>ایموجی / آیکون دسته‌بندی</label>
                <input type="text" value={editCategoryForm.icon || ""} onChange={e => setEditCategoryForm({...editCategoryForm, icon: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>توضیحات / تعداد (مثلا: ۱۲ مدل پرفروش)</label>
                <input type="text" value={editCategoryForm.count || ""} onChange={e => setEditCategoryForm({...editCategoryForm, count: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '6px' }}>فیلتر کوئری جستجو در آمازون/سایت (نام انگلیسی دسته)</label>
                <input type="text" value={editCategoryForm.query || ""} onChange={e => setEditCategoryForm({...editCategoryForm, query: e.target.value})} style={{ width: '100%', padding: '10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditCategoryOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>انصراف</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {attributeCategory && (
        <CategoryAttributeManager
          category={attributeCategory}
          onClose={() => setAttributeCategory(null)}
        />
      )}

    </AdminShell>
  );
}
