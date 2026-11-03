import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import { useAuth } from '../context/AuthContext';
import { apiAdminGetStats } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, role, isSuperAdmin, hasPermission, isLoggedIn, isAdmin, isLoading: isAuthLoading } = useAuth();

  const [stats, setStats] = useState(null);

  // Guard: Redirect to admin login if not authenticated
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, isAuthLoading, navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiAdminGetStats();
      if (res?.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load dashboard metrics:', err.message);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchStats();
    }
  }, [isLoggedIn, isAdmin, fetchStats]);

  // Administration Modules Grid
  const modules = [
    {
      id: 'inventory',
      title: 'Inventory & Stock Management',
      icon: '📦',
      path: '/admin/inventory',
      description: 'Add new items, manage warehouse SKUs, update real-time stock levels, and audit low-inventory alerts.',
      badge: stats?.inventory ? `${stats.inventory.totalProducts || 0} Products` : 'Catalog',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      statLabel: 'Low Stock Items',
      statValue: stats?.inventory?.lowStock || 0,
      permission: 'inventory'
    },
    {
      id: 'orders',
      title: 'Orders, Invoices & Fulfillment',
      icon: '🚚',
      path: '/admin/orders',
      description: 'Track product deliveries, course enrollments, verify automated invoices, and manage promo coupon codes.',
      badge: stats?.orders ? `${stats.orders.total || 0} Total Orders` : 'Orders',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      statLabel: 'Pending Fulfillment',
      statValue: stats?.orders?.pending || 0,
      permission: 'orders'
    },
    {
      id: 'complaints',
      title: 'Customer Complaints & Support',
      icon: '🎫',
      path: '/admin/complaints',
      description: 'Resolve user tickets, dispatch replacements, handle refund requests, and issue resolution notes.',
      badge: stats?.complaints ? `${stats.complaints.pending || 0} Pending` : 'Tickets',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      statLabel: 'Open Tickets',
      statValue: stats?.complaints?.pending || 0,
      permission: 'complaints'
    },
    {
      id: 'crm',
      title: 'Customer Relationship (CRM)',
      icon: '👥',
      path: '/admin/crm',
      description: 'Search registered practitioners, audit spending habits, view lifetime order history, and suspend/activate accounts.',
      badge: stats?.crm ? `${stats.crm.totalUsers || 0} Yogis` : 'Members',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      statLabel: 'Registered Yogis',
      statValue: stats?.crm?.totalUsers || 0,
      permission: 'crm'
    },
    {
      id: 'trainers',
      title: 'Trainers & Courses Moderation',
      icon: '🧘',
      path: '/admin/trainers',
      description: 'Approve instructor applications, manage platform commissions, moderate live classes, and publish/unpublish courses.',
      badge: stats?.trainers ? `${stats.trainers.pendingApproval || 0} Approvals Due` : 'Instructors',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      statLabel: 'Total Instructors',
      statValue: stats?.trainers?.total || 0,
      permission: 'trainers'
    },
    {
      id: 'financials',
      title: 'Financial Reports & PDF Ledger',
      icon: '📊',
      path: '/admin/financials',
      description: 'Inspect platform earnings breakdown (100% products + 20% course commission, excluding trainer payouts), filter by Indian FY, and download official PDF ledgers.',
      badge: stats?.revenue ? `₹${(stats.revenue.grossRevenue || 0).toLocaleString('en-IN')}` : 'Financials',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      statLabel: 'Platform Earning (Net)',
      statValue: stats?.revenue ? `₹${(stats.revenue.grossRevenue || 0).toLocaleString('en-IN')}` : '₹0',
      permission: 'financials'
    },
    {
      id: 'audit',
      title: 'Audit & Security Logs',
      icon: '📜',
      path: '/admin/audit-logs',
      description: 'Review tamper-proof audit trails of every login, logout, failed attempt, privilege elevation, and platform data mutation.',
      badge: 'Security Trail',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      statLabel: 'Compliance Log',
      statValue: 'Enterprise Standard',
      permission: 'audit'
    },
    {
      id: 'subadmins',
      title: 'Sub-Admin & Role Permissions',
      icon: '🛡️',
      path: '/admin/subadmins',
      description: 'Create sub-administrators, assign modular page access permissions, set generated credentials, and manage team access.',
      badge: stats?.admins ? `${stats.admins.total || 0} Admins` : 'Superadmin Exclusive',
      badgeColor: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      statLabel: 'Active Admin Accounts',
      statValue: stats?.admins?.total || 0,
      superAdminOnly: true
    }
  ];

  const visibleModules = modules.filter((m) => {
    if (m.superAdminOnly) return isSuperAdmin;
    return hasPermission(m.permission);
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-nunito text-white">
        <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-stone-400">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-nunito flex flex-col justify-between transition-colors">
      <div>
        <AdminNavbar activePage="dashboard" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Superadmin Hero Banner */}
          <div className="admin-hero-banner bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-10 shadow-md dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-black text-stone-800 dark:text-stone-200">
                  <span>{isSuperAdmin ? '👑 Superadmin Master Suite' : '🛡️ Role Administrator Terminal'}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
                  Welcome, {isSuperAdmin ? 'Super Administrator' : (currentUser?.name || 'Administrator')}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {isSuperAdmin
                    ? 'You have unrestricted oversight across all YogaZen infrastructure. Click any command module below to govern inventory, manage trainers, audit financial statements, or assign role-based access to staff.'
                    : 'Your administrative account has been provisioned with tailored modular privileges. Select an authorized module below to commence operational tasks.'}
                </p>
              </div>

              {/* Quick Profile Pill */}
              <div className="bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-saffron-500 to-amber-400 flex items-center justify-center text-xl shrink-0">
                  {isSuperAdmin ? '👑' : '🛡️'}
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                    Role: <strong className="text-saffron-600 dark:text-saffron-400 uppercase">{currentUser?.role || role}</strong>
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-mono">
                    Account: {isSuperAdmin ? 'Master Root Suite' : `@${currentUser?.username || 'admin'}`}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Operational Token Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Platform Earning', val: stats?.revenue ? `₹${(stats.revenue.grossRevenue || 0).toLocaleString('en-IN')}` : '₹0', icon: '💰' },
                { label: 'Total Orders', val: stats.orders?.total || 0, icon: '📦' },
                { label: 'Pending Orders', val: stats.orders?.pending || 0, icon: '⏳' },
                { label: 'Registered Yogis', val: stats.crm?.totalUsers || 0, icon: '🧘' },
                { label: 'Active Trainers', val: stats.trainers?.total || 0, icon: '🌿' },
                { label: 'Open Complaints', val: stats.complaints?.pending || 0, icon: '🎫' }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
                  <span className="text-xs text-stone-500 dark:text-stone-400 block truncate">{kpi.label}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-base sm:text-lg font-black text-stone-900 dark:text-white">{kpi.val}</span>
                    <span className="text-sm">{kpi.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Core Modules Grid (Clickable Cards) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>🏛️ Administration Command Cards</span>
                  <span className="text-xs font-normal text-stone-500 dark:text-stone-400">({visibleModules.length} Modules Available)</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Click any card to launch the corresponding administrative control interface.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleModules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.path)}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-saffron-500 rounded-3xl p-6 shadow-sm dark:shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6 cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 group-hover:bg-saffron-500 text-2xl flex items-center justify-center transition-colors shadow-inner">
                        {mod.icon}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${mod.badgeColor}`}>
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-stone-900 dark:text-white group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-3 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">
                        {mod.statLabel}
                      </span>
                      <span className="text-sm font-black text-stone-800 dark:text-stone-200">
                        {mod.statValue}
                      </span>
                    </div>

                    <span className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 group-hover:bg-saffron-500 text-stone-700 dark:text-stone-300 group-hover:text-white font-bold transition flex items-center gap-1">
                      <span>Launch</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminDashboard;
