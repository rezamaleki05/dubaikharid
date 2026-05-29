export const laptops = [
  {
    id: 'lap1', name: 'MacBook Air M2', spec: '8GB / 256GB SSD',
    model: 'M2 2022', ram: '8GB Unified', storage: '256GB SSD', cpu: 'Apple M2 8-Core', gpu: 'Apple 8-Core', screenSize: '13.6 inch Liquid Retina',
    priceAed: 1680, weight: 1.24, category: 'electronics', brand: 'Apple',
    store: 'انبار ایران',
    link: 'https://www.noon.com/uae-en/macbook-air-m2-2022-8gb-256gb-ssd-space-grey/N53351982A/p/',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=85&auto=format&fit=crop',
    description: 'لپتاپ استوک اپل مدل مک‌بوک ایر M2 بسیار تمیز و کم‌کارکرد.'
  },
  {
    id: 'lap2', name: 'Dell XPS 13 9315', spec: '16GB / 512GB SSD',
    model: 'XPS 13 9315', ram: '16GB LPDDR5', storage: '512GB PCIe NVMe SSD', cpu: 'Intel Core i5-1230U', gpu: 'Intel Iris Xe', screenSize: '13.4 inch FHD+',
    priceAed: 1460, weight: 1.17, category: 'electronics', brand: 'Dell',
    store: 'انبار ایران',
    link: 'https://www.amazon.ae/Dell-XPS-9315-Laptop-i5-1230U/dp/B0B527FF94/',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=85&auto=format&fit=crop',
    description: 'لپتاپ اولترابوک دل مدل XPS 13 مناسب برای کارهای مهندسی و روزمره.'
  },
  {
    id: 'lap3', name: 'Lenovo ThinkPad T14', spec: '16GB / 512GB SSD',
    model: 'T14 Gen 3', ram: '16GB DDR4', storage: '512GB SSD', cpu: 'Intel Core i7 12th Gen', gpu: 'Intel Iris Xe', screenSize: '14 inch IPS Anti-glare',
    priceAed: 1020, weight: 1.35, category: 'electronics', brand: 'Lenovo',
    store: 'انبار ایران',
    link: 'https://www.noon.com/uae-en/thinkpad-t14-gen-3-lenovo/N53348123A/p/',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=85&auto=format&fit=crop',
    description: 'لپتاپ صنعتی و قدرتمند لنوو سری ThinkPad T14 استوک وارداتی از دبی.',
    discountPercent: 12
  },
  {
    id: 'lap4', name: 'HP Spectre x360', spec: '16GB / 1TB SSD',
    model: 'Spectre x360 14', ram: '16GB LPDDR4x', storage: '1TB PCIe NVMe M.2 SSD', cpu: 'Intel Core i7-1165G7', gpu: 'Intel Iris Xe', screenSize: '13.5 inch OLED Touch',
    priceAed: 1380, weight: 1.36, category: 'electronics', brand: 'HP',
    store: 'انبار ایران',
    link: 'https://www.amazon.ae/HP-Spectre-x360-14-ea1023dx-Intel/dp/B09D1X4D46/',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=85&auto=format&fit=crop',
    description: 'لپتاپ تبلت‌شو جذاب اچ‌پی با کیفیت تصویر عالی و طراحی لوکس.'
  },
  {
    id: 'lap5', name: 'ASUS ROG Zephyrus G14', spec: '16GB / 512GB SSD',
    model: 'Zephyrus G14 (2022)', ram: '16GB DDR5', storage: '512GB PCIe 4.0 SSD', cpu: 'AMD Ryzen 9 6900HS', gpu: 'AMD Radeon RX 6700S', screenSize: '14 inch 120Hz WQXGA',
    priceAed: 1510, weight: 1.72, category: 'electronics', brand: 'ASUS',
    store: 'انبار ایران',
    link: 'https://www.noon.com/uae-en/rog-zephyrus-g14/N53289123A/p/',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=85&auto=format&fit=crop',
    description: 'لپتاپ گیمینگ ایسوس مخصوص بازی و رندرهای سنگین.'
  }
];

export const trendingProducts = [
  {
    id: 'p1', name: "Nike Air Force 1 '07", spec: 'کلاسیک سفید',
    priceAed: 318, weight: 0.95, category: 'shoes', brand: 'Nike',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/air-force-1-07/N41052736A/p/',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=85&auto=format&fit=crop',
    description: 'کفش کلاسیک و پرطرفدار نایک ساخت اندونزی.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['سفید', 'مشکی'],
    discountPercent: 15
  },
  {
    id: 'p2', name: 'iPhone 15 Pro Max', spec: '256GB / Titanium',
    priceAed: 2815, weight: 0.22, category: 'electronics', brand: 'Apple',
    store: 'amazon.ae',
    link: 'https://www.amazon.ae/Apple-iPhone-15-Pro-Max/dp/B0CHX3522C/',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=85&auto=format&fit=crop',
    description: 'جدیدترین آیفون اپل با بدنه تیتانیومی و دوربین فوق‌پیشرفته.'
  },
  {
    id: 'p3', name: 'Michael Kors Jet Set', spec: 'کیف دستی چرم زنانه',
    priceAed: 456, weight: 0.8, category: 'bags', brand: 'Michael Kors',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/jet-set-travel-medium-leather/N50981245A/p/',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=85&auto=format&fit=crop',
    description: 'کیف زنانه برند مایکل کورس دوخت دقیق با چرم مرغوب.'
  },
  {
    id: 'p4', name: 'Dior Sauvage EDP 100ml', spec: 'ادو پرفیوم مردانه',
    priceAed: 318, weight: 0.55, category: 'beauty', brand: 'Dior',
    store: 'namshi.com',
    link: 'https://www.namshi.com/uae-en/dior-sauvage-edp-100ml/',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=85&auto=format&fit=crop',
    description: 'عطر محبوب دیور ساواج با رایحه خنک و تلخ مردانه.'
  },
  {
    id: 'p5', name: 'Samsung S24 Ultra', spec: '256GB / Titanium Gray',
    priceAed: 2300, weight: 0.23, category: 'electronics', brand: 'Samsung',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/galaxy-s24-ultra/N60912457A/p/',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=85&auto=format&fit=crop',
    description: 'گوشی پرچمدار سامسونگ با قلم S-Pen و هوش مصنوعی پیشرفته.'
  }
];

export const menProducts = [
  {
    id: 'm1', name: 'تی‌شرت ورزشی نایک Dry-Fit', spec: 'خنک‌کننده و ضدتعریق ورزشی',
    priceAed: 95, weight: 0.25, category: 'clothing', gender: 'men', brand: 'Nike',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/dri-fit-training-t-shirt/N51052123A/p/',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=450&q=85&auto=format&fit=crop',
    description: 'تی‌شرت ورزشی مردانه نایک با الیاف پیشرفته Dry-Fit فوق‌العاده راحت.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['مشکی', 'سفید', 'طوسی', 'سرمه‌ای'],
    discountPercent: 15
  },
  {
    id: 'm2', name: 'پیراهن کتان زارا Casual', spec: 'دوخت دقیق اسپورت روزمره',
    priceAed: 135, weight: 0.35, category: 'clothing', gender: 'men', brand: 'Zara',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/zara-mens-cotton-shirt/N50981923A/p/',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=450&q=85&auto=format&fit=crop',
    description: 'پیراهن خوش‌دوخت تمام کتان زارا مناسب برای استایل‌های غیررسمی و نیمه‌رسمی.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['سفید', 'کرم', 'زیتونی', 'سرمه‌ای']
  },
  {
    id: 'm3', name: 'شلوار لی مردانه لویز Slim Fit', spec: 'شلوار جین جذب با دوام بالا',
    priceAed: 195, weight: 0.65, category: 'pants', gender: 'men', brand: 'Levi\'s',
    store: 'amazon.ae',
    link: 'https://www.amazon.ae/Levis-Mens-Slim-Fit-Jeans/dp/B0018OM123/',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=450&q=85&auto=format&fit=crop',
    description: 'شلوار جین نمادین لویز ۵۱۱ با کیفیت رنگ عالی و الیاف الاستین انعطاف‌پذیر.',
    sizes: ['30', '32', '34', '36'],
    colors: ['آبی تیره', 'ذغالی', 'آبی روشن'],
    discountPercent: 20
  },
  {
    id: 'm4', name: 'کفش ورزشی آدیداس Ultraboost Light', spec: 'کفش دویدن و پیاده‌روی فوق سبک',
    priceAed: 440, weight: 0.85, category: 'shoes', gender: 'men', brand: 'Adidas',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/ultraboost-light-shoes/N60891234A/p/',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=450&q=85&auto=format&fit=crop',
    description: 'جدین‌ترین نسخه کفش‌های الترابوست آدیداس با کپسول‌های برگشت انرژی لایت.',
    sizes: ['41', '42', '43', '44', '45'],
    colors: ['مشکی', 'سفید', 'طوسی-نارنجی']
  },
  {
    id: 'm5', name: 'کمربند چرم طبیعی پیر کاردین', spec: 'چرم گاوی اصل ۱۰۰٪ با سگک فلزی',
    priceAed: 85, weight: 0.2, category: 'accessories', gender: 'men', brand: 'Pierre Cardin',
    store: 'namshi.com',
    link: 'https://www.namshi.com/uae-en/pierre-cardin-leather-belt/',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb8ec97db?w=450&q=85&auto=format&fit=crop',
    description: 'کمربند رسمی چرم طبیعی پیر کاردین مناسب برای هماهنگ کردن با کت و شلوارهای رسمی.',
    sizes: ['100', '105', '110', '115'],
    colors: ['مشکی', 'قهوه‌ای']
  }
];

export const womenProducts = [
  {
    id: 'w1', name: 'پیراهن نخی ساحلی مانگو', spec: 'پیراهن خنک و تابستانه زنانه',
    priceAed: 155, weight: 0.3, category: 'clothing', gender: 'women', brand: 'Mango',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/mango-summer-dress/N51198345A/p/',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=450&q=85&auto=format&fit=crop',
    description: 'پیراهن نخی زنانه بسیار سبک و راحت برند مانگو با طراحی شیک تابستانه.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['صورتی', 'سفید', 'سبز نعنایی', 'خردلی'],
    discountPercent: 30
  },
  {
    id: 'w2', name: 'پلیور بافتنی یقه اسکی H&M', spec: 'بافت ظریف پاییزه و زمستانه',
    priceAed: 125, weight: 0.45, category: 'clothing', gender: 'women', brand: 'H&M',
    store: 'namshi.com',
    link: 'https://www.namshi.com/uae-en/hm-turtleneck-sweater/',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=450&q=85&auto=format&fit=crop',
    description: 'پلیور بافت گرم برند اچ اند ام با یقه اسکی شیک و دوخت متراکم.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['کرم', 'طوسی ملانژ', 'مشکی'],
    discountPercent: 10
  },
  {
    id: 'w3', name: 'شلوار پارچه‌ای فاق بلند زارا', spec: 'شلوار گشاد کلاسیک دمپا',
    priceAed: 145, weight: 0.4, category: 'pants', gender: 'women', brand: 'Zara',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/zara-high-waisted-trousers/N50983198A/p/',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=450&q=85&auto=format&fit=crop',
    description: 'شلوار فاق بلند راسته زارا مناسب برای استایل‌های اداری و روزانه زنانه.',
    sizes: ['34', '36', '38', '40', '42'],
    colors: ['مشکی', 'کرم', 'طوسی تیره']
  },
  {
    id: 'w4', name: 'کفش ورشس آدیداس NMD_R1', spec: 'کتانی راحتی پیاده‌روی زنانه',
    priceAed: 380, weight: 0.75, category: 'shoes', gender: 'women', brand: 'Adidas',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/nmd-r1-shoes-adidas/N60981923A/p/',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=450&q=85&auto=format&fit=crop',
    description: 'کتانی شیک و لایف‌استایل آدیداس سری NMD با رویه کشسانی تنفس‌پذیر.',
    sizes: ['37', '38', '39', '40'],
    colors: ['سفید', 'مشکی-طلایی', 'صورتی ملایم']
  },
  {
    id: 'w5', name: 'شال گردن و روسری حریر گوچی', spec: 'طرح گل‌دار کلاسیک Gucci',
    priceAed: 290, weight: 0.15, category: 'accessories', gender: 'women', brand: 'Gucci',
    store: 'namshi.com',
    link: 'https://www.namshi.com/uae-en/gucci-silk-floral-scarf/',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=450&q=85&auto=format&fit=crop',
    description: 'شال ابریشم حریر بسیار لطیف برند لاکچری گوچی با چاپ رنگی دیجیتال ثابت.',
    sizes: ['تك سایز'],
    colors: ['مولتی‌کالر گل‌دار']
  }
];

export const kidsProducts = [
  {
    id: 'k1', name: 'هودی چاپی بچگانه زارا', spec: 'هودی دورس کرک‌دار کلاه‌دار',
    priceAed: 85, weight: 0.28, category: 'clothing', gender: 'kids', brand: 'Zara',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/zara-kids-printed-hoodie/N50984912A/p/',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=450&q=85&auto=format&fit=crop',
    description: 'هودی کلاه‌دار بچگانه بسیار گرم با طرح‌های کارتونی چاپی جذاب.',
    sizes: ['4-5 سال', '6-7 سال', '8-9 سال', '10-12 سال'],
    colors: ['خردلی', 'طوسی روشن', 'سبز یشمی']
  },
  {
    id: 'k2', name: 'پیش‌بند و شلوار سرهمی جین H&M', spec: 'جین نرم و راحت با بند قابی',
    priceAed: 98, weight: 0.35, category: 'pants', gender: 'kids', brand: 'H&M',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/hm-kids-denim-overalls/N51194212A/p/',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=450&q=85&auto=format&fit=crop',
    description: 'سرهمی جین بچگانه اچ اند ام با قابلیت تنظیم ارتفاع بندها و چرم تزیینی.',
    sizes: ['2-3 سال', '4-5 سال', '6-7 سال']
  },
  {
    id: 'k3', name: 'کتانی بچگانه نایک Air Max SC', spec: 'کتانی چسبی ورزشی بچگانه',
    priceAed: 185, weight: 0.5, category: 'shoes', gender: 'kids', brand: 'Nike',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/kids-air-max-sc/N60921234A/p/',
    image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=450&q=85&auto=format&fit=crop',
    description: 'کفش ورزشی بچگانه نایک با لایه محافظ هوا Air Max و بندهای چسبی برای سهولت استفاده.',
    sizes: ['28', '30', '32', '34', '35'],
    colors: ['سفید-قرمز', 'مشکی-سفید', 'آبی-طوسی'],
    discountPercent: 25
  }
];

export const bagsAndAccessoriesProducts = [
  {
    id: 'ba1', name: 'کیف دستی شنل Classic Flap', spec: 'کیف زنانه چرمی طرح خاویاری شیک',
    priceAed: 980, weight: 0.9, category: 'bags', brand: 'Chanel',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/chanel-classic-flap-bag/N51124578A/p/',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=450&q=85&auto=format&fit=crop',
    description: 'کیف رودوشی زنجیردار لوکس شنل چرم خاویاری اعلا دوخت ضربدری با یراق‌آلات طلایی.',
    colors: ['مشکی', 'کرم', 'قرمز']
  },
  {
    id: 'ba2', name: 'ساعت مچی رولکس Submariner Date', spec: 'ساعت لوکس تمام استیل اتوماتیک',
    priceAed: 2450, weight: 0.45, category: 'watches_glasses', brand: 'Rolex',
    store: 'amazon.ae',
    link: 'https://www.amazon.ae/Rolex-Submariner-Stainless-Steel-Watch/dp/B0B527EE94/',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=450&q=85&auto=format&fit=crop',
    description: 'ساعت مچی اتوماتیک رولکس سری ساب‌مارینر قاب استیل ضدزنگ موتور کالیبر ۳۲۳۵ با شیشه سافایر.',
    colors: ['مشکی', 'سبز', 'آبی']
  },
  {
    id: 'ba3', name: 'عینک آفتابی ری‌بن Aviator Classic', spec: 'عینک خلبانی فریم طلایی شیک شیشه سبز',
    priceAed: 215, weight: 0.15, category: 'watches_glasses', brand: 'Ray-Ban',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/aviator-classic-sunglasses-gold/N41098124A/p/',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=450&q=85&auto=format&fit=crop',
    description: 'عینک خلبانی کلاسیک ری‌بن فریم فلزی طلایی شیشه ضدخش پولاریزه با فیلتر کامل UV400.',
    colors: ['طلایی-سبز', 'مشکی', 'نقره‌ای'],
    discountPercent: 40
  },
  {
    id: 'ba4', name: 'کیف پول چرم گوچی GG Marmont', spec: 'کیف پول زنانه تاشو چرم اصل',
    priceAed: 245, weight: 0.2, category: 'wallets_belts', brand: 'Gucci',
    store: 'namshi.com',
    link: 'https://www.namshi.com/uae-en/gucci-gg-marmont-wallet/',
    image: 'https://images.unsplash.com/photo-1627124357773-413d9413466c?w=450&q=85&auto=format&fit=crop',
    description: 'کیف پول چرمی لوکس گوچی با لوگوی فلزی طلایی برجسته GG، دارای جاکارتی و زیپ مجزا.',
    colors: ['مشکی', 'کرم', 'قهوه‌ای'],
    discountPercent: 18
  },
  {
    id: 'ba5', name: 'کیف توت لویی ویتون Neverfull MM', spec: 'کیف خرید کلاسیک طرح مونوگرام',
    priceAed: 880, weight: 0.85, category: 'bags', brand: 'Louis Vuitton',
    store: 'noon.com',
    link: 'https://www.noon.com/uae-en/louis-vuitton-neverfull-mm/N50987345A/p/',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=450&q=85&auto=format&fit=crop',
    description: 'کیف خرید جادار لویی ویتون طرح نمادین مونوگرام قهوه‌ای، چرم طبیعی مقاوم در برابر خط و خش.',
    colors: ['قهوه‌ای مونوگرام', 'کرم دامیه']
  }
];

export const getAllProducts = () => [
  ...laptops,
  ...trendingProducts,
  ...menProducts,
  ...womenProducts,
  ...kidsProducts,
  ...bagsAndAccessoriesProducts
];

export const getProductById = (id) => getAllProducts().find(p => p.id === id);
