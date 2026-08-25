export function roundBillableWeight(weight, minimumWeight, method = 'ceil') {
  const numericWeight = Number(weight);
  const numericMinimum = Number(minimumWeight);
  if (!Number.isFinite(numericWeight) || numericWeight < 0) throw new TypeError('Weight must be a non-negative finite number.');
  if (!Number.isFinite(numericMinimum) || numericMinimum <= 0) throw new TypeError('Minimum weight must be a positive finite number.');
  const rounder = method === 'floor' ? Math.floor : method === 'round' ? Math.round : Math.ceil;
  return Math.max(numericMinimum, rounder(numericWeight));
}

export function calculateProductPricing({ priceAed, weight }, settings) {
  const price = Number(priceAed);
  const rate = Number(settings?.aedRate);
  const commissionPercent = Number(settings?.commissionPercent);
  const shippingPerKgAed = Number(settings?.shippingPerKgAed);
  const minimumWeight = Number(settings?.minWeightClass);
  if (![price, rate, commissionPercent, shippingPerKgAed, minimumWeight].every(Number.isFinite)) {
    throw new TypeError('Pricing settings are not configured.');
  }
  if (price < 0 || rate <= 0 || commissionPercent < 0 || shippingPerKgAed < 0 || minimumWeight <= 0) {
    throw new RangeError('Pricing values are outside the allowed range.');
  }
  const billableWeight = roundBillableWeight(Number(weight) || minimumWeight, minimumWeight, settings.roundingMethod);
  const commissionAed = price * (commissionPercent / 100);
  const shippingAed = billableWeight * shippingPerKgAed;
  return {
    priceAed: price,
    billableWeight,
    commissionAed,
    shippingAed,
    totalAed: price + commissionAed + shippingAed,
    totalToman: Math.round((price + commissionAed + shippingAed) * rate),
    exchangeRate: rate,
    commissionPercent,
    shippingPerKgAed,
  };
}

export function resolvePurchaseRequestPricing({ priceAed, weight, finalToman }, settings) {
  const confirmedPriceAed = Number(priceAed);
  const confirmedWeight = Number(weight);
  if (!Number.isFinite(confirmedPriceAed) || confirmedPriceAed < 0) {
    throw new TypeError('Confirmed AED price must be a non-negative finite number.');
  }
  if (!Number.isFinite(confirmedWeight) || confirmedWeight < 0 || confirmedWeight > 10000) {
    throw new TypeError('Confirmed weight must be between 0 and 10000 kilograms.');
  }

  const quote = calculateProductPricing({ priceAed: confirmedPriceAed, weight: confirmedWeight }, settings);
  const hasFinalOverride = finalToman !== undefined && finalToman !== null && String(finalToman).trim() !== '';
  const manualFinalToman = hasFinalOverride ? Number(finalToman) : null;
  if (hasFinalOverride && (!Number.isFinite(manualFinalToman) || manualFinalToman <= 0)) {
    throw new TypeError('Manual final price must be a positive finite number.');
  }
  if (!hasFinalOverride && quote.totalToman <= 0) {
    throw new RangeError('Calculated final price must be positive.');
  }

  return {
    ...quote,
    priceAed: confirmedPriceAed,
    weight: confirmedWeight,
    calculatedFinalToman: quote.totalToman,
    finalToman: hasFinalOverride ? Math.round(manualFinalToman) : quote.totalToman,
    hasFinalOverride,
  };
}
