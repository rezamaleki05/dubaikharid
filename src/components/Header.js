'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import styles from './Header.module.css';

export default function Header() {
  const { settings } = useSiteSettings();
  const { currentUser, isLoggedIn, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  // Database of searchable terms
  const searchTerms = [
    { label: 'نایک (Nike)', query: 'nike', type: 'brand' },
    { label: 'آدیداس (Adidas)', query: 'adidas', type: 'brand' },
    { label: 'زارا (Zara)', query: 'zara', type: 'brand' },
    { label: 'گوچی (Gucci)', query: 'gucci', type: 'brand' },
    { label: 'شنل (Chanel)', query: 'chanel', type: 'brand' },
    { label: 'اپل (Apple)', query: 'apple', type: 'brand' },
    { label: 'مک‌بوک (MacBook)', query: 'macbook', type: 'product' },
    { label: 'آیفون (iPhone)', query: 'iphone', type: 'product' },
    { label: 'سامسونگ (Samsung)', query: 'samsung', type: 'brand' },
    { label: 'رولکس (Rolex)', query: 'rolex', type: 'brand' },
    { label: 'ری‌بن (Ray-Ban)', query: 'ray-ban', type: 'brand' },
    { label: 'لویی ویتون (Louis Vuitton)', query: 'louis vuitton', type: 'brand' },
    { label: 'مانگو (Mango)', query: 'mango', type: 'brand' },
    { label: 'اچ اند ام (H&M)', query: 'h&m', type: 'brand' },
    { label: 'کفش ورزشی مردانه', query: 'کفش', type: 'category' },
    { label: 'تی‌شرت ورزشی', query: 'لباس', type: 'category' },
    { label: 'شلوار لی و کتان', query: 'شلوار', type: 'category' },
    { label: 'کیف دستی و کوله‌پشتی', query: 'کیف', type: 'category' },
    { label: 'ساعت مچی لوکس', query: 'ساعت', type: 'category' },
    { label: 'عینک آفتابی خلبانی', query: 'عینک', type: 'category' },
    { label: 'لپتاپ استوک', query: 'لپتاپ', type: 'category' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (val) => {
    setSearchQuery(val);
    if (val.trim()) {
      const queryLower = val.toLowerCase().trim();
      const filtered = searchTerms.filter(term => 
        term.label.toLowerCase().includes(queryLower) ||
        term.query.includes(queryLower)
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term) => {
    setSearchQuery(term.label);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(term.query)}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const isActive = (href) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>

      {/* ── TOP BAR ── */}
      <div className={styles.topBar}>
        <div className="container">
          <div className={styles.topBarInner}>
            <div className={styles.topBarRight}>
              <span className={styles.servicePulse} aria-hidden="true" />
              <span>سفارش از فروشگاه‌های دبی، تحویل در ایران</span>
              <Link href="/buy-from-dubai" className={styles.topBarGuide}>راهنمای خرید</Link>
            </div>
            <div className={styles.topBarLeft}>
              {isLoggedIn && currentUser ? (
                <div className={styles.userMenuContainer}>
                  <button className={styles.userMenuTrigger}>
                    <span className={styles.userAvatar} aria-hidden="true">{currentUser.name?.trim()?.charAt(0) || 'ک'}</span>
                    <span>{currentUser.name}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                  </button>
                  <div className={styles.userDropdown}>
                    <Link href="/profile">پنل کاربری</Link>
                    <Link href="/profile?sub=orders">سفارش‌های من</Link>
                    <button onClick={logout} className={styles.logoutBtn}>خروج از حساب</button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className={styles.topBarLogin}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ورود / ثبت نام
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ROW ── */}
      <div className={styles.mainRow}>
        <div className="container">
          <div className={styles.mainRowInner}>

            <button
              type="button"
              className={`${styles.mobileMenuButton} ${isMobileMenuOpen ? styles.mobileMenuButtonOpen : ''}`}
              aria-label={isMobileMenuOpen ? 'بستن منوی اصلی' : 'باز کردن منوی اصلی'}
              aria-controls="store-navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>

            {/* Logo */}
            <Link href="/" className={styles.logo}>
              <img src={settings.siteLogoUrl} alt={settings.siteName} className={styles.logoImg} />
              <span className={styles.logoCaption}>خرید بی‌واسطه از دبی</span>
            </Link>

            {/* Search — CENTER */}
            <div className={styles.searchArea}>
              <div className={styles.searchBox}>
                <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
                  <input
                    type="text"
                    placeholder="جستجو برای محصولات، برندها و دسته‌ها..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <button type="submit" className={styles.searchBtn} aria-label="جستجو">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </form>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.suggestions} aria-label="پیشنهادهای جستجو">
                  {suggestions.map((term, index) => (
                    <li key={`${term.type}-${term.query}-${index}`}>
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSuggestionClick(term)}>
                        <span className={styles.suggestionIcon} aria-hidden="true">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                        </span>
                        <span>{term.label}</span>
                        <small>{term.type === 'brand' ? 'برند' : term.type === 'category' ? 'دسته‌بندی' : 'محصول'}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Icons — LEFT in RTL */}
            <div className={styles.iconGroup}>
              <ThemeSwitcher compact />
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
      <button
        type="button"
        className={`${styles.mobileMenuBackdrop} ${isMobileMenuOpen ? styles.mobileMenuBackdropVisible : ''}`}
        aria-label="بستن منوی اصلی"
        tabIndex={isMobileMenuOpen ? 0 : -1}
        onClick={closeMobileMenu}
      />
      <nav id="store-navigation" className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`} aria-label="منوی اصلی فروشگاه">
        <div className={styles.mobileNavHeader}>
          <div>
            <span className={styles.mobileNavEyebrow}>DUBAI KHARID</span>
            <strong>انتخاب مسیر خرید</strong>
          </div>
          <button type="button" onClick={closeMobileMenu} aria-label="بستن منو">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div className="container">
          <ul className={styles.navList}>
            <li><Link href="/" aria-current={isActive('/') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/') ? styles.navActive : ''}>صفحه اصلی</Link></li>
            <li><Link href="/brands" aria-current={isActive('/brands') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/brands') ? styles.navActive : ''}>برندها</Link></li>
            <li><Link href="/stock-laptops" aria-current={isActive('/stock-laptops') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/stock-laptops') ? styles.navActive : ''}>لپتاپ استوک</Link></li>
            <li className={styles.navDropdown}>
              <Link href="/men" aria-current={isActive('/men') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/men') ? styles.navActive : ''}>مردانه</Link>
              <div className={styles.dropdownBridge}>
                <ul className={styles.dropdownMenu}>
                  <li><Link href="/men?sub=clothing" onClick={closeMobileMenu}>لباس مردانه</Link></li>
                  <li><Link href="/men?sub=pants" onClick={closeMobileMenu}>شلوار مردانه</Link></li>
                  <li><Link href="/men?sub=shoes" onClick={closeMobileMenu}>کفش مردانه</Link></li>
                  <li><Link href="/men?sub=accessories" onClick={closeMobileMenu}>اکسسوری مردانه</Link></li>
                </ul>
              </div>
            </li>
            <li className={styles.navDropdown}>
              <Link href="/women" aria-current={isActive('/women') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/women') ? styles.navActive : ''}>زنانه</Link>
              <div className={styles.dropdownBridge}>
                <ul className={styles.dropdownMenu}>
                  <li><Link href="/women?sub=clothing" onClick={closeMobileMenu}>لباس زنانه</Link></li>
                  <li><Link href="/women?sub=pants" onClick={closeMobileMenu}>شلوار زنانه</Link></li>
                  <li><Link href="/women?sub=shoes" onClick={closeMobileMenu}>کفش زنانه</Link></li>
                  <li><Link href="/women?sub=accessories" onClick={closeMobileMenu}>اکسسوری زنانه</Link></li>
                </ul>
              </div>
            </li>
            <li className={styles.navDropdown}>
              <Link href="/kids" aria-current={isActive('/kids') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/kids') ? styles.navActive : ''}>کودک</Link>
              <div className={styles.dropdownBridge}>
                <ul className={styles.dropdownMenu}>
                  <li><Link href="/kids?sub=clothing" onClick={closeMobileMenu}>لباس بچگانه</Link></li>
                  <li><Link href="/kids?sub=pants" onClick={closeMobileMenu}>شلوار بچگانه</Link></li>
                  <li><Link href="/kids?sub=shoes" onClick={closeMobileMenu}>کفش بچگانه</Link></li>
                </ul>
              </div>
            </li>
            <li><Link href="/bags-accessories" aria-current={isActive('/bags-accessories') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/bags-accessories') ? styles.navActive : ''}>کیف و اکسسوری</Link></li>
            <li><Link href="/other-products" aria-current={isActive('/other-products') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/other-products') ? styles.navActive : ''}>سایر محصولات</Link></li>
            <li><Link href="/best-sellers" aria-current={isActive('/best-sellers') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/best-sellers') ? `${styles.navActive} ${styles.navBestSellers}` : styles.navBestSellers}>پرفروش‌ها</Link></li>
            <li><Link href="/sale" aria-current={isActive('/sale') ? 'page' : undefined} onClick={closeMobileMenu} className={isActive('/sale') ? `${styles.navActive} ${styles.navSale}` : styles.navSale}>تخفیف‌ها</Link></li>
          </ul>
        </div>
        <div className={styles.mobileNavFooter}>
          <Link className={styles.mobileGuideLink} href="/buy-from-dubai" onClick={closeMobileMenu}>
            <span>راهنمای سفارش مستقیم</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </Link>
          <Link className={styles.mobileAccountLink} href={isLoggedIn ? '/profile' : '/login'} onClick={closeMobileMenu}>
            {isLoggedIn ? 'حساب کاربری من' : 'ورود یا ثبت‌نام'}
          </Link>
        </div>
      </nav>
    </header>
  );
}
