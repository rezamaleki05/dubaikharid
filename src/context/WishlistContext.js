'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  LEGACY_WISHLIST_STORAGE_KEY,
  WISHLIST_STORAGE_KEY,
  normalizeWishlistItem,
  parseWishlistStorage,
  resolverPayload,
} from '@/lib/clientCollectionState';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [storedItems, setStoredItems] = useState([]);
  const [resolvedItems, setResolvedItems] = useState(new Map());
  const [hydrated, setHydrated] = useState(false);

  const loadStorage = useCallback(() => {
    const current = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const legacy = current === null ? localStorage.getItem(LEGACY_WISHLIST_STORAGE_KEY) : null;
    const next = parseWishlistStorage(current ?? legacy ?? '[]');
    if (legacy !== null) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
    }
    return next;
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      setStoredItems(loadStorage());
      setHydrated(true);
    });
    const sync = event => {
      if (event.key === WISHLIST_STORAGE_KEY) setStoredItems(parseWishlistStorage(event.newValue || '[]'));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [loadStorage]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(storedItems));
  }, [hydrated, storedItems]);

  useEffect(() => {
    if (!hydrated || storedItems.length === 0) {
      Promise.resolve().then(() => setResolvedItems(new Map()));
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
      if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی علاقه‌مندی‌ها انجام نشد.');
      setResolvedItems(new Map((payload.data?.items || []).map(item => [`${item.type}:${encodeURIComponent(item.id)}`, item])));
    }).catch(() => {});
    return () => controller.abort();
  }, [hydrated, storedItems]);

  const wishlistItems = useMemo(() => storedItems.map(item => {
    const current = resolvedItems.get(item.key) || {};
    return {
      ...item.snapshot,
      ...current,
      id: item.id,
      key: item.key,
      type: item.type,
      productId: item.type === 'PRODUCT' ? item.id : undefined,
      laptopId: item.type === 'LAPTOP' ? item.id : undefined,
      warehouseItemId: item.type === 'WAREHOUSE' ? item.id : undefined,
      product_type: item.type === 'LAPTOP' ? 'laptop_stock' : item.type === 'WAREHOUSE' ? 'warehouse_stock' : item.type === 'PRODUCT' ? 'iran_inventory' : 'external_product',
      unavailable: current.available === false,
    };
  }), [resolvedItems, storedItems]);

  const toggleWishlist = useCallback(product => {
    const candidate = normalizeWishlistItem(product);
    if (!candidate) return false;
    setStoredItems(previous => previous.some(item => item.key === candidate.key)
      ? previous.filter(item => item.key !== candidate.key)
      : [...previous, candidate]);
    return true;
  }, []);
  const remove = useCallback(key => setStoredItems(previous => previous.filter(item => item.key !== key)), []);
  const clear = useCallback(() => setStoredItems([]), []);
  const isInWishlist = useCallback((id, type = null) => storedItems.some(item => item.id === id && (!type || item.type === type)), [storedItems]);

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, remove, clear, isInWishlist, wishlistCount: storedItems.length, hydrated }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
