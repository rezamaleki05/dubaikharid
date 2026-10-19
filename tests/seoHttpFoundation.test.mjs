import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.SEO_TEST_ORIGIN;
test('local HTTP: guides, rich landing indexability, pagination 404, robots and sitemap', {skip:!origin}, async()=>{
 assert.equal(origin,'http://localhost:3109');
 for(const path of ['/guides/uae-store-comparison','/guides/shoe-sizing','/guides/stock-laptop-checklist','/brands/shein','/stores/amazon']){
  const r=await fetch(origin+path);assert.equal(r.status,200,path);const html=await r.text();assert.equal((html.match(/<h1[ >]/g)||[]).length,1,path);assert.match(html,/<h2/);assert.match(html,/BreadcrumbList/);assert.ok(html.includes('rel="canonical" href="https://dubaikharid.shop'+path+'"'),path);assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
 }
 for(const path of ['/guides/unknown-guide','/guides/toString','/stores/amazon?page=9999','/brands/nike?page=0']){const r=await fetch(origin+path);assert.equal(r.status,404,path);assert.match(await r.text(),/noindex/);}
 const filtered=await fetch(origin+'/stores/amazon?sort=price');assert.match(await filtered.text(),/<meta name="robots" content="noindex, follow"/);
 const sitemap=await(await fetch(origin+'/sitemap.xml')).text();assert.match(sitemap,/\/guides\/shoe-sizing/);assert.match(sitemap,/\/stores\/amazon/);assert.match(sitemap,/\/brands\/shein/);assert.doesNotMatch(sitemap,/\/admin|\/search|\/cart|\/profile|\?page=/);
 const robots=await(await fetch(origin+'/robots.txt')).text();assert.match(robots,/Disallow: \/admin/);assert.doesNotMatch(robots,/Disallow: \/_next/);
});
