// Synthetic fixtures only. Explicit disposable localhost database; never loads .env.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { hash } from 'bcryptjs';
import pg from 'pg';
const url = process.env.COLOR_GALLERY_QA_DATABASE_URL;
assert.ok(url && ['127.0.0.1','localhost'].includes(new URL(url).hostname));
assert.match(new URL(url).pathname, /^\/gallery_[a-z0-9_]+$/);
assert.ok(process.env.COLOR_GALLERY_QA_EMAIL?.endsWith('@example.test'));
assert.ok(process.env.COLOR_GALLERY_QA_PASSWORD?.length >= 12);
const db = new pg.Client({ connectionString: url }); await db.connect();
try {
  assert.equal((await db.query('SELECT id FROM "Product" LIMIT 1')).rowCount, 0, 'Use an empty disposable fixture database.');
  await db.query('BEGIN');
  await db.query(`INSERT INTO "AdminUser" (id,email,"passwordHash",role,"updatedAt") VALUES ('qa-admin',$1,$2,'SUPER_ADMIN',NOW())`, [process.env.COLOR_GALLERY_QA_EMAIL, await hash(process.env.COLOR_GALLERY_QA_PASSWORD,10)]);
  await db.query(`INSERT INTO "Category" (id,name,query) VALUES ('qa-category','کفش نمونه','qa-shoes')`);
  await db.query(`INSERT INTO "Brand" (id,name,"faName") VALUES ('qa-brand','QA','برند نمونه')`);
  await db.query(`INSERT INTO "BrandCategory" ("brandId","categoryId") VALUES ('qa-brand','qa-category')`);
  for (const [id,code,name,type] of [['qa-finish','finish','رنگ','COLOR'],['qa-fit','fit','سایز','MULTI_SELECT']]) {
    await db.query(`INSERT INTO "CatalogAttribute" (id,code,"nameFa","nameEn","inputType","updatedAt") VALUES ($1,$2,$3,$2,$4,NOW())`,[id,code,name,type]);
    await db.query(`INSERT INTO "CategoryAttribute" (id,"categoryId","attributeId","isVariantDefining","allowsMultiple","sortOrder","updatedAt") VALUES ($1,'qa-category',$2,true,true,$3,NOW())`,[id+'-assignment',id,id==='qa-finish'?0:1]);
  }
  for (const [id,label,swatch,attribute] of [['black','مشکی','#151515','qa-finish'],['white','سفید','#ffffff','qa-finish'],['red','قرمز','#c32832','qa-finish'],['39','39',null,'qa-fit'],['40','40',null,'qa-fit'],['41','41',null,'qa-fit']]) {
    await db.query(`INSERT INTO "AttributeOption" (id,"attributeId",code,"labelFa","labelEn","swatchHex","updatedAt") VALUES ($1,$2,$3,$4,$3,$5,NOW())`,['qa-'+id,attribute,id,label,swatch]);
  }
  await db.query('COMMIT');
  await mkdir('public/__qa_phase2y',{recursive:true});
  for (const [color,count,fill] of [['general',2,'#ded8cd'],['black',4,'#20252c'],['white',3,'#eeeeee']]) for(let i=0;i<count;i++) {
    await writeFile(`public/__qa_phase2y/${color}-${i}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700"><rect width="700" height="700" fill="#f5f4f1"/><path d="M140 380 L240 240 360 320 540 370 560 440 140 440Z" fill="${fill}" stroke="#777" stroke-width="3"/><text x="350" y="530" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#555">${color.toUpperCase()} / ${i+1}</text></svg>`);
  }
  console.log('Synthetic fixture ready. Remove public/__qa_phase2y after browser QA.');
} catch(error) { await db.query('ROLLBACK'); throw error; } finally { await db.end(); }
