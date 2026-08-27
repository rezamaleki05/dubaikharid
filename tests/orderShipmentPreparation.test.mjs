import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

async function importSource(path) {
  const contents = await source(path);
  return import(`data:text/javascript;base64,${Buffer.from(contents).toString('base64')}`);
}

const preparation = await importSource('../src/lib/adminShipmentPreparation.js');
const ordersPage = await source('../src/app/admin/orders/page.js');
const shipmentsPage = await source('../src/app/admin/shipments/page.js');
const shipmentRoute = await source('../src/app/api/admin/shipments/route.js');
const shipmentService = await source('../src/lib/adminShipments.js');

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => payload };
}

test('existing Order shipment is reused without any API call', async () => {
  const calls = [];
  const result = await preparation.ensureOrderShipment({
    order: { id: 'order-1', orderCode: 'ORD-1', shipment: { id: 'shipment-1' } },
    canCreate: false,
    fetcher: async (...args) => { calls.push(args); return jsonResponse({}); },
  });
  assert.equal(result.shipment.id, 'shipment-1');
  assert.equal(result.created, false);
  assert.equal(calls.length, 0);
});

test('missing shipment is created through the existing API with the default initial status', async () => {
  const calls = [];
  const fetcher = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') return jsonResponse({ id: 'shipment-2', orderId: 'order-2', status: 'PENDING' }, { status: 201 });
    return jsonResponse({ data: [] });
  };
  const result = await preparation.ensureOrderShipment({ order: { id: 'order-2', orderCode: 'ORD-2' }, canCreate: true, fetcher });
  assert.equal(result.shipment.id, 'shipment-2');
  assert.equal(result.created, true);
  assert.deepEqual(JSON.parse(calls.find(call => call.options.method === 'POST').options.body), { orderId: 'order-2' });
  assert.match(shipmentService, /body\.status === undefined \? 'PENDING' : body\.status/);
  assert.doesNotMatch(calls.find(call => call.options.method === 'POST').options.body, /carrier|tracking|shippingMethod|SHIPPED/);
});

test('a concurrent duplicate response reuses the shipment instead of creating another', async () => {
  let lookupCount = 0;
  const fetcher = async (_url, options = {}) => {
    if (options.method === 'POST') return jsonResponse({ error: 'مرسوله موجود است.' }, { ok: false, status: 409 });
    lookupCount += 1;
    return jsonResponse({ data: lookupCount === 1 ? [] : [{ id: 'shipment-race', orderId: 'order-3' }] });
  };
  const result = await preparation.ensureOrderShipment({ order: { id: 'order-3', orderCode: 'ORD-3' }, canCreate: true, fetcher });
  assert.equal(result.shipment.id, 'shipment-race');
  assert.equal(result.created, false);
  assert.match(shipmentRoute, /if \(order\.shipment\) throw new Error\('DUPLICATE_SHIPMENT'\)/);
});

test('creation permission, loading feedback, navigation and automatic selection remain explicit', async () => {
  await assert.rejects(
    preparation.ensureOrderShipment({ order: { id: 'order-4', orderCode: 'ORD-4' }, canCreate: false, fetcher: async () => jsonResponse({ data: [] }) }),
    /دسترسی ثبت مرسوله/,
  );
  assert.equal(preparation.getShipmentAdminHref('ship/a'), '/admin/shipments?shipmentId=ship%2Fa');
  assert.match(ordersPage, /canCreate: can\(ADMIN_PERMISSIONS\.SHIPMENTS_EDIT\)/);
  assert.match(ordersPage, /در حال آماده‌سازی\.\.\./);
  assert.match(ordersPage, /router\.push\(getShipmentAdminHref/);
  assert.match(shipmentsPage, /new URLSearchParams\(window\.location\.search\)\.get\('shipmentId'\)/);
  assert.match(shipmentsPage, /void selectShipment\(requestedShipmentId\)/);
});

test('preparing a shipment never marks it shipped or bypasses the existing lifecycle', () => {
  assert.match(shipmentService, /PENDING: Object\.freeze\(\['READY', 'CANCELLED'\]\)/);
  assert.match(shipmentService, /READY: Object\.freeze\(\['SHIPPED', 'CANCELLED'\]\)/);
  assert.doesNotMatch(ordersPage.match(/const handlePrepareShipment[\s\S]*?\n  };/)?.[0] || '', /status:\s*'SHIPPED'|tracking|carrier|shippingMethod/);
});
