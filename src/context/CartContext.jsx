import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem("cartItems");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems((prev) => {
      const qty = Number(item.quantity || 1);
      const itemPrice = Number(item.price || 0);
      const customPrice = Number(item.customPrice || 0);
      const existing = prev.find((i) => i.id === item.id && (JSON.stringify(i.customData || {}) === JSON.stringify(item.customData || {})));
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + qty, price: itemPrice, customData: item.customData || i.customData, imageUrl: item.imageUrl || i.imageUrl, customPrice } : i
        );
      }
      return [...prev, { ...item, quantity: qty, price: itemPrice, customPrice }];
    });
  };

  const removeFromCart = (id, customData) => {
    setCartItems((prev) => {
      if (customData && Object.keys(customData).length > 0) {
        return prev.filter((item) => !(item.id === id && JSON.stringify(item.customData || {}) === JSON.stringify(customData)));
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateQuantity = (id, qty, customData) => {
    setCartItems((prev) => {
      if (customData && Object.keys(customData).length > 0) {
        return prev.map((item) => (item.id === id && JSON.stringify(item.customData || {}) === JSON.stringify(customData) ? { ...item, quantity: qty } : item));
      }
      return prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item));
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price || 0);
      const cPrice = Number(item.customPrice || 0);
      const qty = Number(item.quantity || 1);
      return total + (price + cPrice) * qty;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
