import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  apiAdminGetProducts,
  apiAdminAddProduct,
  apiAdminUpdateProduct,
  apiAdminUpdateStock,
  apiAdminDeleteProduct
} from '../services/api';

const CATEGORIES = [
  'Yoga Mats & Props',
  'Tibetan Singing Bowls',
  'Meditation Malas',
  'Herbal & Organic Wellness',
  'Sound Healing & Chimes',
  'Spiritual Books & Cards',
  'General Wellness'
];

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUnits: 0,
    outOfStockCount: 0,
    lowStockCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');

  // Modals & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const initialFormState = {
    title: '',
    category: 'Yoga Mats & Props',
    price: '',
    discountPrice: '',
    stock: 50,
    thumbnail: '',
    description: '',
    isAvailable: true
  };
  const [formData, setFormData] = useState(initialFormState);

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Fetch Inventory List
  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (stockFilter !== 'all') params.stockFilter = stockFilter;

      const res = await apiAdminGetProducts(params);
      if (res?.success) {
        setProducts(res.products || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load inventory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchTerm, stockFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle Form Submit (Push to Database)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price) {
      showToast('Title and valid price are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Update Product
        const res = await apiAdminUpdateProduct(editingProduct._id, formData);
        if (res?.success) {
          showToast(`"${formData.title}" updated in database!`);
          setEditingProduct(null);
          setIsAddModalOpen(false);
          setFormData(initialFormState);
          fetchInventory();
        }
      } else {
        // Create Product
        const res = await apiAdminAddProduct(formData);
        if (res?.success) {
          showToast(`"${formData.title}" pushed to inventory database!`);
          setIsAddModalOpen(false);
          setFormData(initialFormState);
          fetchInventory();
        }
      }
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Stock Adjust (+1, -1, or custom)
  const handleQuickStock = async (product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    try {
      const res = await apiAdminUpdateStock(product._id, { stock: newStock });
      if (res?.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, stock: newStock } : p))
        );
        fetchInventory();
      }
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    }
  };

  // Delete Product
  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${product.title}" from the database?`)) {
      return;
    }

    try {
      const res = await apiAdminDeleteProduct(product._id);
      if (res?.success) {
        showToast(`"${product.title}" removed from database`);
        fetchInventory();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      category: product.category || 'General Wellness',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      stock: product.stock ?? 0,
      thumbnail: product.thumbnail || product.images?.[0] || '',
      description: product.description || '',
      isAvailable: product.isAvailable ?? true
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header & Stats Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📦</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Inventory & Store Management
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Push new wellness products to MongoDB, monitor real-time stock levels, and restock
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData(initialFormState);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer self-start md:self-auto"
            >
              <span>✨</span>
              <span>+ Push New Product</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Catalog Items</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalProducts}</p>
              <span className="text-[11px] text-gray-500">Live active SKUs</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Warehouse Stock</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalUnits}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Available for order</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-600">Low Stock Alert (≤ 5)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.lowStockCount}</p>
              <span className="text-[11px] text-gray-500">Needs replenishment soon</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-red-600">Out of Stock Alert</span>
              <p className="text-2xl font-black text-red-600 mt-1">{stats.outOfStockCount}</p>
              <span className="text-[11px] text-red-500 font-semibold">Needs restock in DB</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search products by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
              >
                <option value="all">All Inventory</option>
                <option value="inStock">In Stock (&gt;5)</option>
                <option value="lowStock">Low Stock (1-5)</option>
                <option value="outOfStock">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-semibold text-gray-500">Connecting to inventory database...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-4xl">📭</span>
                <h3 className="text-base font-bold text-gray-900 mt-2">No products match your criteria</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Click "+ Push New Product" above to add your first store item to the database.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[10px] font-extrabold">
                      <th className="py-3.5 px-4">Product Info</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price / Discount</th>
                      <th className="py-3.5 px-4">Live Stock</th>
                      <th className="py-3.5 px-4">Quick Restock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const stock = product.stock ?? 0;
                      const isOutOfStock = stock <= 0;
                      const isLowStock = stock > 0 && stock <= 5;

                      return (
                        <tr key={product._id} className="hover:bg-gray-50/60 transition">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-saffron-50 border border-saffron-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {product.thumbnail || product.images?.[0] ? (
                                  <img
                                    src={product.thumbnail || product.images[0]}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">🧘</span>
                                )}
                              </div>
                              <div className="max-w-xs">
                                <p className="font-bold text-gray-900 text-xs line-clamp-1">{product.title}</p>
                                <p className="text-[10px] text-gray-400 line-clamp-1">{product.description || 'No description'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-saffron-800 bg-saffron-50 border border-saffron-100">
                              {product.category || 'General'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-bold text-gray-900">
                            <div>
                              <span>₹{product.price}</span>
                              {product.discountPrice && (
                                <span className="block text-[10px] text-emerald-600 font-semibold">
                                  Deal: ₹{product.discountPrice}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Stock Status Badge */}
                          <td className="py-3 px-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                0 Units (Out of Stock)
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                                {stock} Units (Low Stock)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                                {stock} Units (Healthy)
                              </span>
                            )}
                          </td>

                          {/* Quick Restock Stepper */}
                          <td className="py-3 px-4">
                            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden w-28">
                              <button
                                onClick={() => handleQuickStock(product, -1)}
                                className="w-8 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold transition"
                                title="Decrease stock by 1"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-bold text-gray-800">{stock}</span>
                              <button
                                onClick={() => handleQuickStock(product, 5)}
                                className="w-8 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold transition text-xs"
                                title="Add 5 units"
                              >
                                +5
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(product)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Push / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Inventory Product' : 'Push New Product to Database'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="mt-5 space-y-4">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eco Cork Yoga Mat 6mm Non-Slip"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                />
              </div>

              {/* Category & Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock Units *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                  />
                </div>
              </div>

              {/* Price & Discount Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Regular Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 1999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Discounted Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1499"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Detail mindful materials, dimensions, and meditation benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                ></textarea>
              </div>

              {/* Live Availability Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded text-saffron-600 focus:ring-saffron-500 h-4 w-4"
                />
                <label htmlFor="isAvailable" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Mark as Available in Online Store
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Pushing to DB...'
                    : editingProduct
                    ? 'Save Changes'
                    : 'Push to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border ${
              feedback.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{feedback.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminInventory;

