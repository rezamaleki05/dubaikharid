import Link from 'next/link';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import styles from '@/app/admin/Admin.module.css';

export default function AdminForbiddenPage() {
  return (
    <div className={styles.pageWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.loginCard}>
        <h1>دسترسی غیرمجاز</h1>
        <p>حساب شما مجوز دسترسی به این بخش را ندارد.</p>
        <Link href={ADMIN_ROUTES.overview} className={styles.loginBtn} style={{ display: 'block', textDecoration: 'none' }}>
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
