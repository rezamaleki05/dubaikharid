export const PAYMENT_CONFIRMATION_MODES = Object.freeze(['receipt', 'manual']);
export const PAYMENT_CONFIRMATION_MODE_SET = new Set(PAYMENT_CONFIRMATION_MODES);
export const MANUAL_CONFIRMATION_NOTE_MAX_LENGTH = 1000;

export function getPaymentConfirmationError({ method, hasReceipt, confirmationMode, notes }) {
  if (method === 'ONLINE') return 'UNTRUSTED_GATEWAY';
  if (method !== 'CARD') return confirmationMode ? 'INVALID_CONFIRMATION_MODE' : null;

  if (hasReceipt) {
    return confirmationMode === 'receipt' ? null : 'INVALID_CONFIRMATION_MODE';
  }

  if (confirmationMode !== 'manual') return 'RECEIPT_REQUIRED';
  const normalizedNotes = String(notes || '').trim();
  if (!normalizedNotes) return 'MANUAL_NOTE_REQUIRED';
  if (normalizedNotes.length > MANUAL_CONFIRMATION_NOTE_MAX_LENGTH) return 'MANUAL_NOTE_TOO_LONG';
  return null;
}
