import { permanentRedirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { getWarehouseCutoverMappingFromData, warehouseCutoverMappingSelect } from '@/lib/warehouseProductCutover';

export const dynamic = 'force-dynamic';

export default async function WarehouseItemLayout({ children, params }) {
  const { slug } = await params;
  const source = await prisma.warehouseItem.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: warehouseCutoverMappingSelect,
  });
  const mapping = getWarehouseCutoverMappingFromData(source);
  if (mapping) permanentRedirect(`/product/${encodeURIComponent(mapping.productId)}`);
  return children;
}
