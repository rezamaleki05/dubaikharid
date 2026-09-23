export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/إ|أ/g, 'ا')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchTextCandidates(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  const normalized = normalizeSearchText(raw);
  return [...new Set([raw, normalized].filter(Boolean))];
}

export function searchTokens(value) {
  return normalizeSearchText(value)
    .toLocaleLowerCase('fa-IR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 12);
}

const SEARCH_INTENT_WORDS = new Set(['خرید', 'قیمت', 'سفارش', 'از', 'در']);

export function meaningfulSearchTerms(value) {
  const tokens = searchTokens(value);
  const meaningful = tokens.filter(token => !SEARCH_INTENT_WORDS.has(token));
  return meaningful.length ? meaningful : tokens;
}
