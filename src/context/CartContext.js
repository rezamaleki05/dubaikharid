'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics';
import {
  CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY,
  MAX_PRODUCT_QUANTITY,
  normalizeCartItem,
  parseCartStorage,
  resolverPayload,
} from '@/lib/clientCollectionState';

const CartContext = createContext(null);

function enrichCartItem(item, resolved) {
  const current = resolved || {};
  const snapshot = item.snapshot || {};
  const priceChanged = Boolean(current.authoritative && (
    (item.type === 'LAPTOP' && snapshot.priceToman !== null && current.priceToman !== snapshot.priceToman)
    || (item.type === 'WAREHOUSE' && snapshot.priceToman !== null && current.priceToman !== snapshot.priceToman)
    || (item.type === 'PRODUCT' && current.supplyMode === 'IRAN_STOCK' && snapshot.priceToman !== null && Number(current.priceToman) !== Number(snapshot.priceToman))
    || (item.type === 'PRODUCT' && current.supplyMode !== 'IRAN_STOCK' && snapshot.priceAed !== null && Number(current.priceAed) !== Number(snapshot.priceAed))
  ));
  return {
    ...snapshot,
    ...current,
    id: item.id,
    key: item.key,
    cartItemId: item.key,
    type: item.type,
    quantity: item.quantity,
    productVariantId: current.productVariantId || item.productVariantId || null,
    selectedSize: current.selectedSize ?? item.selectedSize,
    selectedColor: current.selectedColor ?? item.selectedColor,
    productId: item.type === 'PRODUCT' ? item.id : undefined,
    laptopId: item.type === 'LAPTOP' ? item.id : undefined,
    warehouseItemId: item.type === 'WAREHOUSE' ? item.id : undefined,
    product_type: item.type === 'LAPTOP' ? 'laptop_stock' : item.type === 'WAREHOUSE' ? 'warehouse_stock' : item.type === 'PRODUCT' ? 'iran_inventory' : 'external_product',
    unavailable: current.available === false,
    resolving: !resolved && item.type !== 'EXTERNAL_PRODUCT',
    authoritative: Boolean(current.authoritative),
    priceChanged,
  };
}

export function CartProvider({ children }) {
  const [storedItems, setStoredItems] = useState([]);
  const [resolvedItems, setResolvedItems] = useState(new Map());
  const [hydrated, setHydrated] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const storedItemsRef = useRef([]);

  const replaceStoredItems = useCallback(updater => {
    const previous = storedItemsRef.current;
    const next = updater(previous);
    storedItemsRef.current = next;
    setStoredItems(next);
  }, []);

  const loadStorage = useCallback(() => {
    const current = localStorage.getItem(CART_STORAGE_KEY);
    const legacy = current === null ? localStorage.getItem(LEGACY_CART_STORAGE_KEY) : null;
    const next = parseCartStorage(current ?? legacy ?? '[]');
    if (legacy !== null) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    }
    return next;
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      const next = loadStorage();
      storedItemsRef.current = next;
      setStoredItems(next);
      setHydrated(true);
    });
    const sync = event => {
      if (event.key === CART_STORAGE_KEY) {
        const next = parseCartStorage(event.newValue || '[]');
        storedItemsRef.current = next;
        setStoredItems(next);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [loadStorage]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedItems));
  }, [hydrated, storedItems]);

  useEffect(() => {
    if (!hydrated || storedItems.length === 0) {
      Promise.resolve().then(() => {
        setResolvedItems(new Map());
        setResolveError('');
      });
      return undefined;
    }
    const controller = new AbortController();
    fetch('/api/cart/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: resolverPayload(storedItems) }),
      signal: controller.signal,
    }).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی سبد خرید انجام نشد.');
      const resolved = payload.data?.items || [];
      const byKey = new Map(resolved.map(item => [item.requestKey || item.key, item]));
      setResolvedItems(byKey);
      setResolveError('');
      const migrations = new Map(resolved
        .filter(item => item.type === 'PRODUCT' && item.productVariantId && item.key)
        .map(item => [item.requestKey || item.key, item]));
      if (migrations.size) {
        replaceStoredItems(previous => {
          let changed = false;
          const merged = new Map();
          for (const item of previous) {
            const authoritative = migrations.get(item.key);
            const migrated = authoritative && (
              item.productVariantId !== authoritative.productVariantId || item.key !== authoritative.key
            )
              ? normalizeCartItem({
                  ...item,
                  productVariantId: authoritative.productVariantId,
                  selectedColor: authoritative.selectedColor,
                  selectedSize: authoritative.selectedSize,
                  snapshot: { ...item.snapshot, ...authoritative },
                })
              : item;
            if (migrated !== item) changed = true;
            const existing = merged.get(migrated.key);
            if (existing && migrated.type !== 'LAPTOP') {
              changed = true;
              merged.set(migrated.key, {
                ...existing,
                quantity: Math.min(MAX_PRODUCT_QUANTITY, existing.quantity + migrated.quantity),
              });
            } else {
              merged.set(migrated.key, migrated);
            }
          }
          return changed ? [...merged.values()] : previous;
        });
      }
    }).catch(error => {
      if (error.name !== 'AbortError') setResolveError(error.message || 'به‌روزرسانی سبد خرید انجام نشد.');
    });
    return () => controller.abort();
  }, [hydrated, replaceStoredItems, storedItems]);

  const cartItems = useMemo(
    () => storedItems.map(item => enrichCartItem(item, resolvedItems.get(item.key))),
    [resolvedItems, storedItems],
  );

  const addToCart = useCallback((product, size = null, color = null) => {
    const candidate = normalizeCartItem({ ...product, selectedSize: size ?? product?.selectedSize, selectedColor: color ?? product?.selectedColor, quantity: 1 });
    if (!candidate) return false;
    let addedQuantity = 0;
    replaceStoredItems(previous => {
      const existing = previous.find(item => item.key === candidate.key);
      if (!existing) {
        addedQuantity = candidate.quantity;
        return [...previous, candidate];
      }
      if (existing.type === 'LAPTOP') return previous;
      const nextQuantity = Math.min(MAX_PRODUCT_QUANTITY, existing.quantity + 1);
      if (nextQuantity === existing.quantity) return previous;
      addedQuantity = nextQuantity - existing.quantity;
      return previous.map(item => item.key === candidate.key
        ? { ...item, quantity: nextQuantity }
        : item);
    });
    if (addedQuantity > 0) trackAddToCart({ ...candidate.snapshot, ...candidate }, addedQuantity);
    return true;
  }, [replaceStoredItems]);

  const updateQuantity = useCallback((key, quantity) => {
    let changedItem = null;
    let quantityDelta = 0;
    replaceStoredItems(previous => previous.map(item => {
      if (item.key !== key) return item;
      if (item.type === 'LAPTOP') return { ...item, quantity: 1 };
      const next = Number(quantity);
      if (!Number.isSafeInteger(next) || next < 1) return item;
      const nextQuantity = Math.min(MAX_PRODUCT_QUANTITY, next);
      quantityDelta = nextQuantity - item.quantity;
      changedItem = item;
      return quantityDelta === 0 ? item : { ...item, quantity: nextQuantity };
    }));
    if (changedItem && quantityDelta > 0) trackAddToCart({ ...changedItem.snapshot, ...changedItem }, quantityDelta);
    if (changedItem && quantityDelta < 0) trackRemoveFromCart({ ...changedItem.snapshot, ...changedItem }, Math.abs(quantityDelta));
  }, [replaceStoredItems]);

  const decrementQuantity = useCallback(key => {
    let decrementedItem = null;
    replaceStoredItems(previous => previous.map(item => {
      if (item.key !== key || item.type === 'LAPTOP' || item.quantity <= 1) return item;
      decrementedItem = item;
      return { ...item, quantity: item.quantity - 1 };
    }));
    if (decrementedItem) trackRemoveFromCart({ ...decrementedItem.snapshot, ...decrementedItem }, 1);
  }, [replaceStoredItems]);
  const removeFromCart = useCallback(key => {
    let removedItem = null;
    replaceStoredItems(previous => {
      removedItem = previous.find(item => item.key === key) || null;
      return removedItem ? previous.filter(item => item.key !== key) : previous;
    });
    if (removedItem) trackRemoveFromCart({ ...removedItem.snapshot, ...removedItem }, removedItem.quantity);
  }, [replaceStoredItems]);
  const removePurchasedItems = useCallback(keys => {
    const selected = new Set(keys);
    replaceStoredItems(previous => previous.filter(item => !selected.has(item.key)));
  }, [replaceStoredItems]);
  const clearCart = useCallback(() => replaceStoredItems(() => []), [replaceStoredItems]);
  const hasItem = useCallback((id, type = null) => storedItems.some(item => item.id === id && (!type || item.type === type)), [storedItems]);
  const cartCount = storedItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, decrementQuantity, removeFromCart, removePurchasedItems, clearCart, hasItem, cartCount, hydrated, resolveError }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
