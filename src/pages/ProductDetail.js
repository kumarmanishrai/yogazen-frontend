import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGetProductById, apiGetSimilarProducts, apiAddProductReview } from '../services/api';
import { useCartWishlist } from '../context/CartWishlistContext';
import { useAuth } from '../context/AuthContext';
import tracker from '../services/analyticsTracker';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, toggleWishlist, wishlist } = useCartWishlist();
  const { isLoggedIn, currentUser, openAuthModal } = useAuth();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedVariety, setSelectedVariety] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null);

  // Fetch product data
  const loadProductData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGetProductById(id);
      if (res?.success && res.product) {
        const prod = res.product;
        setProduct(prod);

        // Pick initial selected variety (default to first variety if available)
        if (prod.varieties && prod.varieties.length > 0) {
          const firstInStock = prod.varieties.find((v) => v.stock > 0) || prod.varieties[0];
          setSelectedVariety(firstInStock);
          setActiveImage(firstInStock.image || prod.thumbnail || prod.images?.[0] || '');
        } else {
          setSelectedVariety(null);
          setActiveImage(prod.thumbnail || prod.images?.[0] || '');
        }
      } else {
        setError('Product not found in mindful store.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch similar products
  const loadSimilarProducts = useCallback(async () => {
    try {
      const res = await apiGetSimilarProducts(id);
      if (res?.success) {
        setSimilarProducts(res.similarProducts || []);
      }
    } catch (err) {
      console.warn('Could not load similar products:', err.message);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProductData();
    loadSimilarProducts();

    const enterTime = Date.now();
    return () => {
      if (product) {
        const dwellSeconds = (Date.now() - enterTime) / 1000;
        tracker.trackProductView(product, dwellSeconds, selectedVariety?.sku);
      }
    };
  }, [loadProductData, loadSimilarProducts, product, selectedVariety]);

  // Handle switching variety swatch
  const handleSelectVariety = (variety) => {
    setSelectedVariety(variety);
    if (variety.image) {
      setActiveImage(variety.image);
    }
    // Reset quantity if current quantity exceeds variety stock
    if (variety.stock > 0 && quantity > variety.stock) {
      setQuantity(1);
    }
    if (product) {
      tracker.trackVarietySelect(product, variety);
    }
  };

  // Pricing calculations
  const effectivePrice = selectedVariety
    ? selectedVariety.price
    : product?.discountPrice || product?.price || 0;

  const originalMRP = selectedVariety
    ? selectedVariety.mrp
    : product?.price || 0;

  const savings = Math.max(0, originalMRP - effectivePrice);
  const discountPercent = originalMRP > effectivePrice
    ? Math.round((savings / originalMRP) * 100)
    : 0;

  // Stock status
  const currentStock = selectedVariety ? selectedVariety.stock : product?.stock || 0;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock < 10;

  // Add to cart with variety details
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      openAuthModal('Please sign in to add mindful items to your cart.');
      return;
    }
    await addToCart(product._id, quantity, {
      varietySku: selectedVariety?.sku || '',
      varietyName: selectedVariety?.name || '',
      image: activeImage,
      price: effectivePrice
    });
    tracker.trackCartAction(product, selectedVariety?.sku, 'add_to_cart');
  };

  // Add to wishlist
  const handleWishlistClick = async () => {
    if (!isLoggedIn) {
      openAuthModal('Please sign in to save items to your wishlist.');
      return;
    }
    await toggleWishlist(product._id);
    tracker.trackWishlistAction(product, 'add_to_wishlist');
  };

  const isSavedInWishlist = wishlist.some(
    (item) => (item.product?._id || item.product).toString() === id
  );

  // Review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewFeedback(null);
    try {
      const res = await apiAddProductReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        name: reviewName || currentUser?.name || 'Mindful Yogi'
      });
      if (res?.success) {
        setReviewFeedback({ type: 'success', text: 'Thank you! Your review has been posted.' });
        setReviewComment('');
        loadProductData(); // refresh reviews and ratings
      }
    } catch (err) {
      setReviewFeedback({ type: 'error', text: err.message || 'Failed to submit review' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating = 5) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <span className="inline-flex text-sm">{stars}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
        <Navbar />
        <div className="py-32 text-center">
          <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Loading mindful product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
        <Navbar />
        <div className="py-32 text-center px-4">
          <span className="text-5xl">🧘‍♂️</span>
          <h2 className="text-xl font-bold text-gray-900 mt-4">{error || 'Product Not Found'}</h2>
          <p className="text-xs text-gray-500 mt-1">The requested wellness item could not be retrieved.</p>
          <Link
            to="/products"
            className="inline-block mt-5 px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            ← Back to Mindful Store
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        {/* Amazon-style Breadcrumbs */}
        <div className="bg-gray-50/80 border-b border-gray-200 py-2.5 px-4 sm:px-8 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-saffron-600 transition">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-saffron-600 transition">Mindful Store</Link>
            <span>/</span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-saffron-600 transition">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate max-w-xs">{product.title}</span>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Main Product Showcase (Amazon 3-Column Layout on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 1. Left: Product Image Gallery (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gray-50/70 rounded-3xl border border-gray-200 overflow-hidden p-6 flex items-center justify-center relative min-h-[380px] sm:min-h-[460px]">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.title}
                    className="max-h-[420px] w-auto object-contain hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-8xl">🧘</span>
                )}

                {discountPercent > 0 && (
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg text-xs font-black bg-red-600 text-white shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails Swiper / List */}
              {product.images && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto py-2">
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition p-1 bg-white cursor-pointer ${
                        activeImage === imgUrl ? 'border-saffron-500 shadow-xs' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Center: Product Info & Variety Selector (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold text-saffron-800 bg-saffron-50 border border-saffron-100 uppercase tracking-wider mb-2">
                  {product.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                  {product.title}
                </h1>
                
                {/* Rating line */}
                <div className="flex items-center gap-2 mt-2 pt-1 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-1">
                    {renderStars(product.rating || 5)}
                    <span className="text-xs font-bold text-gray-800 ml-1">
                      {product.rating ? product.rating.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <a href="#reviews" className="text-xs text-saffron-600 hover:underline font-semibold">
                    {product.reviewsCount || 0} customer ratings
                  </a>
                </div>
              </div>

              {/* Price Block */}
              <div className="space-y-1 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-baseline gap-2">
                  {discountPercent > 0 && (
                    <span className="text-2xl font-light text-red-600">
                      -{discountPercent}%
                    </span>
                  )}
                  <span className="text-3xl font-black text-gray-900">
                    ₹{effectivePrice.toLocaleString()}
                  </span>
                </div>

                {originalMRP > effectivePrice && (
                  <p className="text-xs text-gray-500">
                    Typical M.R.P.: <del className="text-gray-400 font-medium">₹{originalMRP.toLocaleString()}</del>
                    <span className="text-emerald-600 font-bold ml-2">
                      (You Save: ₹{savings.toLocaleString()})
                    </span>
                  </p>
                )}
                <p className="text-[10px] text-gray-400">Inclusive of all taxes & GST</p>
              </div>

              {/* Interactive Variety / Color / Style Selector */}
              {product.varieties && product.varieties.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-800">
                      Option / Variety:{' '}
                      <span className="text-saffron-700 font-semibold">
                        {selectedVariety?.name || 'Choose an option'}
                      </span>
                    </span>
                    {selectedVariety && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        SKU: {selectedVariety.sku}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.varieties.map((v) => {
                      const isSelected = selectedVariety?.sku === v.sku;
                      const isVarOutOfStock = v.stock <= 0;
                      const isVarLowStock = v.stock > 0 && v.stock < 10;

                      return (
                        <button
                          key={v.sku}
                          onClick={() => handleSelectVariety(v)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer flex flex-col gap-0.5 ${
                            isSelected
                              ? 'border-saffron-500 bg-saffron-50/70 text-saffron-900 shadow-2xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          } ${isVarOutOfStock ? 'opacity-60 bg-gray-50' : ''}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{v.name}</span>
                            {isSelected && <span className="text-saffron-600">✓</span>}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-normal">
                            <span>₹{v.price}</span>
                            {isVarOutOfStock ? (
                              <span className="text-red-500 font-bold">Out of stock</span>
                            ) : isVarLowStock ? (
                              <span className="text-amber-600 font-bold">Only {v.stock} left</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">{v.stock} in stock</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Description */}
              <div className="pt-2 space-y-2 border-t border-gray-100 text-xs">
                <h3 className="font-extrabold text-gray-900 uppercase tracking-wide">
                  About this mindful item
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Specifications Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block font-medium">Category</span>
                  <span className="font-bold text-gray-800">{product.category}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block font-medium">Warehouse</span>
                  <span className="font-bold text-gray-800">
                    {selectedVariety?.warehouseLocation || 'WH-PRAYAG-B2'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Right: Amazon-style Buy Box (3 Cols) */}
            <div className="lg:col-span-3 sticky top-24">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                
                {/* Price Header */}
                <div>
                  <span className="text-2xl font-black text-gray-900 block">
                    ₹{(effectivePrice * quantity).toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">
                    {effectivePrice >= 999 ? '✓ FREE Delivery' : '+ ₹99 Delivery fee'}
                  </span>
                </div>

                {/* Live Stock Indicator */}
                <div className="py-2 border-y border-gray-100">
                  {isOutOfStock ? (
                    <div className="text-red-600">
                      <p className="text-sm font-bold">Currently Unavailable</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        We don't know when this item will be back in stock.
                      </p>
                    </div>
                  ) : isLowStock ? (
                    <div className="text-amber-700">
                      <p className="text-sm font-black flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        Only {currentStock} left in stock - order soon.
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Dispatched from certified yoga depot.</p>
                    </div>
                  ) : (
                    <div className="text-emerald-700">
                      <p className="text-sm font-black">In Stock</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Ready for immediate dispatch.</p>
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                {!isOutOfStock && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 text-gray-800 focus:outline-none focus:border-saffron-500 cursor-pointer"
                    >
                      {Array.from({ length: Math.min(10, currentStock) }, (_, i) => i + 1).map((q) => (
                        <option key={q} value={q}>
                          {q} unit{q > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs ${
                      isOutOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-saffron-500 hover:bg-saffron-600 text-white cursor-pointer shadow-saffron-100'
                    }`}
                  >
                    <span>🛒</span>
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                  </button>

                  <button
                    onClick={handleWishlistClick}
                    className="w-full py-2.5 rounded-xl font-bold text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isSavedInWishlist ? '❤️' : '🤍'}</span>
                    <span>{isSavedInWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                </div>

                {/* Security Trust Badges */}
                <div className="pt-2 text-[10px] text-gray-400 space-y-1.5 border-t border-gray-100 text-center">
                  <p>🔒 Secure 256-Bit Encrypted Payment</p>
                  <p>📦 Shipped in Eco-Friendly Biodegradable Box</p>
                  <p>✨ 7-Day Hassle-Free Returns</p>
                </div>
              </div>
            </div>

          </div>

          {/* Customer Reviews & Feedback Section */}
          <section id="reviews" className="mt-16 pt-10 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Ratings Summary (4 Cols) */}
              <div className="lg:col-span-4 bg-gray-50/60 p-6 rounded-3xl border border-gray-200 space-y-4">
                <h3 className="text-base font-extrabold text-gray-900">Customer Reviews</h3>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900">
                    {product.rating ? product.rating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-xs text-gray-500">out of 5 stars</span>
                </div>

                <div>{renderStars(product.rating || 5)}</div>
                <p className="text-xs text-gray-500 font-medium">
                  Based on {product.reviewsCount || 0} customer verified ratings
                </p>

                {/* Review Form */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide mb-3">
                    Review this product
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Share your mindful practice thoughts with other yogis.
                  </p>

                  {reviewFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold mb-3 ${
                        reviewFeedback.type === 'error'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {reviewFeedback.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Overall Rating:</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setReviewRating(s)}
                            className={`text-xl cursor-pointer transition ${
                              s <= reviewRating ? 'text-amber-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-xs font-bold text-gray-600 ml-2">{reviewRating} Star{reviewRating > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Your Name (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. Ananya S."
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Write your review:</label>
                      <textarea
                        rows="3"
                        required
                        placeholder="How does this tool enhance your asana or meditation practice?"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500 bg-white"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Write a Product Review'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Reviews Feed (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Verified Customer Reviews ({product.reviews?.length || 0})
                  </h3>
                </div>

                {!product.reviews || product.reviews.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-100">
                    <span className="text-3xl">📝</span>
                    <p className="text-xs text-gray-500 font-semibold mt-2">
                      No customer reviews yet. Be the first to review this wellness product!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 space-y-4">
                    {product.reviews.map((rev, index) => (
                      <div key={index} className="pt-4 first:pt-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-saffron-100 text-saffron-700 font-bold flex items-center justify-center text-xs">
                            {rev.name ? rev.name.charAt(0).toUpperCase() : 'Y'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{rev.name}</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified Purchase</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {renderStars(rev.rating)}
                          <span className="text-[10px] text-gray-400">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed pt-1">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Similar Products Carousel / Grid */}
          {similarProducts.length > 0 && (
            <section className="mt-20 pt-10 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Similar Mindful Products in {product.category}
                  </h3>
                  <p className="text-xs text-gray-500">Curated recommendations based on your selection</p>
                </div>
                <Link
                  to={`/products?category=${encodeURIComponent(product.category)}`}
                  className="text-xs font-bold text-saffron-600 hover:text-saffron-700 hover:underline"
                >
                  See all {product.category} &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {similarProducts.map((sim) => {
                  const sPrice = sim.discountPrice || sim.price;
                  return (
                    <Link
                      key={sim._id}
                      to={`/products/${sim._id}`}
                      className="group bg-white p-3 rounded-2xl border border-gray-200 hover:border-saffron-300 transition shadow-2xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="h-32 bg-saffron-50/40 rounded-xl overflow-hidden flex items-center justify-center p-2">
                        {sim.thumbnail ? (
                          <img
                            src={sim.thumbnail}
                            alt={sim.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <span className="text-2xl">🧘</span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-saffron-600 transition">
                          {sim.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="text-amber-500">★</span>
                          <span>{sim.rating ? sim.rating.toFixed(1) : '5.0'}</span>
                        </div>
                        <p className="text-xs font-extrabold text-gray-900">
                          ₹{sPrice.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
