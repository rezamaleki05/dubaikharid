'use client';
import styles from './BrandLogosBar.module.css';

const brands = [
  {
    id: 'gucci',
    name: 'Gucci',
    url: 'https://www.gucci.com/ae/en_gb/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <svg viewBox="0 0 56 30" width="48" height="24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="18" cy="15" r="10"/>
          <circle cx="38" cy="15" r="10"/>
        </svg>
        <span className={styles.brandName} style={{fontFamily:'Georgia,serif',letterSpacing:'2px', fontSize:'11px'}}>GUCCI</span>
      </div>
    ),
  },
  {
    id: 'prada',
    name: 'Prada',
    url: 'https://www.prada.com/ae/en.html',
    logo: (
      <div className={styles.brandLogoWrap}>
        <span style={{fontFamily:'Georgia,serif',fontWeight:400,letterSpacing:'3.5px',fontSize:'24px'}}>PRADA</span>
      </div>
    ),
  },
  {
    id: 'aldo',
    name: 'Aldo',
    url: 'https://aldoshoes.me/ae/en/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <img src="/images/logo/aldo.png" alt="Aldo" style={{ filter: 'brightness(0) invert(1)', height: '18px', width: 'auto', objectFit: 'contain' }} />
      </div>
    ),
  },
  {
    id: 'lv',
    name: 'Louis Vuitton',
    url: 'https://me.louisvuitton.com/eng-ae/homepage',
    logo: (
      <div className={styles.brandLogoWrap}>
        <svg viewBox="0 0 40 28" width="34" height="24" fill="currentColor">
          <text x="0" y="24" fontSize="28" fontWeight="900" fontFamily="Georgia,serif">LV</text>
        </svg>
        <span style={{fontFamily:'Georgia,serif',letterSpacing:'1px',fontSize:'9px',fontWeight:700,whiteSpace:'nowrap'}}>LOUIS VUITTON</span>
      </div>
    ),
  },
  {
    id: 'dior',
    name: 'Dior',
    url: 'https://www.dior.com/en_ae/fashion',
    logo: (
      <div className={styles.brandLogoWrap}>
        <span style={{fontFamily:'Georgia,serif',fontWeight:400,letterSpacing:'5px',fontSize:'24px'}}>DIOR</span>
      </div>
    ),
  },
  {
    id: 'nike',
    name: 'Nike',
    url: 'https://www.nike.ae/en/home/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <img src="/images/logo/NIKE.svg" alt="Nike" style={{ filter: 'brightness(0) invert(1)', height: '24px', width: 'auto' }} />
      </div>
    ),
  },
  {
    id: 'adidas',
    name: 'Adidas',
    url: 'https://www.adidas.ae/en',
    logo: (
      <div className={styles.brandLogoWrap}>
        <img src="/images/logo/adidas.png" alt="Adidas" style={{ filter: 'brightness(0) invert(1)', height: '32px', width: 'auto' }} />
      </div>
    ),
  },
  {
    id: 'zara',
    name: 'Zara',
    url: 'https://www.zara.com/ae/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <span style={{fontFamily:'Georgia,serif',fontWeight:400,letterSpacing:'4px',fontSize:'24px'}}>ZARA</span>
      </div>
    ),
  },
  {
    id: 'namshi',
    name: 'Namshi',
    url: 'https://www.namshi.com/uae-en/fashion/men-fashion/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 26V6l20 20V6"/>
        </svg>
        <span style={{fontFamily:'Arial,sans-serif',fontWeight:700,letterSpacing:'1.5px',fontSize:'10px'}}>NAMSHI</span>
      </div>
    ),
  },
  {
    id: 'shein',
    name: 'Shein',
    url: 'https://www.shein.com/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <img src="/images/logo/Shein.png" alt="Shein" style={{ filter: 'brightness(0) invert(1)', height: '20px', width: 'auto' }} />
      </div>
    ),
  },
  {
    id: 'temu',
    name: 'Temu',
    url: 'https://www.temu.com/ae',
    logo: (
      <div className={styles.brandLogoWrap}>
        <span style={{fontFamily:'Arial,sans-serif',fontWeight:900,letterSpacing:'1px',fontSize:'28px',color:'#fff'}}>temu</span>
      </div>
    ),
  },
  {
    id: 'amazon',
    name: 'Amazon',
    url: 'https://www.amazon.ae/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <img src="/images/logo/amazon.png" alt="Amazon" style={{ filter: 'brightness(0) invert(1)', height: '24px', width: 'auto' }} />
      </div>
    ),
  },
  {
    id: 'noon',
    name: 'Noon',
    url: 'https://www.noon.com/uae-en/',
    logo: (
      <div className={styles.brandLogoWrap}>
        <img src="/images/logo/Noon.webp" alt="Noon" style={{ filter: 'brightness(0) invert(1)', height: '28px', width: 'auto' }} />
      </div>
    ),
  },
];

export default function BrandLogosBar() {
  const repeatedBrands = [...brands, ...brands, ...brands, ...brands];
  const renderBrands = () => (
    repeatedBrands.map(({ id, url, name, logo }, idx) => (
      <a
        key={`${id}-${idx}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.brandCard}
        title={name}
      >
        {logo}
      </a>
    ))
  );

  return (
    <section className={styles.sectionWrapper}>
      <div className={styles.brandBar}>
        <div className={styles.marqueeTrack}>
          <div className={styles.marqueeInner}>
            {renderBrands()}
          </div>
          <div className={styles.marqueeInner}>
            {renderBrands()}
          </div>
        </div>
      </div>
    </section>
  );
}
