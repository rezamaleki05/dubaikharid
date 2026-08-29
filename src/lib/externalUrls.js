import 'server-only';

import dns from 'node:dns/promises';
import net from 'node:net';
import {
  isPublicIp,
  isSupportedProductStore,
  normalizeProductSourceUrl,
  parseExternalHttpUrl,
} from './externalUrlPolicy.js';

export async function assertPublicDestination(url) {
  const parsed = url instanceof URL ? url : parseExternalHttpUrl(url);
  if (!parsed) throw new Error('INVALID_URL');
  const ipCandidate = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(ipCandidate)) {
    if (!isPublicIp(ipCandidate)) throw new Error('PRIVATE_DESTINATION');
    return parsed;
  }
  const addresses = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) throw new Error('PRIVATE_DESTINATION');
  return parsed;
}

export {
  isPublicIp,
  isSupportedProductStore,
  normalizeProductSourceUrl,
  parseExternalHttpUrl,
};
