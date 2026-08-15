'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import { AdminIcons } from '@/components/admin/AdminIcons';
import styles from '@/app/admin/Admin.module.css';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setLoginError('ایمیل یا رمز عبور اشتباه است.');
        return;
      }

      setPassword('');
      router.replace(ADMIN_ROUTES.overview);
      router.refresh();
    } catch {
      setLoginError('ورود در حال حاضر امکان‌پذیر نیست.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} className={styles.loginCard}>
        <span className={styles.loginLogo}>{AdminIcons.plane(36)}</span>
        <h1>پنل مدیریت دبی خرید</h1>
        <p>جهت دسترسی به سفارشات، آپلود محصولات و نظرات کاربران، وارد شوید.</p>

        {loginError && <div className={styles.loginError}>{loginError}</div>}

        <div className={styles.formGroup}>
          <label>ایمیل مدیر:</label>
          <input
            type="email"
            placeholder="ایمیل مدیر را وارد کنید..."
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.loginInput}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>رمز عبور:</label>
          <input
            type="password"
            placeholder="رمز عبور پنل را وارد کنید..."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={styles.loginInput}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className={styles.loginBtn} disabled={isSubmitting}>
          {isSubmitting ? 'در حال ورود...' : 'ورود به داشبورد مدیریت'}
        </button>

        <div style={{ marginTop: '20px', fontSize: '11px', color: '#8b92a5' }}>
          <Link href="/" style={{ color: '#f87820', textDecoration: 'none', fontWeight: 'bold' }}>
            بازگشت به صفحه اصلی فروشگاه
          </Link>
        </div>
      </form>
    </div>
  );
}
