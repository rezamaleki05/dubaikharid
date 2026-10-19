import { INDEXNOW_ORIGIN } from './indexnowDomain.js';

// Inject the existing public projections, not raw private records or every DB write.
export function createIndexNowStateReader({ readProduct, readLaptopGroups, readEntity, brandGuides, storeAnswers }) {
  return async function read(kind, id) {
    let pages = {};
    if (kind === 'product') {
      const product = await readProduct(id);
      if (product) pages[`${INDEXNOW_ORIGIN}/product/${product.id}`] = product;
    } else if (kind === 'laptop') {
      pages = Object.fromEntries((await readLaptopGroups()).map(group => [`${INDEXNOW_ORIGIN}/laptops/${group.slug}`, {
        ...group, units: [...group.units].sort((a, b) => a.id.localeCompare(b.id)),
      }]));
    } else if (kind === 'store' || kind === 'brand') {
      const row = await readEntity(kind, id);
      const indexable = row && (kind === 'store' || (row.showInBrandDirectory && (brandGuides[id] || row._count.products > 0)));
      if (indexable) pages[`${INDEXNOW_ORIGIN}/${kind}s/${id}`] = kind === 'store'
        ? { name: row.name, desc: row.desc, img: row.img, count: row._count.products, answers: storeAnswers[id] }
        : { name: row.name, faName: row.faName, cat: row.cat, img: row.img, count: row._count.products, guide: brandGuides[id] };
    }
    return { kind, id, pages };
  };
}
