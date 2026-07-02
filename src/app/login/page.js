'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Login.module.css';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { settings } = useSiteSettings();
  const { login, register, triggerGoogleLogin, triggerAppleLogin, isLoggedIn } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/profile');
    }
  }, [isLoggedIn, router]);
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Status & Validation states
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  // Trigger Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  // Switch tabs cleanly and reset form states
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  // Basic Form Validation
  const validateForm = () => {
    const newErrors = {};
    
    const toEnglishDigits = (str) => {
      const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return str
        .replace(/[۰-۹]/g, (w) => farsiDigits.indexOf(w))
        .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w));
    };

    const cleanPhone = toEnglishDigits((phone || '').trim().replace(/\s+/g, ''));
    
    // Phone validation
    if (!cleanPhone) {
      newErrors.phone = 'وارد کردن شماره موبایل الزامی است';
    } else if (!/^(?:09|\+989|989|00989)\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'شماره موبایل معتبر نیست (مثال: 09123456789 یا +989123456789)';
    }

    // Email validation if filled
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'فرمت ایمیل وارد شده معتبر نیست';
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'وارد کردن رمز عبور الزامی است';
    } else if (password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    }

    if (activeTab === 'register') {
      // Name validation
      if (!name.trim()) {
        newErrors.name = 'وارد کردن نام و نام خانوادگی الزامی است';
      }
      
      // Password confirmation
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'رمز عبور و تایید آن همخوانی ندارند';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('لطفاً خطاهای فرم را برطرف کنید', 'error');
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      if (activeTab === 'login') {
        const res = login(phone, password);
        if (res.success) {
          showToast('ورود با موفقیت انجام شد. خوش آمدید!', 'success');
          setPhone('');
          setPassword('');
          setTimeout(() => router.push('/profile'), 800);
        } else {
          showToast(res.message, 'error');
        }
      } else {
        const res = register(name, phone, email, password);
        if (res.success) {
          showToast('ثبت‌نام با موفقیت انجام شد. حساب کاربری شما آماده است!', 'success');
          setName('');
          setPhone('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setTimeout(() => router.push('/profile'), 800);
        } else {
          showToast(res.message, 'error');
        }
      }
    }, 1200);
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        <div className={styles.authCard}>
          {/* Logo Area */}
          <div className={styles.logoArea}>
            <img src={settings.siteLogoUrl} alt={settings.siteName} className={styles.logoImg} />
            <p className={styles.subtitle}>خرید مستقیم از بازارهای بین‌المللی دبی به ایران</p>
          </div>

          {/* Login / Register Tab Toggles */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('login')}
            >
              ورود
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('register')}
            >
              ثبت نام
            </button>
          </div>

          {/* Auth Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            
            {/* Full Name field (Register only) */}
            {activeTab === 'register' && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>نام و نام خانوادگی *</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="text" 
                    placeholder="نام و نام خانوادگی خود را وارد کنید"
                    className={styles.inputField}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                {errors.name && <span style={{color: '#ff4d4d', fontSize: '11px', paddingRight: '4px'}}>{errors.name}</span>}
              </div>
            )}

            {/* Mobile Number field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>شماره موبایل *</label>
              <div className={styles.inputWrapper}>
                <input 
                  type="tel" 
                  placeholder="مثال: 09123456789"
                  className={styles.inputField}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'right', paddingRight: '42px' }}
                />
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              {errors.phone && <span style={{color: '#ff4d4d', fontSize: '11px', paddingRight: '4px'}}>{errors.phone}</span>}
            </div>

            {/* Email field (Optional for Registration) */}
            {activeTab === 'register' && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>ایمیل (اختیاری)</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="email" 
                    placeholder="example@mail.com"
                    className={styles.inputField}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    style={{ textAlign: 'right', paddingRight: '42px' }}
                  />
                  <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                {errors.email && <span style={{color: '#ff4d4d', fontSize: '11px', paddingRight: '4px'}}>{errors.email}</span>}
              </div>
            )}

            {/* Password field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>رمز عبور *</label>
              <div className={styles.inputWrapper}>
                <input 
                  type="password" 
                  placeholder="رمز عبور خود را وارد کنید"
                  className={styles.inputField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'right', paddingRight: '42px' }}
                />
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              {errors.password && <span style={{color: '#ff4d4d', fontSize: '11px', paddingRight: '4px'}}>{errors.password}</span>}
            </div>

            {/* Password Confirmation field (Register only) */}
            {activeTab === 'register' && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>تکرار رمز عبور *</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="password" 
                    placeholder="رمز عبور خود را مجدداً وارد کنید"
                    className={styles.inputField}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    style={{ textAlign: 'right', paddingRight: '42px' }}
                  />
                  <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                {errors.confirmPassword && <span style={{color: '#ff4d4d', fontSize: '11px', paddingRight: '4px'}}>{errors.confirmPassword}</span>}
              </div>
            )}

            {/* Remember Me and Forgot Password options (Login only) */}
            {activeTab === 'login' && (
              <div className={styles.helperRow}>
                <label className={styles.rememberMe}>
                  <input 
                    type="checkbox" 
                    className={styles.checkbox}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  مرا به خاطر بسپار
                </label>
                <a href="#" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); showToast('سرویس بازیابی رمز عبور موقتاً در دسترس نیست', 'error'); }}>
                  فراموشی رمز عبور؟
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  در حال بررسی...
                </>
              ) : (
                activeTab === 'login' ? 'ورود به حساب' : 'ثبت نام در سایت'
              )}
            </button>

            {/* Social Logins */}
            <div className={styles.divider}>یا</div>

            <div className={styles.socialButtons}>
              <button 
                type="button" 
                className={styles.socialBtn} 
                onClick={triggerGoogleLogin}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.18 0-5.76-2.58-5.76-5.76s2.58-5.76 5.76-5.76c1.5 0 2.87.58 3.93 1.5l3.176-3.176C19.14 1.63 15.9 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 12.24-4.88 12.24-12.24 0-.83-.075-1.64-.215-2.435H12.24z"></path>
                </svg>
                ورود با گوگل / Continue with Google
              </button>
              
              <button 
                type="button" 
                className={styles.socialBtn} 
                onClick={triggerAppleLogin}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.15-.52 2.81-1.33z"></path>
                </svg>
                ورود با اپل
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* Floating Status Toast Alert */}
      <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''} ${toast.show ? styles.toastShow : ''}`}>
        {toast.type === 'success' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )}
        <span>{toast.message}</span>
      </div>

      <Footer />
    </div>
  );
}
