import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGetProducts, apiGetCategories } from '../services/api';
import tracker from '../services/analyticsTracker';
import { useCartWishlist } from '../context/CartWishlistContext';
import { useNotification } from '../context/NotificationContext';

const PRICE_RANGES = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹1,500', min: '', max: '1500' },
  { label: '₹1,500 - ₹3,000', min: '1500', max: '3000' },
  { label: '₹3,000 - ₹5,000', min: '3000', max: '5000' },
  { label: 'Above ₹5,000', min: '5000', max: '' }
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query state
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || searchParams.get('cat') || 'All';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;
  const sortParam = searchParams.get('sort') || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const minRatingParam = searchParams.get('minRating') || '';

  // Component state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    totalProducts: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);

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

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Load available categories with product counts
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await apiGetCategories();
        if (res?.success) {
          setCategories(res.categories || []);
        }
      } catch (err) {
        console.warn('Could not load categories:', err.message);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products based on all active filters
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pageParam,
        limit: 12,
        sort: sortParam
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (categoryParam && categoryParam !== 'All') params.category = categoryParam;
      if (minPriceParam) params.minPrice = minPriceParam;
      if (maxPriceParam) params.maxPrice = maxPriceParam;
      if (inStockParam) params.inStock = 'true';
      if (minRatingParam) params.minRating = minRatingParam;

      const res = await apiGetProducts(params);
      if (res?.success) {
        setProducts(res.products || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryParam, pageParam, sortParam, minPriceParam, maxPriceParam, inStockParam, minRatingParam]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter Update Helpers
  const updateQueryParam = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'All') {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
    });
    // Reset to page 1 on filter changes unless changing page itself
    if (!('page' in newParams)) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateQueryParam({ search: searchInput.trim() });
  };

  const handleCategoryChange = (catName) => {
    updateQueryParam({ category: catName });
  };

  const handleSortChange = (e) => {
    updateQueryParam({ sort: e.target.value });
  };

  const handlePriceRangeClick = (range) => {
    updateQueryParam({ minPrice: range.min, maxPrice: range.max });
  };

  const handleInStockToggle = (e) => {
    updateQueryParam({ inStock: e.target.checked ? 'true' : '' });
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  // Star Rating Renderer
  const renderStars = (rating = 5) => {
    const stars = [];
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rounded ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <span className="text-xs inline-flex">{stars}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        {/* Amazon-style Subnav / Breadcrumb */}
        <div className="bg-white border-b border-gray-200 py-2.5 px-4 sm:px-8 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-saffron-600 transition">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-bold">Mindful Store</span>
            {categoryParam !== 'All' && (
              <>
                <span>/</span>
                <span className="text-saffron-600 font-semibold">{categoryParam}</span>
              </>
            )}
            {searchQuery && (
              <>
                <span>/</span>
                <span className="text-gray-700 italic">"{searchQuery}"</span>
              </>
            )}
          </div>

          <div className="hidden sm:block text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-900">{pagination.totalProducts}</span> wellness products
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Left Sidebar: Amazon-style Filters */}
            <aside className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">Filters</h3>
                {(searchQuery || categoryParam !== 'All' || minPriceParam || maxPriceParam || inStockParam || minRatingParam) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-saffron-600 hover:text-saffron-700 font-bold underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* In-Page Quick Search */}
              <div>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-gray-400">🔍</span>
                </form>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5">
                  Category
                </h4>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition font-medium flex items-center justify-between ${
                      categoryParam === 'All'
                        ? 'bg-saffron-50 text-saffron-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>All Products</span>
                    <span className="text-[10px] text-gray-400">{categories.reduce((a, b) => a + b.count, 0)}</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition font-medium flex items-center justify-between ${
                        categoryParam.toLowerCase() === cat.name.toLowerCase()
                          ? 'bg-saffron-50 text-saffron-700 font-bold'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5">
                  Price (₹)
                </h4>
                <div className="space-y-1.5 text-xs">
                  {PRICE_RANGES.map((r) => {
                    const isSelected = minPriceParam === r.min && maxPriceParam === r.max;
                    return (
                      <button
                        key={r.label}
                        onClick={() => handlePriceRangeClick(r)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg transition font-medium ${
                          isSelected
                            ? 'bg-saffron-50 text-saffron-700 font-bold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5">
                  Availability
                </h4>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inStockParam}
                    onChange={handleInStockToggle}
                    className="rounded text-saffron-500 focus:ring-saffron-400 h-4 w-4"
                  />
                  <span>Exclude Out of Stock</span>
                </label>
              </div>

              {/* Customer Rating Filter */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5">
                  Avg. Customer Rating
                </h4>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: '4★ & Above', value: '4' },
                    { label: '3★ & Above', value: '3' },
                    { label: 'All Ratings', value: '' }
                  ].map((rate) => {
                    const isSelected = minRatingParam === rate.value;
                    return (
                      <button
                        key={rate.label}
                        type="button"
                        onClick={() => updateQueryParam({ minRating: rate.value })}
                        className={`w-full text-left px-2 py-1.5 rounded-lg transition font-medium flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-saffron-50 text-saffron-700 font-bold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>{rate.label}</span>
                        {rate.value && <span className="text-amber-400 font-bold">★★★★</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Right: Products Listing (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Top Controls: Sorting & Stats */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {categoryParam !== 'All' ? categoryParam : 'All Wellness & Practice Essentials'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {pagination.totalProducts} results found {searchQuery && `matching "${searchQuery}"`}
                  </p>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <label htmlFor="sortSelect" className="text-xs font-bold text-gray-500 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    id="sortSelect"
                    value={sortParam}
                    onChange={handleSortChange}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-saffron-500 cursor-pointer"
                  >
                    <option value="newest">Featured & Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Avg. Customer Review</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-gray-100">
                  <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-semibold text-gray-500">Loading authentic mindful catalog...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-2xs">
                  <span className="text-5xl">🧘‍♂️</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-4">No matching products found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your search keywords, clearing your filters, or browsing all categories.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-5 px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => {
                    const price = product.discountPrice || product.price;
                    const originalPrice = product.price;
                    const discountPercent = originalPrice > price
                      ? Math.round(((originalPrice - price) / originalPrice) * 100)
                      : 0;
                    const varietiesCount = product.varieties?.length || 0;
                    const isOutOfStock = product.stock <= 0;
                    const isLowStock = product.stock > 0 && product.stock < 10;
                    const cartQty = getCartItemQuantity(product._id);

                    return (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        onClick={() => tracker.trackProductClick(product, 'catalog_grid')}
                        className="bg-white rounded-2xl border border-gray-200 hover:border-saffron-400 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                      >
                        {/* Image Container */}
                        <div className="relative h-56 bg-saffron-50/40 overflow-hidden flex items-center justify-center p-4 border-b border-gray-100">
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-5xl">🧘</span>
                          )}

                          {/* Discount Tag */}
                          {discountPercent > 0 && (
                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white shadow-xs">
                              {discountPercent}% OFF
                            </span>
                          )}

                          {/* Wishlist Heart Icon */}
                          <button
                            type="button"
                            onClick={(e) => handleWishlistToggle(e, product)}
                            title={isSavedInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs ${
                              isSavedInWishlist(product._id)
                                ? 'bg-red-50 text-red-500 scale-105 hover:bg-red-100'
                                : 'bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500 hover:bg-white hover:scale-105'
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              className="w-4 h-4 transition-transform active:scale-125"
                              fill={isSavedInWishlist(product._id) ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={isSavedInWishlist(product._id) ? '0' : '2'}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-saffron-600 mb-1">
                              <span>{product.category}</span>
                              {isOutOfStock ? (
                                <span className="text-red-600 font-extrabold">Out of Stock</span>
                              ) : isLowStock ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-xs animate-pulse">
                                  🔥 Only {product.stock} left!
                                </span>
                              ) : (
                                <span className="text-emerald-600">In Stock</span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-saffron-600 transition line-clamp-2 leading-snug">
                              {product.title}
                            </h3>

                            {/* Ratings Bar */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {renderStars(product.rating || 5)}
                              <span className="text-[11px] font-bold text-gray-700">
                                {product.rating ? product.rating.toFixed(1) : '5.0'}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                ({product.reviewsCount || 0})
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          </div>

                          {/* Pricing & Blinkit/Zepto-style CTA */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-gray-900">
                                  ₹{price.toLocaleString()}
                                </span>
                                {originalPrice > price && (
                                  <del className="text-xs text-gray-400">₹{originalPrice.toLocaleString()}</del>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-600 font-semibold block">
                                Free Delivery on orders &gt;₹999
                              </span>
                            </div>

                            {/* Blinkit / Zepto Action Button & Stepper */}
                            <div className="flex flex-col items-end">
                              {isOutOfStock ? (
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold border border-gray-200">
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
                                    onClick={(e) => handleDecrement(e, product, cartQty)}
                                    title="Decrease quantity"
                                    className="w-7 h-full flex items-center justify-center hover:bg-saffron-600 active:scale-90 transition font-black text-sm cursor-pointer select-none"
                                  >
                                    −
                                  </button>

                                  {/* Quantity Display (Clicking again also increments) */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleIncrement(e, product, cartQty)}
                                    title="Click to add more"
                                    className="px-2 h-full flex items-center justify-center font-black text-xs hover:bg-saffron-600/60 active:scale-95 transition cursor-pointer select-none min-w-[24px]"
                                  >
                                    {cartQty}
                                  </button>

                                  {/* Increment Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleIncrement(e, product, cartQty)}
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
                                  onClick={(e) => handleAddClick(e, product)}
                                  className="px-4 py-1.5 bg-saffron-50 hover:bg-saffron-500 text-saffron-700 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider border border-saffron-300 hover:border-transparent transition-all duration-200 flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
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
                              {varietiesCount > 0 && !isOutOfStock && cartQty === 0 && (
                                <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                                  {varietiesCount} options
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Numbered Pagination (Amazon Style) */}
              {!isLoading && pagination.totalPages > 1 && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <button
                    disabled={!pagination.hasPrevPage}
                    onClick={() => {
                      updateQueryParam({ page: pagination.currentPage - 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    &larr; Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => {
                          updateQueryParam({ page: pNum });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl font-bold transition flex items-center justify-center ${
                          pagination.currentPage === pNum
                            ? 'bg-saffron-500 text-white shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() => {
                      updateQueryParam({ page: pagination.currentPage + 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
