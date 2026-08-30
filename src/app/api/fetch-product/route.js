import { NextResponse } from 'next/server';
import {
  assertPublicDestination,
  isSupportedProductStore,
  parseExternalHttpUrl,
} from '@/lib/externalUrls';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

const MAX_HTML_BYTES = 2 * 1024 * 1024;

async function readLimitedText(response) {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_HTML_BYTES) throw new Error('RESPONSE_TOO_LARGE');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error('RESPONSE_TOO_LARGE');
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchProductHtml(initialUrl, signal) {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    await assertPublicDestination(currentUrl);
    if (!isSupportedProductStore(currentUrl)) throw new Error('UNSUPPORTED_STORE');

    const response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'manual',
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount === 3) throw new Error('INVALID_REDIRECT');
      const nextUrl = parseExternalHttpUrl(new URL(location, currentUrl).toString());
      if (!nextUrl) throw new Error('INVALID_REDIRECT');
      currentUrl = nextUrl;
      continue;
    }
    if (!response.ok) throw new Error(`UPSTREAM_${response.status}`);
    return { html: await readLimitedText(response), finalUrl: currentUrl };
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

// Smart Persian translation dictionary for common e-commerce keywords
const TRANSLATION_DICT = {
  nike: 'نایکی',
  adidas: 'آدیداس',
  'michael kors': 'مایکل کورس',
  michael: 'مایکل',
  kors: 'کورس',
  tommy: 'تامی',
  hilfiger: 'هیلفیگر',
  apple: 'اپل',
  iphone: 'آیفون',
  samsung: 'سامسونگ',
  galaxy: 'گلکسی',
  ultra: 'اولترا',
  dior: 'دیور',
  sauvage: 'ساواج',
  shein: 'شین',
  amazon: 'آمازون',
  noon: 'نون',
  bag: 'کیف دستی',
  bags: 'کیف',
  tote: 'کیف رودوشی',
  handbag: 'کیف زنانه',
  backpack: 'کوله پشتی',
  leather: 'چرم',
  shoes: 'کفش',
  shoe: 'کفش',
  sneaker: 'کتانی',
  sneakers: 'کتانی',
  running: 'ورزشی مخصوص دویدن',
  sport: 'ورزشی',
  sports: 'ورزشی',
  men: 'مردانه',
  "men's": 'مردانه',
  women: 'زنانه',
  "women's": 'زنانه',
  unisex: 'اسپورت مشترک',
  kids: 'بچه‌گانه',
  classic: 'کلاسیک',
  white: 'سفید',
  black: 'مشکی',
  red: 'قرمز',
  blue: 'آبی',
  green: 'سبز',
  watch: 'ساعت',
  smartwatch: 'ساعت هوشمند',
  perfume: 'عطر و ادکلن',
  fragrance: 'رایحه عطر',
  cologne: 'ادکلن',
  parfum: 'پرفیوم',
  toilette: 'توالت',
  laptop: 'لپ‌تاپ',
  notebook: 'نوت‌بوک',
  phone: 'تلفن همراه',
  mobile: 'موبایل',
  gold: 'طلایی',
  silver: 'نقره‌ای',
  grey: 'خاکستری',
  gray: 'خاکستری',
  pro: 'پرو',
  max: 'مکس',
  mini: 'مینی',
  air: 'ایر',
  jacket: 'کاپشن و کت',
  coat: 'پالتو',
  dress: 'پیراهن زنانه',
  shirt: 'پیراهن مردانه',
  't-shirt': 'تی‌شرت',
  pants: 'شلوار',
  jeans: 'شلوار جین',
  hoodie: 'هودی و سویشرت',
  sunglasses: 'عینک آفتابی',
  glasses: 'عینک',
  travel: 'سفری',
  medium: 'متوسط',
  large: 'بزرگ',
  small: 'کوچک',
  original: 'اورجینال',
  fit: 'تن‌خور',
  slim: 'جذب',
  cotton: 'نخی'
};

// Heuristic translation function
function translateToPersian(title) {
  if (!title) return 'کالای درخواستی دبی';
  
  // Clean special characters but keep spaces
  const cleanTitle = title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = cleanTitle.split(/\s+/).filter(w => w.length > 1);
  
  let translatedWords = [];
  let skipNext = false;
  
  for (let i = 0; i < words.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    // Check two-word phrases first
    if (i < words.length - 1) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (TRANSLATION_DICT[phrase]) {
        translatedWords.push(TRANSLATION_DICT[phrase]);
        skipNext = true;
        continue;
      }
    }
    
    // Check single word
    const word = words[i];
    if (TRANSLATION_DICT[word]) {
      translatedWords.push(TRANSLATION_DICT[word]);
    } else {
      // If it is a number, keep it as is
      if (!isNaN(word)) {
        translatedWords.push(word);
      }
    }
  }
  
  if (translatedWords.length === 0) {
    return title.split('|')[0].trim(); // Fallback to raw English title before pipe separator
  }
  
  // De-duplicate consecutively repeated words to look extremely clean
  const uniqueWords = [];
  for (let i = 0; i < translatedWords.length; i++) {
    if (translatedWords[i] !== translatedWords[i - 1]) {
      uniqueWords.push(translatedWords[i]);
    }
  }
  
  // Format beautifully
  return uniqueWords.join(' ');
}

export async function GET(request) {
  const guard = publicRequestGuard(request, { limit: 10, windowMs: 60_000 });
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  
  const parsedTargetUrl = parseExternalHttpUrl(targetUrl);
  if (!parsedTargetUrl) {
    return NextResponse.json({ success: false, error: 'INVALID_URL' }, { status: 400 });
  }
  if (!isSupportedProductStore(parsedTargetUrl)) {
    return NextResponse.json({ success: false, error: 'UNSUPPORTED_STORE' }, { status: 400 });
  }
  
  let timeoutId;
  try {
    // 1. Fetch HTML of the product URL
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
    
    const { html, finalUrl } = await fetchProductHtml(parsedTargetUrl, controller.signal);
    clearTimeout(timeoutId);
    
    // 2. Extract OpenGraph and Title tags using regular expressions
    // Extract og:title
    const titleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
    const titleRegexAlt = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i;
    let rawTitle = '';
    let match = html.match(titleRegex) || html.match(titleRegexAlt);
    if (match && match[1]) {
      rawTitle = match[1];
    } else {
      // Fallback to <title>
      const titleTagRegex = /<title[^>]*>([^<]+)<\/title>/i;
      match = html.match(titleTagRegex);
      if (match && match[1]) {
        rawTitle = match[1];
      }
    }
    
    // Extract og:image
    const imageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
    const imageRegexAlt = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i;
    let imageUrl = '';
    match = html.match(imageRegex) || html.match(imageRegexAlt);
    if (match && match[1]) {
      imageUrl = match[1];
    }
    
    // 3. Extract price details (Amazon and Noon formats)
    let extractedPrice = null;
    
    // Search for OpenGraph product price
    const ogPriceRegex = /<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i;
    match = html.match(ogPriceRegex);
    if (match && match[1]) {
      extractedPrice = parseFloat(match[1]);
    }
    
    // If not found, look for Noon or Amazon specific price strings inside the HTML body
    if (!extractedPrice) {
      // Match price pattern like "AED 599.00" or "599 AED" or "Dh 599" or "599 Dhs"
      const priceTextPatterns = [
        /aed\s*([\d,.]+)/i,
        /([\d,.]+)\s*aed/i,
        /dh\s*([\d,.]+)/i,
        /([\d,.]+)\s*dhs/i,
        /price-amount[^>]*>([\d,.]+)/i
      ];
      
      for (const pattern of priceTextPatterns) {
        match = html.match(pattern);
        if (match && match[1]) {
          const cleanPrice = parseFloat(match[1].replace(/,/g, ''));
          if (cleanPrice > 1 && cleanPrice < 25000) {
            extractedPrice = cleanPrice;
            break;
          }
        }
      }
    }
    
    // 4. Translate English title to Persian
    // Clean raw title from HTML entities if any
    const cleanTitleStr = rawTitle
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
      
    const translatedTitle = translateToPersian(cleanTitleStr);
    
    // Determine category based on title
    let category = 'others';
    const titleLower = cleanTitleStr.toLowerCase();
    if (titleLower.includes('bag') || titleLower.includes('purse') || titleLower.includes('backpack') || titleLower.includes('tote')) {
      category = 'bags';
    } else if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('run') || titleLower.includes('boot')) {
      category = 'shoes';
    } else if (titleLower.includes('laptop') || titleLower.includes('phone') || titleLower.includes('macbook') || titleLower.includes('watch') || titleLower.includes('intel') || titleLower.includes('amd')) {
      category = 'electronics';
    } else if (titleLower.includes('perfume') || titleLower.includes('dior') || titleLower.includes('sauvage') || titleLower.includes('cologne') || titleLower.includes('cream') || titleLower.includes('beauty')) {
      category = 'beauty';
    } else if (titleLower.includes('shirt') || titleLower.includes('pant') || titleLower.includes('dress') || titleLower.includes('jacket') || titleLower.includes('coat') || titleLower.includes('shein')) {
      category = 'clothing';
    }
    
    // Determine weight based on category
    let weight = 0.5;
    if (category === 'bags') weight = 0.8;
    else if (category === 'shoes') weight = 0.95;
    else if (category === 'electronics') weight = titleLower.includes('phone') || titleLower.includes('watch') ? 0.3 : 1.35;
    else if (category === 'beauty') weight = 0.55;
    else if (category === 'clothing') weight = 0.7;
    
    // Determine brand
    const urlObj = finalUrl;
    const domain = urlObj.hostname.replace('www.', '');
    let brand = domain.split('.')[0];
    brand = brand.charAt(0).toUpperCase() + brand.slice(1);
    
    // Match common brands
    if (titleLower.includes('nike')) brand = 'Nike';
    else if (titleLower.includes('adidas')) brand = 'Adidas';
    else if (titleLower.includes('kors')) brand = 'Michael Kors';
    else if (titleLower.includes('apple')) brand = 'Apple';
    else if (titleLower.includes('dior')) brand = 'Dior';
    else if (titleLower.includes('shein')) brand = 'Shein';

    const productData = {
      name: translatedTitle,
      nameEn: cleanTitleStr,
      brand,
      store: domain,
      priceAed: extractedPrice,
      weight,
      category,
      imageUrl,
      sourceUrl: finalUrl.toString(),
    };

    if (!extractedPrice) {
      return NextResponse.json({
        success: false,
        error: 'PRICE_NOT_FOUND',
        product: productData,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      ...productData,
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    
    const knownClientError = ['INVALID_URL', 'PRIVATE_DESTINATION', 'UNSUPPORTED_STORE', 'INVALID_REDIRECT'].includes(error?.message);
    return NextResponse.json({
      success: false,
      error: knownClientError ? error.message : 'PRODUCT_FETCH_FAILED',
    }, { status: knownClientError ? 400 : 502 });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
