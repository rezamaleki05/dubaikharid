/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    if (process.env.VERCEL_ENV === 'production') {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }

    if (process.env.VERCEL_ENV === 'preview') {
      headers.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' });
    }

    // Facets on catalog pages are navigation states, not new search intents.
    // Deliberately excludes Homepage, Product details and paginated Store/Brand collections.
    const catalogPaths = ['/men', '/women', '/kids', '/sports-shoes', '/clothing', '/bags-accessories', '/beauty-health', '/watches', '/electronics', '/mobile', '/sale', '/best-sellers'];
    const facetHeaders = catalogPaths.flatMap(source => ['sub', 'sort', 'brand', 'brands', 'category', 'q'].map(key => ({
      source,
      has: [{ type: 'query', key }],
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
    })));
    return [{ source: '/:path*', headers }, ...facetHeaders];
  },
};

export default nextConfig;
