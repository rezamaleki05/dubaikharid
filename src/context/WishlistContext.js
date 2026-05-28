'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('dubiShopWishlist');
      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  }, []);

  // Save to localStorage when wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem('dubiShopWishlist', JSON.stringify(wishlistItems));
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  }, [wishlistItems]);

  const toggleWishlist = (product) => {
    setWishlistItems((prevItems) => {
      const exists = prevItems.some((item) => item.id === product.id);
      if (exists) {
        // Remove it
        return prevItems.filter((item) => item.id !== product.id);
      } else {
        // Add it
        return [...prevItems, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
