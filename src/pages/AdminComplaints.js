import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  apiAdminGetComplaints,
  apiAdminGetComplaintStats,
  apiAdminUpdateComplaint
} from '../services/api';

const QUICK_RESOLUTIONS = [
  {
    label: '📦 Express Replacement Dispatched',
    text: 'We sincerely apologize for the damaged item! A brand-new replacement package has been dispatched via BlueDart Express courier with complimentary priority delivery. Tracking code will be emailed shortly.'
  },
  {
    label: '💳 Full Refund Processed',
    text: 'We have processed a full 100% refund for this order back to your original source payment method. You will receive an official bank confirmation receipt within 2-4 business days.'
  },
  {
    label: '🧘 Course Access & Video Stream Fixed',
    text: 'Your course access credentials and high-definition video streaming permissions have been fully refreshed. You can now access all classes directly from your User Profile with zero restrictions.'
  },
  {
    label: '🌿 Variety / Exchange Scheduled',
    text: 'We have registered your exchange request for the correct variety SKU. Our courier pickup associate will collect the existing unit tomorrow, and the replacement variety will be delivered simultaneously.'
  }
];

const AdminComplaints = () => {
  const { role, isLoggedIn, isLoading: isAuthLoading } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
    rejected: 0,
    productComplaints: 0,
    courseComplaints: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Review & Resolution Modal State
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState('Resolved');
  const [resolutionPriority, setResolutionPriority] = useState('Medium');
  const [resolutionResponse, setResolutionResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Fetch Complaints Data
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (orderTypeFilter !== 'All') params.orderType = orderTypeFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [complaintsRes, statsRes] = await Promise.all([
        apiAdminGetComplaints(params),
        apiAdminGetComplaintStats()
      ]);

      if (complaintsRes?.complaints) {
        setComplaints(complaintsRes.complaints);
      }
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      showToast(err.message || 'Error fetching complaints data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, orderTypeFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    if (isLoggedIn && (role === 'admin' || role === 'superadmin')) {
      fetchComplaints();
    }
  }, [isLoggedIn, role, fetchComplaints]);

  // Open Review & Resolve Modal
  const openResolveModal = (ticket) => {
    setActiveComplaint(ticket);
    setResolutionStatus(ticket.status === 'Pending' ? 'In Review' : ticket.status);
    setResolutionPriority(ticket.priority || 'Medium');
    setResolutionResponse(ticket.adminResponse || '');
    setAdminNotes(ticket.adminNotes || '');
    setIsModalOpen(true);
  };

  // Submit Resolution
  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      setIsSubmitting(true);
      const res = await apiAdminUpdateComplaint(activeComplaint._id, {
        status: resolutionStatus,
        priority: resolutionPriority,
        adminResponse: resolutionResponse,
        adminNotes: adminNotes
      });

      if (res?.success) {
        showToast(`Complaint ${activeComplaint.ticketId} updated to "${resolutionStatus}"!`);
        setIsModalOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update ticket.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

  // Admin Barrier: neither regular users nor trainers can access admin portal
  if (!isLoggedIn || (role !== 'admin' && role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-red-200 shadow-sm">
            <span className="text-5xl">🛑</span>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Access Denied: Admin Portal Only</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              This grievance and dispute resolution portal is restricted exclusively to <span className="font-bold text-red-600">YogaZen Administrators</span>.
              Practitioners and yoga instructors are forbidden from accessing admin complaint management.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Sign In as Administrator
              </Link>
              <Link
                to="/"
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Return to Store Home
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

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          
          {/* Top Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Customer Grievances & Complaints
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Resolve order disputes, process refunds/replacements, and maintain customer trust
                  </p>
                </div>
              </div>
            </div>

            {/* Switch between Admin Sections */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
              <Link
                to="/admin/inventory"
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
              >
                📦 Store Inventory
              </Link>
              <Link
                to="/admin/complaints"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-saffron-500 text-white shadow-sm transition"
              >
                🎫 Order Complaints ({stats.pending + stats.inReview})
              </Link>
            </div>
          </div>

          {/* Toast Notification */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm transition animate-fade-in ${
                feedback.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{feedback.type === 'error' ? '⚠️' : '✅'}</span>
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          )}

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Grievances</span>
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
              <span className="text-[11px] text-gray-500">Across products & courses</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600">Pending Action</span>
              <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
              <span className="text-[11px] text-amber-600 font-semibold">Requires immediate review</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-600">Under Review</span>
              <p className="text-2xl font-black text-purple-700">{stats.inReview}</p>
              <span className="text-[11px] text-purple-600 font-semibold">In active investigation</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Resolved Cases</span>
              <p className="text-2xl font-black text-emerald-700">{stats.resolved}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Customers satisfied</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Search Field */}
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Ticket ID (e.g. CMP-2026), Order #, customer name, or keywords..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
                <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Order Type Filter */}
              <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto">
                {['All', 'product', 'course'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial capitalize ${
                      orderTypeFilter === t
                        ? 'bg-white text-saffron-600 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {t === 'All' ? 'All Orders' : t === 'product' ? 'Store Products' : 'Yoga Courses'}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Pills & Priority Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 mr-1">Status:</span>
                {['All', 'Pending', 'In Review', 'Resolved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      statusFilter === status
                        ? 'bg-saffron-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-saffron-400 bg-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          {isLoading ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-600 mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-gray-500">Fetching customer grievances from database...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <span className="text-5xl block">🕊️</span>
              <h3 className="text-base font-bold text-gray-800">No Complaints Matching Filters</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No support tickets found matching current status or search terms. Everything in the sanctuary is serene!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-white rounded-3xl border border-gray-100 hover:border-saffron-200 shadow-xs p-6 transition space-y-4"
                >
                  {/* Ticket Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                        {ticket.ticketId}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ticket.orderType === 'product'
                          ? 'bg-saffron-50 text-saffron-700 border border-saffron-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {ticket.orderType === 'product' ? '📦 Physical Gear' : '🧘 Course'}
                      </span>

                      <span className="text-gray-500">
                        Order Ref: <strong className="font-mono text-gray-800">{ticket.orderNumber}</strong>
                      </span>

                      <span className="text-gray-400 hidden sm:inline">•</span>

                      <span className="text-gray-500">
                        Customer: <strong className="text-gray-800">{ticket.user?.name || 'Practitioner'}</strong> ({ticket.user?.email || 'No email'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Priority Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ticket.priority === 'Urgent'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : ticket.priority === 'High'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
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

                  {/* Grievance Body */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-saffron-700 bg-saffron-50 px-2 py-0.5 rounded border border-saffron-200">
                        {ticket.category}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">{ticket.subject}</h3>
                    </div>

                    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
                      {ticket.description}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>
                        Logged on: {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {ticket.resolvedAt && (
                        <span className="text-emerald-700 font-semibold">
                          Resolved on: {new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Official Admin Response Preview */}
                  {ticket.adminResponse && (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <span>💬</span> Official Admin Resolution Message sent to user:
                      </span>
                      <p className="text-emerald-800 leading-relaxed">{ticket.adminResponse}</p>
                    </div>
                  )}

                  {/* Internal Admin Notes */}
                  {ticket.adminNotes && (
                    <div className="p-3 rounded-xl bg-gray-100/60 border border-gray-200 text-xs space-y-1 text-gray-600">
                      <span className="font-bold text-gray-700">🔒 Internal Admin Note:</span>
                      <p>{ticket.adminNotes}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => openResolveModal(ticket)}
                      className="px-5 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <span>⚙️</span>
                      <span>Review & Update Resolution</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Review & Resolution Modal */}
      {isModalOpen && activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Review Ticket {activeComplaint.ticketId}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order <strong className="font-mono text-gray-800">{activeComplaint.orderNumber}</strong> ({activeComplaint.orderType}) • Customer: {activeComplaint.user?.name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-5">
              
              {/* Complaint Summary Reminder */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1 text-xs">
                <span className="font-bold text-gray-700 block">Customer's Stated Issue:</span>
                <p className="text-gray-600 italic">"{activeComplaint.description}"</p>
              </div>

              {/* Status & Priority Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Update Status</label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  >
                    <option value="Pending">Pending (Awaiting Action)</option>
                    <option value="In Review">In Review (Investigating)</option>
                    <option value="Resolved">Resolved (Resolution Provided)</option>
                    <option value="Rejected">Rejected (Claim Denied)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Set Priority</label>
                  <select
                    value={resolutionPriority}
                    onChange={(e) => setResolutionPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Quick Template Fillers */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Quick Resolution Responses</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RESOLUTIONS.map((tpl, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        setResolutionResponse(tpl.text);
                        setResolutionStatus('Resolved');
                      }}
                      className="px-2.5 py-1 bg-gray-50 hover:bg-saffron-50 text-[11px] font-semibold text-gray-700 hover:text-saffron-700 rounded-lg border border-gray-200 hover:border-saffron-300 transition"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Response to User */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Official Resolution Response (Visible to Customer on their Profile)
                </label>
                <textarea
                  rows="4"
                  value={resolutionResponse}
                  onChange={(e) => setResolutionResponse(e.target.value)}
                  placeholder="Explain the resolution, replacement dispatch code, or refund timeline..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-saffron-400"
                ></textarea>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Internal Notes (Visible only to YogaZen Administrators)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Courier damaged box; claimed insurance from BlueDart."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <span>Save Resolution & Dispatch Response</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
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

export default AdminComplaints;

