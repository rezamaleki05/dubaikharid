import 'server-only';

const DEFAULT_SITE_URL = 'https://dubaikharid.shop';
const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

function value(name) {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function required(name, { minLength = 1 } = {}) {
  const current = value(name);
  if (!current) throw new Error(`Missing required server environment variable: ${name}`);
  if (current.length < minLength) throw new Error(`${name} must contain at least ${minLength} characters.`);
  return current;
}

function httpUrl(name, raw, { httpsOnly = false } = {}) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || (httpsOnly && parsed.protocol !== 'https:')) {
    throw new Error(`${name} must use ${httpsOnly ? 'https' : 'http or https'}.`);
  }
  return parsed.toString().replace(/\/$/, '');
}

export function getDatabaseUrl() {
  const url = required('DATABASE_URL');
  if (!/^postgres(?:ql)?:\/\//i.test(url)) throw new Error('DATABASE_URL must be a PostgreSQL URL.');
  return url;
}

export function getAdminSessionSecret() {
  return required('ADMIN_SESSION_SECRET', { minLength: 32 });
}

export function getCustomerSessionSecret() {
  return required('NEXTAUTH_SECRET', { minLength: 32 });
}

export function getGoogleOAuthConfig() {
  const clientId = value('GOOGLE_CLIENT_ID');
  const clientSecret = value('GOOGLE_CLIENT_SECRET');
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together.');
  }
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function getSiteUrl() {
  return httpUrl('NEXT_PUBLIC_SITE_URL', value('NEXT_PUBLIC_SITE_URL') || DEFAULT_SITE_URL, {
    httpsOnly: process.env.VERCEL_ENV === 'production',
  });
}

export function getGoogleAnalyticsMeasurementId() {
  const measurementId = value('NEXT_PUBLIC_GA_MEASUREMENT_ID');
  return measurementId && GA_MEASUREMENT_ID_PATTERN.test(measurementId) ? measurementId : null;
}

export function isGoogleAnalyticsEnabled() {
  return process.env.VERCEL_ENV === 'production'
    && getSiteUrl() === DEFAULT_SITE_URL
    && Boolean(getGoogleAnalyticsMeasurementId());
}

export function isPreviewDeployment() {
  return process.env.VERCEL_ENV === 'preview';
}
