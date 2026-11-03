import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCartWishlist } from '../context/CartWishlistContext';
import { useNotification } from '../context/NotificationContext';
import { apiCreateOrder, apiValidateCoupon } from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, openAuthModal } = useAuth();
  const { showNotification, showConfirm } = useNotification();
  const {
    cart,
    summary,
    isCartLoading,
    isSyncing,
    updateCartItem,
    removeFromCart,
    clearCart,
    addToWishlist
  } = useCartWishlist();

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddressForm, setNewAddressForm] = useState({
    street: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contact: ''
  });
  const [paymentType, setPaymentType] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(null);

  // Set default address when checkout modal opens
  useEffect(() => {
    if (currentUser?.addresses && currentUser.addresses.length > 0) {
      const defaultAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
      setSelectedAddressId(defaultAddr._id || defaultAddr.id || '');
    } else {
      setSelectedAddressId('new');
    }
  }, [currentUser, isCheckoutModalOpen]);

  // Auto-proceed to checkout modal once user logs in and guest cart data is synced to database
  useEffect(() => {
    if (isLoggedIn && !isSyncing) {
      try {
        const pendingCheckout = sessionStorage.getItem('yogazen_pending_checkout');
        if (pendingCheckout === 'true' && cart.length > 0) {
          sessionStorage.removeItem('yogazen_pending_checkout');
          setIsCheckoutModalOpen(true);
        }
      } catch (e) {}
    }
  }, [isLoggedIn, isSyncing, cart.length]);

  const handleQuantityChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      const confirmed = await showConfirm({
        title: 'Remove Item',
        message: `Remove "${item.product?.title || 'this item'}" from your cart?`,
        confirmText: 'Remove',
        cancelText: 'Keep Item',
        type: 'danger'
      });
      if (confirmed) {
        await removeFromCart(item.product?._id || item.product);
      }
    } else {
      await updateCartItem(item.product?._id || item.product, newQty);
    }
  };

  const handleMoveToWishlist = async (item) => {
    const prodId = item.product?._id || item.product;
    await addToWishlist(prodId, item.product);
    await removeFromCart(prodId);
  };

  // Coupon application handler
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;

    try {
      setIsValidatingCoupon(true);
      setCouponFeedback(null);
      const res = await apiValidateCoupon(code, summary.subtotal);
      if (res?.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponInput('');
        setCouponFeedback({ type: 'success', message: res.message });
      }
    } catch (err) {
      setCouponFeedback({ type: 'error', message: err.message || 'Invalid coupon code.' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponFeedback(null);
  };

  // Dynamic Free Shipping & Total Calculations
  const subtotal = summary.subtotal || 0;
  const isFreeShipUnlocked = subtotal >= 999 || appliedCoupon?.type === 'shipping';
  const effectiveShippingFee = isFreeShipUnlocked ? 0 : 149;
  const couponDiscountAmount = appliedCoupon?.type === 'shipping' ? 0 : (appliedCoupon?.discountAmount || 0);
  const finalTotalAmount = Math.max(0, subtotal - couponDiscountAmount + effectiveShippingFee);
  const freeShipProgress = Math.min(100, Math.round((subtotal / 999) * 100));
  const amountNeededForFreeShip = Math.max(0, 999 - subtotal);

  // Handle final order submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart || cart.length === 0) return;

    let shippingAddress = {};
    if (selectedAddressId === 'new') {
      if (!newAddressForm.street || !newAddressForm.city || !newAddressForm.pincode || !newAddressForm.contact) {
        showNotification('Please complete all required fields for your delivery address.', 'error');
        return;
      }
      shippingAddress = { ...newAddressForm };
    } else {
      const existing = (currentUser?.addresses || []).find((a) => (a._id || a.id) === selectedAddressId);
      if (!existing) {
        showNotification('Please choose or enter a delivery address.', 'error');
        return;
      }
      shippingAddress = {
        street: existing.street,
        landmark: existing.landmark,
        city: existing.city,
        state: existing.state,
        country: existing.country || 'India',
        pincode: existing.pincode,
        contact: existing.contact || currentUser.contact
      };
    }

    try {
      setIsPlacingOrder(true);

      const formattedItems = cart.map((item) => ({
        product: item.product?._id || item.product,
        title: item.product?.title || 'YogaZen Wellness Product',
        varietySku: item.varietySku || item.varietyData?.sku || '',
        varietyName: item.varietyName || item.varietyData?.name || '',
        varietyImage: item.varietyImage || item.varietyData?.image || item.product?.images?.[0] || '',
        unitPrice: item.unitPrice || item.product?.discountPrice || item.product?.price || 0,
        quantity: item.quantity || 1
      }));

      let finalizedPaymentMethod = 'Cash on Delivery (Verified)';
      if (paymentType === 'upi') {
        finalizedPaymentMethod = `UPI Instant (${upiId.trim() || 'user@upi'})`;
      } else if (paymentType === 'card') {
        const cleanNum = cardDetails.number.replace(/\s+/g, '');
        const last4 = cleanNum.length >= 4 ? cleanNum.slice(-4) : '4242';
        finalizedPaymentMethod = `Credit/Debit Card (Ending in •••• ${last4})`;
      } else if (paymentType === 'netbanking') {
        finalizedPaymentMethod = `Net Banking (${selectedBank})`;
      }

      const payload = {
        orderType: 'product',
        items: formattedItems,
        shippingAddress,
        subtotal,
        couponCode: appliedCoupon?.code || '',
        discountAmount: couponDiscountAmount,
        shippingFee: effectiveShippingFee,
        totalAmount: finalTotalAmount,
        paymentMethod: finalizedPaymentMethod
      };

      const res = await apiCreateOrder(payload);

      if (res?.success && res.order) {
        await clearCart();
        setIsCheckoutModalOpen(false);
        navigate('/order-success', { state: { order: res.order } });
      }
    } catch (err) {
      showNotification(`Order placement failed: ${err.message || 'Please try again.'}`, 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Your Shopping Cart
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Carefully curated wellness tools, mats, and mindful props
              </p>
            </div>

            {isLoggedIn && cart.length > 0 && (
              <button
                onClick={async () => {
                  const confirmed = await showConfirm({
                    title: 'Clear Shopping Cart',
                    message: 'Are you sure you want to clear your entire cart?',
                    confirmText: 'Clear Cart',
                    cancelText: 'Keep Items',
                    type: 'danger'
                  });
                  if (confirmed) {
                    clearCart();
                  }
                }}
                className="self-start sm:self-auto text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition border border-red-100"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Guest Notice Pill */}
          {!isLoggedIn && cart.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>You are browsing as a guest. Your items are safely preserved. You can modify quantities or sign in to complete checkout.</span>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal('Sign in to sync your cart and checkout.')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shrink-0 self-start sm:self-auto"
              >
                Sign In
              </button>
            </div>
          )}

          {isCartLoading && cart.length === 0 ? (
            /* Loading State */
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-gray-500">Retrieving your mindful cart...</p>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart State */
            <div className="mt-12 p-12 max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-saffron-50 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
                🛍️
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your cart is currently empty</h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Explore our collection of authentic eco-friendly yoga mats, singing bowls, malas, and organic wellness tools.
              </p>
              <Link
                to="/products"
                className="inline-block mt-6 px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Explore Mindful Store
              </Link>
            </div>
          ) : (
            /* Active Cart Layout */
            <div className="mt-8 space-y-6">
              {/* Free Shipping Progress Meter */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-saffron-100 shadow-xs">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <span>🚚</span>
                    {isFreeShipUnlocked ? (
                      <span className="text-emerald-700 font-extrabold">Congratulations! You unlocked FREE Express Delivery!</span>
                    ) : (
                      <span>
                        Add <strong className="text-saffron-600 font-extrabold">₹{amountNeededForFreeShip}</strong> more for <strong>FREE Delivery</strong>
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-gray-500">{freeShipProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isFreeShipUnlocked ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-saffron-500'
                    }`}
                    style={{ width: `${freeShipProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Out of Stock Warning Banner */}
              {summary.hasOutOfStockItems && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs">
                    <p className="font-bold">Items in your cart are currently out of stock</p>
                    <p className="mt-0.5 text-red-700">
                      Please remove or save unavailable items to your wishlist before proceeding to checkout.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Cart Items List (8 Cols) */}
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item) => {
                    const product = item.product || {};
                    const isOutOfStock = item.isOutOfStock;
                    const isExceeded = item.isQuantityExceeded;

                    return (
                      <div
                        key={item._id || product._id}
                        className={`p-4 sm:p-5 bg-white rounded-2xl border transition ${
                          isOutOfStock
                            ? 'border-red-200 bg-red-50/20'
                            : isExceeded
                            ? 'border-amber-200 bg-amber-50/20'
                            : 'border-gray-100 hover:border-gray-200'
                        } shadow-xs flex flex-col sm:flex-row gap-4 sm:items-center justify-between`}
                      >
                        {/* Product Image & Title */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-saffron-50/60 border border-saffron-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.varietyImage || product.thumbnail || product.images?.[0] ? (
                              <img
                                src={item.varietyImage || product.thumbnail || product.images[0]}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl">🧘</span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-saffron-700 bg-saffron-50 rounded-md">
                              {product.category || 'Mindful Product'}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                              {product.title || 'Wellness Product'}
                            </h3>
                            {item.varietyName && (
                              <p className="text-xs text-gray-500 font-medium">
                                Option: <span className="text-gray-800 font-semibold">{item.varietyName}</span>
                              </p>
                            )}

                            {/* Stock Status Badge */}
                            <div>
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100/70 px-2.5 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                  Item out of stock
                                </span>
                              ) : isExceeded ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                                  Only {item.availableStock} available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                  In Stock
                                </span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-2 pt-1 text-xs">
                              <span className="font-extrabold text-gray-900 text-sm">
                                ₹{item.unitPrice || product.price || 0}
                              </span>
                              {product.discountPrice && product.discountPrice < product.price && (
                                <del className="text-gray-400 text-xs">₹{product.price}</del>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Counter & Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          {/* Item Subtotal */}
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                              Total
                            </span>
                            <span className="text-sm font-extrabold text-gray-900">
                              ₹{(item.itemTotal || (item.unitPrice || 0) * item.quantity).toLocaleString()}
                            </span>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={isCartLoading}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition font-bold text-sm disabled:opacity-50"
                              title={item.quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={isCartLoading || item.quantity >= item.availableStock || isOutOfStock}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center gap-3 text-xs">
                            <button
                              onClick={() => handleMoveToWishlist(item)}
                              className="text-gray-400 hover:text-saffron-600 transition font-medium"
                              title="Save to Wishlist"
                            >
                              💛 Save
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => removeFromCart(product._id || item.product)}
                              className="text-gray-400 hover:text-red-600 transition font-medium"
                              title="Remove item"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Order Summary & Coupon Engine (4 Cols) */}
                <div className="lg:col-span-4 sticky top-24 space-y-4">
                  {/* Coupon Code Card */}
                  <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>🏷️</span> Apply Promo Coupon
                      </span>
                      {appliedCoupon && (
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-[11px] text-red-600 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {appliedCoupon ? (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-emerald-800 uppercase tracking-wider font-mono">
                            {appliedCoupon.code}
                          </span>
                          <p className="text-[11px] text-emerald-700 mt-0.5">{appliedCoupon.description}</p>
                        </div>
                        <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                          {appliedCoupon.type === 'shipping' ? 'FREE Delivery' : `-₹${appliedCoupon.discountAmount}`}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter promo code..."
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 uppercase font-mono tracking-wider focus:outline-none focus:border-saffron-500"
                          />
                          <button
                            onClick={() => handleApplyCoupon()}
                            disabled={isValidatingCoupon || !couponInput.trim()}
                            className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                          >
                            {isValidatingCoupon ? 'Checking...' : 'Apply'}
                          </button>
                        </div>

                        {/* Quick Coupon Chips */}
                        <div className="pt-1">
                          <span className="text-[10px] text-gray-400 block mb-1.5 font-medium">Available Offers:</span>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {['YOGA10', 'ZEN20', 'FREESHIP', 'MINDFUL500'].map((code) => (
                              <button
                                key={code}
                                onClick={() => handleApplyCoupon(code)}
                                className="px-2.5 py-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-800 border border-saffron-200 rounded-lg font-bold font-mono transition"
                              >
                                {code}
                              </button>
                            ))}
                          </div>
                        </div>

                        {couponFeedback && (
                          <div
                            className={`p-2 rounded-xl text-xs font-semibold ${
                              couponFeedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {couponFeedback.message}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Order Summary Card */}
                  <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                      Order Summary
                    </h2>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Items ({summary.totalItems || 0})</span>
                        <span className="font-semibold text-gray-900">
                          ₹{subtotal.toLocaleString()}
                        </span>
                      </div>

                      {appliedCoupon && couponDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Coupon Discount ({appliedCoupon.code})</span>
                          <span>-₹{couponDiscountAmount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          Delivery Charges
                          {!isFreeShipUnlocked && (
                            <span className="text-[10px] text-gray-400">(Free above ₹999)</span>
                          )}
                        </span>
                        <span className="font-semibold">
                          {isFreeShipUnlocked ? (
                            <span className="text-emerald-600 font-bold">FREE</span>
                          ) : (
                            `₹${effectiveShippingFee}`
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-extrabold text-gray-900 block">Total Amount</span>
                        <span className="text-[10px] text-gray-400">Inclusive of all taxes</span>
                      </div>
                      <span className="text-xl font-black text-saffron-600">
                        ₹{finalTotalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      disabled={!summary.canCheckout}
                      onClick={() => {
                        if (!isLoggedIn) {
                          try {
                            sessionStorage.setItem('yogazen_pending_checkout', 'true');
                          } catch (e) {}
                          openAuthModal('Please sign in to proceed with checkout and delivery address.');
                          return;
                        }
                        setIsCheckoutModalOpen(true);
                      }}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm ${
                        summary.canCheckout
                          ? 'bg-saffron-500 hover:bg-saffron-600 text-white cursor-pointer shadow-saffron-100'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                      }`}
                    >
                      {summary.hasOutOfStockItems
                        ? 'Remove Out of Stock Items'
                        : summary.canCheckout
                        ? 'Proceed to Mindful Checkout →'
                        : 'Cart Not Ready for Checkout'}
                    </button>

                    {/* Trust Badges */}
                    <div className="pt-2 text-[10px] text-gray-400 space-y-1 text-center border-t border-gray-50">
                      <p>🔒 256-Bit Encrypted Secure Checkout</p>
                      <p>✨ Free returns & exchanges within 7 days</p>
                      <p>🚚 Fast Dispatch via BlueDart & Delhivery</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link
                      to="/products"
                      className="text-xs font-bold text-saffron-600 hover:text-saffron-700 transition"
                    >
                      ← Continue Mindful Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* 💳 MODAL: INTERACTIVE MINDFUL CHECKOUT FLOW                    */}
      {/* ============================================================== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-saffron-100 max-h-[92vh] overflow-y-auto">
            {orderPlacedSuccess ? (
              /* Order Confirmation Celebration */
              <div className="text-center py-6 space-y-4">
                <div className="w-18 h-18 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-gray-900">Order Placed Successfully!</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Thank you for practicing mindfulness with YogaZen. Your authentic package is being prepared for dispatch.
                </p>

                <div className="bg-saffron-50/50 p-4 rounded-2xl border border-saffron-100 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Number</span>
                    <span className="font-extrabold font-mono text-gray-900">{orderPlacedSuccess.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax Invoice ID</span>
                    <span className="font-mono text-gray-700">{orderPlacedSuccess.invoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-black text-saffron-700">₹{orderPlacedSuccess.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Courier Tracking</span>
                    <span className="font-mono text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {orderPlacedSuccess.trackingNumber || 'Assigned on dispatch'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Link
                    to="/profile"
                    className="flex-1 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition text-center"
                  >
                    View & Track in Your Profile →
                  </Link>
                  <button
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      setOrderPlacedSuccess(null);
                      navigate('/products');
                    }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>🛍️</span> Complete Your Order
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {summary.totalItems} items • Total: ₹{finalTotalAmount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full text-base"
                  >
                    ✕
                  </button>
                </div>

                {/* Section 1: Choose Delivery Address */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📍</span> Step 1: Delivery Address
                  </h4>

                  {currentUser?.addresses && currentUser.addresses.length > 0 && (
                    <div className="space-y-2">
                      {currentUser.addresses.map((addr) => {
                        const addrId = addr._id || addr.id;
                        const isSelected = selectedAddressId === addrId;
                        return (
                          <label
                            key={addrId}
                            className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                              isSelected
                                ? 'border-saffron-500 bg-saffron-50/40 ring-1 ring-saffron-400'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="checkoutAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addrId)}
                              className="mt-1 text-saffron-600 focus:ring-saffron-400"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-gray-900">{addr.street}</p>
                              {addr.landmark && <p className="text-gray-500">Landmark: {addr.landmark}</p>}
                              <p className="text-gray-600">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <p className="text-gray-500 mt-1">📞 {addr.contact || currentUser.contact}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Option to use a new address */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                      selectedAddressId === 'new'
                        ? 'border-saffron-500 bg-saffron-50/40 ring-1 ring-saffron-400'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkoutAddress"
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId('new')}
                      className="text-saffron-600 focus:ring-saffron-400"
                    />
                    <span className="text-xs font-bold text-gray-900">+ Deliver to a New Address</span>
                  </label>

                  {selectedAddressId === 'new' && (
                    <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Street Address & Flat / House No. *</label>
                        <input
                          type="text"
                          required
                          value={newAddressForm.street}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                          placeholder="e.g. 108 Shanti Niwas, 2nd Cross"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.city}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                            placeholder="Bengaluru"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.state}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                            placeholder="Karnataka"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.pincode}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                            placeholder="560038"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Contact Phone *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.contact}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, contact: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Choose Payment Method */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💳</span> Step 2: Payment Method
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'upi', label: 'UPI / GPay / QR', icon: '📱' },
                      { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                      { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                      { id: 'cod', label: 'Cash on Delivery', icon: '🚚' }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentType(pm.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center text-xs transition cursor-pointer ${
                          paymentType === pm.id
                            ? 'border-saffron-500 bg-saffron-50/70 font-black text-saffron-900 ring-2 ring-saffron-400'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-xl">{pm.icon}</span>
                        <span className="leading-tight text-[11px]">{pm.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Payment Sub-Forms */}
                  {paymentType === 'upi' && (
                    <div className="p-4 bg-saffron-50/50 rounded-2xl border border-saffron-100 space-y-2">
                      <label className="block text-[11px] font-bold text-gray-800">Enter UPI Virtual Payment Address (VPA)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@okhdfcbank or 9876543210@paytm"
                          className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-saffron-400"
                        />
                        <span className="px-3 py-2 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center gap-1">
                          <span>✓</span> Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        ⚡ Instant verification enabled via UPI 2.0 gateway simulator.
                      </p>
                    </div>
                  )}

                  {paymentType === 'card' && (
                    <div className="p-4 bg-saffron-50/50 rounded-2xl border border-saffron-100 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-800 mb-1">Card Number</label>
                        <input
                          type="text"
                          maxLength="19"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-800 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            maxLength="5"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-800 mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength="4"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            placeholder="•••"
                            className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        🔒 256-bit tokenized test card processing with zero card data storage.
                      </p>
                    </div>
                  )}

                  {paymentType === 'netbanking' && (
                    <div className="p-4 bg-saffron-50/50 rounded-2xl border border-saffron-100 space-y-2">
                      <label className="block text-[11px] font-bold text-gray-800">Select Bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                      </select>
                    </div>
                  )}

                  {paymentType === 'cod' && (
                    <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <span>🚚</span>
                      <span>Pay easily with Cash or UPI upon delivery at your doorstep.</span>
                    </div>
                  )}
                </div>

                {/* Section 3: Summary & Order Action */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Total Payable Amount:</span>
                    <span className="text-lg font-black text-saffron-600">₹{finalTotalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isPlacingOrder}
                      className="flex-1 py-3.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {isPlacingOrder ? 'Confirming Order...' : `Confirm & Place Order (₹${finalTotalAmount.toLocaleString()})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cart;
