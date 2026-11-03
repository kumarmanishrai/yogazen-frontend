import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminFooter from './AdminFooter';

const AdminLayout = ({ children, activePage }) => {
  const { currentUser, isSuperAdmin, hasPermission, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('yogazen_admin_sidebar_collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isSidebarCollapsed) {
        document.body.classList.add('admin-sidebar-collapsed');
      } else {
        document.body.classList.remove('admin-sidebar-collapsed');
      }
      try {
        localStorage.setItem('yogazen_admin_sidebar_collapsed', String(isSidebarCollapsed));
      } catch (e) {}
    }
  }, [isSidebarCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleHamburgerToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarCollapsed((prev) => !prev);
    } else {
      setIsMobileSidebarOpen((prev) => !prev);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Command Hub', icon: '👑', path: '/admin', permission: null },
    { id: 'inventory', label: 'Inventory', icon: '📦', path: '/admin/inventory', permission: 'inventory' },
    { id: 'orders', label: 'Orders & Invoices', icon: '🚚', path: '/admin/orders', permission: 'orders' },
    { id: 'complaints', label: 'Customer Complaints', icon: '🎫', path: '/admin/complaints', permission: 'complaints' },
    { id: 'crm', label: 'CRM & Yogis', icon: '👥', path: '/admin/crm', permission: 'crm' },
    { id: 'trainers', label: 'Trainers & Courses', icon: '🧘', path: '/admin/trainers', permission: 'trainers' },
    { id: 'financials', label: 'Financials & Reports', icon: '📊', path: '/admin/financials', permission: 'financials' },
    { id: 'audit', label: 'Audit & Security Logs', icon: '📜', path: '/admin/audit-logs', permission: 'audit' },
    { id: 'subadmins', label: 'Admin Roles & RBAC', icon: '🛡️', path: '/admin/subadmins', superAdminOnly: true }
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const getPageTitle = () => {
    const matched = navItems.find((i) => i.id === activePage || location.pathname === i.path);
    if (matched) return matched.label;
    if (location.pathname.includes('/admin/crm/user/')) return 'Customer Intelligence';
    return 'Portal Suite';
  };

  return (
    <div className={`min-h-screen flex overflow-x-hidden ${isDark ? 'bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'} transition-colors duration-200`}>
      {/* ============================================================== */}
      {/* 🧭 LEFT SIDEBAR (Desktop Collapsible, Mobile Slide-over)        */}
      {/* ============================================================== */}
      
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`admin-left-sidebar fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          isDark
            ? 'bg-stone-900 border-r border-stone-800 text-white'
            : 'bg-white border-r border-stone-200 text-stone-900 shadow-sm'
        } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-stone-200 dark:border-stone-800 flex items-center ${isSidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between'}`}>
          <Link
            to="/admin"
            className={`flex items-center gap-2.5 group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="YogaZen Portal"
          >
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-saffron-500 to-amber-400 flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition shrink-0">
              🧘
            </span>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight whitespace-nowrap">YogaZen</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-saffron-500/20 text-saffron-600 dark:text-saffron-400 border border-saffron-500/30">
                    Portal
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono block whitespace-nowrap">Control Management</span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button (Both collapses and expands!) */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className={`hidden lg:flex rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-saffron-500 hover:text-white dark:hover:bg-saffron-500 dark:hover:text-white text-stone-600 dark:text-stone-300 transition-all border border-stone-200 dark:border-stone-700 shadow-xs items-center justify-center cursor-pointer ${
              isSidebarCollapsed ? 'w-8 h-8 text-xs font-black mt-1' : 'w-7 h-7 text-xs font-bold'
            }`}
            title={isSidebarCollapsed ? 'Expand navigation sidebar (▶)' : 'Collapse navigation sidebar (◀)'}
            aria-label={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
          >
            {isSidebarCollapsed ? '▶' : '◀'}
          </button>

          {/* Close mobile button */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-black dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Admin Identity Card */}
        <div className={`px-4 py-3 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-950/40 ${isSidebarCollapsed ? 'text-center' : ''}`}>
          {isSidebarCollapsed ? (
            <span
              className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-xs font-bold mx-auto"
              title={isSuperAdmin ? 'Super Administrator' : 'Administrator'}
            >
              {isSuperAdmin ? '👑' : '🛡️'}
            </span>
          ) : (
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">
                  {isSuperAdmin ? 'Super Administrator' : (currentUser?.name || currentUser?.username || 'Administrator')}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono block truncate">
                  {currentUser?.email || (isSuperAdmin ? 'superadmin@yogazen.com' : 'admin@yogazen.com')}
                </span>
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  isSuperAdmin
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                    : 'bg-saffron-100 dark:bg-saffron-950 text-saffron-700 dark:text-saffron-300 border-saffron-300 dark:border-saffron-800'
                }`}
              >
                {isSuperAdmin ? '👑 Super' : '🛡️ Admin'}
              </span>
            </div>
          )}
        </div>

        {/* Vertical Navigation Links */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-3 block mb-2 font-mono">
              Management Modules
            </span>
          )}
          {visibleItems.map((item) => {
            const isActive =
              activePage === item.id ||
              location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center rounded-2xl transition group ${
                  isSidebarCollapsed
                    ? 'justify-center p-3 text-lg'
                    : 'gap-3 px-3.5 py-2.5 text-xs font-bold'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-saffron-500 to-amber-500 text-white shadow-md font-black'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span className={`${isSidebarCollapsed ? 'text-xl' : 'text-base'} group-hover:scale-110 transition shrink-0`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!isSidebarCollapsed && isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls: View Store, Logout */}
        <div className={`border-t border-stone-200 dark:border-stone-800 space-y-2 bg-stone-50/60 dark:bg-stone-950/60 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {/* View Public Store */}
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className={`w-full flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white text-xs font-bold transition border border-stone-300 dark:border-stone-700/60 ${
              isSidebarCollapsed ? 'p-2.5 text-base' : 'gap-2 px-3.5 py-2'
            }`}
            title="Open customer store in new tab"
          >
            <span>👁️</span>
            {!isSidebarCollapsed && <span>View Public Store</span>}
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-200 text-xs font-bold transition border border-red-200 dark:border-red-900/60 ${
              isSidebarCollapsed ? 'p-2.5 text-base' : 'gap-2 px-3.5 py-2'
            }`}
            title="Sign out of admin session"
          >
            <span>🚪</span>
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 🖥️ MAIN CONTENT AREA                                           */}
      {/* ============================================================== */}
      <div className={`flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Header Bar */}
        <header
          className={`h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 border-b transition-colors ${
            isDark ? 'bg-stone-900/90 border-stone-800 backdrop-blur-md text-white' : 'bg-white/90 border-stone-200 backdrop-blur-md text-stone-900'
          }`}
        >
          {/* Universal Hamburger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleHamburgerToggle}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white transition flex items-center justify-center border border-stone-200 dark:border-stone-700 shadow-xs cursor-pointer"
              title={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
              aria-label="Toggle navigation sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">{getPageTitle()}</h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono hidden sm:block">
                YogaZen Administrative Platform
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Theme Toggle Icon */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 shadow-xs ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-amber-300 hover:bg-stone-700'
                  : 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              <span>{isDark ? '🌙' : '☀️'}</span>
              <span className="font-bold">{isDark ? 'Dark Theme' : 'Light Theme'}</span>
            </button>

            {/* Admin User Chip */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'}`}>
              <div className="w-6 h-6 rounded-lg bg-saffron-500 text-white flex items-center justify-center font-bold text-xs">
                {isSuperAdmin ? '👑' : '🛡️'}
              </div>
              <span className="text-xs font-bold truncate max-w-[120px]">
                {currentUser?.name || currentUser?.username || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="admin-layout-main flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Clean Admin-Exclusive Footer */}
        <AdminFooter />
      </div>
    </div>
  );
};

export default AdminLayout;
