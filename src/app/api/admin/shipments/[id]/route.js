import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { fulfillOrderInventoryReservations } from '@/lib/adminOrders';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import {
  adminShipmentInclude,
  canTransitionShipment,
  isShipmentId,
  orderStatusForShipment,
  parseShipmentUpdateInput,
  serializeAdminShipment,
  shipmentTimestampData,
} from '@/lib/adminShipments';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SHIPMENTS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!isShipmentId(id)) return NextResponse.json({ error: 'شناسه مرسوله معتبر نیست.' }, { status: 400 });
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id }, include: adminShipmentInclude });
    if (!shipment) return NextResponse.json({ error: 'مرسوله پیدا نشد.' }, { status: 404 });
    return NextResponse.json(serializeAdminShipment(shipment));
  } catch (error) {
    console.error('Error fetching admin shipment:', error);
    return NextResponse.json({ error: 'دریافت مرسوله با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SHIPMENTS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!isShipmentId(id)) return NextResponse.json({ error: 'شناسه مرسوله معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const parsed = parseShipmentUpdateInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.shipment.findUnique({
        where: { id },
        include: { order: { select: { id: true, status: true } } },
      });
      if (!current) throw new Error('NOT_FOUND');
      const nextStatus = parsed.data.status || current.status;
      const statusChanged = nextStatus !== current.status;
      if (statusChanged && !canTransitionShipment(current.status, nextStatus)) {
        throw new Error('INVALID_TRANSITION');
      }
      if (current.order?.status === 'cancelled' && !['CANCELLED', 'FAILED'].includes(nextStatus)) {
        throw new Error('ORDER_CANCELLED');
      }

      const comparableFields = ['carrier', 'trackingCode', 'trackingUrl', 'method', 'notes'];
      const fieldsChanged = comparableFields.some(field =>
        Object.hasOwn(parsed.data, field) && parsed.data[field] !== current[field]
      );
      if (!statusChanged && !fieldsChanged) {
        const unchanged = await tx.shipment.findUnique({ where: { id }, include: adminShipmentInclude });
        return { shipment: unchanged, changed: false, statusChanged: false, previousStatus: current.status };
      }

      const timestampData = statusChanged ? shipmentTimestampData(current, nextStatus) : {};
      await tx.shipment.update({ where: { id }, data: { ...parsed.data, ...timestampData } });

      const targetOrderStatus = statusChanged ? orderStatusForShipment(nextStatus) : null;
      if (targetOrderStatus === 'delivered' && current.order?.status !== 'delivered') {
        await tx.order.update({ where: { id: current.order.id }, data: { status: 'delivered' } });
      } else if (
        targetOrderStatus === 'shipped' &&
        current.order &&
        !['shipped', 'delivered'].includes(current.order.status)
      ) {
        await fulfillOrderInventoryReservations(tx, current.order.id);
        await tx.order.update({ where: { id: current.order.id }, data: { status: 'shipped' } });
      }

      const updated = await tx.shipment.findUnique({ where: { id }, include: adminShipmentInclude });
      return { shipment: updated, changed: true, statusChanged, previousStatus: current.status };
    }, { isolationLevel: 'Serializable', timeout: 20_000 });

    if (result.changed) {
      const action = result.statusChanged
        ? (result.shipment.status === 'CANCELLED' ? 'SHIPMENT_CANCELLED' : 'SHIPMENT_STATUS_CHANGED')
        : 'SHIPMENT_UPDATED';
      await logAdminActivity({
        adminId: admin.id,
        action,
        entityType: 'Shipment',
        entityId: id,
        metadata: {
          shipmentId: id,
          orderId: result.shipment.orderId,
          ...(result.statusChanged ? {
            previousStatus: result.previousStatus,
            newStatus: result.shipment.status,
          } : {}),
          carrier: result.shipment.carrier,
          trackingNumber: result.shipment.trackingCode,
        },
        request,
      });
    }
    return NextResponse.json(serializeAdminShipment(result.shipment));
  } catch (error) {
    const known = {
      NOT_FOUND: ['مرسوله پیدا نشد.', 404],
      INVALID_TRANSITION: ['تغییر وضعیت مرسوله مجاز نیست.', 409],
      ORDER_CANCELLED: ['سفارش مرتبط لغو شده و این تغییر وضعیت مجاز نیست.', 409],
    }[error.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error('Error updating admin shipment:', error);
    return NextResponse.json({ error: 'به‌روزرسانی مرسوله با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SHIPMENTS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!isShipmentId(id)) return NextResponse.json({ error: 'شناسه مرسوله معتبر نیست.' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.shipment.findUnique({ where: { id }, include: { order: { select: { id: true } } } });
      if (!current) throw new Error('NOT_FOUND');
      if (current.status === 'CANCELLED') return { shipment: await tx.shipment.findUnique({ where: { id }, include: adminShipmentInclude }), changed: false, previousStatus: current.status };
      if (!canTransitionShipment(current.status, 'CANCELLED')) throw new Error('INVALID_TRANSITION');
      const shipment = await tx.shipment.update({ where: { id }, data: { status: 'CANCELLED' }, include: adminShipmentInclude });
      return { shipment, changed: true, previousStatus: current.status };
    }, { isolationLevel: 'Serializable' });

    if (result.changed) {
      await logAdminActivity({
        adminId: admin.id,
        action: 'SHIPMENT_CANCELLED',
        entityType: 'Shipment',
        entityId: id,
        metadata: {
          shipmentId: id,
          orderId: result.shipment.orderId,
          previousStatus: result.previousStatus,
          newStatus: 'CANCELLED',
        },
        request,
      });
    }
    return NextResponse.json(serializeAdminShipment(result.shipment));
  } catch (error) {
    const known = {
      NOT_FOUND: ['مرسوله پیدا نشد.', 404],
      INVALID_TRANSITION: ['لغو این مرسوله در وضعیت فعلی مجاز نیست.', 409],
    }[error.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error('Error cancelling admin shipment:', error);
    return NextResponse.json({ error: 'لغو مرسوله با خطا مواجه شد.' }, { status: 500 });
  }
}
