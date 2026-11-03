import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link, useLocation } from 'react-router-dom';
import {
  apiGetMyOrders,
  apiGetMyComplaints,
  apiCreateComplaint,
  apiUpdateUserProfile,
  apiAddUserAddress,
  apiUpdateUserAddress,
  apiDeleteUserAddress,
  apiCancelOrder,
  apiRequestReturn,
  apiUpdateCourseProgress,
  apiAddProductReview
} from '../services/api';

const UserProfile = ({ defaultTab = 'orders' }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab');

  const { currentUser, updateCurrentUser, isLoggedIn, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const { showNotification, showConfirm } = useNotification();

  // Determine initial active tab based on pathname and query
  const getInitialTab = () => {
    if (location.pathname === '/orders' || location.pathname === '/my-orders') return 'orders';
    if (queryTab && ['orders', 'complaints', 'profile', 'addresses', 'courses'].includes(queryTab)) {
      return queryTab;
    }
    return defaultTab || 'orders';
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (location.pathname === '/orders' || location.pathname === '/my-orders') {
      setActiveTab('orders');
    } else if (queryTab && ['orders', 'complaints', 'profile', 'addresses', 'courses'].includes(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [location.pathname, queryTab]);

  // Orders & Complaints State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState('all'); // 'all' | 'ongoing' | 'completed' | 'cancelled'
  const [ordersTypeFilter, setOrdersTypeFilter] = useState('all'); // 'all' | 'product' | 'course'

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

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Found better price elsewhere');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Return Order Modal State
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Item damaged or defective');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Course Studio & Curriculum Player Modal State
  const [activeStudioOrder, setActiveStudioOrder] = useState(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Rate & Review Modal State for Ordered Products
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenReviewModal = (item, order) => {
    setReviewModalItem({
      productId: item.product?._id || item.product,
      title: item.title,
      varietyName: item.varietyName,
      varietyImage: item.varietyImage,
      orderNumber: order.orderNumber
    });
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem || !reviewComment.trim()) return;

    try {
      setIsSubmittingReview(true);
      const res = await apiAddProductReview(reviewModalItem.productId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        name: currentUser?.name || userInfo.name || 'Mindful Customer'
      });
      if (res?.success) {
        showNotification('Thank you! Your verified product review has been submitted.', 'success');
        setReviewModalItem(null);
        setReviewComment('');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Generate & Print Official PDF Invoice dynamically
  const handlePrintInvoice = (order) => {
    const win = window.open('', '_blank');
    if (!win) {
      showNotification('Please allow popups to view and print your invoice.', 'info');
      return;
    }
    const orderDateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>YogaZen Tax Invoice - ${order.invoiceId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; font-size: 13px; }
            .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 22px; font-weight: 800; color: #ea580c; }
            .meta { font-size: 11px; color: #6b7280; margin-top: 4px; }
            .grid { display: flex; justify-content: space-between; margin-top: 25px; gap: 20px; }
            .card { flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #4b5563; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .total-box { margin-top: 20px; text-align: right; }
            .total-line { font-size: 15px; font-weight: 800; color: #ea580c; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px dashed #d1d5db; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">🧘 YogaZen Official Tax Invoice</div>
              <div class="meta">Invoice No: <strong>${order.invoiceId}</strong></div>
              <div class="meta">Order Ref: <strong>${order.orderNumber}</strong></div>
              <div class="meta">Date: ${orderDateStr}</div>
              <div class="meta">Payment Status: <strong>${order.paymentStatus || 'Paid'}</strong> (${order.paymentMethod || 'Verified'})</div>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 14px;">YogaZen Wellness Pvt. Ltd.</strong><br/>
              MNNIT Campus, Prayagraj - 211004<br/>
              Uttar Pradesh, India<br/>
              GSTIN: 09AAACY7182N1Z4
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <strong style="color: #374151;">Delivered To:</strong><br/>
              ${order.shippingAddress ? `
                ${order.shippingAddress.street || ''}<br/>
                ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.pincode || ''}<br/>
                Contact: ${order.shippingAddress.contact || ''}
              ` : 'Registered Customer (Digital / Course Access)'}
            </div>
            <div class="card">
              <strong style="color: #374151;">Logistics & Courier:</strong><br/>
              Assigned Partner: ${order.courierName || 'BlueDart Express'}<br/>
              Tracking ID: ${order.trackingNumber || 'Assigned'}<br/>
              Order Type: ${order.orderType === 'product' ? 'Physical Goods' : 'Certified Course'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(i => `
                <tr>
                  <td>
                    <strong>${i.title}</strong>
                    ${i.varietyName ? `<br/><span style="font-size: 11px; color: #6b7280;">Variant: ${i.varietyName}</span>` : ''}
                  </td>
                  <td>${i.quantity}</td>
                  <td>₹${i.unitPrice?.toLocaleString()}</td>
                  <td>₹${(i.unitPrice * i.quantity)?.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${order.orderType === 'course' ? `
                <tr>
                  <td><strong>${order.courseDetails?.title || 'Yoga Course Enrollment'}</strong><br/><span style="font-size: 11px; color: #6b7280;">Trainer: ${order.courseDetails?.trainer || 'YogaZen Master'}</span></td>
                  <td>1</td>
                  <td>₹${order.totalAmount?.toLocaleString()}</td>
                  <td>₹${order.totalAmount?.toLocaleString()}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="total-box">
            ${order.discountAmount > 0 ? `<div style="color: #059669; font-size: 12px; margin-bottom: 4px;">Discount Applied (${order.couponCode || 'PROMO'}): -₹${order.discountAmount}</div>` : ''}
            <div class="total-line">Grand Total: ₹${order.totalAmount?.toLocaleString()}</div>
          </div>

          <div class="footer">
            This is an authentic computer-generated e-invoice for YogaZen orders. No physical signature required.<br/>
            Need assistance? Email care@yogazen.store | +91 98765 43210
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Helper to extract YouTube Video or Live ID from URL formats
  const extractYouTubeId = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = trimmed.match(regExp);
    return match ? match[1] : '';
  };

  // Handle Order Cancellation
  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    try {
      setIsSubmittingCancel(true);
      const res = await apiCancelOrder(cancellingOrder._id, cancelReason);
      if (res?.success) {
        showNotification(res.message || 'Order has been successfully cancelled and refunded.', 'success');
        setCancellingOrder(null);
        fetchOrders();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Handle Order Return Request
  const handleRequestReturn = async (e) => {
    e.preventDefault();
    if (!returningOrder) return;
    try {
      setIsSubmittingReturn(true);
      const res = await apiRequestReturn(returningOrder._id, returnReason);
      if (res?.success) {
        showNotification(res.message || 'Return request submitted successfully. Our team will contact you.', 'success');
        setReturningOrder(null);
        fetchOrders();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to submit return request', 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Handle Lesson Progress Toggle
  const handleToggleLessonComplete = async (lessonId) => {
    if (!activeStudioOrder) return;
    const currentCompleted = activeStudioOrder.courseProgress?.completedClasses || [];
    const lessonIdStr = String(lessonId);
    const isAlreadyCompleted = currentCompleted.map(String).includes(lessonIdStr);
    const updatedCompleted = isAlreadyCompleted
      ? currentCompleted.filter(id => String(id) !== lessonIdStr)
      : [...currentCompleted, lessonIdStr];

    const activeClasses =
      activeStudioOrder.courseDetails?.course?.classes ||
      activeStudioOrder.courseDetails?.classes ||
      activeStudioOrder.classes ||
      [];
    const totalCount = activeClasses.length > 0 ? activeClasses.length : 1;
    const percentage = Math.min(100, Math.round((updatedCompleted.length / totalCount) * 100));

    try {
      setIsUpdatingProgress(true);
      const res = await apiUpdateCourseProgress(activeStudioOrder._id, {
        completedClasses: updatedCompleted,
        progressPercentage: percentage
      });
      if (res?.success) {
        setActiveStudioOrder(prev => ({
          ...prev,
          courseProgress: {
            completedClasses: updatedCompleted,
            progressPercentage: percentage
          }
        }));
        setOrders(prev => prev.map(o => o._id === activeStudioOrder._id ? {
          ...o,
          courseProgress: {
            completedClasses: updatedCompleted,
            progressPercentage: percentage
          }
        } : o));
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update progress', 'error');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Fetch orders from backend
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const res = await apiGetMyOrders();
      if (res?.orders && Array.isArray(res.orders)) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch complaints from backend
  const fetchComplaints = useCallback(async () => {
    try {
      setIsLoadingComplaints(true);
      const res = await apiGetMyComplaints();
      if (res?.complaints && Array.isArray(res.complaints)) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);

  // Initial load and refetch when currentUser changes
  useEffect(() => {
    fetchOrders();
    fetchComplaints();
  }, [currentUser, fetchOrders, fetchComplaints]);

  // Refetch when switching to orders tab to guarantee fresh data
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

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
      showNotification('Address saved successfully!', 'success');
    } catch (err) {
      showNotification(`Failed to save address: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    const confirmed = await showConfirm({
      title: 'Remove Delivery Address',
      message: 'Are you sure you want to remove this address?',
      confirmText: 'Remove Address',
      cancelText: 'Keep Address',
      type: 'danger'
    });

    if (confirmed) {
      try {
        const res = await apiDeleteUserAddress(id);
        if (res?.addresses) {
          setAddresses(res.addresses);
          if (updateCurrentUser) updateCurrentUser({ addresses: res.addresses });
        } else {
          setAddresses((prev) => prev.filter((addr) => (addr._id || addr.id) !== id));
        }
        showNotification('Address has been successfully removed.', 'success');
      } catch (err) {
        showNotification(`Failed to delete address: ${err.message || 'Unknown error'}`, 'error');
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
      showNotification('Default delivery address updated.', 'success');
    } catch (err) {
      showNotification(`Failed to set default address: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const getStatusCategory = (status) => {
    const s = (status || '').toLowerCase();
    if (['processing', 'shipped', 'active', 'pending'].includes(s)) return 'ongoing';
    if (['delivered', 'completed'].includes(s)) return 'completed';
    if (['cancelled', 'canceled', 'refunded'].includes(s)) return 'cancelled';
    return 'other';
  };

  const ongoingCount = orders.filter((o) => getStatusCategory(o.status) === 'ongoing').length;
  const completedCount = orders.filter((o) => getStatusCategory(o.status) === 'completed').length;
  const cancelledCount = orders.filter((o) => getStatusCategory(o.status) === 'cancelled').length;

  const filteredOrders = orders.filter((order) => {
    // Filter by order lifecycle status
    if (ordersFilter !== 'all' && getStatusCategory(order.status) !== ordersFilter) {
      return false;
    }
    // Filter by product or course type
    if (ordersTypeFilter !== 'all' && order.orderType !== ordersTypeFilter) {
      return false;
    }
    return true;
  });

  if (!isAuthLoading && (!currentUser || !isLoggedIn)) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-saffron-100 shadow-sm space-y-4">
            <span className="text-5xl block">📦</span>
            <h2 className="text-2xl font-black text-gray-900">Sign In to View Orders</h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Please sign in with your mindful account to track shipments, access invoices, or manage course enrollments.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuthModal && openAuthModal('Sign in to view your orders and account history.')}
                className="px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Sign In to Account
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Return to Store
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-3xl border border-saffron-100 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <span>📦</span> Orders & Purchases
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Track ongoing deliveries, review order details, inspect cancelled & refunded gear, or download official invoices
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Status Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/90 p-1.5 rounded-2xl">
                    {[
                      { id: 'all', label: 'All Orders', count: orders.length, icon: '📦' },
                      { id: 'ongoing', label: 'Ongoing', count: ongoingCount, icon: '🚚' },
                      { id: 'completed', label: 'Completed', count: completedCount, icon: '✓' },
                      { id: 'cancelled', label: 'Cancelled', count: cancelledCount, icon: '✕' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setOrdersFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          ordersFilter === tab.id
                            ? tab.id === 'cancelled'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                              : tab.id === 'completed'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : tab.id === 'ongoing'
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                              : 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                        }`}
                      >
                        <span className="text-[11px]">{tab.icon}</span>
                        <span>{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                            ordersFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-700'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Type Filter Sub-Pills */}
                  <div className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-xl">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'product', label: 'Products' },
                      { id: 'course', label: 'Courses' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setOrdersTypeFilter(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          ordersTypeFilter === t.id
                            ? 'bg-white text-saffron-600 shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={fetchOrders}
                    disabled={isLoadingOrders}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="Refresh orders list"
                  >
                    <span className={isLoadingOrders ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {isLoadingOrders ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-600 mx-auto mb-3"></div>
                  <p className="text-xs text-gray-500 font-semibold">Loading your order history...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-saffron-100 shadow-sm space-y-4">
                  <span className="text-5xl block">
                    {ordersFilter === 'cancelled'
                      ? '✨'
                      : ordersFilter === 'ongoing'
                      ? '🚚'
                      : ordersFilter === 'completed'
                      ? '🧘'
                      : '🛍️'}
                  </span>
                  <h3 className="text-base font-bold text-gray-800">
                    {ordersFilter === 'cancelled'
                      ? 'No Cancelled Orders'
                      : ordersFilter === 'ongoing'
                      ? 'No Ongoing Deliveries'
                      : ordersFilter === 'completed'
                      ? 'No Completed Orders Yet'
                      : 'No Orders Found'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {ordersFilter === 'cancelled'
                      ? 'You do not have any cancelled or refunded orders. All your orders are either ongoing or successfully fulfilled!'
                      : ordersFilter === 'ongoing'
                      ? 'You currently have no active or in-transit orders.'
                      : ordersFilter === 'completed'
                      ? 'You have not completed any deliveries or course programs yet.'
                      : "You haven't placed any orders yet. Discover authentic mindful gear and transformative sessions!"}
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
                  {filteredOrders.map((order) => {
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
                                {order.discountAmount > 0 && (
                                  <span className="block text-[9px] text-emerald-600 font-bold">
                                    Saved ₹{order.discountAmount} ({order.couponCode})
                                  </span>
                                )}
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
                            {/* Cancelled Banner if Order was Cancelled */}
                            {order.status === 'Cancelled' && (
                              <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-start sm:items-center gap-3">
                                  <span className="w-7 h-7 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-sm shrink-0">
                                    ✕
                                  </span>
                                  <div>
                                    <span className="font-extrabold text-rose-950 text-xs">
                                      Order Cancelled & Refunded
                                    </span>
                                    <p className="text-[11px] text-rose-700 mt-0.5">
                                      {order.cancellationReason ? `Reason: "${order.cancellationReason}"` : 'Cancelled upon customer request.'}
                                      {order.cancelledAt && (
                                        <span> • Cancelled on {new Date(order.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-300 flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs">
                                  <span>✓</span>
                                  <span>Refund Processed to Source</span>
                                </span>
                              </div>
                            )}

                            {order.orderType === 'product' ? (
                              <div className="space-y-3">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-4">
                                    {item.varietyImage ? (
                                      <img
                                        src={item.varietyImage}
                                        alt={item.title}
                                        className="w-16 h-16 rounded-2xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-saffron-50/60 flex items-center justify-center text-2xl flex-shrink-0">
                                        🧘
                                      </div>
                                    )}
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
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                      <span className="text-sm font-black text-gray-900">₹{item.unitPrice * item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReviewModal(item, order)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                        title="Rate & Review this product"
                                      >
                                        <span className="text-amber-500">★</span>
                                        <span>Rate Product</span>
                                      </button>
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
                                    {order.courseDetails?.trainer && (
                                      <span>Trainer: <strong className="text-gray-700">{order.courseDetails.trainer}</strong></span>
                                    )}
                                    {order.courseDetails?.validity && (
                                      <span> • {order.courseDetails.validity}</span>
                                    )}
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

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Cancel Order Button (Available when status === 'Processing') */}
                              {order.status === 'Processing' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancellingOrder(order);
                                    setCancelReason('Found better price elsewhere');
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition shadow-xs flex items-center gap-1 cursor-pointer"
                                  title="Cancel order and restore stock"
                                >
                                  <span>✕</span>
                                  <span>Cancel Order</span>
                                </button>
                              )}

                              {/* Return Request Button (Available when status === 'Delivered') */}
                              {order.status === 'Delivered' && !order.returnStatus && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReturningOrder(order);
                                    setReturnReason('Item damaged or defective');
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200 transition shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <span>🔄</span>
                                  <span>Request Return</span>
                                </button>
                              )}

                              {order.returnStatus && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Return: {order.returnStatus}
                                </span>
                              )}

                              {/* Course Studio Button for Courses */}
                              {order.orderType === 'course' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveStudioOrder(order);
                                    setSelectedLessonIndex(0);
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-600 border border-purple-200 transition shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <span>▶</span>
                                  <span>Study Course ({order.courseProgress?.progressPercentage || 0}%)</span>
                                </button>
                              )}

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
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 transition shadow-xs flex items-center gap-1.5"
                                >
                                  <span>⚠️</span>
                                  <span>Raise Grievance</span>
                                </button>
                              )}

                              {/* Invoice PDF Print / Download */}
                              <button
                                type="button"
                                onClick={() => handlePrintInvoice(order)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-saffron-700 hover:text-white bg-saffron-50 hover:bg-saffron-600 border border-saffron-200 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title="Print or save tax invoice PDF"
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

          {/* TAB 3: Enrolled Courses & Interactive Studio */}
          {activeTab === 'courses' && (() => {
            const courseOrders = orders.filter((o) => o.orderType === 'course');
            const mergedCourses = [
              ...enrolledCourses,
              ...courseOrders.map((o) => ({
                id: o._id,
                isOrder: true,
                orderData: o,
                title: o.courseDetails?.title || 'Yoga Masterclass',
                category: o.courseDetails?.category || 'Yoga Course',
                trainer: o.courseDetails?.trainer || 'YogaZen Acharya',
                enrolledAt: new Date(o.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
                amountPaid: o.totalAmount,
                invoiceId: o.invoiceId,
                progress: o.courseProgress?.progressPercentage || 0,
                completedClasses: o.courseProgress?.completedClasses || []
              }))
            ];

            return (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm space-y-6">
                {/* Dedicated Portal Spotlight Banner */}
                <div className="bg-gradient-to-r from-saffron-600 to-amber-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Dedicated Student Portal
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black">
                      Live Yoga Studio & My Learning Portal
                    </h3>
                    <p className="text-xs text-white/90 max-w-xl leading-relaxed">
                      Watch ongoing live classes, view scheduled upcoming sessions, replay recorded classes, and track daily progress on your dedicated learning page.
                    </p>
                  </div>
                  <Link
                    to="/my-learning"
                    className="px-5 py-3 rounded-2xl bg-white text-saffron-700 hover:bg-saffron-50 text-xs font-black shadow-md transition whitespace-nowrap self-start sm:self-auto"
                  >
                    Open Live Studio Portal (→)
                  </Link>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enrolled Courses & Live Studio</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Stream your curriculum classes, track lesson progress, join live sessions, and earn certificates
                  </p>
                </div>

                {mergedCourses.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-sm">You haven't enrolled in any courses yet.</p>
                    <Link
                      to="/courses"
                      className="inline-block mt-3 px-5 py-2 bg-saffron-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-saffron-600 transition"
                    >
                      Browse Yoga Courses
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mergedCourses.map((course) => {
                      const courseProgress = course.progress || 0;
                      const isComplete = courseProgress === 100;

                      return (
                        <div
                          key={course.id}
                          className="p-5 rounded-2xl border border-gray-100 hover:border-saffron-200 bg-gray-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-50 text-saffron-700 border border-saffron-200">
                                {course.category}
                              </span>
                              {isComplete && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🏆 Certified Completed
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-gray-900">{course.title}</h4>
                            <p className="text-xs text-gray-500">
                              Instructor: <span className="font-semibold text-gray-700">{course.trainer}</span> • Enrolled on {course.enrolledAt}
                            </p>

                            {/* Progress bar */}
                            <div className="max-w-xs space-y-1">
                              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                                <span>Curriculum Progress</span>
                                <span className={isComplete ? 'text-emerald-600' : 'text-saffron-600'}>{courseProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isComplete ? 'bg-emerald-500' : 'bg-saffron-500'
                                  }`}
                                  style={{ width: `${courseProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-xs text-gray-400 block">Amount Paid</span>
                              <span className="text-sm font-extrabold text-gray-900">₹{course.amountPaid}</span>
                            </div>

                            {/* Enter Studio Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const matchingOrder = course.isOrder ? course.orderData : orders.find(o => o.invoiceId === course.invoiceId) || {
                                  _id: course.id,
                                  orderType: 'course',
                                  courseDetails: {
                                    title: course.title,
                                    trainer: course.trainer,
                                    category: course.category
                                  },
                                  courseProgress: {
                                    completedClasses: course.completedClasses || [],
                                    progressPercentage: courseProgress
                                  }
                                };
                                setActiveStudioOrder(matchingOrder);
                                setSelectedLessonIndex(0);
                              }}
                              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <span>📖 In-page Studio</span>
                            </button>

                            {/* Live Studio Dedicated Portal */}
                            <Link
                              to={`/my-learning?courseId=${course.orderData?.courseDetails?.course || course.id}`}
                              className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                              <span>▶ Open Live Studio</span>
                            </Link>

                            {/* Rate Course Button */}
                            <Link
                              to={`/courses/${course.orderData?.courseDetails?.course || course.id}#reviews`}
                              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                              <span>★</span>
                              <span>Rate & Review</span>
                            </Link>

                            {/* Download PDF Invoice Button */}
                            <button
                              onClick={() =>
                                showNotification(`Downloading PDF Invoice for ${course.invoiceId} (Amount: ₹${course.amountPaid})`, 'info')
                              }
                              className="px-4 py-2 bg-white hover:bg-saffron-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}


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

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>🛑</span>
                <span>Cancel Order</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold">Order #{cancellingOrder.orderNumber} • ₹{cancellingOrder.totalAmount}</p>
              <p className="text-[11px] text-rose-700">
                Are you sure you want to cancel this order? Reserved items will immediately be returned to live store stock.
              </p>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs font-medium"
                >
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Ordered by mistake / change of mind">Ordered by mistake / change of mind</option>
                  <option value="Delivery duration is too long">Delivery duration is too long</option>
                  <option value="Need to change shipping address">Need to change shipping address</option>
                  <option value="Incorrect variant or quantity chosen">Incorrect variant or quantity chosen</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingCancel ? 'Cancelling Order...' : 'Confirm Order Cancellation'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Keep Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>🔄</span>
                <span>Request Return / Exchange</span>
              </h3>
              <button
                type="button"
                onClick={() => setReturningOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Delivered Order #{returningOrder.orderNumber}</p>
              <p className="text-[11px] text-amber-800">
                Our 7-day mindful return policy guarantees easy courier reverse pickup from your registered address.
              </p>
            </div>

            <form onSubmit={handleRequestReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs font-medium"
                >
                  <option value="Item damaged or defective">Item damaged or defective</option>
                  <option value="Received wrong product or variant SKU">Received wrong product or variant SKU</option>
                  <option value="Product not matching website photo/description">Product not matching website photo/description</option>
                  <option value="Size / Dimensions do not fit requirement">Size / Dimensions do not fit requirement</option>
                  <option value="Quality not meeting mindful standards">Quality not meeting mindful standards</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setReturningOrder(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Studio & Curriculum Player Modal */}
      {activeStudioOrder && (() => {
        const studioClasses =
          activeStudioOrder.courseDetails?.course?.classes ||
          activeStudioOrder.courseDetails?.classes ||
          activeStudioOrder.classes ||
          [];
        const totalLessons = studioClasses.length;
        const currentLesson = studioClasses[selectedLessonIndex] || studioClasses[0] || null;
        const currentLessonId = currentLesson ? (currentLesson._id || currentLesson.id) : null;
        const completedClasses = activeStudioOrder.courseProgress?.completedClasses || [];
        const isCurrentCompleted = currentLessonId ? completedClasses.map(String).includes(String(currentLessonId)) : false;
        const ytId = currentLesson ? (currentLesson.youtubeVideoId || extractYouTubeId(currentLesson.videoUrl || currentLesson.meetingUrl || currentLesson.recordingUrl)) : '';
        const courseId = activeStudioOrder.courseDetails?.course?._id || activeStudioOrder.courseDetails?.course || activeStudioOrder._id;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto flex flex-col">
              {/* Studio Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-t-3xl">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-saffron-300">
                    Mindful Learning Studio
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {activeStudioOrder.courseDetails?.title || 'Yoga Masterclass'}
                  </h3>
                  <p className="text-xs text-stone-300">
                    Instructor: {activeStudioOrder.courseDetails?.trainer || 'Acharya'} • {totalLessons} Modules
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/my-learning?courseId=${courseId}`}
                    className="px-3.5 py-1.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>▶ Fullscreen Studio</span>
                  </Link>
                  {activeStudioOrder.courseProgress?.progressPercentage === 100 && (
                    <button
                      type="button"
                      onClick={() => setShowCertificateModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🏆</span>
                      <span>View Certificate</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStudioOrder(null)}
                    className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center text-xs transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress Ribbon */}
              <div className="px-6 py-2.5 bg-saffron-50 border-b border-saffron-100 flex items-center justify-between text-xs">
                <span className="font-bold text-saffron-800 flex items-center gap-1.5">
                  <span>🧘</span>
                  <span>
                    Course Progress: {activeStudioOrder.courseProgress?.progressPercentage || 0}% Complete (
                    {completedClasses.length} / {totalLessons} Lessons)
                  </span>
                </span>
                <div className="w-36 bg-saffron-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-saffron-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeStudioOrder.courseProgress?.progressPercentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Studio Content Grid */}
              {totalLessons === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <span className="text-5xl block">🧘</span>
                  <h4 className="text-base font-bold text-gray-900">Curriculum in preparation</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    The instructor has not added classes to this course curriculum yet. You can visit the My Learning portal to check for upcoming live broadcasts.
                  </p>
                  <Link
                    to={`/my-learning?courseId=${courseId}`}
                    className="inline-block px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Open Live Studio Portal (→)
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
                  {/* Main Player Viewport (2 cols) */}
                  <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r border-gray-100 space-y-4">
                    {/* Real Video Player Embed */}
                    <div className="aspect-video w-full rounded-2xl bg-black relative flex flex-col items-center justify-center text-white overflow-hidden shadow-inner group">
                      {ytId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                          title={currentLesson?.title || 'Yoga Lesson'}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      ) : currentLesson?.meetingUrl ? (
                        <div className="p-8 text-center space-y-3">
                          <span className="text-4xl block">📹</span>
                          <h4 className="text-sm font-bold">{currentLesson.title}</h4>
                          <p className="text-xs text-stone-300">Live Meeting Room</p>
                          <a
                            href={currentLesson.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block px-5 py-2 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition shadow-md"
                          >
                            Open Session Link (→)
                          </a>
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-3">
                          <span className="text-4xl block">🧘</span>
                          <h4 className="text-sm font-bold text-stone-100">{currentLesson?.title}</h4>
                          <p className="text-xs text-stone-400">
                            Duration: {currentLesson?.duration || '45 mins'}
                          </p>
                          <span className="text-[11px] text-saffron-300 block">
                            Guided practice content will begin at the scheduled session time.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Lesson Description & Mark Complete */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          {currentLesson?.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {currentLesson?.description || 'Mindful breath retention and aligned postures.'}
                        </p>
                      </div>

                      {currentLessonId && (
                        <button
                          type="button"
                          disabled={isUpdatingProgress}
                          onClick={() => handleToggleLessonComplete(currentLessonId)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs ${
                            isCurrentCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-saffron-500 text-white hover:bg-saffron-600'
                          }`}
                        >
                          <span>
                            {isCurrentCompleted ? '✅ Completed' : '○ Mark as Completed'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lesson Sidebar (1 col) */}
                  <div className="p-4 bg-neutral-50/60 overflow-y-auto max-h-[480px]">
                    <h5 className="text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-3 px-1">
                      Course Curriculum ({totalLessons})
                    </h5>
                    <div className="space-y-2">
                      {studioClasses.map((lesson, idx) => {
                        const lId = lesson._id || lesson.id;
                        const isDone = completedClasses.map(String).includes(String(lId));
                        const isCurrent = selectedLessonIndex === idx;

                        return (
                          <div
                            key={lId || idx}
                            onClick={() => setSelectedLessonIndex(idx)}
                            className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                              isCurrent
                                ? 'bg-white border-saffron-400 shadow-sm ring-1 ring-saffron-400'
                                : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleLessonComplete(lId);
                              }}
                              className="mt-0.5 accent-saffron-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold truncate ${isCurrent ? 'text-saffron-700' : 'text-gray-800'}`}>
                                {idx + 1}. {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                <span>⏱ {lesson.duration}</span>
                                {isDone && <span className="text-emerald-600 font-bold">• Completed</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Certificate of Completion Modal */}
      {showCertificateModal && activeStudioOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-amber-50/90 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-4 border-amber-300 relative text-center">
            <button
              type="button"
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-200/60 hover:bg-amber-200 text-stone-700 flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>

            <div className="border-2 border-amber-400/80 p-8 rounded-2xl bg-white shadow-inner">
              <span className="text-4xl">🕉️</span>
              <h2 className="text-2xl font-black font-serif text-stone-900 mt-2 tracking-wide uppercase">
                Certificate of Completion
              </h2>
              <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">
                YogaZen Mindful Academy • International Standards
              </p>

              <p className="text-xs text-stone-600 mt-6">This is to proudly certify that</p>
              <h3 className="text-2xl font-bold font-serif text-saffron-700 my-2 underline decoration-saffron-300 underline-offset-4">
                {userInfo.name || currentUser?.name || 'Mindful Practitioner'}
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                has dedicatedly fulfilled all practical asanas, breathwork modules, and foundational requirements of
              </p>
              <h4 className="text-base font-black text-stone-900 mt-2">
                {activeStudioOrder.courseDetails?.title || 'Comprehensive Yoga Masterclass'}
              </h4>

              <div className="mt-8 pt-6 border-t border-amber-200 flex items-center justify-between text-xs text-stone-600">
                <div className="text-left">
                  <span className="font-mono text-[10px] block text-stone-400">CERTIFICATE ID</span>
                  <span className="font-mono font-bold text-stone-800">YZ-{activeStudioOrder._id?.slice(-8).toUpperCase()}</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-serif italic block text-stone-800">Acharya Shanti</span>
                  <span className="text-[10px] text-stone-400">Lead Yoga Guru</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] block text-stone-400">ISSUED ON</span>
                  <span className="font-bold text-stone-800">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                🖨️ Print / Download Certificate
              </button>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-gray-100 text-stone-700 font-bold text-xs rounded-xl border border-gray-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate & Review Ordered Product Modal */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-amber-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>⭐</span>
                <span>Rate & Review Ordered Item</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product summary card */}
            <div className="my-4 p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center gap-3">
              {reviewModalItem.image && (
                <img
                  src={reviewModalItem.image}
                  alt={reviewModalItem.title}
                  className="w-12 h-12 rounded-xl object-cover bg-white border border-amber-200"
                />
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold text-gray-900 truncate">{reviewModalItem.title}</p>
                {reviewModalItem.varietyName && (
                  <p className="text-amber-800 text-[11px] font-semibold">Variety: {reviewModalItem.varietyName}</p>
                )}
                <span className="text-[10px] text-gray-400 font-mono">From Order #{reviewModalItem.orderNumber}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="text-3xl transition transform hover:scale-110 cursor-pointer"
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <span className={star <= reviewRating ? 'text-amber-400' : 'text-gray-200'}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-gray-600">
                    {reviewRating === 5 && '5.0 - Excellent'}
                    {reviewRating === 4 && '4.0 - Very Good'}
                    {reviewRating === 3 && '3.0 - Good'}
                    {reviewRating === 2 && '2.0 - Fair'}
                    {reviewRating === 1 && '1.0 - Needs Improvement'}
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Honest Mindful Feedback *
                </label>
                <textarea
                  rows="4"
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the quality, texture, sound resonance, comfort, or packaging..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs leading-relaxed"
                ></textarea>
                <p className="text-[10px] text-gray-400 mt-1">
                  Verified purchaser review will be displayed on the store product showcase.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingReview ? 'Posting Review...' : 'Submit Verified Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
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
