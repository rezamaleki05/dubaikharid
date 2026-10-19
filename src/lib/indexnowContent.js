import { INDEXNOW_ORIGIN, canonicalIndexNowUrl } from './indexnowDomain.js';

// Versioned content has no CMS. Run explicitly after its reviewed deployment, not on every build.
export function changedIndexNowContent({ previous, current, files = [], liveUrls = [] }) {
  const changed = (family, id) => JSON.stringify(previous[family]?.[id]) !== JSON.stringify(current[family]?.[id]);
  const urls = Object.keys(current.guides || {}).filter(id => changed('guides', id)).map(id => `${INDEXNOW_ORIGIN}/guides/${id}`);
  for (const url of liveUrls) {
    if (!canonicalIndexNowUrl(url)) continue;
    const path = new URL(url).pathname;
    const match = /^\/(stores|brands|guides)\/([^/]+)$/.exec(path);
    if (match && (files.includes(`src/app/${match[1]}/[slug]/page.js`) || (match[1] === 'stores' && changed('storeAnswers', match[2])) || (match[1] === 'brands' && changed('brandGuides', match[2])))) urls.push(url);
  }
  for (const [file, path] of [['src/app/buy-from-dubai/page.js', '/buy-from-dubai'], ['src/app/about/page.js', '/about']]) if (files.includes(file)) urls.push(INDEXNOW_ORIGIN + path);
  return [...new Set(urls)];
}
