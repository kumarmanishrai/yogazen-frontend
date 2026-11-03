import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminNavbar = ({ activePage }) => {
  const { currentUser, isSuperAdmin, hasPermission, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop sidebar collapse state (persisted)
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

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleHamburgerToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // On desktop, collapse or expand sidebar
      toggleSidebarCollapse();
    } else {
      // On mobile, toggle drawer
      setIsMobileMenuOpen((prev) => !prev);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Command Hub', icon: '👑', path: '/admin', permission: null },
    { id: 'inventory', label: 'Inventory', icon: '📦', path: '/admin/inventory', permission: 'inventory' },
    { id: 'orders', label: 'Orders & Invoices', icon: '🚚', path: '/admin/orders', permission: 'orders' },
    { id: 'complaints', label: 'Complaints', icon: '🎫', path: '/admin/complaints', permission: 'complaints' },
    { id: 'crm', label: 'CRM / Yogis', icon: '👥', path: '/admin/crm', permission: 'crm' },
    { id: 'trainers', label: 'Trainers & Courses', icon: '🧘', path: '/admin/trainers', permission: 'trainers' },
    { id: 'financials', label: 'Financials & PDF', icon: '📊', path: '/admin/financials', permission: 'financials' },
    { id: 'audit', label: 'Audit & Security Logs', icon: '📜', path: '/admin/audit-logs', permission: 'audit' },
    { id: 'subadmins', label: 'Admin Roles & RBAC', icon: '🛡️', path: '/admin/subadmins', superAdminOnly: true }
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const getPageTitle = () => {
    const item = navItems.find((i) => i.id === activePage || location.pathname === i.path);
    if (item) return item.label;
    if (location.pathname.startsWith('/admin/crm/user/')) return 'Customer Intelligence';
    return 'Portal Suite';
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 🧭 DESKTOP COLLAPSIBLE LEFT SIDEBAR                            */}
      {/* ============================================================== */}
      <aside
        className={`admin-left-sidebar fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white select-none transition-all duration-300 ease-in-out shadow-sm ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
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
                  <span className="text-base font-black tracking-tight text-stone-900 dark:text-white whitespace-nowrap">YogaZen</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-saffron-500/20 text-saffron-600 dark:text-saffron-400 border border-saffron-500/30">
                    Portal
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono block whitespace-nowrap">Control System</span>
              </div>
            )}
          </Link>

          {/* Dedicated Toggle Button (Collapses when expanded, Expands when collapsed!) */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-saffron-500 hover:text-white dark:hover:bg-saffron-500 dark:hover:text-white text-stone-600 dark:text-stone-300 transition-all border border-stone-200 dark:border-stone-700 shadow-xs flex items-center justify-center cursor-pointer ${
              isSidebarCollapsed ? 'w-8 h-8 text-xs font-black mt-1' : 'w-7 h-7 text-xs font-bold'
            }`}
            title={isSidebarCollapsed ? 'Expand navigation sidebar (▶)' : 'Collapse navigation sidebar (◀)'}
            aria-label={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
          >
            {isSidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Identity & Role Badge */}
        <div className={`px-4 py-3 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-950/40 ${isSidebarCollapsed ? 'text-center' : ''}`}>
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
                <span className="text-xs font-black text-stone-900 dark:text-white block truncate">
                  {isSuperAdmin ? 'Super Administrator' : (currentUser?.name || currentUser?.username || 'Administrator')}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono block truncate">
                  {currentUser?.email || (isSuperAdmin ? 'superadmin@yogazen.com' : 'admin@yogazen.com')}
                </span>
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  isSuperAdmin
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : 'bg-saffron-100 dark:bg-saffron-950 text-saffron-700 dark:text-saffron-300 border-saffron-200 dark:border-saffron-800'
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
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-3 block mb-2 font-mono">
              Modules Navigation
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

        {/* Sidebar Footer Controls */}
        <div className={`border-t border-stone-200 dark:border-stone-800 space-y-2 bg-stone-50/80 dark:bg-stone-950/60 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {/* View Store */}
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className={`w-full flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition border border-stone-300 dark:border-stone-700/60 ${
              isSidebarCollapsed ? 'p-2.5 text-base' : 'gap-2 px-3.5 py-2'
            }`}
            title="Open public customer store"
          >
            <span>👁️</span>
            {!isSidebarCollapsed && <span>View Public Store</span>}
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-200 hover:text-red-700 dark:hover:text-white text-xs font-bold transition border border-red-200 dark:border-red-900/60 ${
              isSidebarCollapsed ? 'p-2.5 text-base' : 'gap-2 px-3.5 py-2'
            }`}
            title="Sign out of portal"
          >
            <span>🚪</span>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 📱 TOP HEADER (Responsive with Hamburger Collapse Trigger)      */}
      {/* ============================================================== */}
      <header
        className={`bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white sticky top-0 z-30 shadow-xs transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger Button & Active Page Indicator */}
            <div className="flex items-center gap-3">
              {/* Universal Hamburger Button (Works on both desktop & mobile) */}
              <button
                type="button"
                onClick={handleHamburgerToggle}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition flex items-center justify-center border border-stone-200 dark:border-stone-700 shadow-xs cursor-pointer"
                title={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
                aria-label="Toggle navigation sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h1 className="text-base font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
                  <span>{getPageTitle()}</span>
                </h1>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono hidden sm:block">
                  YogaZen Master Control Environment
                </p>
              </div>
            </div>

            {/* Quick Header Right Actions */}
            <div className="flex items-center gap-2.5">
              {/* Theme Toggle Pill */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 shadow-xs ${
                  isDark
                    ? 'bg-stone-800 border-stone-700 text-amber-300 hover:bg-stone-700 hover:text-white'
                    : 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              >
                <span>{isDark ? '🌙' : '☀️'}</span>
                <span className="font-bold">{isDark ? 'Dark Theme' : 'Light Theme'}</span>
              </button>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition items-center gap-1.5 border border-stone-300 dark:border-stone-700"
                title="Open public website in a new tab"
              >
                <span>👁️</span>
                <span>Store</span>
              </Link>

              {/* Admin profile chip */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 text-right">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-[120px]">
                  {isSuperAdmin ? 'Superadmin' : (currentUser?.name || currentUser?.username || 'Admin')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-200 hover:text-red-700 dark:hover:text-white text-xs font-bold transition border border-red-200 dark:border-red-900/60 flex items-center gap-1"
                title="Sign out"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 p-4 space-y-2 animate-in slide-in-from-top-2 shadow-lg">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
              {visibleItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-saffron-500 hover:text-white flex items-center gap-2"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
              >
                <span>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default AdminNavbar;
