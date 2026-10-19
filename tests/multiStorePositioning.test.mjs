import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guides } from '../src/lib/commerceGuides.js';
const read=p=>fs.readFileSync(p,'utf8');
test('previous three guides retain exact identity and dedicated intent',()=>{
 for(const slug of ['uae-store-comparison','shoe-sizing','stock-laptop-checklist']){assert.ok(guides[slug]);assert.ok(guides[slug].answers.length>=4);}
});
test('Temu is a single conditional review guide, not a fabricated stocked Brand',()=>{
 const guide=guides['temu-ordering'];assert.ok(guide);assert.match(guide.intro,/تأیید امکان خرید همه کالاها/);assert.ok(guide.answers.some(([q])=>q==='چطور از Temu خرید کنیم؟'));assert.doesNotMatch(guide.intro,/همکار رسمی|تضمین اصالت|ارسال رایگان/);
});
test('Store and Brand pages explain nonexclusive multi-store service with a relevant CTA',()=>{
 for(const path of ['src/app/stores/[slug]/page.js','src/app/brands/[slug]/page.js'])assert.match(read(path),/<MultiStoreNotice \/>/);
 const notice=read('src/components/seo/MultiStoreNotice.js');assert.match(notice,/بسیاری از فروشگاه/);assert.match(notice,/شرایط حمل/);assert.match(notice,/\/buy-from-dubai#send-link/);assert.doesNotMatch(notice,/تمام سایت|همه سایت‌ها را|هر وب‌سایت/);
});
test('buy guide remains procedural and keeps its distinct metadata/H1 while answering unlisted stores',()=>{
 const s=read('src/app/buy-from-dubai/page.js');assert.match(s,/title: 'راهنمای سفارش از سایت‌های امارات و محاسبه هزینه'/);assert.match(s,/<h1>راهنمای سفارش از سایت‌های امارات<\/h1>/);assert.match(s,/اگر سایت موردنظر من در لیست نباشد چه/);assert.match(s,/id="send-link"/);assert.match(s,/SHEIN، Nike، Temu، Adidas، Amazon UAE، Noon و Namshi/);
});
test('private Admin robots is explicit noindex/nofollow without changing auth logic',()=>assert.match(read('src/app/admin/layout.js'),/robots: \{ index: false, follow: false, nocache: true \}/));
