import net from 'node:net';
import { getSupportedProductDomains } from './productPreview/adapters.js';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
]);

const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'dclid', 'msclkid']);

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase().split('%')[0];
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:') ||
    (normalized.startsWith('::ffff:') && isPrivateIpv4(normalized.slice(7)));
}

export function isPublicIp(address) {
  const version = net.isIP(address);
  if (version === 4) return !isPrivateIpv4(address);
  if (version === 6) return !isPrivateIpv6(address);
  return false;
}

export function parseExternalHttpUrl(value, { maxLength = 2048 } = {}) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  let url;
  try { url = new URL(trimmed); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  if ((url.protocol === 'http:' && url.port && url.port !== '80') ||
      (url.protocol === 'https:' && url.port && url.port !== '443')) return null;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const ipCandidate = hostname.replace(/^\[|\]$/g, '');
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') || hostname.endsWith('.internal')) return null;
  if (net.isIP(ipCandidate) && !isPublicIp(ipCandidate)) return null;
  url.hostname = hostname;
  return url;
}

export function normalizeProductSourceUrl(value) {
  const url = parseExternalHttpUrl(value);
  if (!url) return null;
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  return url.toString();
}

export function isSupportedProductStore(url) {
  const hostname = url.hostname.toLowerCase();
  return getSupportedProductDomains().some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}
