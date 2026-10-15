import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { validateProductImage } from '../src/lib/productImageValidation.js';
import { isOwnedProductBlobPathname, normalizeProductImagesInput } from '../src/lib/productGallery.js';

async function uploadRoute({ authorized = true } = {}) {
  const calls = [];
  const dependencies = {
    'node:crypto': { randomUUID }, '@vercel/blob': { put: async (pathname,bytes,options) => { calls.push({pathname,bytes,options});return {pathname,url:'https://qa.public.blob.vercel-storage.com/'+pathname}; } },
    'next/server': { NextResponse: { json: (data,options) => Response.json(data,options) } },
    '@/lib/adminApiAuth': { authorizeAdminApiRequestAny: async () => authorized ? {admin:{id:'qa'}} : {response:Response.json({error:'Unauthorized'},{status:401})} },
    '@/lib/adminActivity': { logAdminActivity: async () => {} },
    '@/lib/adminPermissions': { ADMIN_PERMISSIONS: { PRODUCTS_CREATE:'create',PRODUCTS_EDIT:'edit' } },
    '@/lib/productGallery': { isOwnedProductBlobPathname }, '@/lib/productImageValidation': { validateProductImage },
    '@/lib/productImageStorage': { getProductBlobAuthOptions: () => ({ token: 'isolated-mock-provider' }), deleteUnreferencedProductBlobs: () => assert.fail('Upload must not delete storage') },
    '@/lib/prisma': { prisma: {} },
  };
  const source=(await readFile(new URL('../src/app/api/admin/products/upload/route.js',import.meta.url),'utf8')).replace(/import\s*{([^}]+)}\s*from\s*'([^']+)';/g,(_,names,module)=>`const {${names}}=dependencies[${JSON.stringify(module)}];`).replace(/export /g,'');
  const route = await new (Object.getPrototypeOf(async function(){}).constructor)('dependencies',source+'\nreturn {POST};')(dependencies);
  return { ...route,calls };
}
const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
function request(type='image/png',bytes=png){const data=new FormData();data.set('file',new File([bytes],'qa.png',{type}));return new Request('http://localhost/api/admin/products/upload',{method:'POST',body:data});}
test('existing protected upload handler supports repeated files and persists returned storage identity per gallery',async()=>{
  const route=await uploadRoute(); const uploaded=[];
  for(let i=0;i<3;i++){const response=await route.POST(request());assert.equal(response.status,201);uploaded.push(await response.json());}
  assert.equal(route.calls.length,3);assert.equal(new Set(uploaded.map(row=>row.blobPathname)).size,3);
  for(const call of route.calls){assert.equal(call.options.allowOverwrite,false);assert.equal(call.options.access,'public');assert.equal(call.options.contentType,'image/png');assert.deepEqual(call.bytes,png);}
  const normalized=normalizeProductImagesInput(uploaded.map(({url,blobPathname},i)=>({url,blobPathname,isPrimary:i===1})));
  assert.equal(normalized.error,undefined);assert.equal(normalized.data[1].isPrimary,true);
});
test('upload rejects unauthorized requests before storage access',async()=>{const route=await uploadRoute({authorized:false});assert.equal((await route.POST(request())).status,401);assert.equal(route.calls.length,0);});
test('upload rejects disguised file types without a provider request',async()=>{const route=await uploadRoute();assert.equal((await route.POST(request('image/jpeg'))).status,400);assert.equal(route.calls.length,0);});
