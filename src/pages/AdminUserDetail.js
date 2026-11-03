import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiAdminGetUserById, apiAdminToggleUserStatus, apiAdminDeleteUser, apiGetRecommendations } from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, hasPermission } = useAuth();
  const { showNotification, showConfirmation } = useNotification();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('ml'); // 'ml' | 'orders' | 'complaints' | 'addresses'
  const [statusLoading, setStatusLoading] = useState(false);
  const [userRecommendations, setUserRecommendations] = useState([]);

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiAdminGetUserById(id);
      if (res?.success && res.user) {
        setUserData(res.user);
        try {
          const recRes = await apiGetRecommendations(null, id);
          if (recRes?.success && recRes.products) {
            setUserRecommendations(recRes.products);
          }
        } catch (e) {
          console.warn('Could not fetch recommendations for user:', e.message);
        }
      } else {
        showNotification('User not found', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to load user profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification]);

  useEffect(() => {
    if (isLoggedIn && isAdmin && hasPermission('crm')) {
      fetchUserDetails();
    }
  }, [isLoggedIn, isAdmin, hasPermission, fetchUserDetails]);

  const handleToggleStatus = async () => {
    if (!userData) return;
    try {
      setStatusLoading(true);
      const nextActive = userData.isActive === false ? true : false;
      const res = await apiAdminToggleUserStatus(userData._id, nextActive);
      if (res?.success) {
        setUserData((prev) => ({ ...prev, isActive: nextActive }));
        showNotification(
          `User account is now ${nextActive ? 'Active' : 'Suspended'}`,
          nextActive ? 'success' : 'info'
        );
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update account status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteUser = () => {
    if (!userData) return;
    showConfirmation({
      title: 'Delete Customer Account',
      message: `Are you sure you want to permanently delete account "${userData.name || userData.email}"? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await apiAdminDeleteUser(userData._id);
          if (res?.success) {
            showNotification('Customer account deleted', 'success');
            navigate('/admin/crm');
          }
        } catch (err) {
          showNotification(err.message || 'Failed to delete user', 'error');
        }
      }
    });
  };

  if (!isLoggedIn || !isAdmin || !hasPermission('crm')) {
    return (
      <AdminLayout activePage="crm">
        <div className="p-8 text-center text-stone-400">
          <p className="text-sm">Access denied. CRM permissions required.</p>
        </div>
      </AdminLayout>
    );
  }

  const user = userData;
  const orders = user?.orders || [];
  const complaints = user?.complaints || [];
  const activities = user?.activities || [];
  const mlInsights = user?.mlInsights || {};

  const totalSpent = orders.reduce((sum, o) => {
    if (o.status !== 'Cancelled') return sum + (Number(o.totalAmount) || 0);
    return sum;
  }, 0);

  const getEventBadge = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
      case 'add_to_cart':
        return 'bg-amber-950/80 text-amber-300 border-amber-700';
      case 'product_view':
        return 'bg-blue-950/80 text-blue-300 border-blue-700';
      case 'product_click':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700';
      case 'category_browse':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'search':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700';
      case 'add_to_wishlist':
        return 'bg-pink-950/80 text-pink-300 border-pink-700';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <AdminLayout activePage="crm">
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/admin/crm" className="text-saffron-400 hover:text-saffron-300 font-bold transition">
              ← Back to CRM / Yogis List
            </Link>
            <span className="text-stone-600">/</span>
            <span className="text-stone-300 font-medium">Customer Intelligence Profile</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUserDetails}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition"
            >
              🔄 Refresh Data
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={statusLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                user?.isActive !== false
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
              }`}
            >
              {user?.isActive !== false ? 'Suspend Account' : 'Reactivate Account'}
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              className="px-3 py-1.5 rounded-xl bg-red-950/80 text-red-300 border border-red-800 hover:bg-red-900 text-xs font-bold transition"
            >
              🗑️ Delete User
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-bold text-stone-400">Loading Customer & ML Telemetry Profile...</p>
          </div>
        ) : !user ? (
          <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-3xl">
            <p className="text-base font-bold text-stone-300">Customer profile could not be found.</p>
            <Link to="/admin/crm" className="mt-4 inline-block text-xs font-bold text-saffron-400 hover:underline">
              Return to Yogis directory
            </Link>
          </div>
        ) : (
          <>
            {/* Customer Overview Card */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-saffron-500 to-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-white">{user.name || 'Anonymous Practitioner'}</h1>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          user.isActive !== false
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-red-950/80 text-red-300 border-red-800'
                        }`}
                      >
                        {user.isActive !== false ? '● Active Yogi' : '○ Account Suspended'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                        ID: {user._id}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 flex flex-wrap items-center gap-4">
                      <span>📧 {user.email}</span>
                      <span>📞 {user.contact || 'No phone provided'}</span>
                      <span>📅 Member Since: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* High-Level Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Lifetime Spend</span>
                  <span className="text-lg font-black text-emerald-400 mt-1 block">₹{totalSpent.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Orders</span>
                  <span className="text-lg font-black text-white mt-1 block">{orders.length}</span>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Enrolled Courses</span>
                  <span className="text-lg font-black text-purple-300 mt-1 block">{user.enrolledCourses?.length || 0}</span>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Tracked ML Events</span>
                  <span className="text-lg font-black text-saffron-400 mt-1 block">{mlInsights.totalTrackedEvents || activities.length}</span>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Dwell Time</span>
                  <span className="text-lg font-black text-blue-300 mt-1 block">{mlInsights.totalDwellMinutes || 0} mins</span>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">ML Purchase Conv.</span>
                  <span className="text-lg font-black text-cyan-300 mt-1 block">{mlInsights.conversionRatePercent || 0}%</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('ml')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'ml'
                    ? 'bg-saffron-500 text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                <span>🤖 ML Model Telemetry & Insights</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
                  {activities.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-saffron-500 text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                <span>📦 Order History</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
                  {orders.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('complaints')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'complaints'
                    ? 'bg-saffron-500 text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                <span>🎫 Complaints & Tickets</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
                  {complaints.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'addresses'
                    ? 'bg-saffron-500 text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                <span>📍 Saved Addresses</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
                  {user.addresses?.length || 0}
                </span>
              </button>
            </div>

            {/* TAB CONTENT 1: ML Model Telemetry Data */}
            {activeTab === 'ml' && (
              <div className="space-y-6">
                {/* ML Behavioral Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Top Categories Browsed */}
                  <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-saffron-400 block">
                      🧘 Top Categories Browsed (ML Affinity)
                    </span>
                    {mlInsights.topCategories && mlInsights.topCategories.length > 0 ? (
                      <div className="space-y-2">
                        {mlInsights.topCategories.map((cat, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-stone-200 capitalize font-medium">{cat.category}</span>
                            <span className="font-mono text-stone-400 bg-stone-950 px-2 py-0.5 rounded-full text-[10px]">
                              {cat.count} interactions
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500">No category affinity logged yet.</p>
                    )}
                  </div>

                  {/* Search Queries History */}
                  <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
                      🔍 Search Queries Logged
                    </span>
                    {mlInsights.searchQueries && mlInsights.searchQueries.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mlInsights.searchQueries.map((q, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-[11px] font-medium"
                          >
                            "{q}"
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500">No search activity recorded.</p>
                    )}
                  </div>

                  {/* Event Breakdown */}
                  <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">
                      📊 Telemetry Event Breakdown
                    </span>
                    {mlInsights.eventCounts && Object.keys(mlInsights.eventCounts).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(mlInsights.eventCounts).map(([ev, count]) => (
                          <div key={ev} className="bg-stone-950 p-2 rounded-xl border border-stone-800/60">
                            <span className="text-[10px] text-stone-400 block truncate">{ev.replace(/_/g, ' ')}</span>
                            <span className="font-extrabold text-white text-xs">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500">No telemetry events logged.</p>
                    )}
                  </div>
                </div>

                {/* Real-Time ML Hybrid Model Recommendations Profile */}
                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">
                          ML Recommendation Profile (YogaZen Hybrid ML Recommender)
                        </h3>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Predicted product recommendations computed by YogaZen's ML recommendation model
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 text-[10px] font-mono font-bold self-start sm:self-auto">
                      Real-time Inference Active
                    </span>
                  </div>

                  {userRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {userRecommendations.map((rec) => (
                        <div
                          key={rec._id || rec.product_id}
                          className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-2xl flex flex-col justify-between space-y-2 hover:border-saffron-500/50 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-saffron-400">
                                {rec.category || rec.matchCategory}
                              </span>
                              <span className="text-[10px] font-black text-amber-300 font-mono bg-stone-900 px-1.5 py-0.5 rounded border border-stone-700">
                                {rec.mlScore ? `${Math.min(99, Math.round((rec.mlScore > 1 ? 0.94 : rec.mlScore) * 100))}%` : 'High'} Match
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">
                              {rec.title || rec.product_title}
                            </h4>
                            <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed bg-stone-900/60 p-1.5 rounded-lg border border-stone-800/60 font-mono">
                              💡 {rec.mlReason || `Predicted for user affinity in ${rec.category}`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs">
                            <span className="font-black text-white font-mono">
                              ₹{(rec.price || 999).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              ID: {String(rec._id).substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic p-3 text-center">
                      Accumulating interaction telemetry to compute personalized predictions for this practitioner.
                    </p>
                  )}
                </div>

                {/* Telemetry Event Stream Table */}
                <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden">
                  <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">Live ML Activity Stream & Interaction Logs</h3>
                      <p className="text-xs text-stone-400">Captured user behavioral events used for ML training and personalization</p>
                    </div>
                    <span className="text-xs font-mono text-saffron-400 font-bold">
                      {activities.length} Events Logged
                    </span>
                  </div>

                  {activities.length === 0 ? (
                    <div className="p-10 text-center text-stone-400">
                      <p className="text-xs">No telemetry activity recorded for this customer yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-stone-800 bg-stone-950/70 text-stone-400 uppercase font-mono text-[10px]">
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Event Type</th>
                            <th className="py-3 px-4">Product / Item</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Dwell Time</th>
                            <th className="py-3 px-4">Source Component</th>
                            <th className="py-3 px-4">Session ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60">
                          {activities.map((act) => (
                            <tr key={act._id} className="hover:bg-stone-800/40 transition">
                              <td className="py-3 px-4 font-mono text-stone-400 whitespace-nowrap">
                                {new Date(act.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getEventBadge(
                                    act.eventType
                                  )}`}
                                >
                                  {act.eventType}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                                {act.productTitle || act.searchQuery ? `"${act.searchQuery || act.productTitle}"` : '—'}
                              </td>
                              <td className="py-3 px-4 text-stone-300 capitalize">
                                {act.category || '—'}
                              </td>
                              <td className="py-3 px-4 font-mono text-stone-400">
                                {act.dwellTimeSeconds ? `${act.dwellTimeSeconds}s` : '—'}
                              </td>
                              <td className="py-3 px-4 text-stone-400">
                                <span className="bg-stone-950 px-2 py-0.5 rounded-md font-mono text-[10px]">
                                  {act.sourceComponent || 'direct'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-stone-500 text-[10px] truncate max-w-[120px]">
                                {act.sessionId || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Orders */}
            {activeTab === 'orders' && (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-stone-800">
                  <h3 className="text-sm font-black text-white">All Orders & Subscriptions</h3>
                </div>

                {orders.length === 0 ? (
                  <div className="p-10 text-center text-stone-400">
                    <p className="text-xs">No orders placed by this customer yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-800 bg-stone-950/70 text-stone-400 uppercase font-mono text-[10px]">
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Items / Course</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Payment</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60">
                        {orders.map((o) => (
                          <tr key={o._id} className="hover:bg-stone-800/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-saffron-400">
                              {o.orderNumber || o._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3 px-4 text-stone-400 whitespace-nowrap">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  o.orderType === 'course'
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {o.orderType === 'course' ? 'Yoga Course' : 'Product'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                              {o.orderType === 'course'
                                ? o.courseDetails?.title || 'Yoga Masterclass'
                                : o.items && o.items[0]?.title
                                ? `${o.items[0].title}${o.items.length > 1 ? ` (+${o.items.length - 1} more)` : ''}`
                                : 'Yoga Gear'}
                            </td>
                            <td className="py-3 px-4 font-mono font-extrabold text-emerald-400">
                              ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-stone-300">
                              {o.paymentMethod || 'Online'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  o.status === 'Delivered' || o.status === 'Active'
                                    ? 'bg-emerald-950 text-emerald-300'
                                    : o.status === 'Cancelled'
                                    ? 'bg-red-950 text-red-300'
                                    : 'bg-amber-950 text-amber-300'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Complaints */}
            {activeTab === 'complaints' && (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-stone-800">
                  <h3 className="text-sm font-black text-white">Tickets & Inquiries Logged</h3>
                </div>

                {complaints.length === 0 ? (
                  <div className="p-10 text-center text-stone-400">
                    <p className="text-xs">No complaints filed by this customer.</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {complaints.map((c) => (
                      <div key={c._id} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono font-bold text-xs text-saffron-400">
                            Ticket #{c.complaintNumber || c._id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'Resolved'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">{c.subject || 'Complaint'}</p>
                        <p className="text-xs text-stone-400">{c.description}</p>
                        {c.adminNotes && (
                          <div className="mt-2 p-2 rounded-xl bg-stone-900 text-[11px] text-stone-300">
                            <span className="text-saffron-400 font-bold">Admin Resolution: </span>
                            {c.adminNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
                <h3 className="text-sm font-black text-white mb-4">Saved Shipping Destinations</h3>
                {(!user.addresses || user.addresses.length === 0) ? (
                  <p className="text-xs text-stone-500">No registered shipping addresses found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1 text-xs">
                        {addr.isDefault && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-saffron-950 text-saffron-300 border border-saffron-800 mb-1">
                            Default Address
                          </span>
                        )}
                        <p className="font-bold text-white">{addr.street}</p>
                        {addr.landmark && <p className="text-stone-400">Near: {addr.landmark}</p>}
                        <p className="text-stone-400">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-stone-500 font-mono text-[11px]">📞 {addr.contact}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;

