if (process.env.NODE_ENV === "production" || process.env.ALLOW_DESTRUCTIVE_DEV_SEED !== "true") {
  throw new Error("Destructive demo seed blocked. It is allowed only outside production with ALLOW_DESTRUCTIVE_DEV_SEED=true.");
}

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface CategorySeed {
  name: string;
  icon: string;
  query: string;
  countText: string;
}

interface BrandSeed {
  id: string;
  name: string;
  faName: string;
  cat: string;
  hasImage: boolean;
  img?: string;
  fallback?: string;
  url: string;
}

interface StoreSeed {
  id: string;
  name: string;
  desc: string;
  url: string;
  hasImage: boolean;
  img?: string;
  fallback?: string;
}

const categoriesData: CategorySeed[] = [
  { name: 'مد و پوشاک', icon: 'Shirt', query: 'fashion', countText: 'بیش از ۵۰ برند' },
  { name: 'کیف و کفش', icon: 'Footprints', query: 'shoes', countText: 'بیش از ۲۰ برند' },
  { name: 'ساعت و اکسسوری', icon: 'Watch', query: 'accessories', countText: 'بیش از ۱۵ برند' },
  { name: 'عطر و آرایشی', icon: 'Sparkles', query: 'perfume', countText: 'بیش از ۳۰ برند' },
  { name: 'تکنولوژی', icon: 'Laptop', query: 'tech', countText: 'برندهای مطرح دیجیتال' },
  { name: 'خانه و دکوراسیون', icon: 'Home', query: 'home', countText: 'برندهای لوازم خانگی' },
  { name: 'ورزشی ( اسپورت )', icon: 'Activity', query: 'sports', countText: 'برندهای اسپورت' }
];

const brandsData: BrandSeed[] = [
  { id: 'gucci', name: 'Gucci', faName: 'گوچی', cat: 'مد و پوشاک', hasImage: false, fallback: 'GUCCI', url: 'https://www.gucci.com/ae/en/' },
  { id: 'lv', name: 'Louis Vuitton', faName: 'لویی ویتون', cat: 'مد و پوشاک', hasImage: false, fallback: 'LV', url: 'https://ae.louisvuitton.com/eng-ae/homepage' },
  { id: 'chanel', name: 'Chanel', faName: 'شنل', cat: 'مد و پوشاک', hasImage: false, fallback: 'CHANEL', url: 'https://www.chanel.com/ae/' },
  { id: 'prada', name: 'Prada', faName: 'پرادا', cat: 'کیف و کفش', hasImage: false, fallback: 'PRADA', url: 'https://www.prada.com/ae/en.html' },
  { id: 'dior', name: 'Dior', faName: 'دیور', cat: 'مد و پوشاک', hasImage: false, fallback: 'DIOR', url: 'https://www.dior.com/en_ae' },
  { id: 'hermes', name: 'Hermès', faName: 'هرمس', cat: 'کیف و کفش', hasImage: false, fallback: 'HERMÈS', url: 'https://www.hermes.com/ae/en/' },
  { id: 'aldo', name: 'Aldo', faName: 'آلدو', cat: 'کیف و کفش', hasImage: true, img: '/images/logo/aldo.png', url: 'https://aldoshoes.me/ae/en/' },
  { id: 'rolex', name: 'Rolex', faName: 'رولکس', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'ROLEX', url: 'https://www.rolex.com' },
  { id: 'cartier', name: 'Cartier', faName: 'کارتیر', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'Cartier', url: 'https://www.cartier.ae/en-ae' },
  { id: 'burberry', name: 'Burberry', faName: 'بربری', cat: 'مد و پوشاک', hasImage: false, fallback: 'BURBERRY', url: 'https://ae.burberry.com' },
  { id: 'fendi', name: 'Fendi', faName: 'فندی', cat: 'مد و پوشاک', hasImage: false, fallback: 'FENDI', url: 'https://www.fendi.com/ae-en/' },
  { id: 'balenciaga', name: 'Balenciaga', faName: 'بالنسیاگا', cat: 'مد و پوشاک', hasImage: false, fallback: 'BALENCIAGA', url: 'https://www.balenciaga.com/en-ae' },
  { id: 'saintlaurent', name: 'Saint Laurent', faName: 'سن لورن', cat: 'مد و پوشاک', hasImage: false, fallback: 'YSL', url: 'https://www.ysl.com/en-ae' },
  { id: 'nike', name: 'Nike', faName: 'نایک نایکی', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/NIKE.svg', url: 'https://www.nike.com/ae/' },
  { id: 'adidas', name: 'Adidas', faName: 'آدیداس ادیداس', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/adidas.png', url: 'https://www.adidas.ae' },
  { id: 'shein', name: 'Shein', faName: 'شی این', cat: 'مد و پوشاک', hasImage: true, img: '/images/logo/Shein.png', url: 'https://m.shein.com/ae' },
  { id: 'apple', name: 'Apple', faName: 'اپل', cat: 'تکنولوژی', hasImage: false, fallback: '', url: 'https://www.apple.com/ae/' },
  { id: 'samsung', name: 'Samsung', faName: 'سامسونگ', cat: 'تکنولوژی', hasImage: false, fallback: 'SAMSUNG', url: 'https://www.samsung.com/ae/' },
  { id: 'sephora', name: 'Sephora', faName: 'سفورا', cat: 'عطر و آرایشی', hasImage: false, fallback: 'SEPHORA', url: 'https://www.sephora.ae' },
  { id: 'dyson', name: 'Dyson', faName: 'دایسون', cat: 'خانه و دکوراسیون', hasImage: false, fallback: 'dyson', url: 'https://www.dyson.ae/en-AE' },
  { id: 'zara', name: 'Zara', faName: 'زارا', cat: 'مد و پوشاک', hasImage: false, fallback: 'ZARA', url: 'https://www.zara.com/ae/en/' },
  { id: 'mango', name: 'Mango', faName: 'مانگو', cat: 'مد و پوشاک', hasImage: false, fallback: 'MANGO', url: 'https://shop.mango.com/ae' },
  { id: 'hm', name: 'H&M', faName: 'اچ اند ام', cat: 'مد و پوشاک', hasImage: false, fallback: 'H&M', url: 'https://ae.hm.com/en/' }
];

const storesData: StoreSeed[] = [
  { id: 'noon', name: 'Noon', desc: 'فروشگاه آنلاین چندمنظوره با ارسال سریع در دبی', url: 'https://www.noon.com/uae-en/', hasImage: true, img: '/images/logo/Noon.webp' },
  { id: 'namshi', name: 'Namshi', desc: 'مد و پوشاک، کیف، کفش و اکسسوری', url: 'https://www.namshi.com/uae-en/', hasImage: false, fallback: 'NAMSHI' },
  { id: 'ounass', name: 'Ounass', desc: 'فروشگاه لوکس برندهای جهانی', url: 'https://www.ounass.ae', hasImage: false, fallback: 'OUNASS' },
  { id: 'amazon', name: 'Amazon.ae', desc: 'خرید انواع کالا با ارسال سریع به امارات و دبی', url: 'https://www.amazon.ae', hasImage: true, img: '/images/logo/amazon.png' },
  { id: '6thstreet', name: '6thStreet', desc: 'مد و فشن با بهترین برندها', url: 'https://www.6thstreet.com/ae/en/', hasImage: false, fallback: '6thSTREET' },
  { id: 'modanisa', name: 'Modanisa', desc: 'فروشگاه آنلاین پوشاک مناسب بانوان', url: 'https://www.modanisa.com/en/', hasImage: false, fallback: 'modanisa' }
];

async function main() {
  console.log('Starting seed...');

  // 1. Clear database
  await prisma.setting.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.laptop.deleteMany();
  await prisma.warehouseItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.store.deleteMany();
  await prisma.category.deleteMany();

  console.log('Database cleared.');

  // 2. Seed Settings
  await prisma.setting.createMany({
    data: [
      { key: 'aed_toman_rate', value: '18500' },
      { key: 'shipping_cost_per_kg', value: '45' }
    ]
  });
  console.log('Settings seeded.');

  // 3. Seed Categories
  const categories: any[] = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: cat
    });
    categories.push(created);
  }
  console.log(`${categories.length} Categories seeded.`);

  // 4. Seed Brands
  const brands: any[] = [];
  for (const b of brandsData) {
    const created = await prisma.brand.create({
      data: {
        id: b.id,
        name: b.name,
        faName: b.faName,
        cat: b.cat,
        url: b.url,
        img: b.img || null,
        fallback: b.fallback || null,
        hasImage: b.hasImage
      }
    });
    brands.push(created);
  }
  console.log(`${brands.length} Brands seeded.`);

  // 5. Seed Stores
  const stores: any[] = [];
  for (const s of storesData) {
    const created = await prisma.store.create({
      data: {
        id: s.id,
        name: s.name,
        desc: s.desc,
        url: s.url,
        img: s.img || null,
        fallback: s.fallback || null,
        hasImage: s.hasImage
      }
    });
    stores.push(created);
  }
  console.log(`${stores.length} Stores seeded.`);

  // 6. Seed Laptops (Stock)
  await prisma.laptop.createMany({
    data: [
      {
        name: 'HP EliteBook 840 G8',
        brand: 'HP',
        model: 'EliteBook',
        cpu: 'Intel Core i7-1185G7',
        ram: '16GB',
        storage: '512GB SSD',
        gpu: 'Intel Iris Xe',
        screen: '14" FHD Touch',
        condition: 'اوپن باکس',
        priceToman: 28500000,
        stock: 5,
        isActive: true,
        description: 'لپ‌تاپ بسیار تمیز و سبک صنعتی مناسب برنامه‌نویسی و کارهای اداری'
      },
      {
        name: 'Dell Latitude 5420',
        brand: 'Dell',
        model: 'Latitude',
        cpu: 'Intel Core i5-1145G7',
        ram: '8GB',
        storage: '256GB SSD',
        gpu: 'Intel UHD Graphics',
        screen: '14" HD',
        condition: 'کارکرده گرید A',
        priceToman: 19500000,
        stock: 3,
        isActive: true,
        description: 'لپ‌تاپ اقتصادی با طول عمر بالای باتری'
      }
    ]
  });
  console.log('Laptops seeded.');

  // 7. Seed Products
  const createdProducts: any[] = [];
  const aldoBrand = brands.find(b => b.id === 'aldo');
  const shoesCategory = categories.find(c => c.name === 'کیف و کفش');

  if (aldoBrand) {
    const p1 = await prisma.product.create({
      data: {
        code: 'ALDO-SHOE-001',
        name: 'کتانی روزمره مردانه آلدو',
        nameFa: 'کتانی روزمره مردانه آلدو',
        nameEn: 'Aldo Men Casual Sneaker',
        slug: 'aldo-men-casual-sneaker',
        brandId: aldoBrand.id,
        categoryId: shoesCategory ? shoesCategory.id : null,
        priceAed: 249,
        weight: 1.2,
        gender: 'men',
        isBestSeller: true,
        originalLink: 'https://aldoshoes.me/ae/en/men/footwear/casual-shoes/casual-sneaker.html'
      }
    });
    createdProducts.push(p1);
  }

  const nikeBrand = brands.find(b => b.id === 'nike');
  const sportsCategory = categories.find(c => c.name === 'ورزشی ( اسپورت )');
  if (nikeBrand) {
    const p2 = await prisma.product.create({
      data: {
        code: 'NIKE-PEGASUS-40',
        name: 'کفش نایک ایر زوم پگاسوس ۴۰',
        nameFa: 'کفش نایک ایر زوم پگاسوس ۴۰',
        nameEn: 'Nike Air Zoom Pegasus 40',
        slug: 'nike-air-zoom-pegasus-40',
        brandId: nikeBrand.id,
        categoryId: sportsCategory ? sportsCategory.id : null,
        priceAed: 529,
        weight: 0.9,
        gender: 'unisex',
        isBestSeller: true,
        hasDiscount: true,
        discountPercent: 15,
        originalLink: 'https://www.nike.com/ae/t/air-zoom-pegasus-40-road-running-shoes'
      }
    });
    createdProducts.push(p2);
  }
  console.log(`${createdProducts.length} Products seeded.`);

  // 8. Seed Customer & Order
  const customer = await prisma.customer.create({
    data: {
      name: 'رضا ملکی',
      phone: '09123456789',
      email: 'reza@example.com',
      city: 'تهران',
      group: 'همکار',
      notes: 'مشتری دائمی و خوش‌حساب'
    }
  });

  const order = await prisma.order.create({
    data: {
      orderCode: 'DK-1001',
      customerId: customer.id,
      status: 'paid',
      totalAed: 249,
      totalToman: 4606500,
      notes: 'ارسال با پست پیشتاز'
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      name: 'Aldo Men Casual Sneaker',
      quantity: 1,
      priceAed: 249,
      priceToman: 4606500
    }
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: 4606500,
      method: 'CARD',
      type: 'INCOME',
      category: 'فروش محصول',
      status: 'success',
      paidAt: new Date(),
      reference: 'TRX-998877',
      notes: 'تایید شد'
    }
  });

  await prisma.shipment.create({
    data: {
      orderId: order.id,
      recipient: 'رضا ملکی',
      method: 'پست پیشتاز',
      status: 'shipped',
      trackingCode: '123456789012345678901'
    }
  });

  console.log('Customer, Order, OrderItem, Payment, and Shipment seeded.');

  console.log('Seed completed successfully! 🌱');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    pool.end();
    process.exit(1);
  });
