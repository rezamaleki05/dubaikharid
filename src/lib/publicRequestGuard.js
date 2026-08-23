import 'server-only';

const buckets = globalThis.__dubaiKharidPublicRequestBuckets || new Map();
globalThis.__dubaiKharidPublicRequestBuckets = buckets;

export function publicRequestGuard(request, { limit = 12, windowMs = 60_000 } = {}) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return { error: 'مبدأ درخواست معتبر نیست.', status: 403 };
    } catch {
      return { error: 'مبدأ درخواست معتبر نیست.', status: 403 };
    }
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) return { error: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.', status: 429 };
  current.count += 1;
  return null;
}

export function readIdempotencyKey(request) {
  const value = request.headers.get('idempotency-key')?.trim();
  return value && /^[A-Za-z0-9_-]{16,128}$/.test(value) ? value : null;
}
