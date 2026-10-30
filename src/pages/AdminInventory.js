import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
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
  const { role, isLoggedIn, isLoading: isAuthLoading } = useAuth();
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
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'gallery' | 'varieties'

  const initialFormState = {
    title: '',
    category: 'Yoga Mats & Props',
    price: '',
    discountPrice: '',
    stock: 25,
    thumbnail: '',
    images: [''],
    description: '',
    isAvailable: true,
    varieties: [
      {
        sku: 'SKU-VAR-01',
        name: 'Standard Variant',
        price: '',
        mrp: '',
        stock: 25,
        image: '',
        warehouseLocation: 'WH-PRAYAG-B2'
      }
    ]
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
    setModalTab('basic');
    const prodImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.thumbnail || ''];

    const prodVarieties = Array.isArray(product.varieties) && product.varieties.length > 0
      ? product.varieties.map((v) => ({
          sku: v.sku || '',
          name: v.name || '',
          price: v.price !== undefined ? v.price : (product.price || ''),
          mrp: v.mrp !== undefined ? v.mrp : (product.price || ''),
          stock: v.stock !== undefined ? v.stock : 0,
          image: v.image || '',
          warehouseLocation: v.warehouseLocation || 'WH-PRAYAG-B2'
        }))
      : [];

    setFormData({
      title: product.title || '',
      category: product.category || 'General Wellness',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      stock: product.stock ?? 0,
      thumbnail: product.thumbnail || product.images?.[0] || '',
      images: prodImages,
      description: product.description || '',
      isAvailable: product.isAvailable ?? true,
      varieties: prodVarieties
    });
    setIsAddModalOpen(true);
  };

  // Variety Management Handlers
  const handleAddVariety = () => {
    const nextIdx = (formData.varieties || []).length + 1;
    const newSku = `SKU-${Date.now().toString().slice(-4)}-0${nextIdx}`;
    const newVariety = {
      sku: newSku,
      name: `Variant ${nextIdx}`,
      price: formData.price || '',
      mrp: formData.price || '',
      stock: 20,
      image: formData.thumbnail || '',
      warehouseLocation: 'WH-PRAYAG-B2'
    };
    const updatedVarieties = [...(formData.varieties || []), newVariety];
    const calculatedStock = updatedVarieties.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    setFormData({
      ...formData,
      varieties: updatedVarieties,
      stock: calculatedStock
    });
  };

  const handleRemoveVariety = (index) => {
    const updatedVarieties = (formData.varieties || []).filter((_, i) => i !== index);
    const calculatedStock = updatedVarieties.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    setFormData({
      ...formData,
      varieties: updatedVarieties,
      stock: calculatedStock
    });
  };

  const handleVarietyChange = (index, field, value) => {
    const updatedVarieties = (formData.varieties || []).map((v, i) => {
      if (i === index) {
        return { ...v, [field]: value };
      }
      return v;
    });
    const calculatedStock = updatedVarieties.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    setFormData({
      ...formData,
      varieties: updatedVarieties,
      stock: calculatedStock
    });
  };

  // Gallery Image Handlers
  const handleAddGalleryImage = () => {
    setFormData({
      ...formData,
      images: [...(formData.images || []), '']
    });
  };

  const handleRemoveGalleryImage = (index) => {
    const updated = (formData.images || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: updated.length > 0 ? updated : ['']
    });
  };

  const handleGalleryImageChange = (index, value) => {
    const updated = [...(formData.images || [])];
    updated[index] = value;
    setFormData({
      ...formData,
      images: updated,
      thumbnail: !formData.thumbnail && index === 0 ? value : formData.thumbnail
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
        <Navbar />
        <div className="py-32 text-center">
          <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Authenticating administrator access...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Admin Barrier: neither users nor trainers can access admin portal
  if (!isLoggedIn || (role !== 'admin' && role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-red-200 shadow-sm">
            <span className="text-5xl">🛑</span>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Access Denied: Admin Portal Only</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              This inventory control dashboard is strictly restricted to <span className="font-bold text-red-600">YogaZen Administrators</span>.
              Regular user accounts and instructor accounts do not have permission to view or modify store warehouse records.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Return to Home
              </Link>
              <Link
                to="/products"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Go to Mindful Store
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
                <Link
                  to="/admin/inventory"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-saffron-500 text-white shadow-sm transition"
                >
                  📦 Store Inventory
                </Link>
                <Link
                  to="/admin/complaints"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  🎫 Order Complaints
                </Link>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setModalTab('basic');
                  setFormData(initialFormState);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer self-start md:self-auto"
              >
                <span>✨</span>
                <span>+ Push New Product</span>
              </button>
            </div>
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-gray-900 text-xs line-clamp-1">{product.title}</p>
                                  {product.varieties && product.varieties.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-saffron-50 text-saffron-700 border border-saffron-200 whitespace-nowrap">
                                      {product.varieties.length} Variants
                                    </span>
                                  )}
                                </div>
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
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>✨</span>
                  <span>{editingProduct ? 'Edit Inventory Master Product' : 'Push New Master Product to Database'}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure product details, multi-image gallery, and inventory varieties with specific SKUs & stocks
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center gap-2 mt-4 pb-2 border-b border-gray-100 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('basic')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  modalTab === 'basic'
                    ? 'bg-saffron-500 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                📌 1. Basic Details & Pricing
              </button>
              <button
                type="button"
                onClick={() => setModalTab('gallery')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  modalTab === 'gallery'
                    ? 'bg-saffron-500 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                🖼️ 2. Gallery Images ({formData.images?.filter(Boolean).length || (formData.thumbnail ? 1 : 0)})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('varieties')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  modalTab === 'varieties'
                    ? 'bg-saffron-500 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎨 3. Varieties & Stock ({formData.varieties?.length || 0})
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="mt-5 space-y-4">
              
              {/* TAB 1: BASIC DETAILS & PRICING */}
              {modalTab === 'basic' && (
                <div className="space-y-4 animate-fade-in">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>

                  {/* Category & Master Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron-400 bg-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Total Warehouse Stock Units *
                      </label>
                      {formData.varieties && formData.varieties.length > 0 ? (
                        <div className="relative">
                          <input
                            type="number"
                            readOnly
                            value={formData.stock}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs font-black text-emerald-800 cursor-not-allowed"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-600">
                            ⚡ Sum of {formData.varieties.length} varieties
                          </span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="e.g. 50"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-400"
                        />
                      )}
                    </div>
                  </div>

                  {/* Price & Discount Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Regular MRP / Base Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="e.g. 1999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Discounted Sale Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 1499"
                        value={formData.discountPrice}
                        onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Description</label>
                    <textarea
                      rows="4"
                      placeholder="Detail mindful materials, dimensions, traditional artisan origin, and meditation benefits..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    ></textarea>
                  </div>

                  {/* Live Availability Toggle */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Catalog Store Status</span>
                      <p className="text-[11px] text-gray-500">Enable to make this product visible to public shoppers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGE GALLERY */}
              {modalTab === 'gallery' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-saffron-50/50 border border-saffron-100 text-xs text-saffron-800">
                    💡 Provide high-resolution product imagery. The primary thumbnail is displayed in the store grid, while additional images appear in the Amazon-style gallery preview.
                  </div>

                  {/* Primary Thumbnail */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Primary Thumbnail Image URL *
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="url"
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                        value={formData.thumbnail}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-400"
                      />
                      {formData.thumbnail && (
                        <img
                          src={formData.thumbnail}
                          alt="Thumbnail Preview"
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 bg-gray-50"
                        />
                      )}
                    </div>
                  </div>

                  {/* Gallery Images List */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Additional Gallery Images</span>
                      <button
                        type="button"
                        onClick={handleAddGalleryImage}
                        className="px-3 py-1 bg-saffron-50 text-saffron-700 hover:bg-saffron-100 rounded-lg text-xs font-bold border border-saffron-200 transition"
                      >
                        + Add Image URL
                      </button>
                    </div>

                    {(formData.images || []).map((imgUrl, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-gray-400 w-5">#{idx + 1}</span>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={imgUrl}
                          onChange={(e) => handleGalleryImageChange(idx, e.target.value)}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-400"
                        />
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx}`}
                            className="w-9 h-9 rounded-xl object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: VARIETIES & VARIANT STOCK */}
              {modalTab === 'varieties' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-saffron-50/60 border border-saffron-100">
                    <div>
                      <h4 className="text-xs font-bold text-saffron-900">
                        Multi-Variety Inventory Management
                      </h4>
                      <p className="text-[11px] text-saffron-700 mt-0.5">
                        Each variety tracks its individual SKU, pricing, and dedicated stock count.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariety}
                      className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>➕</span>
                      <span>Add New Variety</span>
                    </button>
                  </div>

                  {(!formData.varieties || formData.varieties.length === 0) ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <span className="text-3xl block">📦</span>
                      <p className="text-xs font-bold text-gray-700">No varieties configured for this product.</p>
                      <p className="text-[11px] text-gray-500">The product will be treated as a single standard item using master pricing and stock.</p>
                      <button
                        type="button"
                        onClick={handleAddVariety}
                        className="mt-2 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition"
                      >
                        Create First Variety
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                      {formData.varieties.map((variety, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-4 rounded-2xl border border-gray-200 bg-gray-50/40 space-y-3 relative group hover:border-saffron-300 transition"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-saffron-100 text-saffron-800 text-[10px] flex items-center justify-center font-bold">
                                {vIdx + 1}
                              </span>
                              <span>{variety.name || `Variant ${vIdx + 1}`}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariety(vIdx)}
                              className="text-xs text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-2 py-1 rounded-lg transition"
                            >
                              ✕ Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                                Variety Name *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Sage Green 6mm"
                                value={variety.name}
                                onChange={(e) => handleVarietyChange(vIdx, 'name', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-saffron-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                                Variety SKU *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. MAT-SAGE-01"
                                value={variety.sku}
                                onChange={(e) => handleVarietyChange(vIdx, 'sku', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-saffron-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                                Variety Price (₹) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                required
                                placeholder={formData.price || '1899'}
                                value={variety.price}
                                onChange={(e) => handleVarietyChange(vIdx, 'price', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-saffron-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                                Stock Units *
                              </label>
                              <input
                                type="number"
                                min="0"
                                required
                                placeholder="25"
                                value={variety.stock}
                                onChange={(e) => handleVarietyChange(vIdx, 'stock', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-saffron-400"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                                Variety Image URL (Optional)
                              </label>
                              <input
                                type="url"
                                placeholder={formData.thumbnail || 'https://...'}
                                value={variety.image}
                                onChange={(e) => handleVarietyChange(vIdx, 'image', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-saffron-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                                Warehouse Bin Location
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. WH-PRAYAG-B2"
                                value={variety.warehouseLocation}
                                onChange={(e) => handleVarietyChange(vIdx, 'warehouseLocation', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-saffron-400"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Variety Stock Summary */}
                  {formData.varieties && formData.varieties.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold">
                      <span>Total Varieties: {formData.varieties.length}</span>
                      <span>Total Calculated Warehouse Stock: {formData.stock} units</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  {modalTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'varieties' ? 'gallery' : 'basic')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      ← Previous
                    </button>
                  )}
                  {modalTab !== 'varieties' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'basic' ? 'gallery' : 'varieties')}
                      className="px-4 py-2 bg-saffron-50 hover:bg-saffron-100 text-saffron-700 text-xs font-bold rounded-xl border border-saffron-200 transition"
                    >
                      Next Step →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
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
                      ? 'Pushing to Database...'
                      : editingProduct
                      ? 'Save Master Product'
                      : 'Push Product & Varieties'}
                  </button>
                </div>
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

