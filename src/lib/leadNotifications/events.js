export function persistedLeadEvent(type, row, origin) {
  if (type === 'purchase_request') return {
    type, customerName: row.customer?.name, phone: row.customer?.phone, email: row.customer?.email,
    product: `${row.productName || 'محصول'} × ${row.quantity}`, productUrl: row.productUrl,
    message: row.note, estimatedAmount: row.finalToman, amountAed: row.priceAed, source: 'درخواست خرید سایت',
    createdAt: row.createdAt.toISOString(), adminUrl: `${origin}/admin/leads`,
  };
  return {
    type, customerName: row.customerNameSnapshot, phone: row.customerPhoneSnapshot,
    email: row.customerEmailSnapshot, orderId: row.orderCode, estimatedAmount: row.totalToman,
    product: row.items.map(item => `${item.name} × ${item.quantity}`).join('، '),
    message: row.notes, source: 'تسویه حساب سایت', createdAt: row.createdAt.toISOString(), adminUrl: `${origin}/admin/orders`,
  };
}
