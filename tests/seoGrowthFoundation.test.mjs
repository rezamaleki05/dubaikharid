import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { collectionSeoState, collectionPageExists } from '../src/lib/collectionSeoDomain.js';
import { guides, brandGuides, storeAnswers } from '../src/lib/commerceGuides.js';
const read = path => fs.readFileSync(path, 'utf8');

test('Homepage design, content, H1, metadata, canonical and shared dependencies stay byte-for-byte frozen', () => {
 const manifest = JSON.parse(read('docs/seo/homepage-freeze.json'));
 for (const [path, expected] of Object.entries(manifest)) assert.equal(crypto.createHash('sha256').update(read(path)).digest('hex'), expected, path);
 assert.equal(read('src/components/Hero.js').match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 'خرید مستقیم از دبی و ارسال به ایران');
});

test('collection pagination has its own canonical and strips tracking', () => {
 assert.deepEqual(collectionSeoState('/stores/amazon', { page:'2',utm_source:'test' }), {page:2,path:'/stores/amazon?page=2',noindex:false});
 assert.equal(collectionSeoState('/stores/amazon',{page:'1'}).path,'/stores/amazon');
});
for (const page of ['0','-1','1.5','NaN','1000000',['2','3'],'02']) test(`invalid pagination ${JSON.stringify(page)} is not indexable`, () => assert.equal(collectionSeoState('/brands/nike',{page}).page,null));
test('facets are noindex with a stable pagination canonical', () => assert.deepEqual(collectionSeoState('/brands/nike',{page:'2',sort:'price'}),{page:2,path:'/brands/nike?page=2',noindex:true}));
test('nonexistent collection pages do not become indexable empty 200 pages', () => {assert.equal(collectionPageExists(2,1),false);assert.equal(collectionPageExists(1,0),true);assert.equal(collectionPageExists(2,3),true);});
test('Product body uses authoritative public data at server render and preserves canonical identity', () => {
 const server=read('src/app/product/[id]/page.js'),client=read('src/app/product/[id]/ProductClient.js');
 assert.match(server,/await getPublicProduct\(id\)/);assert.match(server,/if \(!product\) notFound\(\)/);assert.match(server,/permanentRedirect\(`\/product\/\$\{product.id\}`\)/);
 assert.ok(server.indexOf("identity?.kind === 'laptop'") < server.indexOf('await getPublicProduct(id)'));
 assert.match(client,/useState\(initialProduct\)/);assert.equal((client.match(/<h1/g)||[]).length,1);
 assert.match(read('src/app/product/[id]/layout.js'),/productPath\(item.id\)/);
});
test('no-review Products do not invent a five-star average',()=>assert.match(read('src/app/product/[id]/ProductClient.js'),/: '—'/));
test('curated guide content has unique identity and substantive direct answers', () => {
 assert.equal(new Set(Object.values(guides).map(x=>x.title)).size,Object.keys(guides).length);
 for(const guide of [...Object.values(guides),...Object.values(brandGuides)]) {assert.ok(guide.intro.length>100);assert.ok(guide.answers.length>=2);for(const [q,a]of guide.answers){assert.ok(q.endsWith('؟'));assert.ok(a.length>100);}for(const [url]of guide.links)assert.ok(url.startsWith('/')&&!url.startsWith('//'));}
 assert.equal(Object.keys(storeAnswers).length,3);
});
test('guides are server rendered, one H1, visible answers and truthful schema',()=>{
 const page=read('src/app/guides/[slug]/page.js');assert.doesNotMatch(page,/'use client'/);assert.equal((page.match(/<h1/g)||[]).length,1);assert.match(page,/if \(!guide\) notFound\(\)/);assert.match(page,/breadcrumbSchema/);assert.doesNotMatch(page,/FAQPage|AggregateRating|Review|gtin|mpn/);
 const sections=read('src/components/seo/AnswerSections.js');assert.match(sections,/<h2>\{question\}<\/h2><p>\{answer\}<\/p>/);
});
test('sitemap discovers curated guides and rich empty-inventory landing pages, excluding private/hidden data',()=>{
 const map=read('src/app/sitemap.js');assert.match(map,/Object.keys\(guides\)/);assert.match(map,/Object.keys\(brandGuides\)/);assert.match(map,/PUBLIC_PRODUCT_VISIBILITY/);assert.match(map,/getPublicLaptopModelGroups/);assert.doesNotMatch(map,/absoluteUrl\('\/(admin|search|profile|cart|payment)/);
});
test('private routes and search retain noindex; public assets remain crawlable',()=>{
 for(const path of ['admin','profile','cart','payment','login','tracking','wishlist','search']) assert.match(read(`src/app/${path}/layout.js`),/NOINDEX_METADATA|index: false/);
 const robots=read('src/app/robots.js');assert.match(robots,/disallow: \['\/admin'/);assert.doesNotMatch(robots,/disallow:.*\/(_next|images|product|laptops|brands)/);
});

test('catalog facet headers noindex only explicit collection paths; never frozen Homepage',async()=>{
 const {default:config}=await import('../next.config.mjs');const headers=await config.headers();const facets=headers.filter(x=>x.has);
 assert.ok(facets.length>0);assert.ok(facets.every(x=>x.source!=='/'&&!x.source.includes(':')));
 assert.ok(facets.some(x=>x.source==='/sports-shoes'&&x.has[0].key==='sub'));
 assert.ok(facets.every(x=>x.headers.some(h=>h.key==='X-Robots-Tag'&&h.value==='noindex, follow')));
});
