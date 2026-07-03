export const laptops = [];
export const trendingProducts = [];
export const menProducts = [];
export const womenProducts = [];
export const kidsProducts = [];
export const bagsAndAccessoriesProducts = [];

export const getAllProducts = () => {
  const base = [
    ...laptops,
    ...trendingProducts,
    ...menProducts,
    ...womenProducts,
    ...kidsProducts,
    ...bagsAndAccessoriesProducts
  ];
  return base;
};

export const getProductById = (id) => getAllProducts().find(p => p.id === id);

// Dynamic product_type assignment on load
try {
  laptops.forEach(p => { if (!p.product_type) p.product_type = 'stock_laptop'; });
  trendingProducts.forEach(p => { if (!p.product_type) p.product_type = 'external_product'; });
  menProducts.forEach(p => { if (!p.product_type) p.product_type = 'external_product'; });
  womenProducts.forEach(p => { if (!p.product_type) p.product_type = 'external_product'; });
  kidsProducts.forEach(p => { if (!p.product_type) p.product_type = 'external_product'; });
  bagsAndAccessoriesProducts.forEach(p => { if (!p.product_type) p.product_type = 'external_product'; });
} catch (e) {
  console.error('Error assigning product types dynamically:', e);
}

// Product Type helper
export function getProductType(product) {
  if (!product) return 'external_product';
  if (product.product_type) return product.product_type;
  
  // Fallbacks:
  if (product.id && (product.id.startsWith('lap') || product.id.startsWith('uploaded-') || product.category === 'electronics' || product.category === 'laptops')) {
    return 'stock_laptop';
  }
  
  if (product.store === 'انبار ایران' || (product.id && product.id.startsWith('DK-INV'))) {
    return 'iran_inventory';
  }
  
  return 'external_product';
}

// Self-executing localStorage dynamic product injector
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('dubaiKharidUploadedProducts');
    if (saved) {
      const uploaded = JSON.parse(saved);
      uploaded.forEach(prod => {
        if (prod && prod.id) {
          // Flatten standard lists to check duplicates
          const all = [
            ...laptops,
            ...trendingProducts,
            ...menProducts,
            ...womenProducts,
            ...kidsProducts,
            ...bagsAndAccessoriesProducts
          ];
          if (!all.some(p => p.id === prod.id)) {
            // Assign type based on category
            if (!prod.product_type) {
              prod.product_type = getProductType(prod);
            }
            // Route dynamically based on gender or category tags
            if (prod.gender === 'men') {
              menProducts.push(prod);
            } else if (prod.gender === 'women') {
              womenProducts.push(prod);
            } else if (prod.gender === 'kids') {
              kidsProducts.push(prod);
            } else if (prod.category === 'electronics') {
              laptops.push(prod);
            } else if (prod.category === 'bags' || prod.category === 'accessories' || prod.category === 'watches_glasses' || prod.category === 'wallets_belts') {
              bagsAndAccessoriesProducts.push(prod);
            } else {
              trendingProducts.push(prod);
            }
          }
        }
      });
    }
  } catch (e) {
    console.error('Error loading dynamic uploaded products:', e);
  }

  try {
    const savedWarehouse = localStorage.getItem('dubaiKharidWarehouseProducts');
    if (savedWarehouse) {
      const warehouse = JSON.parse(savedWarehouse);
      warehouse.forEach(prod => {
        if (prod && prod.id && !prod.isArchived) {
          // Flatten standard lists to check duplicates
          const all = [
            ...laptops,
            ...trendingProducts,
            ...menProducts,
            ...womenProducts,
            ...kidsProducts,
            ...bagsAndAccessoriesProducts
          ];
          if (!all.some(p => p.id === prod.id)) {
            // Assign type based on category
            if (!prod.product_type) {
              prod.product_type = 'iran_inventory';
            }
            if (!prod.store) {
              prod.store = 'انبار ایران';
            }
            // Route dynamically based on gender or category tags
            if (prod.gender === 'men') {
              menProducts.push(prod);
            } else if (prod.gender === 'women') {
              womenProducts.push(prod);
            } else if (prod.gender === 'kids') {
              kidsProducts.push(prod);
            } else if (prod.category === 'electronics' || prod.category === 'laptops') {
              laptops.push(prod);
            } else if (prod.category === 'bags' || prod.category === 'accessories' || prod.category === 'watches_glasses' || prod.category === 'wallets_belts') {
              bagsAndAccessoriesProducts.push(prod);
            } else {
              trendingProducts.push(prod);
            }
          }
        }
      });
    }
  } catch (e) {
    console.error('Error loading dynamic warehouse products in catalog:', e);
  }
}
