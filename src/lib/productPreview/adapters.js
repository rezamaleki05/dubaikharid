const SOURCE_DEFINITIONS = Object.freeze([
  {
    id: 'amazon_uae',
    label: 'Amazon UAE',
    domains: ['amazon.ae'],
    titleSelectors: ['#productTitle'],
    brandSelectors: ['#bylineInfo'],
    priceSelectors: [
      '#corePrice_feature_div .priceToPay .a-offscreen',
      '#corePrice_feature_div .a-price .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
    ],
    imageSelectors: ['#landingImage', '#imgTagWrapperId img'],
    embeddedScriptSelectors: ['script[type="a-state"][data-a-state*="product"]'],
  },
  {
    id: 'noon',
    label: 'Noon',
    domains: ['noon.com', 'noon.ae'],
    titleSelectors: [
      '[data-qa="pdp-product-name"]',
      '[data-testid="product-title"]',
      'h1',
    ],
    brandSelectors: [
      '[data-qa="pdp-brand"]',
      '[data-testid="product-brand"]',
    ],
    priceSelectors: [
      '[data-qa="pdp-price"]',
      '[data-testid="product-price"]',
      '[class*="priceNow"]',
    ],
    imageSelectors: [
      '[data-qa="pdp-image"] img',
      '[data-testid="product-image"] img',
    ],
    embeddedScriptSelectors: ['#__NEXT_DATA__', 'script[data-testid="product-json"]'],
  },
  {
    id: 'namshi',
    label: 'Namshi',
    domains: ['namshi.com'],
    titleSelectors: [
      '[data-testid="product-title"]',
      '[data-qa="product-name"]',
      'h1',
    ],
    brandSelectors: [
      '[data-testid="product-brand"]',
      '[data-qa="product-brand"]',
    ],
    priceSelectors: [
      '[data-testid="product-price"]',
      '[data-qa="product-price"]',
      '[class*="ProductPrice"]',
    ],
    imageSelectors: [
      '[data-testid="product-image"] img',
      '[data-qa="product-image"] img',
    ],
    embeddedScriptSelectors: ['#__NEXT_DATA__', '#__APOLLO_STATE__', 'script[data-testid="product-json"]'],
  },
]);

function hostnameMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function getProductSource(url) {
  const hostname = url.hostname.toLowerCase();
  return SOURCE_DEFINITIONS.find(source => source.domains.some(domain => hostnameMatches(hostname, domain))) || null;
}

export function getSupportedProductDomains() {
  return SOURCE_DEFINITIONS.flatMap(source => source.domains);
}

export { SOURCE_DEFINITIONS };
