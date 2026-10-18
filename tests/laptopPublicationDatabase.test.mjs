import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
const url=process.env.LAPTOP_TEST_DATABASE_URL;
test('isolated Laptop publication transaction, historical safety and nullable display/gallery persistence',{skip:!url},async()=>{
 const parsed=new URL(url);assert.equal(parsed.hostname,'127.0.0.1');assert.equal(parsed.port,'55454');assert.match(parsed.pathname,/^\/phase2z_/);
 const c=new pg.Client({connectionString:url});await c.connect();
 try {await c.query('BEGIN');
 for(const [key,value]of [['telegramEnabled','true'],['telegramAutoPublishLaptops','true'],['telegramChannel','@isolatedtest']])await c.query('INSERT INTO "Setting" (id,key,value,"updatedAt") VALUES ($1,$2,$3,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',['qa-'+key,key,value]);
 const before=(await c.query('SELECT count(*)::int n FROM "LaptopTelegramPublication"')).rows[0].n;
 await c.query('UPDATE "Laptop" SET description=description WHERE "createdAt"<(SELECT finished_at FROM "_prisma_migrations" WHERE migration_name=\'20261018000100_laptop_stock_complete\')');
 assert.equal((await c.query('SELECT count(*)::int n FROM "LaptopTelegramPublication"')).rows[0].n,before,'historical edit cannot bulk enqueue');
 const id='qa-laptop-trigger';const images=['one','two','three','four'];
 await c.query('INSERT INTO "Laptop" (id,name,brand,series,model,status,"priceToman","isTouchscreen","displayResolution",images,image,"updatedAt") VALUES ($1,\'QA\',\'Dell\',\'Precision\',\'5530\',\'INACTIVE\',110000000,false,\'2560×1600\',$2,\'one\',NOW())',[id,JSON.stringify(images)]);
 assert.equal((await c.query('SELECT count(*)::int n FROM "LaptopTelegramPublication" WHERE "laptopId"=$1',[id])).rows[0].n,0);
 await c.query('UPDATE "Laptop" SET status=\'AVAILABLE\' WHERE id=$1',[id]);
 let row=(await c.query('SELECT * FROM "LaptopTelegramPublication" WHERE "laptopId"=$1',[id])).rows[0];assert.equal(row.status,'PENDING');assert.equal(row.destination,'@isolatedtest');assert.equal(row.attemptCount,0);
 for(const column of ['description','priceToman','cpu','ram','gpu','images','image','isTouchscreen','displayResolution','reservedOrderId'])await c.query('UPDATE "Laptop" SET "'+column+'"="'+column+'" WHERE id=$1',[id]);
 await c.query('UPDATE "Laptop" SET status=\'INACTIVE\' WHERE id=$1',[id]);await c.query('UPDATE "Laptop" SET status=\'AVAILABLE\' WHERE id=$1',[id]);
 assert.equal((await c.query('SELECT count(*)::int n FROM "LaptopTelegramPublication" WHERE "laptopId"=$1',[id])).rows[0].n,1);
 const saved=(await c.query('SELECT * FROM "Laptop" WHERE id=$1',[id])).rows[0];assert.equal(saved.isTouchscreen,false);assert.equal(saved.displayResolution,'2560×1600');assert.deepEqual(saved.images,images);
 await c.query('ALTER TABLE "LaptopTelegramPublication" ADD CONSTRAINT qa_isolation CHECK ("laptopId"<>\'qa-laptop-failure\')');
 await c.query('INSERT INTO "Laptop" (id,name,brand,model,status,"priceToman","updatedAt") VALUES (\'qa-laptop-failure\',\'QA\',\'Dell\',\'7510\',\'AVAILABLE\',100,NOW())');
 assert.equal((await c.query('SELECT status FROM "Laptop" WHERE id=\'qa-laptop-failure\'')).rows[0].status,'AVAILABLE','outbox failure must not roll back Laptop save');
 }finally{await c.query('ROLLBACK');await c.end();}
});
