'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('dubiShopCart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }, []);

  // Save to localStorage when cart changes
  useEffect(() => {
    try {
      localStorage.setItem('dubiShopCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      // Check if product already exists
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        // Increase quantity
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Add new item
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const decrementQuantity = (productId) => {
    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === productId) {
          return { ...item, quantity: Math.max(1, item.quantity - 1) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, decrementQuantity, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
