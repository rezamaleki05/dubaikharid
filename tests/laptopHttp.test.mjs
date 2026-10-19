import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.LAPTOP_HTTP_TEST_ORIGIN;
const request=async path=>{assert.equal(new URL(origin).hostname,'localhost');assert.equal(new URL(origin).port,'3108');return fetch(origin+path,{redirect:'manual'})};
for(const model of ['5530','7510']) test(`Laptop canonical ${model}: one H1, bilingual metadata, gallery and display specs`,{skip:!origin},async()=>{
 const response=await request('/laptops/dell-precision-'+model);assert.equal(response.status,200);const html=await response.text();assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.match(html,new RegExp('Dell Precision '+model));assert.ok(html.includes('https://dubaikharid.shop/laptops/dell-precision-'+model));assert.match(html,/index, follow/);assert.match(html,/application\/ld\+json/);assert.match(html,/صفحه لمسی/);assert.match(html,/کیفیت نمایشگر/);
 const api=await request('/api/laptops/qa-laptop-'+model);const body=await api.json();assert.equal(body.images.length,4);assert.equal(body.image,body.images[0]);assert.ok(!('serial' in body));
});
test('Laptop legacy Product path and previous model slug return permanent redirects; normal Products do not',{skip:!origin},async()=>{
 for(const path of ['/product/qa-laptop-5530','/laptops/dell-legacy5530']){const r=await request(path);assert.equal(r.status,308);assert.match(r.headers.get('location'),/\/laptops\/dell-precision-5530$/)}
 const p=await request('/product/cmuucn84r000304ld8kncox78');assert.equal(p.status,200);
});
test('unknown Laptop detail is noindex rather than invented identity',{skip:!origin},async()=>{const r=await request('/laptops/not-a-real-model');assert.equal(r.status,404);assert.match(await r.text(),/noindex/)});
