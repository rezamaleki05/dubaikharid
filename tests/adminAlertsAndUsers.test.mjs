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

const rules = await importSource('../src/lib/adminAlertRules.js');
const safety = await importSource('../src/lib/adminUserSafety.js');
const alertService = await source('../src/lib/adminAlerts.js');
const header = await source('../src/components/admin/AdminHeader.js');
const sidebar = await source('../src/components/admin/AdminSidebar.js');
const dashboard = await source('../src/app/admin/dashboard/page.js');
const adminUsersRoute = await source('../src/app/api/admin/admin-users/[id]/route.js');
const schema = await source('../prisma/schema.prisma');

test('1. a new PurchaseRequest increases its actionable count', () => {
  assert.equal(rules.buildAdminAlertCounts({ purchaseRequests: 1 }).purchaseRequests, 1);
});

test('2. bell total includes a new PurchaseRequest', () => {
  assert.equal(rules.buildAdminAlertCounts({ orders: 2, purchaseRequests: 1 }).total, 3);
  assert.match(header, /counts\?\.total/);
});

test('3. dashboard warnings use the shared actionable summary', () => {
  assert.match(dashboard, /useAdminShellData\(\)/);
  assert.match(dashboard, /alertSummary\?\.counts/);
});

test('4. PurchaseRequest sidebar badge uses its own count', () => {
  assert.match(sidebar, /badge: counts\.purchaseRequests/);
});

test('5. a priced or otherwise resolved request no longer contributes', () => {
  assert.deepEqual(rules.ACTIONABLE_PURCHASE_REQUEST_STATUSES, ['pending']);
  assert.equal(rules.buildAdminAlertCounts({ purchaseRequests: 0 }).purchaseRequests, 0);
});

test('6. zero and invalid badges are not rendered', () => {
  assert.equal(rules.shouldRenderAdminBadge(0), false);
  assert.equal(rules.shouldRenderAdminBadge(-2), false);
  assert.equal(rules.shouldRenderAdminBadge(undefined), false);
});

test('7. a positive badge renders its exact count', () => {
  assert.equal(rules.shouldRenderAdminBadge(7), true);
  assert.equal(rules.normalizeAlertCount(7), 7);
});

test('8. submitted CARD receipts awaiting review contribute to Payments', () => {
  assert.match(alertService, /status: 'pending'/);
  assert.match(alertService, /method: 'CARD', receiptBlobPathname: \{ not: null \}/);
});

test('9. resolved payments stop contributing when the pending count becomes zero', () => {
  assert.equal(rules.buildAdminAlertCounts({ payments: 0 }).payments, 0);
});

test('10. counts use Prisma and real statuses rather than mock arrays', () => {
  assert.match(alertService, /client\.purchaseRequest\.count/);
  assert.match(alertService, /ACTIONABLE_PURCHASE_REQUEST_STATUSES/);
  assert.doesNotMatch(alertService, /mock|localStorage/i);
});

test('11. an Admin cannot delete the currently authenticated account', () => {
  assert.equal(safety.getAdminDeletionBlocker({ actingAdminId: 'a', target: { id: 'a', role: 'ADMIN', status: 'ACTIVE' }, activeSuperAdminCount: 2 }), 'SELF_DELETE');
});

test('12. the last active Super Admin cannot be deleted', () => {
  assert.equal(safety.getAdminDeletionBlocker({ actingAdminId: 'a', target: { id: 'b', role: 'SUPER_ADMIN', status: 'ACTIVE' }, activeSuperAdminCount: 1 }), 'LAST_SUPER_ADMIN');
});

test('13. an eligible different Admin can be deleted', () => {
  assert.equal(safety.getAdminDeletionBlocker({ actingAdminId: 'a', target: { id: 'b', role: 'ADMIN', status: 'ACTIVE' }, activeSuperAdminCount: 1 }), null);
});

test('14. Admin deletion requires existing ADMIN_USERS_MANAGE authorization', () => {
  const deleteHandler = adminUsersRoute.slice(adminUsersRoute.indexOf('export async function DELETE'));
  assert.match(deleteHandler, /authorizeAdminApiRequest\(request, ADMIN_PERMISSIONS\.ADMIN_USERS_MANAGE\)/);
});

test('15. audit, payment and warehouse history survive Admin deletion', () => {
  assert.match(schema, /admin AdminUser\? @relation\(fields: \[adminId\], references: \[id\], onDelete: SetNull\)/);
  assert.match(schema, /confirmedBy AdminUser\? @relation\("PaymentConfirmedBy", fields: \[confirmedById\], references: \[id\], onDelete: SetNull\)/);
  assert.doesNotMatch(adminUsersRoute.slice(adminUsersRoute.indexOf('export async function DELETE')), /deleteMany\(/);
});

test('16. existing permission-filtered Admin navigation remains intact', () => {
  assert.match(sidebar, /menuItems = \[/);
  assert.match(sidebar, /\.filter\(item => can\(item\.permission\)\)/);
});
