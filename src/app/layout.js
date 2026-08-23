import { Vazirmatn } from "next/font/google";
import "./globals.css";
import JsonLd from '@/components/seo/JsonLd';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo';
import { isPreviewDeployment } from '@/lib/env';

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'خرید مستقیم از دبی و امارات | دبی خرید',
    template: '%s | دبی خرید',
  },
  description: 'خرید مستقیم از فروشگاه‌های دبی و امارات، محاسبه برآورد قیمت با نرخ درهم و ثبت سفارش برای ارسال به ایران در دبی خرید.',
  robots: isPreviewDeployment()
    ? { index: false, follow: false, nocache: true }
    : { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website', locale: 'fa_IR', siteName: SITE_NAME, url: SITE_URL,
    title: 'خرید مستقیم از دبی و امارات | دبی خرید',
    description: 'ثبت سفارش از سایت‌های معتبر امارات و ارسال کالا از دبی به ایران با برآورد شفاف هزینه.',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: 'دبی خرید؛ خدمات خرید از امارات' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خرید مستقیم از دبی و امارات | دبی خرید',
    description: 'ثبت سفارش از فروشگاه‌های امارات و ارسال کالا از دبی به ایران.',
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import MaintenanceGate from "@/components/MaintenanceGate";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  let initialSettings = null;
  try {
    initialSettings = (await getPublicSettings()).values;
  } catch (error) {
    console.error('Failed to preload public settings:', error);
  }
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: initialSettings?.siteName || SITE_NAME,
    alternateName: 'DubaiKharid',
    url: SITE_URL,
    logo: absoluteUrl(initialSettings?.siteLogoUrl?.startsWith('/') ? initialSettings.siteLogoUrl : DEFAULT_OG_IMAGE),
    ...(initialSettings?.supportPhone || initialSettings?.supportEmail ? {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        ...(initialSettings?.supportPhone ? { telephone: initialSettings.supportPhone } : {}),
        ...(initialSettings?.supportEmail ? { email: initialSettings.supportEmail } : {}),
        availableLanguage: ['fa'],
      },
    } : {}),
  };
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: initialSettings?.siteName || SITE_NAME,
    alternateName: 'DubaiKharid',
    url: SITE_URL,
    inLanguage: 'fa-IR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} data-scroll-behavior="smooth">
      <body style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <SiteSettingsProvider initialSettings={initialSettings}>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <MaintenanceGate>{children}</MaintenanceGate>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
