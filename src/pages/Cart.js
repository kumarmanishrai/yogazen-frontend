import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCartWishlist } from '../context/CartWishlistContext';

const Cart = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const {
    cart,
    summary,
    isCartLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    addToWishlist
  } = useCartWishlist();

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('Please sign in to view and checkout your cart.');
    }
  }, [isLoggedIn, openAuthModal]);

  const handleQuantityChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      if (window.confirm(`Remove "${item.product?.title || 'this item'}" from your cart?`)) {
        await removeFromCart(item.product?._id || item.product);
      }
    } else {
      await updateCartItem(item.product?._id || item.product, newQty);
    }
  };

  const handleMoveToWishlist = async (item) => {
    const prodId = item.product?._id || item.product;
    await addToWishlist(prodId);
    await removeFromCart(prodId);
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
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire cart?')) {
                    clearCart();
                  }
                }}
                className="self-start sm:self-auto text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition border border-red-100"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Guest State */}
          {!isLoggedIn ? (
            <div className="mt-12 p-8 sm:p-12 max-w-lg mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
              <span className="text-5xl">🧘</span>
              <h2 className="text-xl font-bold text-gray-900 mt-4">Welcome to Yogazen Store</h2>
              <p className="text-sm text-gray-600 mt-2">
                You are currently browsing as a guest. Sign in to view your saved cart items, check out securely, and track orders.
              </p>
              <button
                onClick={() => openAuthModal('Please sign in to view your cart.')}
                className="mt-6 w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl shadow-md transition text-sm"
              >
                Sign In to View Cart
              </button>
              <Link
                to="/products"
                className="inline-block mt-4 text-xs font-bold text-saffron-600 hover:underline"
              >
                Continue browsing store &rarr;
              </Link>
            </div>
          ) : isCartLoading && cart.length === 0 ? (
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
                            {product.thumbnail || product.images?.[0] ? (
                              <img
                                src={product.thumbnail || product.images[0]}
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

                {/* Right: Order Summary (4 Cols) */}
                <div className="lg:col-span-4 sticky top-24 space-y-4">
                  <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                      Order Summary
                    </h2>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Items ({summary.totalItems || 0})</span>
                        <span className="font-semibold text-gray-900">
                          ₹{(summary.subtotal || 0).toLocaleString()}
                        </span>
                      </div>

                      {summary.discountSavings > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Discount Savings</span>
                          <span>-₹{summary.discountSavings.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          Delivery Charges
                          {summary.subtotal < 999 && (
                            <span className="text-[10px] text-gray-400">(Free above ₹999)</span>
                          )}
                        </span>
                        <span className="font-semibold">
                          {summary.shippingFee === 0 ? (
                            <span className="text-emerald-600 font-bold">FREE</span>
                          ) : (
                            `₹${summary.shippingFee}`
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
                        ₹{(summary.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      disabled={!summary.canCheckout}
                      onClick={() => alert('Proceeding to checkout with secure gateway!')}
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
                      <p>✨ Free returns within 7 days of delivery</p>
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

      <Footer />
    </div>
  );
};

export default Cart;
