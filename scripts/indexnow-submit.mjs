// Operator-only release tool. No public submission API, no DB writes, no build hook.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import nextEnv from '@next/env';
import { INDEXNOW_ORIGIN, canonicalIndexNowUrl, createIndexNowClient, indexNowConfiguration } from '../src/lib/indexnowDomain.js';
import { guides, brandGuides, storeAnswers } from '../src/lib/commerceGuides.js';
import { changedIndexNowContent } from '../src/lib/indexnowContent.js';

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const args = process.argv.slice(2), option = name => args[args.indexOf(name) + 1];
const category = url => {
  const path = new URL(url).pathname;
  if (path === '/') return 'homepage';
  if (path === '/buy-from-dubai') return 'service';
  for (const [prefix, label] of [['/product/', 'product'], ['/laptops/', 'laptop'], ['/stores/', 'store'], ['/brands/', 'brand'], ['/guides/', 'guide']]) if (path.startsWith(prefix)) return label;
  return ['/about', '/brands'].includes(path) ? 'other' : 'category';
};
async function get(url) {
  return fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'error', headers: { 'User-Agent': 'DubaiKharid-IndexNow-Verification/1.0' } });
}
async function verify(url) {
  const response = await get(url);
  if (response.status !== 200 || /noindex/i.test(response.headers.get('x-robots-tag') || '')) throw Error(`Not indexable: ${url}`);
  const html = await response.text();
  const tags = html.match(/<(?:link|meta)\b[^>]*>/gi) || [];
  let canonical;
  for (const tag of tags) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)=["']([^"']*)["']/g)].map(match => [match[1].toLowerCase(), match[2]]));
    if (/robots|bingbot|googlebot/i.test(attrs.name || '') && /noindex/i.test(attrs.content || '')) throw Error(`Noindex: ${url}`);
    if (attrs.rel === 'canonical') canonical = attrs.href;
  }
  if (!canonical || new URL(canonical).href !== url) throw Error(`Canonical mismatch: ${url}`);
}
async function main() {
  let urls;
  if (args.includes('--from-sitemap')) {
    const response = await get(`${INDEXNOW_ORIGIN}/sitemap.xml`);
    if (!response.ok) throw Error('Sitemap unavailable');
    const xml = await response.text();
    if (!/<urlset(?:\s|>)/.test(xml) || !xml.includes('</urlset>')) throw Error('Invalid sitemap XML document');
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&'));
    if (!urls.length) throw Error('Unexpected empty sitemap; stopped');
  } else if (args.includes('--changed-from')) {
    const ref = option('--changed-from');
    if (!/^[a-f0-9]{40}$/.test(ref)) throw Error('Use an exact trusted baseline Git SHA');
    const oldSource = execFileSync('git', ['show', `${ref}:src/lib/commerceGuides.js`], { encoding: 'utf8' });
    // This repository module is versioned first-party literal content, with no imports.
    if (/\bimport\s/.test(oldSource)) throw Error('Content audit required: historical module has imports');
    const previous = await import(`data:text/javascript;base64,${Buffer.from(oldSource).toString('base64')}`);
    const files = execFileSync('git', ['diff', '--name-only', ref, 'HEAD'], { encoding: 'utf8' }).split('\n');
    const response = await get(`${INDEXNOW_ORIGIN}/sitemap.xml`);
    if (!response.ok) throw Error('Sitemap unavailable');
    const liveUrls = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&'));
    urls = changedIndexNowContent({ previous, current: { guides, brandGuides, storeAnswers }, files, liveUrls });
  } else if (args.includes('--urls-file')) urls = JSON.parse(await fs.readFile(option('--urls-file'), 'utf8')).urls;
  else throw Error('Use --from-sitemap, --changed-from <SHA>, or --urls-file <manifest>');
  if (!Array.isArray(urls) || urls.some(url => !canonicalIndexNowUrl(url))) throw Error('Unsafe URL list; stopped');
  urls = [...new Set(urls.map(canonicalIndexNowUrl))];
  if (urls.length > 200) throw Error('Unexpectedly large list (>200); review before submission');
  const breakdown = urls.reduce((counts, url) => ({ ...counts, [category(url)]: (counts[category(url)] || 0) + 1 }), {});
  console.log(JSON.stringify({ urlCount: urls.length, breakdown, urls }, null, 2));
  for (const url of urls) await verify(url);
  const manifest = { urls, breakdown, digest: createHash('sha256').update(JSON.stringify(urls)).digest('hex') };
  if (args.includes('--output')) await fs.writeFile(option('--output'), JSON.stringify(manifest, null, 2));
  if (!args.includes('--send')) { console.log('DRY_RUN_VERIFIED; no IndexNow submission'); return; }
  if (!urls.length) { console.log('No changed public URLs; no submission'); return; }
  const configuration = indexNowConfiguration();
  if (!configuration) throw Error('Production apex configuration/key required');
  const proof = await get(configuration.keyLocation);
  if (proof.status !== 200 || await proof.text() !== configuration.key) throw Error('Key verification failed; stopped');
  const receiptPath = option('--receipt');
  if (!args.includes('--receipt') || !receiptPath) throw Error('Explicit --receipt <file> required to prevent accidental repeat');
  // Reserve before sending: a timeout is uncertain; inspect receipt before any manual retry.
  await fs.writeFile(receiptPath, JSON.stringify({ digest: manifest.digest, state: 'SUBMISSION_STARTED', count: urls.length }), { flag: 'wx' });
  const result = await createIndexNowClient().submit(urls);
  await fs.writeFile(receiptPath, JSON.stringify({ digest: manifest.digest, ...result }, null, 2));
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
