import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  apiAdminGetOrders,
  apiAdminUpdateOrderStatus,
  apiAdminGetCoupons,
  apiAdminCreateCoupon,
  apiAdminToggleCoupon,
  apiAdminDeleteCoupon
} from '../services/api';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, hasPermission, isLoading: isAuthLoading } = useAuth();
  const { showNotification, showConfirmation } = useNotification();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'coupons'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Selected Order Invoice Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 499,
    validUntil: '',
    description: ''
  });

  // Guard: Permission check
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
      } else if (!hasPermission('orders')) {
        showNotification('Access denied. Orders & Invoices permission required.', 'error');
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, hasPermission, isAuthLoading, navigate, showNotification]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const res = await apiAdminGetOrders();
      if (res?.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to load orders', 'error');
    } finally {
      setIsLoadingOrders(false);
    }
  }, [showNotification]);

  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoadingCoupons(true);
      const res = await apiAdminGetCoupons();
      if (res?.success && Array.isArray(res.coupons)) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to load promotional coupons', 'error');
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (hasPermission('orders')) {
      if (activeTab === 'orders') {
        fetchOrders();
      } else {
        fetchCoupons();
      }
    }
  }, [hasPermission, activeTab, fetchOrders, fetchCoupons]);

  // Update fulfillment status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await apiAdminUpdateOrderStatus(orderId, { status: newStatus });
      if (res?.success) {
        showNotification(`Order status updated to ${newStatus}`, 'success');
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
        fetchOrders();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update order status', 'error');
    }
  };

  // Coupon Creation
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) {
      showNotification('Coupon code is required', 'warning');
      return;
    }

    try {
      const res = await apiAdminCreateCoupon({
        ...couponFormData,
        code: couponFormData.code.trim().toUpperCase()
      });
      if (res?.success) {
        showNotification(`Coupon ${couponFormData.code} activated!`, 'success');
        setIsCouponModalOpen(false);
        fetchCoupons();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to create promo code', 'error');
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      const res = await apiAdminToggleCoupon(id);
      if (res?.success) {
        showNotification('Coupon status toggled', 'success');
        fetchCoupons();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to toggle coupon', 'error');
    }
  };

  const handleDeleteCoupon = (c) => {
    showConfirmation({
      title: 'Delete Promo Code',
      message: `Delete coupon "${c.code}"? Customers will no longer be able to claim it.`,
      confirmText: 'Delete Promo',
      cancelText: 'Keep',
      onConfirm: async () => {
        try {
          const res = await apiAdminDeleteCoupon(c._id);
          if (res?.success) {
            showNotification('Coupon deleted', 'success');
            fetchCoupons();
          }
        } catch (err) {
          showNotification(err.message || 'Failed to delete coupon', 'error');
        }
      }
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.orderType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inv = (o.invoiceId || '').toLowerCase();
      const name = (o.deliveryAddress?.fullName || o.user?.name || '').toLowerCase();
      const email = (o.user?.email || '').toLowerCase();
      return inv.includes(q) || name.includes(q) || email.includes(q);
    }
    return true;
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-nunito text-white">
        <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-stone-400">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin || !hasPermission('orders')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-nunito flex flex-col justify-between transition-colors duration-200">
      <div>
        <AdminNavbar activePage="orders" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                Logistics & Order Verification
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Orders, Invoices & Promotional Coupons
              </h1>
              <p className="text-xs text-stone-400">
                Verify automated customer e-invoices, update courier shipping progress, and configure promotional vouchers.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                  activeTab === 'orders' ? 'bg-saffron-500 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                }`}
              >
                <span>🚚 All Orders</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40">
                  {orders.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('coupons')}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                  activeTab === 'coupons' ? 'bg-saffron-500 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                }`}
              >
                <span>🎟️ Promo Codes</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40">
                  {coupons.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: ORDERS & INVOICES */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by Invoice ID, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-saffron-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 font-bold focus:outline-none focus:border-saffron-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 font-bold focus:outline-none focus:border-saffron-500"
                  >
                    <option value="all">All Order Types</option>
                    <option value="product">Equipment Orders</option>
                    <option value="course">Course Enrollments</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
                {isLoadingOrders ? (
                  <div className="p-12 text-center text-xs text-stone-400">
                    <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading orders registry...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-stone-400 text-xs">No orders found matching filter criteria.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-950/70 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="py-3.5 px-6">Invoice ID</th>
                          <th className="py-3.5 px-6">Customer</th>
                          <th className="py-3.5 px-6">Order Type & Items</th>
                          <th className="py-3.5 px-6">Amount Paid</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {filteredOrders.map((ord) => {
                          const isCourse = ord.orderType === 'course';
                          const invoiceNumber = ord.invoiceId || `INV-${String(ord._id).slice(-8).toUpperCase()}`;

                          return (
                            <tr key={ord._id} className="hover:bg-stone-800/40 transition">
                              <td className="py-4 px-6">
                                <span className="font-mono text-saffron-300 font-extrabold text-xs block">
                                  {invoiceNumber}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-bold text-white block">
                                  {ord.deliveryAddress?.fullName || ord.user?.name || 'Practitioner'}
                                </span>
                                <span className="text-stone-400 font-mono text-[11px] block truncate max-w-[160px]">
                                  {ord.user?.email || 'customer@yogazen.store'}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 inline-block mb-1">
                                  {isCourse ? '🧘 Yoga Course' : '📦 Products'}
                                </span>
                                <p className="text-stone-300 text-xs font-semibold truncate max-w-[220px]">
                                  {isCourse
                                    ? (ord.courseDetails?.title || 'Yoga Masterclass')
                                    : (ord.items && ord.items[0]?.title ? `${ord.items[0].title}${ord.items.length > 1 ? ` (+${ord.items.length - 1} more)` : ''}` : 'Equipment')}
                                </p>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-black text-emerald-400 text-sm block">
                                  ₹{ord.totalAmount}
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {ord.paymentMethod || 'Online'}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${
                                    ord.status === 'Delivered'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                      : ord.status === 'Shipped'
                                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                                      : ord.status === 'Cancelled'
                                      ? 'bg-red-950 text-red-300 border-red-800'
                                      : 'bg-amber-950 text-amber-300 border-amber-800'
                                  }`}
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(ord)}
                                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                                >
                                  <span>🧾 Invoice</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROMOTIONAL COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">Promotional Coupon Codes</h3>
                  <p className="text-xs text-stone-400">Configure promotional vouchers for courses and products checkout.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-black transition flex items-center gap-1"
                >
                  <span>+</span> Create Coupon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoadingCoupons ? (
                  <div className="col-span-full py-12 text-center text-stone-500">
                    <div className="w-8 h-8 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs">Loading coupons...</p>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-stone-500 text-xs">
                    No active discount codes found. Create one above to boost seasonal conversions.
                  </div>
                ) : (
                  coupons.map((c) => (
                    <div key={c._id} className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-black text-saffron-400 bg-stone-950 px-3 py-1 rounded-xl border border-stone-800">
                          {c.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 font-bold">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      </p>
                      <p className="text-xs text-stone-400">{c.description || 'Promotional seasonal discount code'}</p>

                      <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c._id)}
                          className="px-3 py-1 rounded-xl bg-stone-800 text-stone-300 font-bold hover:text-white"
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c)}
                          className="p-1 rounded-xl bg-red-950/60 text-red-300 hover:text-white"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminFooter />

      {/* INVOICE DRAWER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-xs">
            <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div>
                <span className="text-[10px] uppercase font-bold text-saffron-400 block">Official E-Invoice Details</span>
                <h3 className="text-base font-black text-white font-mono">{selectedOrder.invoiceId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Customer</span>
                  <strong className="text-white block">{selectedOrder.deliveryAddress?.fullName || selectedOrder.user?.name}</strong>
                  <span className="text-stone-400">{selectedOrder.user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Shipping Address</span>
                  <span className="text-stone-300 block">
                    {selectedOrder.deliveryAddress ? `${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.city}` : 'Digital Product'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-stone-400 mb-2">Itemized Breakdown</h4>
                {selectedOrder.orderType === 'course' ? (
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex justify-between">
                    <div>
                      <strong className="text-white block">{selectedOrder.courseDetails?.title || 'Yoga Course'}</strong>
                      <span className="text-stone-400 text-[11px]">{selectedOrder.courseDetails?.category || 'YogaZen Curriculum'}</span>
                    </div>
                    <span className="font-black text-emerald-400">₹{selectedOrder.totalAmount}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, i) => (
                      <div key={i} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex justify-between">
                        <div>
                          <strong className="text-white block">{item.title}</strong>
                          <span className="text-stone-400 text-[11px]">Qty: {item.quantity}</span>
                        </div>
                        <span className="font-black text-emerald-400">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 flex justify-between items-center text-sm">
                <span className="font-bold text-stone-300">Total Invoice Amount</span>
                <span className="text-lg font-black text-emerald-400">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-black text-white">Create Promotional Voucher</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI25"
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Discount Type</label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    value={couponFormData.discountValue}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={couponFormData.minOrderAmount}
                  onChange={(e) => setCouponFormData({ ...couponFormData, minOrderAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-saffron-500 text-white font-black"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
