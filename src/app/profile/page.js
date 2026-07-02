'use client';

import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Profile.module.css';

// Status style mapping
const getStatusLabel = (status) => {
  const mapping = {
    pending: { text: 'در انتظار بررسی اولیه', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', step: 1 },
    price_tagged: { text: 'بررسی و قیمت‌گذاری شده', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', step: 2 },
    approved: { text: 'تایید و پرداخت شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', step: 3 },
    purchased: { text: 'خریداری شده از دبی', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', step: 3 },
    noon_dubai: { text: 'خریداری شده (در نون دبی)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', step: 3 },
    processing: { text: 'در حال بسته‌بندی و پردازش انبار', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', step: 4 },
    warehouse_dubai: { text: 'موجود در انبار دبی', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', step: 4 },
    shipped: { text: 'ارسال شده به ایران (کارگو هوایی)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', step: 5 },
    delivered: { text: 'تحویل داده شده نهایی', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', step: 6 },
    cancelled: { text: 'لغو شده', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', step: 0 }
  };
  return mapping[status] || { text: 'در حال بررسی وضعیت', color: '#8b92a5', bg: 'rgba(255, 255, 255, 0.05)', step: 1 };
};

const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function ProfileContent() {
  const { currentUser, isLoggedIn, logout } = useAuth();
  const { settings } = useSiteSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('sub') || 'profile'; // 'profile' or 'orders'

  // Tab State
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Profile Form States
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Orders State
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Redirect guest users
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  // Sync tab status with URL query
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Hydrate user form fields
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditEmail(currentUser.email || '');
      setEditPhone(currentUser.phone || '');
      setEditAddress(currentUser.address || '');
    }
  }, [currentUser]);

  // Load and seed orders history
  useEffect(() => {
    if (!currentUser) return;

    try {
      const savedLeads = localStorage.getItem('dubaiKharidLeads');
      let leadsList = savedLeads ? JSON.parse(savedLeads) : [];

      // Seed mock order for رضا محمدی if no orders exist for them
      if (currentUser.phone === '09123456789' && !leadsList.some(l => l.phone === '09123456789')) {
        const mockOrder = {
          id: 'DK-1256',
          customerName: 'رضا محمدی',
          phone: '09123456789',
          address: 'تهران، خیابان ولیعصر، برج نیایش، واحد ۵',
          totalToman: 4850000,
          status: 'processing',
          paymentStatus: 'paid',
          paymentMethod: 'gateway',
          trackingNum: 'TRK-98127391-SH',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          productName: "Nike Air Force 1 '07",
          img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=85&auto=format&fit=crop',
          items: [
            { name: "Nike Air Force 1 '07", quantity: 1, color: 'سفید', size: '42' }
          ],
          store: 'noon.com',
          isRequest: true
        };

        leadsList.unshift(mockOrder);
        localStorage.setItem('dubaiKharidLeads', JSON.stringify(leadsList));
      }

      // Filter orders by phone number
      const filtered = leadsList.filter(l => l.phone === currentUser.phone);
      setUserOrders(filtered);
      
      if (filtered.length > 0) {
        setSelectedOrder(filtered[0]);
      }
    } catch (e) {
      console.error('Error loading user orders:', e);
    }
  }, [currentUser]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!editName) {
      alert('وارد کردن نام الزامی است.');
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      try {
        const usersSaved = localStorage.getItem('dubaiKharidUsers');
        let usersList = usersSaved ? JSON.parse(usersSaved) : [];

        const updatedUser = {
          ...currentUser,
          name: editName,
          email: editEmail,
          address: editAddress
        };

        // Update list
        const index = usersList.findIndex(u => u.phone === currentUser.phone);
        if (index !== -1) {
          usersList[index] = updatedUser;
        } else {
          usersList.push(updatedUser);
        }

        // Save
        localStorage.setItem('dubaiKharidUsers', JSON.stringify(usersList));
        localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(updatedUser));
        
        // Reload page data
        setToastMessage('پروفایل کاربری شما با موفقیت بروزرسانی شد.');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        console.error(err);
      }
      setIsUpdating(false);
    }, 1000);
  };

  if (!currentUser) {
    return (
      <div className={styles.pageWrapper}>
        <div style={{ padding: '100px', textAlign: 'center' }}>در حال بارگذاری پنل کاربری...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        
        {/* Page Header */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>پنل کاربری دبی خرید</h1>
          <p className={styles.subtitle}>مدیریت مشخصات فردی، آدرس تحویل کالا و پیگیری لحظه‌ای وضعیت سفارشات دبی</p>
        </div>

        {/* Dashboard Content Layout */}
        <div className={styles.dashboardGrid}>
          
          {/* Sidebar */}
          <aside className={styles.sidebarCard}>
            <img src={currentUser.avatar} alt="avatar" className={styles.profileAvatar} />
            <h2 className={styles.profileName}>{currentUser.name}</h2>
            <span className={styles.profileMeta}>ثبت نام شده در: {currentUser.dateRegistered || '۱۴۰۵'}</span>
            
            <div className={styles.sidebarMenu}>
              <button 
                className={`${styles.menuBtn} ${activeTab === 'profile' ? styles.menuBtnActive : ''}`}
                onClick={() => { setActiveTab('profile'); router.replace('/profile?sub=profile'); }}
              >
                👤 اطلاعات پروفایل
              </button>
              <button 
                className={`${styles.menuBtn} ${activeTab === 'orders' ? styles.menuBtnActive : ''}`}
                onClick={() => { setActiveTab('orders'); router.replace('/profile?sub=orders'); }}
              >
                📦 سفارشات و پیگیری کالا
              </button>
              <button 
                className={`${styles.menuBtn} ${styles.logoutBtn}`}
                onClick={() => { logout(); router.push('/'); }}
              >
                🚪 خروج از حساب کاربری
              </button>
            </div>
          </aside>

          {/* Content Card */}
          <section className={styles.contentCard}>
            
            {/* TOAST SUCCESS ALERT */}
            {toastMessage && (
              <div style={{ background: '#10b981', color: '#fff', fontSize: '13px', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ {toastMessage}
              </div>
            )}

            {/* TAB: PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <div>
                <h3 className={styles.sectionTitle}>ویرایش اطلاعات کاربری</h3>
                
                <form onSubmit={handleUpdateProfile}>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>نام و نام خانوادگی:</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={styles.inputField} 
                        placeholder="نام خود را وارد کنید"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>شماره همراه (غیرقابل ویرایش):</label>
                      <input 
                        type="text" 
                        value={editPhone}
                        className={`${styles.inputField} ${styles.inputFieldDisabled}`}
                        disabled
                        dir="ltr"
                      />
                    </div>
                    <div className={styles.inputGroupFull}>
                      <label className={styles.label}>آدرس ایمیل:</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className={styles.inputField} 
                        placeholder="example@mail.com"
                        dir="ltr"
                      />
                    </div>
                    <div className={styles.inputGroupFull}>
                      <label className={styles.label}>آدرس دقیق جهت تحویل کالا در ایران (کد پستی و پلاک):</label>
                      <textarea 
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className={`${styles.inputField} ${styles.textareaField}`}
                        placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، زنگ، واحد و کد پستی را به همراه جزئیات وارد کنید."
                      />
                    </div>
                  </div>
                  
                  <button type="submit" className={styles.saveBtn} disabled={isUpdating}>
                    {isUpdating ? 'در حال ثبت تغییرات...' : '✓ ذخیره مشخصات'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: ORDERS & TRACKING */}
            {activeTab === 'orders' && (
              <div>
                <h3 className={styles.sectionTitle}>سفارشات و پیگیری کارگو هوایی</h3>

                {/* If selected order exists, render the tracking visual stepper */}
                {selectedOrder ? (
                  <div>
                    <div className={styles.trackingSection}>
                      <div className={styles.trackingHeader}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>شناسه پیش‌فاکتور</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#ff9d00', fontSize: '14px' }}>{selectedOrder.id}</span>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>وضعیت فعلی</span>
                          <span 
                            style={{ 
                              background: getStatusLabel(selectedOrder.status).bg, 
                              color: getStatusLabel(selectedOrder.status).color,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            {getStatusLabel(selectedOrder.status).text}
                          </span>
                        </div>
                      </div>

                      {/* Visual Timeline Stepper */}
                      {selectedOrder.status !== 'cancelled' ? (
                        <div className={styles.timeline}>
                          <div className={styles.timelineLine}></div>
                          <div 
                            className={styles.timelineProgress}
                            style={{ 
                              width: `${Math.max(0, (getStatusLabel(selectedOrder.status).step - 1) * 20)}%` 
                            }}
                          ></div>

                          {/* Step 1 */}
                          <div className={`${styles.timelineStep} ${getStatusLabel(selectedOrder.status).step >= 1 ? styles.stepActive : ''} ${getStatusLabel(selectedOrder.status).step > 1 ? styles.stepCompleted : ''}`}>
                            <div className={styles.stepIcon}>۱</div>
                            <span className={styles.stepLabel}>ثبت اولیه</span>
                          </div>

                          {/* Step 2 */}
                          <div className={`${styles.timelineStep} ${getStatusLabel(selectedOrder.status).step >= 2 ? styles.stepActive : ''} ${getStatusLabel(selectedOrder.status).step > 2 ? styles.stepCompleted : ''}`}>
                            <div className={styles.stepIcon}>۲</div>
                            <span className={styles.stepLabel}>قیمت‌گذاری</span>
                          </div>

                          {/* Step 3 */}
                          <div className={`${styles.timelineStep} ${getStatusLabel(selectedOrder.status).step >= 3 ? styles.stepActive : ''} ${getStatusLabel(selectedOrder.status).step > 3 ? styles.stepCompleted : ''}`}>
                            <div className={styles.stepIcon}>۳</div>
                            <span className={styles.stepLabel}>پرداخت نهایی</span>
                          </div>

                          {/* Step 4 */}
                          <div className={`${styles.timelineStep} ${getStatusLabel(selectedOrder.status).step >= 4 ? styles.stepActive : ''} ${getStatusLabel(selectedOrder.status).step > 4 ? styles.stepCompleted : ''}`}>
                            <div className={styles.stepIcon}>۴</div>
                            <span className={styles.stepLabel}>بسته‌بندی دبی</span>
                          </div>

                          {/* Step 5 */}
                          <div className={`${styles.timelineStep} ${getStatusLabel(selectedOrder.status).step >= 5 ? styles.stepActive : ''} ${getStatusLabel(selectedOrder.status).step > 5 ? styles.stepCompleted : ''}`}>
                            <div className={styles.stepIcon}>۵</div>
                            <span className={styles.stepLabel}>کارگو هوایی</span>
                          </div>

                          {/* Step 6 */}
                          <div className={`${styles.timelineStep} ${getStatusLabel(selectedOrder.status).step >= 6 ? styles.stepActive : ''} ${getStatusLabel(selectedOrder.status).step > 6 ? styles.stepCompleted : ''}`}>
                            <div className={styles.stepIcon}>۶</div>
                            <span className={styles.stepLabel}>تحویل کالا</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px dashed rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          ❌ این پیش‌فاکتور توسط مدیریت یا به خواست شما لغو گردیده است.
                        </div>
                      )}
                    </div>

                    {/* Order Details Summary Block */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>کالای سفارش داده شده:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={selectedOrder.img} alt="product" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', display: 'block' }}>{selectedOrder.productName}</span>
                            <span style={{ fontSize: '10px', color: '#8b92a5' }}>خریداری شده از {selectedOrder.store || 'امارات'}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>مبلغ فاکتور:</span>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: '#f87820' }}>{fmtToman(selectedOrder.totalToman)} تومان</span>
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', marginTop: '4px' }}>
                          {selectedOrder.paymentStatus === 'paid' ? '💳 پرداخت شده آنلاین' : '⏳ در انتظار تایید پرداخت'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Orders List / History */}
                <div className={styles.ordersList}>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px', textAlign: 'right' }}>سابقه خریدهای من:</h4>
                  {userOrders.length === 0 ? (
                    <div className={styles.noOrders}>
                      <div className={styles.noOrdersIcon}>🛒</div>
                      <p>شما هنوز هیچ سفارشی ثبت نکرده‌اید.</p>
                      <button 
                        onClick={() => router.push('/')} 
                        style={{
                          background: 'transparent',
                          border: '1px solid #f87820',
                          color: '#f87820',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginTop: '16px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        شروع خرید از فروشگاه
                      </button>
                    </div>
                  ) : (
                    userOrders.map((order) => {
                      const isActive = selectedOrder && selectedOrder.id === order.id;
                      return (
                        <div 
                          key={order.id} 
                          className={`${styles.orderItem} ${isActive ? styles.orderItemActive : ''}`}
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            borderColor: isActive ? 'rgba(248, 120, 32, 0.4)' : 'rgba(255, 255, 255, 0.04)',
                            background: isActive ? 'rgba(248, 120, 32, 0.04)' : 'rgba(255, 255, 255, 0.02)'
                          }}
                        >
                          <div className={styles.orderInfo}>
                            <img src={order.img} alt={order.productName} className={styles.orderImg} />
                            <div className={styles.orderMeta}>
                              <span className={styles.orderId}>{order.id}</span>
                              <span className={styles.orderName}>{order.productName}</span>
                              <span className={styles.orderDate}>{new Date(order.date).toLocaleDateString('fa-IR')}</span>
                            </div>
                          </div>
                          
                          <div className={styles.orderPriceSection}>
                            <span className={styles.orderPrice}>{fmtToman(order.totalToman)} تومان</span>
                            <span 
                              className={styles.statusBadge}
                              style={{ 
                                color: getStatusLabel(order.status).color,
                                background: getStatusLabel(order.status).bg
                              }}
                            >
                              {getStatusLabel(order.status).text}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری پنل کاربری...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
