import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  apiGetMyOrders,
  apiGetMyComplaints,
  apiCreateComplaint,
  apiUpdateUserProfile,
  apiAddUserAddress,
  apiUpdateUserAddress,
  apiDeleteUserAddress,
} from '../services/api';

const UserProfile = () => {
  const { currentUser, updateCurrentUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'complaints' | 'profile' | 'addresses' | 'courses'

  // Orders & Complaints State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState('All'); // 'All' | 'product' | 'course'

  const [complaints, setComplaints] = useState([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  // Raise Complaint Modal State
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintOrder, setComplaintOrder] = useState(null);
  const [complaintForm, setComplaintForm] = useState({
    category: 'Damaged / Defective Product',
    subject: '',
    description: '',
    priority: 'Medium'
  });
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintFeedback, setComplaintFeedback] = useState({ type: '', message: '' });

  // Personal Info State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    contact: currentUser?.contact || '',
  });

  // Addresses State
  const [addresses, setAddresses] = useState(currentUser?.addresses || []);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    contact: '',
    isDefault: false,
  });

  // Enrolled Courses & Invoices State
  const [enrolledCourses, setEnrolledCourses] = useState(currentUser?.enrolledCourses || []);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await apiGetMyOrders();
      if (res?.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch complaints from backend
  const fetchComplaints = async () => {
    try {
      setIsLoadingComplaints(true);
      const res = await apiGetMyComplaints();
      if (res?.complaints) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchComplaints();
  }, []);

  // Sync state if currentUser changes or loads from session
  useEffect(() => {
    if (currentUser) {
      setUserInfo({
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.contact || '',
      });
      if (Array.isArray(currentUser.addresses)) {
        setAddresses(currentUser.addresses);
      }
      if (Array.isArray(currentUser.enrolledCourses)) {
        setEnrolledCourses(currentUser.enrolledCourses);
      }
    }
  }, [currentUser]);

  // Modal open for Raising Complaint
  const openComplaintModal = (order) => {
    setComplaintOrder(order);
    const defaultCat = order.orderType === 'product'
      ? 'Damaged / Defective Product'
      : 'Course Video / Stream Issue';
    setComplaintForm({
      category: defaultCat,
      subject: `Issue regarding Order ${order.orderNumber}`,
      description: '',
      priority: 'Medium'
    });
    setComplaintFeedback({ type: '', message: '' });
    setIsComplaintModalOpen(true);
  };

  // Handle complaint submission
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintOrder) return;
    try {
      setIsSubmittingComplaint(true);
      setComplaintFeedback({ type: '', message: '' });

      const res = await apiCreateComplaint({
        orderId: complaintOrder._id,
        category: complaintForm.category,
        subject: complaintForm.subject,
        description: complaintForm.description,
        priority: complaintForm.priority
      });

      if (res?.success) {
        setComplaintFeedback({
          type: 'success',
          message: `Ticket ${res.complaint?.ticketId || ''} submitted successfully! YogaZen care team will review it.`
        });
        await fetchComplaints();
        setTimeout(() => {
          setIsComplaintModalOpen(false);
          setActiveTab('complaints');
        }, 1200);
      }
    } catch (err) {
      setComplaintFeedback({
        type: 'error',
        message: err.message || 'Failed to submit complaint. Please try again.'
      });
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Handle Personal Info Update
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    try {
      setIsSavingInfo(true);
      setInfoMessage('');
      const res = await apiUpdateUserProfile({
        name: userInfo.name,
        contact: userInfo.contact,
      });
      if (res?.user) {
        if (updateCurrentUser) updateCurrentUser(res.user);
        setInfoMessage('Profile details updated successfully!');
        setIsEditingInfo(false);
        setTimeout(() => setInfoMessage(''), 3000);
      }
    } catch (err) {
      setInfoMessage(`Error: ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Open Address Modal
  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressFormData({
      street: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      contact: userInfo.contact || '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr._id || addr.id);
    setAddressFormData({
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      contact: addr.contact || '',
      isDefault: addr.isDefault || false,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setIsSavingAddress(true);
      let res;
      if (editingAddressId) {
        res = await apiUpdateUserAddress(editingAddressId, addressFormData);
      } else {
        res = await apiAddUserAddress(addressFormData);
      }
      if (res?.addresses) {
        setAddresses(res.addresses);
        if (updateCurrentUser) updateCurrentUser({ addresses: res.addresses });
      }
      setIsAddressModalOpen(false);
    } catch (err) {
      alert(`Failed to save address: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      try {
        const res = await apiDeleteUserAddress(id);
        if (res?.addresses) {
          setAddresses(res.addresses);
          if (updateCurrentUser) updateCurrentUser({ addresses: res.addresses });
        } else {
          setAddresses((prev) => prev.filter((addr) => (addr._id || addr.id) !== id));
        }
      } catch (err) {
        alert(`Failed to delete address: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await apiUpdateUserAddress(id, { isDefault: true });
      if (res?.addresses) {
        setAddresses(res.addresses);
        if (updateCurrentUser) updateCurrentUser({ addresses: res.addresses });
      } else {
        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: (addr._id || addr.id) === id,
          }))
        );
      }
    } catch (err) {
      alert(`Failed to set default address: ${err.message || 'Unknown error'}`);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 text-2xl font-black shadow-inner">
              {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{userInfo.name || 'Member'}</h1>
                <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 px-2.5 py-0.5 rounded-full border border-saffron-200 w-fit mx-auto sm:mx-0">
                  Mindful Member
                </span>
              </div>
              <p className="text-sm text-gray-500">{userInfo.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {currentUser?.createdAt ? `Member since ${new Date(currentUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Mindful Practitioner'} • {enrolledCourses.length} active courses • {addresses.length} saved addresses
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              📦 Previous Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'complaints'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              🎫 Support Tickets ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              👤 Personal Details
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              📍 Shipping Addresses ({addresses.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              🧘 My Courses & Invoices ({enrolledCourses.length})
            </button>
          </div>

          {/* TAB 0: Previous Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-saffron-100 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <span>📦</span> Previous Orders & Purchases
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Track your orders, review variety SKUs, download invoices, or raise complaints
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl w-fit">
                  {['All', 'product', 'course'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrdersFilter(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                        ordersFilter === type
                          ? 'bg-white text-saffron-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {type === 'All' ? 'All Orders' : type === 'product' ? 'Store Products' : 'Yoga Courses'}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingOrders ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-600 mx-auto mb-3"></div>
                  <p className="text-xs text-gray-500 font-semibold">Loading your order history...</p>
                </div>
              ) : orders.filter(o => ordersFilter === 'All' || o.orderType === ordersFilter).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-saffron-100 shadow-sm space-y-4">
                  <span className="text-5xl block">🛍️</span>
                  <h3 className="text-base font-bold text-gray-800">No Orders Found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    You haven't placed any {ordersFilter !== 'All' ? `${ordersFilter} ` : ''}orders yet. Discover authentic mindful gear and transformative sessions!
                  </p>
                  <Link
                    to="/products"
                    className="inline-block px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Explore Mindful Store
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(o => ordersFilter === 'All' || o.orderType === ordersFilter)
                    .map((order) => {
                      const activeComplaint = complaints.find(c => (c.order?._id || c.order) === order._id);
                      return (
                        <div
                          key={order._id}
                          className="bg-white rounded-3xl border border-saffron-100 shadow-sm overflow-hidden hover:border-saffron-200 transition"
                        >
                          {/* Order Card Header */}
                          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-3">
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Order Number</span>
                                <span className="font-extrabold text-gray-900 font-mono">{order.orderNumber}</span>
                              </div>
                              <span className="text-gray-300 hidden sm:inline">•</span>
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Date Placed</span>
                                <span className="text-gray-700 font-semibold">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <span className="text-gray-300 hidden sm:inline">•</span>
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Total Amount</span>
                                <span className="text-gray-900 font-black">₹{order.totalAmount}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Order Type Badge */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                order.orderType === 'product'
                                  ? 'bg-saffron-50 text-saffron-700 border border-saffron-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {order.orderType === 'product' ? '📦 Physical Gear' : '🧘 Course'}
                              </span>

                              {/* Status Badge */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                order.status === 'Delivered' || order.status === 'Active' || order.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.status === 'Shipped'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : order.status === 'Cancelled'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Order Body */}
                          <div className="p-6 space-y-4">
                            {order.orderType === 'product' ? (
                              <div className="space-y-3">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-4">
                                    <img
                                      src={item.varietyImage || 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400'}
                                      alt={item.title}
                                      className="w-16 h-16 rounded-2xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.title}</h4>
                                      {item.varietyName && (
                                        <p className="text-xs text-saffron-700 font-semibold mt-0.5">
                                          Variety: {item.varietyName} {item.varietySku ? `(${item.varietySku})` : ''}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Qty: {item.quantity} × ₹{item.unitPrice}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-black text-gray-900">₹{item.unitPrice * item.quantity}</span>
                                    </div>
                                  </div>
                                ))}

                                {order.shippingAddress && (
                                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="font-bold text-gray-700">Delivery Address: </span>
                                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                    {order.trackingNumber && (
                                      <span className="ml-2 font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                        Tracking: {order.trackingNumber}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 px-2 py-0.5 rounded-full border border-saffron-200">
                                    {order.courseDetails?.category || 'Yoga Course'}
                                  </span>
                                  <h4 className="text-base font-bold text-gray-900">{order.courseDetails?.title || 'Yoga Course Enrollment'}</h4>
                                  <p className="text-xs text-gray-500">
                                    Trainer: <span className="font-semibold text-gray-700">{order.courseDetails?.trainer || 'YogaZen Acharya'}</span> • {order.courseDetails?.validity || 'Lifetime Access'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-black text-gray-900">₹{order.totalAmount}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Order Action Footer */}
                          <div className="bg-gray-50/70 px-6 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="text-gray-500">
                              Invoice: <span className="font-mono font-semibold text-gray-700">{order.invoiceId}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Raise Complaint / Ticket Button */}
                              {activeComplaint ? (
                                <button
                                  onClick={() => setActiveTab('complaints')}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition flex items-center gap-1.5"
                                >
                                  <span>⚠️</span>
                                  <span>Ticket {activeComplaint.ticketId} ({activeComplaint.status})</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openComplaintModal(order)}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition shadow-sm flex items-center gap-1.5"
                                >
                                  <span>⚠️</span>
                                  <span>Raise Complaint</span>
                                </button>
                              )}

                              {/* Invoice Alert / Download */}
                              <button
                                onClick={() => alert(`Downloading official PDF Invoice for ${order.invoiceId} (Amount: ₹${order.totalAmount})`)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:text-saffron-600 bg-white hover:bg-saffron-50 border border-gray-200 transition shadow-sm flex items-center gap-1.5"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Invoice PDF</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB: Support Tickets & Complaints */}
          {activeTab === 'complaints' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-saffron-100 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <span>🎫</span> My Support Tickets & Order Grievances
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Track complaints raised for product defects, delivery delays, course streams, and admin resolutions
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 bg-saffron-50 hover:bg-saffron-100 text-saffron-700 border border-saffron-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 w-fit"
                >
                  <span>➕</span> Raise New Complaint on Order
                </button>
              </div>

              {isLoadingComplaints ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-600 mx-auto mb-3"></div>
                  <p className="text-xs text-gray-500 font-semibold">Loading your support tickets...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-saffron-100 shadow-sm space-y-4">
                  <span className="text-5xl block">🎉</span>
                  <h3 className="text-base font-bold text-gray-800">No Complaints Lodged</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    All your orders and course enrollments are in good standing! If you ever face an issue with any product or session, you can raise a ticket directly from your Previous Orders.
                  </p>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="inline-block px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    View Previous Orders
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="bg-white rounded-3xl border border-saffron-100 shadow-sm overflow-hidden p-6 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-extrabold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                            {ticket.ticketId}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            Order: <strong className="text-gray-800 font-mono">{ticket.orderNumber}</strong> ({ticket.orderType})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Priority Badge */}
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            {ticket.priority} Priority
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            ticket.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ticket.status === 'In Review'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : ticket.status === 'Rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-saffron-700 bg-saffron-50 px-2 py-0.5 rounded border border-saffron-200">
                            {ticket.category}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">{ticket.subject}</h4>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          {ticket.description}
                        </p>
                        <span className="text-[10px] text-gray-400 block">
                          Submitted on {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Admin Official Resolution Message */}
                      {ticket.adminResponse ? (
                        <div className="p-4 rounded-2xl bg-saffron-50/60 border border-saffron-200 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-saffron-900">
                            <span>🛡️</span>
                            <span>YogaZen Admin Resolution Response</span>
                            {ticket.resolvedAt && (
                              <span className="text-[10px] text-saffron-700 font-normal">
                                • {new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-saffron-800 leading-relaxed">
                            {ticket.adminResponse}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 text-[11px] text-blue-700 flex items-center gap-2">
                          <span>ℹ️</span>
                          <span>Your ticket is in queue. An admin specialist will investigate and post an update here shortly.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Personal Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-saffron-100 shadow-sm max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage your name and direct contact details</p>
                </div>
                {!isEditingInfo && (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="px-4 py-1.5 text-xs font-bold text-saffron-600 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 rounded-xl transition"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {infoMessage && (
                <div className="mb-6 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  {infoMessage}
                </div>
              )}

              {isEditingInfo ? (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={userInfo.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={userInfo.contact}
                      onChange={(e) => setUserInfo({ ...userInfo, contact: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={isSavingInfo}
                      className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {isSavingInfo ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm divide-y divide-gray-100">
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Full Name</span>
                    <span className="font-semibold text-gray-900">
                      {userInfo.name || <span className="text-gray-400 italic font-normal">Not provided yet</span>}
                    </span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Email</span>
                    <span className="font-semibold text-gray-900">
                      {userInfo.email || <span className="text-gray-400 italic font-normal">Not provided</span>}
                    </span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Contact Phone</span>
                    <span className="font-semibold text-gray-900">
                      {userInfo.contact || <span className="text-gray-400 italic font-normal">Not provided yet</span>}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Addresses Management */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delivery Addresses</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Used for delivery of wellness mats, singing bowls, and malas</p>
                </div>
                <button
                  onClick={openAddAddressModal}
                  className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <span>+</span> Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-dashed border-gray-300 text-center">
                  <span className="text-4xl">🏡</span>
                  <h3 className="text-base font-bold text-gray-800 mt-3">No Saved Addresses Yet</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    You haven't saved any delivery addresses yet. Add an address so we can ship your wellness gear directly to your doorstep.
                  </p>
                  <button
                    onClick={openAddAddressModal}
                    className="mt-4 px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    + Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((addr) => {
                    const addrId = addr._id || addr.id;
                    return (
                      <div
                        key={addrId}
                        className={`p-6 rounded-3xl border bg-white relative transition-all ${
                          addr.isDefault
                            ? 'border-saffron-400 shadow-md shadow-saffron-500/5 ring-1 ring-saffron-400'
                            : 'border-gray-200 hover:border-saffron-200'
                        }`}
                      >
                        {addr.isDefault && (
                          <span className="absolute top-5 right-5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                            Default Address
                          </span>
                        )}

                        <p className="text-sm font-bold text-gray-900">{addr.street}</p>
                        {addr.landmark && <p className="text-xs text-gray-500 mt-0.5">Landmark: {addr.landmark}</p>}
                        <p className="text-xs text-gray-600 mt-1">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-xs text-gray-600">{addr.country}</p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">📞 {addr.contact}</p>

                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                          <div className="flex gap-3">
                            <button
                              onClick={() => openEditAddressModal(addr)}
                              className="font-bold text-saffron-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addrId)}
                              className="font-bold text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addrId)}
                              className="text-gray-500 hover:text-gray-800 font-medium"
                            >
                              Make Default
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Enrolled Courses & Downloadable Invoices */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Enrolled Courses & PDF Invoices</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Access your course curriculums and download official tax receipts anytime
                </p>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">You haven't enrolled in any courses yet.</p>
                  <Link
                    to="/products?cat=yoga"
                    className="inline-block mt-3 px-5 py-2 bg-saffron-500 text-white rounded-xl text-xs font-bold"
                  >
                    Browse Yoga Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-5 rounded-2xl border border-gray-100 hover:border-saffron-200 bg-gray-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-50 text-saffron-700 border border-saffron-200">
                          {course.category}
                        </span>
                        <h4 className="text-base font-bold text-gray-900">{course.title}</h4>
                        <p className="text-xs text-gray-500">
                          Instructor: <span className="font-semibold text-gray-700">{course.trainer}</span> • Enrolled on {course.enrolledAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <span className="text-xs text-gray-400 block">Amount Paid</span>
                          <span className="text-sm font-extrabold text-gray-900">₹{course.amountPaid}</span>
                        </div>

                        {/* Download PDF Invoice Button */}
                        <button
                          onClick={() =>
                            alert(`Downloading PDF Invoice for ${course.invoiceId} (Amount: ₹${course.amountPaid}). Feature connected to invoice generator!`)
                          }
                          className="px-4 py-2 bg-white hover:bg-saffron-50 text-saffron-700 border border-saffron-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <svg className="w-4 h-4 text-saffron-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Invoice PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {/* Address Add / Edit Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Address'}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Street Address & Flat / House No.</label>
                <input
                  type="text"
                  value={addressFormData.street}
                  onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                  required
                  placeholder="e.g. 108 Shanti Niwas, 2nd Cross"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressFormData.landmark}
                  onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })}
                  placeholder="e.g. Near Shiv Temple"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    required
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={addressFormData.state}
                    onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                    required
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={addressFormData.pincode}
                    onChange={(e) => setAddressFormData({ ...addressFormData, pincode: e.target.value })}
                    required
                    placeholder="560001"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={addressFormData.country}
                    onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone for Delivery</label>
                <input
                  type="text"
                  value={addressFormData.contact}
                  onChange={(e) => setAddressFormData({ ...addressFormData, contact: e.target.value })}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressFormData.isDefault}
                  onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-saffron-600 focus:ring-saffron-400"
                />
                <span className="text-xs font-medium text-gray-700">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {isSavingAddress ? 'Saving...' : editingAddressId ? 'Save Address' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Complaint Modal */}
      {isComplaintModalOpen && complaintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Raise Support Ticket / Complaint</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order <span className="font-mono font-bold text-gray-800">{complaintOrder.orderNumber}</span> ({complaintOrder.orderType})
                </p>
              </div>
              <button
                onClick={() => setIsComplaintModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {complaintFeedback.message && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                complaintFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {complaintFeedback.message}
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-xs font-medium"
                >
                  {complaintOrder.orderType === 'product' ? (
                    <>
                      <option value="Damaged / Defective Product">Damaged / Defective Product</option>
                      <option value="Delivery Delay / Not Received">Delivery Delay / Not Received</option>
                      <option value="Wrong Item / Variety Received">Wrong Item / Variety Received</option>
                      <option value="Return / Refund Request">Return / Refund Request</option>
                      <option value="Billing / Invoice Discrepancy">Billing / Invoice Discrepancy</option>
                      <option value="Other">Other Store Inquiry</option>
                    </>
                  ) : (
                    <>
                      <option value="Course Video / Stream Issue">Course Video / Stream Issue</option>
                      <option value="Instructor Session Inquiry">Instructor Session Inquiry</option>
                      <option value="Billing / Invoice Discrepancy">Billing / Invoice Discrepancy</option>
                      <option value="Other">Other Course Issue</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setComplaintForm({ ...complaintForm, priority: p })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
                        complaintForm.priority === p
                          ? 'bg-saffron-500 text-white border-saffron-500 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                  required
                  placeholder="Brief summary of the grievance..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Description</label>
                <textarea
                  rows="4"
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  required
                  placeholder="Please provide details about what went wrong (e.g. package arrived damaged, variety color was incorrect, video doesn't play)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-xs leading-relaxed"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingComplaint}
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmittingComplaint ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <span>Submit Complaint to Admin</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserProfile;
