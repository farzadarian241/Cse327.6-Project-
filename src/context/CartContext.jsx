"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore cart from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("haatbodol_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (err) {
      console.warn("Failed to read cart from localStorage:", err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("haatbodol_cart", JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to save cart to localStorage:", err);
    }
  }, [items, isInitialized]);

  const addToCart = (product) => {
    if (!product || !product.listing_id) return false;
    let added = false;
    setItems((prev) => {
      const exists = prev.some((i) => i.listing_id === product.listing_id);
      if (exists) return prev;
      added = true;
      return [...prev, product];
    });
    return added;
  };

  const removeFromCart = (listingId) => {
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (listingId) => {
    return items.some((i) => i.listing_id === listingId);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.current_asking_price || item.price || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.length,
        subtotal,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
