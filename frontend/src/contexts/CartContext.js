import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { api, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      // Use local storage for unauthenticated users
      const localCart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
      setCart(localCart);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      // Handle local cart
      const localCart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
      const existingItem = localCart.items.find(i => i.product_id === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        localCart.items.push({ product_id: productId, quantity });
      }
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCart(localCart);
      return;
    }

    try {
      await api.post('/cart/add', { product_id: productId, quantity });
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) {
      const localCart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
      localCart.items = localCart.items.filter(i => i.product_id !== productId);
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCart(localCart);
      return;
    }

    try {
      await api.delete(`/cart/${productId}`);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCart({ items: [], total: 0 });
  };

  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      clearCart,
      fetchCart,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
