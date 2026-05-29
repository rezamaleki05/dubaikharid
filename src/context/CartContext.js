'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('dubaiKharidCart');
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
      localStorage.setItem('dubaiKharidCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, [cartItems]);

  const addToCart = (product, size = null, color = null) => {
    const sizeVal = size || 'none';
    const colorVal = color || 'none';
    const cartItemId = `${product.id}-${sizeVal}-${colorVal}`;

    setCartItems((prevItems) => {
      // Find item with same unique composite cartItemId
      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);
      if (existingItem) {
        // Increase quantity of this specific variant
        return prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Add new variant item to cart
      return [
        ...prevItems,
        {
          ...product,
          cartItemId,
          selectedSize: size,
          selectedColor: color,
          quantity: 1
        }
      ];
    });
  };

  const decrementQuantity = (cartItemId) => {
    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.cartItemId === cartItemId) {
          return { ...item, quantity: Math.max(1, item.quantity - 1) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
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
