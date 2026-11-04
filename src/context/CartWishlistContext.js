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

const GUEST_CART_KEY = 'yogazen_guest_cart';
const GUEST_WISHLIST_KEY = 'yogazen_guest_wishlist';

// Helpers for guest persistence
const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveGuestCart = (cartItems) => {
  try {
    if (!cartItems || cartItems.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    }
  } catch (e) {}
};

const loadGuestWishlist = () => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveGuestWishlist = (wishlistItems) => {
  try {
    if (!wishlistItems || wishlistItems.length === 0) {
      localStorage.removeItem(GUEST_WISHLIST_KEY);
    } else {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistItems));
    }
  } catch (e) {}
};

const calculateGuestSummary = (items) => {
  let totalItems = 0;
  let subtotal = 0;
  let originalSubtotal = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.product?.discountPrice || item.product?.price || 0);
    const origPrice = Number(item.product?.price || price);
    totalItems += qty;
    subtotal += price * qty;
    originalSubtotal += origPrice * qty;
  });

  const discountSavings = Math.max(0, originalSubtotal - subtotal);
  const shippingFee = subtotal > 1500 || totalItems === 0 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  return {
    totalItems,
    originalSubtotal,
    subtotal,
    discountSavings,
    shippingFee,
    totalAmount,
    hasOutOfStockItems: false,
    hasQuantityExceededItems: false,
    canCheckout: totalItems > 0
  };
};

export const CartWishlistProvider = ({ children }) => {
  const { isLoggedIn, role } = useAuth();
  const [cart, setCart] = useState(() => loadGuestCart());
  const [summary, setSummary] = useState(() => calculateGuestSummary(loadGuestCart()));
  const [wishlist, setWishlist] = useState(() => loadGuestWishlist());
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch Logged-in Cart from Backend
  const refreshCart = useCallback(async () => {
    if (!isLoggedIn || role !== 'user') {
      const gCart = loadGuestCart();
      setCart(gCart);
      setSummary(calculateGuestSummary(gCart));
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

  // Fetch Logged-in Wishlist from Backend
  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn || role !== 'user') {
      const gWish = loadGuestWishlist();
      setWishlist(gWish);
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

  // Synchronize Guest Cart & Wishlist upon login:
  // Take the data stored in localStorage, save it in the database, delete that data in localStorage
  const syncGuestDataToDatabase = useCallback(async () => {
    const guestCart = loadGuestCart();
    const guestWish = loadGuestWishlist();

    if (guestCart.length === 0 && guestWish.length === 0) {
      return false;
    }

    setIsSyncing(true);
    try {
      // 1. Save guest cart items to database
      if (guestCart.length > 0) {
        for (const item of guestCart) {
          const pId = item.product?._id || item.product || item.productId;
          if (pId) {
            await apiAddToCart(pId, item.quantity || 1, {
              varietySku: item.varietySku,
              varietyName: item.varietyName,
              price: item.price
            }).catch((err) => {
              console.warn('Sync cart item failed:', pId, err.message);
            });
          }
        }
      }

      // 2. Save guest wishlist items to database
      if (guestWish.length > 0) {
        for (const item of guestWish) {
          const pId = item.product?._id || item.product || item._id;
          if (pId) {
            await apiAddToWishlist(pId).catch((err) => {
              console.warn('Sync wishlist item failed:', pId, err.message);
            });
          }
        }
      }

      // 3. Delete that data in local storage
      try {
        localStorage.removeItem(GUEST_CART_KEY);
        localStorage.removeItem(GUEST_WISHLIST_KEY);
      } catch (e) {}

      // 4. Reload from database
      await refreshCart();
      await refreshWishlist();
      return true;
    } catch (err) {
      console.warn('Sync guest data error:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCart, refreshWishlist]);

  // Trigger sync automatically when user logs in
  useEffect(() => {
    if (isLoggedIn && role === 'user') {
      syncGuestDataToDatabase();
    } else if (!isLoggedIn) {
      const gCart = loadGuestCart();
      const gWish = loadGuestWishlist();
      setCart(gCart);
      setSummary(calculateGuestSummary(gCart));
      setWishlist(gWish);
    }
  }, [isLoggedIn, role, syncGuestDataToDatabase]);

  // Add to Cart (Guest + Logged In)
  const addToCart = async (productId, quantity = 1, varietyData = {}, productObj = null) => {
    const clampedQuantity = Math.min(10, Math.max(1, quantity));
    if (!isLoggedIn || role !== 'user') {
      const currentGuest = loadGuestCart();
      const pIdStr = productId ? productId.toString() : '';
      const existingIdx = currentGuest.findIndex(
        (it) =>
          (it.product?._id || it.product || it.productId)?.toString() === pIdStr &&
          (it.varietySku || '') === (varietyData.varietySku || '')
      );

      let updatedCart;
      if (existingIdx > -1) {
        const existingItem = currentGuest[existingIdx];
        const availableStock = existingItem.product?.stock !== undefined ? existingItem.product.stock : 99;
        const newQty = Math.min(10, Math.min(availableStock, existingItem.quantity + clampedQuantity));
        updatedCart = [...currentGuest];
        updatedCart[existingIdx] = {
          ...existingItem,
          quantity: newQty
        };
      } else {
        const prod = productObj || {};
        const availableStock = prod.stock !== undefined ? prod.stock : 99;
        const initialQty = Math.min(10, Math.min(availableStock, clampedQuantity));
        const itemProduct = {
          _id: prod._id || pIdStr,
          title: prod.title || varietyData.productTitle || 'Mindful Product',
          price: Number(prod.price || varietyData.price || 999),
          discountPrice: Number(prod.discountPrice || prod.price || varietyData.price || 999),
          thumbnail: prod.thumbnail || (prod.images && prod.images[0]) || varietyData.varietyImage || varietyData.image || '',
          images: prod.images || (prod.thumbnail ? [prod.thumbnail] : []),
          category: prod.category || varietyData.category || 'Wellness',
          stock: availableStock
        };
        const effPrice = Number(varietyData.price || itemProduct.discountPrice || itemProduct.price || 999);
        const newItem = {
          product: itemProduct,
          quantity: initialQty,
          varietySku: varietyData.varietySku || '',
          varietyName: varietyData.varietyName || '',
          price: effPrice,
          image: varietyData.varietyImage || varietyData.image || itemProduct.thumbnail || ''
        };
        updatedCart = [...currentGuest, newItem];
      }

      saveGuestCart(updatedCart);
      setCart(updatedCart);
      setSummary(calculateGuestSummary(updatedCart));
      return { success: true };
    }

    try {
      const res = await apiAddToCart(productId, clampedQuantity, varietyData);
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
        return { success: true };
      }
    } catch (err) {
      console.warn('Could not add to cart:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Update Cart Item Quantity (Guest + Logged In)
  const updateCartItem = async (productId, quantity) => {
    const clampedQuantity = Math.min(10, Math.max(1, quantity));
    if (!isLoggedIn || role !== 'user') {
      const currentGuest = loadGuestCart();
      const pIdStr = productId.toString();
      const updatedCart = currentGuest.map((it) => {
        if ((it.product?._id || it.product || it.productId)?.toString() === pIdStr) {
          const availableStock = it.product?.stock !== undefined ? it.product.stock : 99;
          const finalQty = Math.min(10, Math.min(availableStock, clampedQuantity));
          return { ...it, quantity: Math.max(1, finalQty) };
        }
        return it;
      });
      saveGuestCart(updatedCart);
      setCart(updatedCart);
      setSummary(calculateGuestSummary(updatedCart));
      return { success: true };
    }

    try {
      const res = await apiUpdateCartItem(productId, clampedQuantity);
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
        return { success: true };
      }
    } catch (err) {
      console.warn('Could not update quantity:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Remove from Cart (Guest + Logged In)
  const removeFromCart = async (productId) => {
    if (!isLoggedIn || role !== 'user') {
      const currentGuest = loadGuestCart();
      const pIdStr = productId.toString();
      const updatedCart = currentGuest.filter(
        (it) => (it.product?._id || it.product || it.productId)?.toString() !== pIdStr
      );
      saveGuestCart(updatedCart);
      setCart(updatedCart);
      setSummary(calculateGuestSummary(updatedCart));
      return { success: true };
    }

    try {
      const res = await apiRemoveFromCart(productId);
      if (res?.success) {
        setCart(res.cart || []);
        if (res.summary) setSummary(res.summary);
        return { success: true };
      }
    } catch (err) {
      console.warn('Could not remove item:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Clear Cart (Guest + Logged In)
  const clearCart = async () => {
    if (!isLoggedIn || role !== 'user') {
      saveGuestCart([]);
      setCart([]);
      setSummary(calculateGuestSummary([]));
      return { success: true };
    }

    try {
      const res = await apiClearCart();
      if (res?.success) {
        setCart([]);
        if (res.summary) setSummary(res.summary);
        return { success: true };
      }
    } catch (err) {
      console.warn('Failed to clear cart:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Add to Wishlist (Guest + Logged In)
  const addToWishlist = async (productId, productObj = null) => {
    if (!isLoggedIn || role !== 'user') {
      const currentWish = loadGuestWishlist();
      const pIdStr = productId.toString();
      const exists = currentWish.some(
        (it) => (it.product?._id || it.product || it._id || it)?.toString() === pIdStr
      );
      if (!exists) {
        const item = {
          product: productObj || { _id: pIdStr, title: 'Mindful Item', price: 999 },
          _id: pIdStr,
          addedAt: new Date().toISOString()
        };
        const updated = [...currentWish, item];
        saveGuestWishlist(updated);
        setWishlist(updated);
      }
      return { success: true };
    }

    try {
      const res = await apiAddToWishlist(productId);
      if (res?.success) {
        setWishlist(res.wishlist || []);
        return { success: true };
      }
    } catch (err) {
      console.warn('Could not add to wishlist:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Toggle Wishlist (Guest + Logged In)
  const toggleWishlist = async (productId, productObj = null) => {
    if (!isLoggedIn || role !== 'user') {
      const currentWish = loadGuestWishlist();
      const pIdStr = productId.toString();
      const existsIndex = currentWish.findIndex(
        (it) => (it.product?._id || it.product || it._id || it)?.toString() === pIdStr
      );
      let updated;
      let inWishlist = false;
      if (existsIndex > -1) {
        updated = currentWish.filter((_, idx) => idx !== existsIndex);
        inWishlist = false;
      } else {
        const item = {
          product: productObj || { _id: pIdStr, title: 'Mindful Item', price: 999 },
          _id: pIdStr,
          addedAt: new Date().toISOString()
        };
        updated = [...currentWish, item];
        inWishlist = true;
      }
      saveGuestWishlist(updated);
      setWishlist(updated);
      return { success: true, action: inWishlist ? 'added' : 'removed', inWishlist };
    }

    try {
      const res = await apiToggleWishlist(productId);
      if (res?.success) {
        setWishlist(res.wishlist || []);
        return { success: true, action: res.action, inWishlist: res.inWishlist };
      }
    } catch (err) {
      console.warn('Could not update wishlist:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Remove from Wishlist (Guest + Logged In)
  const removeFromWishlist = async (productId) => {
    if (!isLoggedIn || role !== 'user') {
      const currentWish = loadGuestWishlist();
      const pIdStr = productId.toString();
      const updated = currentWish.filter(
        (it) => (it.product?._id || it.product || it._id || it)?.toString() !== pIdStr
      );
      saveGuestWishlist(updated);
      setWishlist(updated);
      return { success: true };
    }

    try {
      const res = await apiRemoveFromWishlist(productId);
      if (res?.success) {
        setWishlist(res.wishlist || []);
        return { success: true };
      }
    } catch (err) {
      console.warn('Could not remove item from wishlist:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Move from Wishlist to Cart (Guest + Logged In)
  const moveWishlistToCart = async (productId, quantity = 1) => {
    if (!isLoggedIn || role !== 'user') {
      const currentWish = loadGuestWishlist();
      const pIdStr = productId.toString();
      const item = currentWish.find(
        (it) => (it.product?._id || it.product || it._id || it)?.toString() === pIdStr
      );
      if (item) {
        await addToCart(pIdStr, quantity, {}, item.product || item);
        await removeFromWishlist(pIdStr);
      }
      return { success: true };
    }

    try {
      const res = await apiMoveWishlistToCart(productId, quantity);
      if (res?.success) {
        if (res.cart) setCart(res.cart);
        if (res.wishlist) setWishlist(res.wishlist);
        await refreshCart();
        return { success: true };
      }
    } catch (err) {
      console.warn('Failed to move to cart:', err.message);
      return { success: false, error: err.message };
    }
  };

  // Clear Wishlist (Guest + Logged In)
  const clearWishlist = async () => {
    if (!isLoggedIn || role !== 'user') {
      saveGuestWishlist([]);
      setWishlist([]);
      return { success: true };
    }

    try {
      const res = await apiClearWishlist();
      if (res?.success) {
        setWishlist([]);
        return { success: true };
      }
    } catch (err) {
      console.warn('Failed to clear wishlist:', err.message);
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
        isSyncing,
        syncGuestDataToDatabase,
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
