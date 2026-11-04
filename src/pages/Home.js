import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrainerBanner from '../components/TrainerBanner';
import { apiGetProducts, apiGetRecommendations } from '../services/api';
import tracker from '../services/analyticsTracker';
import { useCartWishlist } from '../context/CartWishlistContext';
import { useNotification } from '../context/NotificationContext';

const FEATURED_CATEGORIES = [
  { name: 'Yoga Mats', icon: '🧘‍♀️', label: 'Yoga Mats', desc: 'Organic cork & natural tree rubber' },
  { name: 'Yoga Props', icon: '🧱', label: 'Blocks & Straps', desc: 'Beveled cork & posture straps' },
  { name: 'Meditation & Rest', icon: '🪑', label: 'Zafu & Cushions', desc: 'Buckwheat bolsters & floor chairs' },
  { name: 'Sound Healing', icon: '🔔', label: 'Singing Bowls & Chimes', desc: '7-Metal Tibetan & 432Hz crystal' },
  { name: 'Spiritual Tools', icon: '📿', label: 'Malas & Crystals', desc: '108 Japa malas & selenite plates' },
  { name: 'Aromatherapy & Cleanse', icon: '🌿', label: 'Oils & Diffusers', desc: 'White sage, palo santo & resin' }
];

const Home = () => {
  const [heroSearch, setHeroSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const navigate = useNavigate();

  const { cart, addToCart, updateCartItem, removeFromCart, wishlist, toggleWishlist } = useCartWishlist();
  const { showNotification } = useNotification();

  const isSavedInWishlist = (productId) => {
    return wishlist.some(
      (item) => (item.product?._id || item.product || item._id).toString() === productId.toString()
    );
  };

  const getCartItemQuantity = (productId) => {
    if (!cart || cart.length === 0) return 0;
    const match = cart.find(
      (item) => (item.product?._id || item.product).toString() === productId.toString()
    );
    return match ? match.quantity : 0;
  };

  const handleWishlistToggle = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(prod._id, prod);
    tracker.trackWishlistAction(prod, 'toggle_wishlist');
  };

  const handleAddClick = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    let varietyData = {};
    if (prod.varieties && prod.varieties.length > 0) {
      const firstInStock = prod.varieties.find((v) => v.stock > 0) || prod.varieties[0];
      varietyData = {
        varietySku: firstInStock.sku || '',
        varietyName: firstInStock.name || '',
        varietyImage: firstInStock.image || prod.thumbnail || prod.images?.[0] || '',
        price: firstInStock.price || prod.discountPrice || prod.price,
        productTitle: prod.title,
        category: prod.category
      };
    } else {
      varietyData = {
        price: prod.discountPrice || prod.price,
        productTitle: prod.title,
        category: prod.category
      };
    }
    await addToCart(prod._id, 1, varietyData, prod);
    tracker.trackCartAction(prod, varietyData.varietySku, 'add_to_cart');
  };

  const handleIncrement = async (e, prod, currentQty) => {
    e.preventDefault();
    e.stopPropagation();
    const maxStock = prod.stock || 99;
    if (currentQty >= maxStock) {
      showNotification(`Maximum available stock (${maxStock}) reached.`, 'info');
      return;
    }
    await updateCartItem(prod._id, currentQty + 1);
    tracker.trackCartAction(prod, '', 'increment_quantity');
  };

  const handleDecrement = async (e, prod, currentQty) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentQty <= 1) {
      await removeFromCart(prod._id);
    } else {
      await updateCartItem(prod._id, currentQty - 1);
    }
    tracker.trackCartAction(prod, '', 'decrement_quantity');
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      tracker.trackSearch(heroSearch.trim());
      navigate(`/products?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/products');
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await apiGetProducts({ limit: 4, sort: 'popular' });
        if (res?.success) {
          setFeaturedProducts(res.products || []);
        }
      } catch (err) {
        console.warn('Could not load featured products:', err.message);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const sessionId = localStorage.getItem('yogazen_session_id') || 'guest_home';
        const res = await apiGetRecommendations(sessionId);
        if (res?.success && res.products?.length > 0) {
          setRecommendedProducts(res.products);
        }
      } catch (err) {
        console.warn('Could not load ML recommendations:', err.message);
      }
    };

    fetchFeatured();
    fetchRecommendations();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-gray-900 dark:text-stone-100 flex flex-col justify-between font-nunito transition-colors duration-200">
      <div>
        <Navbar />

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            {/* Gentle Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-saffron-50 dark:bg-stone-900 text-saffron-700 dark:text-saffron-400 border border-saffron-200 dark:border-stone-800 mb-6">
              Curated Wellness for Mind, Body & Soul
            </span>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-stone-100 tracking-tight leading-tight">
              Embrace Tranquility with{' '}
              <span className="text-saffron-600 underline decoration-saffron-200 decoration-wavy">
                YogaZen
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-stone-400 leading-relaxed">
              Discover ethically-crafted yoga mats, Tibetan singing bowls, sacred malas,
              meditation chairs, and pure aromatherapy — crafted to elevate your daily practice.
            </p>

            {/* Hero Interactive Search Bar */}
            <form onSubmit={handleHeroSearch} className="mt-8 max-w-lg mx-auto relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-stone-800 bg-white dark:bg-stone-900">
              <span className="pl-4 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search yoga mats, singing bowls, malas, props..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full py-3.5 px-3 text-xs sm:text-sm text-gray-800 dark:text-stone-100 placeholder-gray-400 dark:placeholder-stone-500 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex-shrink-0"
              >
                Search Store
              </button>
            </form>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/products"
                className="px-6 py-2.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-700 font-bold text-xs rounded-full border border-saffron-200 transition"
              >
                Explore Full Catalog 🧘
              </Link>
              <Link
                to="/trainer/register"
                className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-full border border-gray-200 transition"
              >
                Join as Trainer 🌿
              </Link>
            </div>
          </div>

          {/* Shop By Mindful Categories Section */}
          <section className="mt-16 sm:mt-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-stone-100 tracking-tight">
                  Shop by Mindful Category
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                  Handcrafted tools dedicated to grounding, breathwork, and meditation
                </p>
              </div>
              <Link to="/products" className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {FEATURED_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => tracker.trackCategoryBrowse(cat.name)}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 hover:border-saffron-300 dark:hover:border-saffron-500 shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-between group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-300 mb-2">
                    {cat.icon}
                  </span>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-stone-100 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition">
                    {cat.label}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-stone-500 mt-1 line-clamp-1">
                    {cat.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured / Trending Products Showcase */}
          {featuredProducts.length > 0 && (
            <section className="mt-16 sm:mt-24">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-stone-100 tracking-tight">
                    Trending Mindful Essentials
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                    Our community's most beloved sacred wellness instruments
                  </p>
                </div>
                <Link to="/products?sort=popular" className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline">
                  Browse Popular &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((p) => {
                  const price = p.discountPrice || p.price;
                  const originalPrice = p.price;
                  const discount = originalPrice > price
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : 0;
                  const cartQty = getCartItemQuantity(p._id);

                  return (
                    <Link
                      key={p._id}
                      to={`/products/${p._id}`}
                      onClick={() => tracker.trackProductClick(p, 'home_trending')}
                      className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-200 dark:border-stone-800 hover:border-saffron-400 dark:hover:border-saffron-500 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 cursor-pointer"
                    >
                      {/* Image Area */}
                      <div className="h-48 bg-saffron-50/40 dark:bg-stone-950/60 rounded-xl overflow-hidden flex items-center justify-center p-3 relative">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-4xl">🧘</span>
                        )}

                        {/* Discount Tag */}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white shadow-xs">
                            {discount}% OFF
                          </span>
                        )}

                        {/* Wishlist Heart Icon */}
                        <button
                          type="button"
                          onClick={(e) => handleWishlistToggle(e, p)}
                          title={isSavedInWishlist(p._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs ${
                            isSavedInWishlist(p._id)
                              ? 'bg-red-50 text-red-500 scale-105 hover:bg-red-100'
                              : 'bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500 hover:bg-white hover:scale-105'
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-4 h-4 transition-transform active:scale-125"
                            fill={isSavedInWishlist(p._id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={isSavedInWishlist(p._id) ? '0' : '2'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="mt-3 space-y-1 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-saffron-600 dark:text-saffron-400">
                            {p.category}
                          </span>
                          <h3 className="text-xs font-bold text-gray-900 dark:text-stone-100 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition line-clamp-2 leading-snug">
                            {p.title}
                          </h3>

                          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-stone-400 pt-1">
                            <span className="text-amber-400">★</span>
                            <span className="font-bold text-gray-800 dark:text-stone-200">{p.rating ? p.rating.toFixed(1) : '5.0'}</span>
                            <span>({p.reviewsCount || 0})</span>
                          </div>
                        </div>

                        {/* Pricing & Blinkit/Zepto CTA */}
                        <div className="pt-2 border-t border-gray-100 dark:border-stone-800 flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-gray-900 dark:text-stone-100">
                              ₹{price.toLocaleString()}
                            </span>
                            {originalPrice > price && (
                              <del className="text-xs text-gray-400 dark:text-stone-500">₹{originalPrice.toLocaleString()}</del>
                            )}
                          </div>

                          <div className="flex flex-col items-end">
                            {p.stock <= 0 ? (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-stone-800 text-gray-400 dark:text-stone-500 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-stone-700">
                                Sold Out
                              </span>
                            ) : cartQty > 0 ? (
                              /* Quantity Stepper (1, +, -) */
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="h-8 bg-saffron-500 text-white rounded-xl font-black text-xs flex items-center shadow-xs overflow-hidden border border-saffron-600"
                              >
                                {/* Decrement Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDecrement(e, p, cartQty)}
                                  title="Decrease quantity"
                                  className="w-7 h-full flex items-center justify-center hover:bg-saffron-600 active:scale-90 transition font-black text-sm cursor-pointer select-none"
                                >
                                  −
                                </button>

                                {/* Quantity Display (Clicking again also increments) */}
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrement(e, p, cartQty)}
                                  title="Click to add more"
                                  className="px-2 h-full flex items-center justify-center font-black text-xs hover:bg-saffron-600/60 active:scale-95 transition cursor-pointer select-none min-w-[24px]"
                                >
                                  {cartQty}
                                </button>

                                {/* Increment Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrement(e, p, cartQty)}
                                  title="Increase quantity"
                                  className="w-7 h-full flex items-center justify-center hover:bg-saffron-600 active:scale-90 transition font-black text-sm cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              /* ADD + Button */
                              <button
                                type="button"
                                onClick={(e) => handleAddClick(e, p)}
                                className="px-3.5 py-1.5 bg-saffron-50 dark:bg-stone-800 hover:bg-saffron-500 dark:hover:bg-saffron-500 text-saffron-700 dark:text-saffron-300 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider border border-saffron-300 dark:border-stone-700 hover:border-transparent transition-all duration-200 flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                              >
                                <span>ADD</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  className="w-3.5 h-3.5 stroke-[3]"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </button>
                            )}
                            {p.varieties?.length > 0 && p.stock > 0 && cartQty === 0 && (
                              <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                                {p.varieties.length} options
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ML Recommendations Showcase (Powered by ML Recommendation System) */}
          {recommendedProducts.length > 0 && (
            <section className="mt-16 sm:mt-24 bg-gradient-to-br from-amber-50/50 via-white to-saffron-50/40 dark:from-stone-900/90 dark:via-stone-900 dark:to-stone-950 p-6 sm:p-10 rounded-3xl border border-saffron-100/80 dark:border-stone-800 shadow-xs dark:shadow-xl transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-3 py-1 rounded-full bg-saffron-500 text-white text-[11px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                      ML Recommended For You
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-stone-100 tracking-tight">
                    Personalized Wellness Selections
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-stone-400 mt-0.5">
                    Tailored by YogaZen's ML recommendation model based on your unique browsing affinities
                  </p>
                </div>
                <Link
                  to="/products"
                  className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:text-saffron-700 dark:hover:text-saffron-300 hover:underline self-start md:self-auto flex items-center gap-1"
                >
                  Explore All Products &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProducts.map((p) => {
                  const price = p.discountPrice || p.price;
                  const originalPrice = p.price;
                  const cartQty = getCartItemQuantity(p._id);

                  return (
                    <Link
                      key={p._id}
                      to={`/products/${p._id}`}
                      onClick={() => tracker.trackProductClick(p, 'home_ml_recommendation')}
                      className="bg-white dark:bg-stone-900 rounded-2xl border border-gray-200 dark:border-stone-800 hover:border-saffron-400 dark:hover:border-saffron-500 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 cursor-pointer relative"
                    >
                      {/* Image Area */}
                      <div className="h-44 bg-saffron-50/40 dark:bg-stone-950/60 rounded-xl overflow-hidden flex items-center justify-center p-3 relative">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-4xl">🧘</span>
                        )}

                        {/* ML Affinity Badge */}
                        <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black bg-stone-900/90 text-amber-300 backdrop-blur-xs shadow-xs border border-amber-400/30 flex items-center gap-1">
                          <span>{p.mlScore ? `${Math.min(99, Math.round((p.mlScore > 1 ? 0.94 : p.mlScore) * 100))}% Match` : 'Top Match'}</span>
                        </span>

                        {/* Wishlist Heart Icon */}
                        <button
                          type="button"
                          onClick={(e) => handleWishlistToggle(e, p)}
                          title={isSavedInWishlist(p._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs ${
                            isSavedInWishlist(p._id)
                              ? 'bg-red-50 text-red-500 scale-105 hover:bg-red-100'
                              : 'bg-white/90 dark:bg-stone-850/90 backdrop-blur-xs text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-stone-800 hover:scale-105'
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-4 h-4 transition-transform active:scale-125"
                            fill={isSavedInWishlist(p._id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={isSavedInWishlist(p._id) ? '0' : '2'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="mt-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] uppercase font-bold text-saffron-600 dark:text-saffron-400">
                              {p.category}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-stone-400">
                              <span className="text-amber-400">★</span>
                              <span className="font-bold text-gray-800 dark:text-stone-200">{p.rating ? p.rating.toFixed(1) : '4.9'}</span>
                            </div>
                          </div>

                          <h3 className="text-xs font-bold text-gray-900 dark:text-stone-100 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition line-clamp-1 leading-snug">
                            {p.title}
                          </h3>

                          {/* ML Reasoning Pill */}
                          <div className="mt-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[10px] text-amber-800 dark:text-amber-300 leading-tight">
                            <span className="font-bold">Reason:</span> {p.mlReason || `High affinity with ${p.category}`}
                          </div>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="pt-2 border-t border-gray-100 dark:border-stone-800 flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-gray-900 dark:text-stone-100">
                              ₹{price.toLocaleString()}
                            </span>
                            {originalPrice > price && (
                              <del className="text-xs text-gray-400 dark:text-stone-500">₹{originalPrice.toLocaleString()}</del>
                            )}
                          </div>

                          <div className="flex flex-col items-end">
                            {p.stock <= 0 && p._id.toString().length === 24 ? (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-stone-800 text-gray-400 dark:text-stone-500 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-stone-700">
                                Sold Out
                              </span>
                            ) : cartQty > 0 ? (
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="h-8 bg-saffron-500 text-white rounded-xl font-black text-xs flex items-center shadow-xs overflow-hidden border border-saffron-600"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleDecrement(e, p, cartQty)}
                                  className="w-7 h-full flex items-center justify-center hover:bg-saffron-600 active:scale-90 transition font-black text-sm cursor-pointer select-none"
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrement(e, p, cartQty)}
                                  className="px-2 h-full flex items-center justify-center font-black text-xs hover:bg-saffron-600/60 active:scale-95 transition cursor-pointer select-none min-w-[24px]"
                                >
                                  {cartQty}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrement(e, p, cartQty)}
                                  className="w-7 h-full flex items-center justify-center hover:bg-saffron-600 active:scale-90 transition font-black text-sm cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleAddClick(e, p)}
                                className="px-3.5 py-1.5 bg-saffron-50 dark:bg-stone-800 hover:bg-saffron-500 dark:hover:bg-saffron-500 text-saffron-700 dark:text-saffron-300 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider border border-saffron-300 dark:border-stone-700 hover:border-transparent transition-all duration-200 flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                              >
                                <span>ADD</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  className="w-3.5 h-3.5 stroke-[3]"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Value Props */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-saffron-50/50 dark:bg-stone-900 border border-saffron-100 dark:border-stone-800 text-center shadow-xs dark:shadow-md transition">
              <span className="text-4xl">🧘‍♂️</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mt-4">Certified Instructors</h3>
              <p className="text-sm text-gray-600 dark:text-stone-400 mt-2 leading-relaxed">
                Learn from verified yoga masters and meditation guides across authentic lineages.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-saffron-50/50 dark:bg-stone-900 border border-saffron-100 dark:border-stone-800 text-center shadow-xs dark:shadow-md transition">
              <span className="text-4xl">🌿</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mt-4">Eco-Friendly Craft</h3>
              <p className="text-sm text-gray-600 dark:text-stone-400 mt-2 leading-relaxed">
                Handmade organic cork mats, brass singing bowls, and sustainably sourced malas.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-saffron-50/50 dark:bg-stone-900 border border-saffron-100 dark:border-stone-800 text-center shadow-xs dark:shadow-md transition">
              <span className="text-4xl">📄</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mt-4">Instant PDF Invoicing</h3>
              <p className="text-sm text-gray-600 dark:text-stone-400 mt-2 leading-relaxed">
                Permanent access to downloadable tax-compliant invoices and course enrollment receipts.
              </p>
            </div>
          </div>

          {/* In-Between Trainer Promotional Banner */}
          <TrainerBanner variant="full" />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
