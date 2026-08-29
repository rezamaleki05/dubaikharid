import { parseExternalHttpUrl } from '../externalUrlPolicy.js';

export function normalizePreviewImageUrl(value, pageUrl) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let candidate;
  try { candidate = new URL(value.trim(), pageUrl); } catch { return null; }
  const parsed = parseExternalHttpUrl(candidate.toString());
  return parsed?.toString() || null;
}
