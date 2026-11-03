import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCartWishlist } from '../context/CartWishlistContext';
import { useNotification } from '../context/NotificationContext';

const Wishlist = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const { showConfirm, showNotification } = useNotification();
  const {
    wishlist,
    isWishlistLoading,
    removeFromWishlist,
    moveWishlistToCart,
    clearWishlist
  } = useCartWishlist();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💛</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Your Saved Wishlist
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Products you love, saved for your next mindful practice
              </p>
            </div>

            {wishlist.length > 0 && (
              <button
                onClick={async () => {
                  const confirmed = await showConfirm({
                    title: 'Clear Wishlist',
                    message: 'Are you sure you want to clear your entire wishlist?',
                    confirmText: 'Clear Wishlist',
                    cancelText: 'Keep Items',
                    type: 'danger'
                  });
                  if (confirmed) {
                    clearWishlist();
                  }
                }}
                className="self-start sm:self-auto text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition border border-red-100"
              >
                Clear Wishlist
              </button>
            )}
          </div>

          {/* Guest Notice Pill */}
          {!isLoggedIn && wishlist.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>You are browsing as a guest. Your wishlist is safely saved on this device. Sign in anytime to sync across devices.</span>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal('Sign in to sync your wishlist.')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shrink-0 self-start sm:self-auto"
              >
                Sign In
              </button>
            </div>
          )}

          {isWishlistLoading && wishlist.length === 0 ? (
            /* Loading State */
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-gray-500">Loading your saved wellness favorites...</p>
            </div>
          ) : wishlist.length === 0 ? (
            /* Empty State */
            <div className="mt-12 p-12 max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
                💛
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your wishlist is empty</h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Save mindful mats, singing bowls, and wellness tools that inspire you. Revisit anytime to add them to your cart.
              </p>
              <Link
                to="/products"
                className="inline-block mt-6 px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Discover Wellness Products
              </Link>
            </div>
          ) : (
            /* Active Wishlist Grid */
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => {
                const product = item.product || {};
                const isOutOfStock = item.isOutOfStock;
                const prodId = product._id || item.product;

                return (
                  <div
                    key={item._id || prodId}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Preview & Delete Button */}
                      <div className="relative h-48 bg-saffron-50/50 flex items-center justify-center overflow-hidden border-b border-gray-50">
                        {product.thumbnail || product.images?.[0] ? (
                          <img
                            src={product.thumbnail || product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <span className="text-5xl">🧘</span>
                        )}

                        {/* Remove from Wishlist Icon */}
                        <button
                          onClick={() => removeFromWishlist(prodId)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500 shadow-xs flex items-center justify-center text-xs transition"
                          title="Remove from wishlist"
                        >
                          ✕
                        </button>

                        {/* Stock Tag Overlay */}
                        <div className="absolute bottom-3 left-3">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-xs">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-saffron-600">
                          {product.category || 'Mindful Product'}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                          {product.title || 'Wellness Product'}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {product.description || 'Crafted with mindfulness for your daily yoga and spiritual practice.'}
                        </p>

                        <div className="pt-2 flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-gray-900">
                            ₹{product.discountPrice || product.price || 0}
                          </span>
                          {product.discountPrice && product.discountPrice < product.price && (
                            <del className="text-xs text-gray-400">₹{product.price}</del>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={async () => {
                          const res = await moveWishlistToCart(prodId, 1);
                          if (res?.success) {
                            showNotification('Item moved from wishlist to cart! 🛒', 'success');
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-saffron-500 hover:bg-saffron-600 text-white shadow-xs cursor-pointer'
                        }`}
                      >
                        <span>🛒</span>
                        <span>{isOutOfStock ? 'Currently Unavailable' : 'Move to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;
