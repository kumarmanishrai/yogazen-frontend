import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  apiGetCart,
  apiAddToCart,
  apiUpdateCartItem,
  apiRemoveFromCart,
  apiClearCart,
  apiGetWishlist,
  apiAddToWishlist,
  apiToggleWishlist,
  apiRemoveFromWishlist,
  apiMoveWishlistToCart,
  apiClearWishlist
} from '../services/api';

const CartWishlistContext = createContext(null);

export const CartWishlistProvider = ({ children }) => {
  const { isLoggedIn, role } = useAuth();
  const [cart, setCart] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    originalSubtotal: 0,
    subtotal: 0,
    discountSavings: 0,
    shippingFee: 0,
    totalAmount: 0,
    hasOutOfStockItems: false,
    hasQuantityExceededItems: false,
    canCheckout: false
  });
  const [wishlist, setWishlist] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMessage({ text: msg, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Fetch Cart
  const refreshCart = useCallback(async () => {
    if (!isLoggedIn || role !== 'user') {
      setCart([]);
      return;
    }
    setIsCartLoading(true);
    try {
      const res = await apiGetCart();
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.warn('Failed to fetch cart:', err.message);
    } finally {
      setIsCartLoading(false);
    }
  }, [isLoggedIn, role]);

  // Fetch Wishlist
  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn || role !== 'user') {
      setWishlist([]);
      return;
    }
    setIsWishlistLoading(true);
    try {
      const res = await apiGetWishlist();
      if (res?.success) {
        setWishlist(res.wishlist || []);
      }
    } catch (err) {
      console.warn('Failed to fetch wishlist:', err.message);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [isLoggedIn, role]);

  // Initial load when logged in as regular user
  useEffect(() => {
    if (isLoggedIn && role === 'user') {
      refreshCart();
      refreshWishlist();
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [isLoggedIn, role, refreshCart, refreshWishlist]);

  // Add to Cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await apiAddToCart(productId, quantity);
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
        showFeedback(res.message || 'Added to cart!');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Could not add to cart', 'error');
      return { success: false, error: err.message };
    }
  };

  // Update Cart Item Quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      const res = await apiUpdateCartItem(productId, quantity);
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Could not update quantity', 'error');
      return { success: false, error: err.message };
    }
  };

  // Remove from Cart
  const removeFromCart = async (productId) => {
    try {
      const res = await apiRemoveFromCart(productId);
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
        showFeedback(res.message || 'Removed from cart');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Could not remove item', 'error');
      return { success: false, error: err.message };
    }
  };

  // Clear Cart
  const clearCart = async () => {
    try {
      const res = await apiClearCart();
      if (res?.success) {
        setCart([]);
        if (res.summary) setSummary(res.summary);
        showFeedback('Cart cleared');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to clear cart', 'error');
      return { success: false, error: err.message };
    }
  };

  // Add to Wishlist
  const addToWishlist = async (productId) => {
    try {
      const res = await apiAddToWishlist(productId);
      if (res?.success) {
        setWishlist(res.wishlist || []);
        showFeedback(res.message || 'Added to wishlist');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Could not add to wishlist', 'error');
      return { success: false, error: err.message };
    }
  };

  // Toggle Wishlist (1-click heart action)
  const toggleWishlist = async (productId) => {
    try {
      const res = await apiToggleWishlist(productId);
      if (res?.success) {
        setWishlist(res.wishlist || []);
        showFeedback(res.message || 'Wishlist updated');
        return { success: true, action: res.action, inWishlist: res.inWishlist };
      }
    } catch (err) {
      showFeedback(err.message || 'Could not update wishlist', 'error');
      return { success: false, error: err.message };
    }
  };

  // Remove from Wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const res = await apiRemoveFromWishlist(productId);
      if (res?.success) {
        setWishlist(res.wishlist || []);
        showFeedback(res.message || 'Removed from wishlist');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Could not remove item', 'error');
      return { success: false, error: err.message };
    }
  };

  // Move from Wishlist to Cart
  const moveWishlistToCart = async (productId, quantity = 1) => {
    try {
      const res = await apiMoveWishlistToCart(productId, quantity);
      if (res?.success) {
        if (res.cart) setCart(res.cart);
        if (res.wishlist) setWishlist(res.wishlist);
        await refreshCart();
        showFeedback(res.message || 'Moved item to cart');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to move to cart', 'error');
      return { success: false, error: err.message };
    }
  };

  // Clear Wishlist
  const clearWishlist = async () => {
    try {
      const res = await apiClearWishlist();
      if (res?.success) {
        setWishlist([]);
        showFeedback('Wishlist cleared');
        return { success: true };
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to clear wishlist', 'error');
      return { success: false, error: err.message };
    }
  };

  // Dynamic counts for navigation badges
  const cartCount = summary?.totalItems ?? cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const wishlistCount = wishlist.length;

  return (
    <CartWishlistContext.Provider
      value={{
        cart,
        summary,
        wishlist,
        cartCount,
        wishlistCount,
        isCartLoading,
        isWishlistLoading,
        feedbackMessage,
        refreshCart,
        refreshWishlist,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        addToWishlist,
        toggleWishlist,
        removeFromWishlist,
        moveWishlistToCart,
        clearWishlist
      }}
    >
      {children}
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border ${
              feedbackMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-saffron-50 text-saffron-800 border-saffron-200'
            }`}
          >
            <span>{feedbackMessage.type === 'error' ? '⚠️' : '✨'}</span>
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}
    </CartWishlistContext.Provider>
  );
};

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
};

