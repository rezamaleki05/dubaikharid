import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "دبی خرید | خرید مستقیم از فروشگاه‌های بین‌المللی دبی",
  description: "محاسبه آنلاین قیمت و خرید مستقیم از آمازون امارات، نون، شین، نایکی و آدیداس به تومان با تحویل درب منزل در سراسر ایران.",
};

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} data-scroll-behavior="smooth">
      <body style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
        <SiteSettingsProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}

