'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>

      {/* ── TOP BAR ── */}
      <div className={styles.topBar}>
        <div className="container">
          <div className={styles.topBarInner}>
            {/* Right: shipping info */}
            <div className={styles.topBarRight}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <span>خرید مستقیم از دبی | ارسال سریع به سراسر ایران</span>
            </div>
            {/* Left: login */}
            <div className={styles.topBarLeft}>
              <a href="/login" className={styles.topBarLogin}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ورود / ثبت نام
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ROW ── */}
      <div className={styles.mainRow}>
        <div className="container">
          <div className={styles.mainRowInner}>

            {/* Logo */}
            <a href="/" className={styles.logo}>
              <img src="/images/logo dubai kharid.png" alt="دبی خرید" className={styles.logoImg} />
            </a>

            {/* Search — CENTER */}
            <div className={styles.searchBox}>
              <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
                <input
                  type="text"
                  placeholder="جستجو برای محصولات، برندها و دسته‌ها..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className={styles.searchBtn} aria-label="جستجو">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
              </form>
            </div>

            {/* Icons — LEFT in RTL */}
            <div className={styles.iconGroup}>
              {/* Wishlist */}
              <button className={styles.iconBtn} aria-label="علاقه‌مندی‌ها" onClick={() => router.push('/wishlist')}>
                <div className={styles.iconWrap}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
                </div>
              </button>
              {/* Cart */}
              <button className={styles.iconBtn} aria-label="سبد خرید" onClick={() => router.push('/cart')}>
                <div className={styles.iconWrap}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className="container">
          <ul className={styles.navList}>
            <li><a href="/" className={pathname === '/' ? styles.navActive : ''}>صفحه اصلی</a></li>
            <li><a href="/brands" className={pathname === '/brands' ? styles.navActive : ''}>برندها</a></li>
            <li><a href="/stock-laptops" className={pathname === '/stock-laptops' ? styles.navActive : ''}>لپتاپ استوک</a></li>
            <li className={styles.navDropdown}>
              <a href="/men" className={pathname === '/men' ? styles.navActive : ''}>مردانه</a>
              <ul className={styles.dropdownMenu}>
                <li><a href="/men?sub=clothing">لباس مردانه</a></li>
                <li><a href="/men?sub=pants">شلوار مردانه</a></li>
                <li><a href="/men?sub=shoes">کفش مردانه</a></li>
                <li><a href="/men?sub=accessories">اکسسوری مردانه</a></li>
              </ul>
            </li>
            <li className={styles.navDropdown}>
              <a href="/women" className={pathname === '/women' ? styles.navActive : ''}>زنانه</a>
              <ul className={styles.dropdownMenu}>
                <li><a href="/women?sub=clothing">لباس زنانه</a></li>
                <li><a href="/women?sub=pants">شلوار زنانه</a></li>
                <li><a href="/women?sub=shoes">کفش زنانه</a></li>
                <li><a href="/women?sub=accessories">اکسسوری زنانه</a></li>
              </ul>
            </li>
            <li className={styles.navDropdown}>
              <a href="/kids" className={pathname === '/kids' ? styles.navActive : ''}>کودک</a>
              <ul className={styles.dropdownMenu}>
                <li><a href="/kids?sub=clothing">لباس بچگانه</a></li>
                <li><a href="/kids?sub=pants">شلوار بچگانه</a></li>
                <li><a href="/kids?sub=shoes">کفش بچگانه</a></li>
              </ul>
            </li>
            <li><a href="/bags-accessories" className={pathname === '/bags-accessories' ? styles.navActive : ''}>کیف و اکسسوری</a></li>
            <li><a href="/best-sellers" className={pathname === '/best-sellers' ? styles.navActive : ''}>پرفروش‌ها</a></li>
            <li><a href="#">الکترونیک</a></li>
            <li><a href="/sale" className={styles.navSale}>تخفیف‌ها</a></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
