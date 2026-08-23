import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { getSettings, updateSettings, validateSettingsInput } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_VIEW);
  if (response) return response;
  try {
    const { values, missingFinancial } = await getSettings();
    return NextResponse.json({ data: values, missingFinancial });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'دریافت تنظیمات با خطا مواجه شد.' }, { status: 500 });
  }
}

function auditActionsFor(changes) {
  const actions = new Set(['SETTINGS_UPDATED']);
  if (Object.hasOwn(changes, 'aedRate')) actions.add('EXCHANGE_RATE_UPDATED');
  if (Object.hasOwn(changes, 'commissionPercent')) actions.add('COMMISSION_UPDATED');
  if (['shippingPerKgAed', 'minWeightClass', 'roundingMethod'].some(key => Object.hasOwn(changes, key))) actions.add('SHIPPING_RATE_UPDATED');
  if (Object.hasOwn(changes, 'maintenanceMode')) actions.add('MAINTENANCE_MODE_CHANGED');
  if (Object.hasOwn(changes, 'allowRegistration')) actions.add('REGISTRATION_SETTING_CHANGED');
  return [...actions];
}

function safeAuditValue(value) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('data:image/')) return '[image data omitted]';
  return value.length > 500 ? `${value.slice(0, 500)}…` : value;
}

export async function PATCH(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const parsed = validateSettingsInput(body);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error, field: parsed.field || null }, { status: 400 });
  }

  try {
    const result = await updateSettings(parsed.values);
    const changes = Object.keys(result.current).map(key => ({
      key,
      previousValue: safeAuditValue(result.previous[key]),
      newValue: safeAuditValue(result.current[key]),
    }));
    await Promise.all(auditActionsFor(parsed.values).map(action => logAdminActivity({
      adminId: admin.id,
      action,
      entityType: 'Setting',
      entityId: action === 'SETTINGS_UPDATED' ? 'batch' : changes.find(change => (
        (action === 'EXCHANGE_RATE_UPDATED' && change.key === 'aedRate') ||
        (action === 'COMMISSION_UPDATED' && change.key === 'commissionPercent') ||
        (action === 'MAINTENANCE_MODE_CHANGED' && change.key === 'maintenanceMode') ||
        (action === 'REGISTRATION_SETTING_CHANGED' && change.key === 'allowRegistration') ||
        (action === 'SHIPPING_RATE_UPDATED' && ['shippingPerKgAed', 'minWeightClass', 'roundingMethod'].includes(change.key))
      ))?.key || 'batch',
      metadata: { changes },
      request,
    })));
    return NextResponse.json({ data: result.current });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'ذخیره تنظیمات با خطا مواجه شد.' }, { status: 500 });
  }
}
