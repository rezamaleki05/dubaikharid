'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
    || (item.type === 'PRODUCT' && snapshot.priceAed !== null && current.priceAed !== snapshot.priceAed)
  ));
  return {
    ...snapshot,
    ...current,
    id: item.id,
    key: item.key,
    cartItemId: item.key,
    type: item.type,
    quantity: item.quantity,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
    productId: item.type === 'PRODUCT' ? item.id : undefined,
    laptopId: item.type === 'LAPTOP' ? item.id : undefined,
    product_type: item.type === 'LAPTOP' ? 'laptop_stock' : item.type === 'PRODUCT' ? 'iran_inventory' : 'external_product',
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
      setStoredItems(loadStorage());
      setHydrated(true);
    });
    const sync = event => {
      if (event.key === CART_STORAGE_KEY) setStoredItems(parseCartStorage(event.newValue || '[]'));
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
      const byKey = new Map((payload.data?.items || []).map(item => [item.key, item]));
      setResolvedItems(byKey);
      setResolveError('');
    }).catch(error => {
      if (error.name !== 'AbortError') setResolveError(error.message || 'به‌روزرسانی سبد خرید انجام نشد.');
    });
    return () => controller.abort();
  }, [hydrated, storedItems]);

  const cartItems = useMemo(
    () => storedItems.map(item => enrichCartItem(item, resolvedItems.get(item.key))),
    [resolvedItems, storedItems],
  );

  const addToCart = useCallback((product, size = null, color = null) => {
    const candidate = normalizeCartItem({ ...product, selectedSize: size ?? product?.selectedSize, selectedColor: color ?? product?.selectedColor, quantity: 1 });
    if (!candidate) return false;
    setStoredItems(previous => {
      const existing = previous.find(item => item.key === candidate.key);
      if (!existing) return [...previous, candidate];
      if (existing.type === 'LAPTOP') return previous;
      return previous.map(item => item.key === candidate.key
        ? { ...item, quantity: Math.min(MAX_PRODUCT_QUANTITY, item.quantity + 1) }
        : item);
    });
    return true;
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    setStoredItems(previous => previous.map(item => {
      if (item.key !== key) return item;
      if (item.type === 'LAPTOP') return { ...item, quantity: 1 };
      const next = Number(quantity);
      if (!Number.isSafeInteger(next) || next < 1) return item;
      return { ...item, quantity: Math.min(MAX_PRODUCT_QUANTITY, next) };
    }));
  }, []);

  const decrementQuantity = useCallback(key => {
    setStoredItems(previous => previous.map(item => item.key === key
      ? { ...item, quantity: item.type === 'LAPTOP' ? 1 : Math.max(1, item.quantity - 1) }
      : item));
  }, []);
  const removeFromCart = useCallback(key => setStoredItems(previous => previous.filter(item => item.key !== key)), []);
  const removePurchasedItems = useCallback(keys => {
    const selected = new Set(keys);
    setStoredItems(previous => previous.filter(item => !selected.has(item.key)));
  }, []);
  const clearCart = useCallback(() => setStoredItems([]), []);
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
