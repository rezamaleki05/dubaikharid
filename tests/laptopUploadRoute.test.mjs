import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
let source = read('src/app/api/admin/laptops/upload/route.js')
  .replace("import { put } from '@vercel/blob';", `const uploads = []; const put = async (pathname,bytes,options) => { uploads.push({pathname,bytes,options}); return {pathname,url:'https://qa.public.blob.vercel-storage.com/'+pathname}; }; export { uploads };`)
  .replace("import { NextResponse } from 'next/server';", 'const NextResponse = Response;')
  .replace("import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';", `const authorizeAdminApiRequest = async request => request.headers.get('x-qa-role') === 'admin' ? {admin:{id:'synthetic-admin'}} : {response:Response.json({error:'Unauthorized'},{status:401})};`)
  .replace("import { logAdminActivity } from '@/lib/adminActivity';", 'const logAdminActivity = async () => {};')
  .replace("import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';", 'const ADMIN_PERMISSIONS={LAPTOPS_EDIT:"laptops:edit"};')
  .replace("'@/lib/laptopImageOwnership'", JSON.stringify(new URL('../src/lib/laptopImageOwnership.js', import.meta.url).href))
  .replace(/import \{\s*deleteUnreferencedLaptopBlobs,\s*getLaptopBlobAuthOptions,\s*\} from '@\/lib\/laptopImageStorage';/, 'const getLaptopBlobAuthOptions=()=>({token:"LOCAL-MOCK-ONLY"}); const deleteUnreferencedLaptopBlobs=async()=>({deleted:[],referenced:[],skipped:[]});')
  .replace("'@/lib/laptopImageValidation'", JSON.stringify(new URL('../src/lib/laptopImageValidation.js', import.meta.url).href))
  .replace("import { prisma } from '@/lib/prisma';", 'const prisma={};');
const route=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function request(bytes,type,role='admin') { const form=new FormData();form.set('file',new File([bytes],'fixture.png',{type}));return new Request('http://localhost/api/admin/laptops/upload',{method:'POST',headers:{'x-qa-role':role},body:form}); }
const png=Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
test('protected Laptop upload rejects unauthorized callers before storage',async()=>{const count=route.uploads.length;assert.equal((await route.POST(request(png,'image/png','none'))).status,401);assert.equal(route.uploads.length,count);});
test('Laptop upload validates bytes and preserves its response contract using isolated storage transport',async()=>{const response=await route.POST(request(png,'image/png'));assert.equal(response.status,201);const payload=await response.json();assert.equal(payload.filename,payload.blobPathname);assert.match(payload.blobPathname,/^laptops\/\d{4}\/.+\.png$/);assert.ok(payload.url.endsWith(payload.blobPathname));const last=route.uploads.at(-1);assert.deepEqual(last.bytes,png);assert.equal(last.options.allowOverwrite,false);assert.equal(last.options.contentType,'image/png');});
test('invalid image signature never reaches storage',async()=>{const count=route.uploads.length;assert.equal((await route.POST(request(png,'image/jpeg'))).status,400);assert.equal(route.uploads.length,count);});
