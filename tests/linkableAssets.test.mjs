import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProductPricing } from '../src/lib/pricing.js';

// Published examples depend on these edge cases, not a duplicated SEO formula.
test('methodology minimum, missing weight and nearest rounding agree with pricing service', () => {
 const settings={aedRate:100.5,commissionPercent:10,shippingPerKgAed:20,minWeightClass:2,roundingMethod:'round'};
 for(const weight of [undefined,0,0.2,1.2,2.4]) {
  const q=calculateProductPricing({priceAed:200,weight},settings);
  assert.equal(q.billableWeight,2);
  assert.equal(q.totalToman,26130);
 }
 assert.equal(calculateProductPricing({priceAed:200,weight:2.5},settings).billableWeight,3);
 assert.equal(calculateProductPricing({priceAed:200,weight:2.9},{...settings,roundingMethod:'floor'}).billableWeight,2);
 assert.equal(calculateProductPricing({priceAed:200,weight:2.1},{...settings,roundingMethod:'ceil'}).billableWeight,3);
});
