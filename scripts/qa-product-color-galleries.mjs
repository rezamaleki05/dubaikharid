// Authenticated round-trip against an explicitly isolated localhost app/database only.
import assert from 'node:assert/strict';
import pg from 'pg';
import { writeFileSync } from 'node:fs';
const origin = process.env.COLOR_GALLERY_QA_ORIGIN;
const database = process.env.COLOR_GALLERY_QA_DATABASE_URL;
assert.ok(origin && ['localhost','127.0.0.1'].includes(new URL(origin).hostname));
assert.ok(database && ['localhost','127.0.0.1'].includes(new URL(database).hostname));
assert.match(new URL(database).pathname, /^\/gallery_[a-z0-9_]+$/);
const db = new pg.Client({ connectionString: database }); await db.connect();
let cookie;
async function api(path, method = 'GET', body, expected = 200, authorized = true) {
  const response = await fetch(origin + path, { method, headers: { 'Content-Type': 'application/json', ...(authorized && cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return { response, data };
}
const snapshots = async () => {
  const result = {};
  for (const table of ['Order','OrderItem','Laptop','WarehouseItem','Setting','TelegramPublication']) {
    result[table] = (await db.query(`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY to_jsonb(t)::text`)).rows;
  }
  return result;
};
try {
  const before = await snapshots();
  const login = await api('/api/admin/auth/login','POST',{ email: process.env.COLOR_GALLERY_QA_EMAIL, password: process.env.COLOR_GALLERY_QA_PASSWORD });
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  const images = (color, count, cover) => Array.from({ length: count }, (_, i) => ({ url: `/__qa_phase2y/${color}-${i}.svg`, isPrimary: i === cover, altFa: `${color} ${i}` }));
  const body = {
    product: { nameFa: 'کفش نمونه گالری رنگ', nameEn: 'Sample Shoe', slug: 'qa-color-shoe', categoryId: 'qa-category', brandId: 'qa-brand', supplyMode: 'IRAN_STOCK', priceToman: '3500000', weight: 1, status: 'active' },
    images: images('general',2,0),
    colorGalleries: [{ colorOptionId: 'qa-black', images: images('black',4,2) }, { colorOptionId: 'qa-white', images: images('white',3,1) }],
    attributeValues: [],
    variants: ['black','white','red'].flatMap(color => ['39','40','41'].map(size => ({ optionIds: ['qa-'+color,'qa-'+size], priceTomanOverride: color === 'white' ? '3900000' : null, inventory: { stock: 5, minStock: 1, location: 'LOCAL-QA' } }))),
  };
  await api('/api/admin/products/configuration','POST',body,401,false);
  const { data: saved } = await api('/api/admin/products/configuration','POST',body,201);
  const id = saved.product.id;
  const path = '/api/admin/products/'+id+'/configuration';
  const payload = detail => ({ product: body.product, images: detail.product.images.map(clean), colorGalleries: detail.product.colorGalleries.map(gallery => ({ colorOptionId: gallery.colorOptionId, images: gallery.images.map(clean) })), attributeValues: [], variants: detail.variants.filter(row => row.isActive).map(row => ({ id: row.id, optionIds: row.options.map(option => option.optionId), priceTomanOverride: row.priceTomanOverride, inventory: { stock: row.inventory.stock, minStock: row.inventory.minStock, location: row.inventory.location } })) });
  function clean({ id,url,blobPathname,isPrimary,altFa,altEn }) { return { id,url,blobPathname,isPrimary,altFa,altEn }; }
  const reopened = (await api(path)).data;
  assert.deepEqual(reopened.product.colorGalleries, saved.product.colorGalleries);
  assert.equal(reopened.product.images.length,2);
  assert.equal(reopened.product.colorGalleries.find(g=>g.colorOptionId==='qa-black').images.length,4);
  const inventoryBefore = (await db.query('SELECT to_jsonb(t) AS row FROM "ProductInventory" t ORDER BY id')).rows;
  // Reorder, change cover, and verify save/reopen.
  let update = payload(reopened);
  update.colorGalleries[0].images.reverse();
  update.colorGalleries[0].images.forEach((row,i)=>{row.isPrimary=i===0;});
  const reordered = (await api(path,'PATCH',update)).data;
  assert.deepEqual(reordered.product.colorGalleries.find(g=>g.colorOptionId===update.colorGalleries[0].colorOptionId).images.map(row=>row.id),update.colorGalleries[0].images.map(row=>row.id));
  assert.equal(reordered.product.colorGalleries[0].images[0].isPrimary,true);
  // Stable identities cannot migrate to a different gallery or product.
  const stolen = payload(reordered); stolen.colorGalleries[1].images[0] = stolen.colorGalleries[0].images[0];
  assert.ok((await api(path,'PATCH',stolen,400)).data.error);
  const foreign = payload(reordered); foreign.colorGalleries.push({ colorOptionId:'qa-39',images:images('black',1,0) });
  await api(path,'PATCH',foreign,400);
  const reassigned = payload(reordered); reassigned.colorGalleries[1].images=[{ ...reassigned.colorGalleries[0].images[0] }]; reassigned.colorGalleries[0].images.shift();
  await api(path,'PATCH',reassigned,409);
  const oldClient = payload(reordered); delete oldClient.colorGalleries;
  const oldSaved = (await api(path,'PATCH',oldClient)).data;
  assert.deepEqual(oldSaved.product.colorGalleries,reordered.product.colorGalleries);
  // Removing a color leaves its images reviewable, and only removes it from public gallery choices.
  const removedColor = payload(oldSaved); removedColor.variants=removedColor.variants.filter(row=>!row.optionIds.includes('qa-black')); delete removedColor.colorGalleries;
  await api(path,'PATCH',removedColor);
  assert.equal(Number((await db.query('SELECT count(*) FROM "ProductImage" WHERE "productId"=$1 AND "colorOptionId"=$2',[id,'qa-black'])).rows[0].count),4);
  const publicWithoutBlack = (await api('/api/products/'+id)).data;
  assert.equal(publicWithoutBlack.colorGalleries.some(g=>g.colorOptionId==='qa-black'),false);
  // Restore the QA fixture for browser verification; identities and stock remain unchanged.
  await api(path,'PATCH',payload(reordered));
  const publicProduct = (await api('/api/products/'+id)).data;
  assert.equal(publicProduct.images.length,2); assert.equal(publicProduct.colorGalleries.length,2);
  assert.equal(publicProduct.image,'/__qa_phase2y/general-0.svg');
  assert.equal(publicProduct.variants.length,9);
  for (const color of ['black','white']) {
    const variant = publicProduct.variants.find(row => row.options.some(option => option.optionCode === color) && row.options.some(option => option.optionCode === '41'));
    for (const quantity of [1,6]) {
      const cart = (await api('/api/cart/resolve','POST',{items:[{type:'PRODUCT',id,productVariantId:variant.id,quantity}]})).data.data.items[0];
      assert.equal(cart.productVariantId,variant.id);
      assert.equal(cart.image,'/__qa_phase2y/general-0.svg');
      assert.equal(cart.available,quantity===1);
      assert.equal(cart.code,quantity===1?null:'INSUFFICIENT_STOCK');
      assert.equal(cart.pricing.finalPriceToman,color==='white'?'3900000':'3500000');
    }
  }
  assert.equal(publicProduct.variants.find(row=>row.options.some(option=>option.optionId==='qa-white')).pricing.finalPriceToman,'3900000');
  assert.deepEqual((await db.query('SELECT id,stock,reserved,"variantId" FROM "ProductInventory" ORDER BY id')).rows,inventoryBefore.map(({row})=>({id:row.id,stock:row.stock,reserved:row.reserved,variantId:row.variantId})).sort((a,b)=>a.id.localeCompare(b.id)));
  assert.deepEqual(await snapshots(),before);
  // Remove a color image association: storage deletion is intentionally not requested.
  const removeImage = payload((await api(path)).data); const white=removeImage.colorGalleries.find(g=>g.colorOptionId==='qa-white'); const removedId=white.images.pop().id;
  await api(path,'PATCH',removeImage);
  assert.equal((await db.query('SELECT id FROM "ProductImage" WHERE id=$1',[removedId])).rowCount,0);
  white.images=images('white',3,1); await api(path,'PATCH',removeImage);
  writeFileSync('/tmp/phase2y-product.json',JSON.stringify({ id, origin, results: ['save/reopen','order/cover','unauthorized write rejected','cross-gallery identity rejected','invalid color rejected','old client preservation','removed color retained','removed color hidden publicly','image association removal','canonical image stable','pricing override unchanged','all inventory counters preserved','business tables/Settings/TelegramPublication unchanged'] },null,2));
  console.log('PASS',id,'authenticated persistence/security/removal/public/commerce snapshots');
} finally { await db.end(); }
