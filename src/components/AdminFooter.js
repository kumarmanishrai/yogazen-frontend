import React from 'react';
import { useTheme } from '../context/ThemeContext';

const AdminFooter = ({ className = '' }) => {
  const { isDark } = useTheme();

  return (
    <footer
      className={`admin-footer py-6 px-6 sm:px-8 border-t text-xs transition-colors duration-200 ${
        isDark ? 'bg-stone-900/90 border-stone-800 text-stone-400' : 'bg-white border-stone-200 text-stone-600'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p className="font-medium">
          © {new Date().getFullYear()} YogaZen Portal Suite. Secure administrative control system.
        </p>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-emerald-500 flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ● System Operational
          </span>
          <span className="text-stone-400 dark:text-stone-500">Strict RBAC Enforced</span>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;

