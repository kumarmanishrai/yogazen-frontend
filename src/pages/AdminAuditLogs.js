import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiAdminGetAuditLogs, apiAdminExportAuditLogs } from '../services/api';

const AdminAuditLogs = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, hasPermission, isLoggedIn, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { showNotification } = useNotification();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ totalLogins: 0, totalLogouts: 0, totalFailedLogins: 0, totalSecurityViolations: 0, totalAdminActions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');

  // Selected entry for details inspection modal
  const [inspectEntry, setInspectEntry] = useState(null);

  // Authentication guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!isSuperAdmin && !hasPermission('audit')) {
        showNotification('Access denied. Audit logs permission required.', 'error');
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, isSuperAdmin, isAuthLoading, navigate, showNotification, hasPermission]);

  // Fetch Audit Logs from Backend
  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: 25,
        search: search.trim() || undefined,
        actorEmail: emailFilter.trim() || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        category: category !== 'all' ? category : undefined,
        role: role !== 'all' ? role : undefined,
        status: status !== 'all' ? status : undefined,
        severity: severity !== 'all' ? severity : undefined
      };

      if (specificDate) {
        params.date = specificDate;
      } else if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (dateFilter === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString();
      } else if (dateFilter === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.startDate = d.toISOString();
      }

      const res = await apiAdminGetAuditLogs(params);
      if (res?.success) {
        setLogs(res.logs || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err.message);
      showNotification('Failed to retrieve audit trail: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, emailFilter, actionFilter, category, role, status, severity, dateFilter, specificDate, showNotification]);

  useEffect(() => {
    if (isLoggedIn && (isSuperAdmin || hasPermission('audit'))) {
      fetchLogs(1);
    }
  }, [fetchLogs, isLoggedIn, isSuperAdmin, hasPermission]);

  // Handle Export to CSV for Audits / Compliance
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = {
        actorEmail: emailFilter.trim() || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        category: category !== 'all' ? category : undefined,
        role: role !== 'all' ? role : undefined,
        status: status !== 'all' ? status : undefined,
        severity: severity !== 'all' ? severity : undefined,
        date: specificDate || undefined
      };
      const csvText = await apiAdminExportAuditLogs(params);
      
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yogazen_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Audit logs exported successfully (CSV)', 'success');
    } catch (err) {
      showNotification('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-nunito text-white">
        <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-stone-400">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-nunito flex flex-col justify-between transition-colors">
      <div>
        <AdminNavbar activePage="audit" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Header Banner */}
          <div className="admin-hero-banner bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-[11px] font-black text-indigo-700 dark:text-indigo-300">
                <span>🛡️ Enterprise Security & SOC2 Compliant Logging</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-white">
                Audit Trail & Access Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Tamper-proof chronological record of logins, logouts, access violations, trainer approvals, inventory updates, and role modifications across all accounts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition border border-stone-300 dark:border-stone-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Download audit records as CSV for compliance audit"
              >
                <span>📥</span>
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>

              <button
                type="button"
                onClick={() => fetchLogs(pagination.page)}
                className="px-4 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Refresh audit stream"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Security KPI Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">Successful Logins</span>
                <span className="text-base">🔐</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {(stats.totalLogins || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Sessions</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">Logged Out Sessions</span>
                <span className="text-base">🚪</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {(stats.totalLogouts || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Terminated</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">Failed Logins</span>
                <span className="text-base">⚠️</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className={`text-xl font-black ${(stats.totalFailedLogins || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}`}>
                  {(stats.totalFailedLogins || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Blocked</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">Security 403</span>
                <span className="text-base">🚨</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className={`text-xl font-black ${(stats.totalSecurityViolations || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-400'}`}>
                  {(stats.totalSecurityViolations || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Denied</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">Admin Actions</span>
                <span className="text-base">⚙️</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {(stats.totalAdminActions || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Logged</span>
              </div>
            </div>
          </div>

          {/* Interactive Filters Panel */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4">
            {/* Quick Action Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold mr-1">
                Quick Activity Filter:
              </span>
              {[
                { id: 'all', label: 'All Activities' },
                { id: 'AUTH_LOGIN', label: '🟢 Logins Only' },
                { id: 'AUTH_LOGOUT', label: '🔵 Logouts Only' },
                { id: 'AUTH_LOGIN_FAILED', label: '⚠️ Failed Logins' },
                { id: 'SECURITY_403_FORBIDDEN', label: '🚨 Access Denied (403)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActionFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    actionFilter === tab.id
                      ? 'bg-saffron-500 text-white border-saffron-600 shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Actor Email Filter */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-bold">
                  Filter by Email (User / Trainer / Admin)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    placeholder="e.g. user@gmail.com, admin@yogazen.com..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:border-saffron-500"
                  />
                  {emailFilter && (
                    <button
                      type="button"
                      onClick={() => setEmailFilter('')}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Specific Date Picker */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-bold">
                  Filter by Exact Date
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => {
                      setSpecificDate(e.target.value);
                      if (e.target.value) setDateFilter('custom');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:border-saffron-500"
                  />
                  {specificDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSpecificDate('');
                        setDateFilter('all');
                      }}
                      className="px-2 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 rounded-xl text-xs font-bold"
                      title="Clear date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Actor Role Filter */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-bold">
                  Actor Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white"
                >
                  <option value="all">All Roles (User, Trainer, Admin)</option>
                  <option value="user">👤 User / Practitioner</option>
                  <option value="trainer">🧘 Trainer</option>
                  <option value="admin">🛡️ Sub-Admin</option>
                  <option value="superadmin">👑 Superadmin</option>
                  <option value="anonymous">❓ Anonymous / Unauth</option>
                </select>
              </div>

              {/* Date Preset Filter */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-bold">
                  Date Range Preset
                </label>
                <select
                  value={specificDate ? 'custom' : dateFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') setSpecificDate('');
                    setDateFilter(val);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white"
                >
                  <option value="all">All Recorded History</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  {specificDate && <option value="custom">Specific Date ({specificDate})</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* General Search Box */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Keyword / IP / Resource Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search IP, name, resource..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="auth">🔐 Auth & Sessions</option>
                  <option value="security">🚨 Security / 403</option>
                  <option value="rbac">🛡️ Roles & RBAC</option>
                  <option value="trainer">🧘 Trainers & Courses</option>
                  <option value="inventory">📦 Inventory</option>
                  <option value="order">🚚 Orders</option>
                  <option value="admin">🏛️ General Admin</option>
                </select>
              </div>

              {/* Status Outcome */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Status Outcome
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white"
                >
                  <option value="all">All Outcomes</option>
                  <option value="SUCCESS">✅ Success</option>
                  <option value="FAILURE">❌ Failed</option>
                  <option value="DENIED">🚫 Denied (403)</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white"
                >
                  <option value="all">All Severities</option>
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="critical">🚨 Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📜</span>
                <h3 className="text-sm font-black text-stone-900 dark:text-white">
                  Audit Events ({pagination.total.toLocaleString()} total)
                </h3>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                Showing Page {pagination.page} of {pagination.totalPages || 1}
              </span>
            </div>

            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-stone-400 font-mono">Querying secure audit repository...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <span className="text-4xl block">🔍</span>
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">No audit events match your active filters</p>
                <p className="text-xs text-stone-500">Try adjusting your search keywords, role selection, or date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    <tr>
                      <th className="py-3 px-4">Timestamp (UTC)</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action & Category</th>
                      <th className="py-3 px-4">Target Resource</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">IP & Client</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
                    {logs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const formattedTime = dateObj.toLocaleTimeString('en-US', { hour12: true });
                      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      const diffMins = Math.floor((new Date() - dateObj) / 60000);
                      const relativeTime = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : diffMins < 1440 ? `${Math.floor(diffMins / 60)}h ago` : `${Math.floor(diffMins / 1440)}d ago`;

                      return (
                        <tr
                          key={log._id}
                          className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition"
                        >
                          {/* Timestamp (Date & Time) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-stone-900 dark:text-white font-extrabold text-xs block">
                              {formattedDate}
                            </span>
                            <span className="font-mono text-[11px] text-stone-600 dark:text-stone-300 block">
                              {formattedTime}
                            </span>
                            <span className="text-[10px] text-stone-400 font-sans block mt-0.5">
                              {relativeTime}
                            </span>
                          </td>

                          {/* Actor (Who Logged In / Out) */}
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono ${
                                  log.actor?.role === 'superadmin'
                                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200'
                                    : log.actor?.role === 'admin'
                                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200'
                                    : log.actor?.role === 'trainer'
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200'
                                    : log.actor?.role === 'user'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200'
                                }`}
                              >
                                {log.actor?.role || 'anonymous'}
                              </span>
                              {log.actor?.name && (
                                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 truncate">
                                  {log.actor.name}
                                </span>
                              )}
                            </div>
                            <span className="block truncate font-extrabold text-stone-900 dark:text-white font-mono text-xs" title={log.actor?.email}>
                              {log.actor?.email || 'Anonymous Caller'}
                            </span>
                          </td>

                          {/* Action & Activity Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {log.action === 'AUTH_LOGIN' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Logged In
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-mono">
                                  AUTH_LOGIN
                                </span>
                              </div>
                            ) : log.action === 'AUTH_LOGOUT' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  Logged Out
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-mono">
                                  AUTH_LOGOUT
                                </span>
                              </div>
                            ) : log.action === 'AUTH_LOGIN_FAILED' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Login Failed
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-mono">
                                  {log.details?.reason || 'Invalid Credentials'}
                                </span>
                              </div>
                            ) : log.action === 'SECURITY_403_FORBIDDEN' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Access Denied (403)
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-mono">
                                  {log.action}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-stone-900 dark:text-white block">
                                  {log.action}
                                </span>
                                <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">
                                  {log.category}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Target Resource */}
                          <td className="py-3.5 px-4 max-w-[180px]">
                            {log.target?.resourceType ? (
                              <div>
                                <span className="font-bold text-stone-800 dark:text-stone-200 block truncate">
                                  {log.target.resourceName || log.target.resourceId || '—'}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono block">
                                  Type: {log.target.resourceType}
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-400 font-mono">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : log.status === 'DENIED'
                                  ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  : 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                              }`}
                            >
                              <span>{log.status === 'SUCCESS' ? '●' : '▲'}</span>
                              <span>{log.status}</span>
                            </span>
                          </td>

                          {/* IP & Client */}
                          <td className="py-3.5 px-4 max-w-[160px] whitespace-nowrap">
                            <span className="font-mono text-stone-800 dark:text-stone-200 block">
                              {log.clientContext?.ip || '127.0.0.1'}
                            </span>
                            <span
                              className="text-[10px] text-stone-400 block truncate"
                              title={log.clientContext?.userAgent}
                            >
                              {log.clientContext?.userAgent?.slice(0, 30) || 'API Client'}...
                            </span>
                          </td>

                          {/* Inspect Details Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectEntry(log)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-saffron-500 hover:text-white dark:hover:bg-saffron-500 text-stone-700 dark:text-stone-300 text-[11px] font-bold transition cursor-pointer"
                              title="Inspect full audit record payload"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 disabled:opacity-40 font-bold"
                >
                  ← Previous
                </button>
                <span className="text-stone-500 dark:text-stone-400 font-mono">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 disabled:opacity-40 font-bold"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* 🔍 MODAL: AUDIT RECORD INSPECTOR (FULL JSON & CLIENT CONTEXT)   */}
      {/* ============================================================== */}
      {inspectEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-saffron-500 text-white font-bold">
                    {inspectEntry.action}
                  </span>
                  <span className="text-xs font-mono text-stone-500">ID: {inspectEntry._id}</span>
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white mt-1">
                  Audit Entry Inspection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectEntry(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-black dark:hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-mono block">Actor Role & Email</span>
                  <p className="font-bold text-stone-900 dark:text-white">{inspectEntry.actor?.email || 'N/A'}</p>
                  <p className="text-[11px] text-stone-500 font-mono">Role: {inspectEntry.actor?.role}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-mono block">Status & Severity</span>
                  <p className="font-bold text-stone-900 dark:text-white">Outcome: {inspectEntry.status}</p>
                  <p className="text-[11px] text-stone-500 font-mono">Severity: {inspectEntry.severity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-mono block">Target Resource</span>
                  <p className="font-bold text-stone-900 dark:text-white">{inspectEntry.target?.resourceType || 'None'}</p>
                  <p className="text-[11px] text-stone-500 font-mono">{inspectEntry.target?.resourceName || inspectEntry.target?.resourceId || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-mono block">Timestamp</span>
                  <p className="font-bold text-stone-900 dark:text-white font-mono">{new Date(inspectEntry.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {/* Client Network & Routing Context */}
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
                <span className="text-[10px] text-stone-400 uppercase font-mono font-bold block">Client Routing & Request Context</span>
                <div className="grid grid-cols-2 gap-2 text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                  <div>IP Address: <span className="font-bold text-stone-900 dark:text-white">{inspectEntry.clientContext?.ip}</span></div>
                  <div>Method: <span className="font-bold text-stone-900 dark:text-white">{inspectEntry.clientContext?.method || 'GET'}</span></div>
                  <div className="col-span-2">Endpoint: <span className="font-bold text-stone-900 dark:text-white">{inspectEntry.clientContext?.endpoint}</span></div>
                  <div className="col-span-2 text-[10px] text-stone-500 break-all">User-Agent: {inspectEntry.clientContext?.userAgent}</div>
                </div>
              </div>

              {/* Details & Payload Payload */}
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-mono font-bold block mb-1">
                  Metadata & Event Diff
                </span>
                <pre className="p-4 bg-stone-950 text-emerald-400 font-mono text-[11px] rounded-2xl border border-stone-800 overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(inspectEntry.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectEntry(null)}
                className="px-5 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl text-xs transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminFooter />
    </div>
  );
};

export default AdminAuditLogs;
