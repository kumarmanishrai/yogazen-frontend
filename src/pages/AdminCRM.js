import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  apiAdminGetUsers,
  apiAdminToggleUserStatus,
  apiAdminDeleteUser
} from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminCRM = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, hasPermission, isLoading: isAuthLoading } = useAuth();
  const { showNotification, showConfirmation } = useNotification();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'

  // Permission Guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
      } else if (!hasPermission('crm')) {
        showNotification('Access denied. CRM permission required.', 'error');
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, hasPermission, isAuthLoading, navigate, showNotification]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiAdminGetUsers({ search: searchTerm });
      if (res?.success && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to retrieve customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, showNotification]);

  useEffect(() => {
    if (hasPermission('crm')) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasPermission, fetchUsers]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.isActive === false ? true : false;
    try {
      const res = await apiAdminToggleUserStatus(user._id, newStatus);
      if (res?.success) {
        showNotification(
          `Customer ${user.name || user.email} is now ${newStatus ? 'Active' : 'Suspended'}`,
          'success'
        );
        fetchUsers();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = (user) => {
    showConfirmation({
      title: 'Delete Customer Account',
      message: `Are you sure you want to delete customer "${user.name || user.email}"? All account records will be removed.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await apiAdminDeleteUser(user._id);
          if (res?.success) {
            showNotification('Customer account deleted successfully', 'success');
            fetchUsers();
          }
        } catch (err) {
          showNotification(err.message || 'Failed to delete customer', 'error');
        }
      }
    });
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active') return u.isActive !== false;
    if (statusFilter === 'suspended') return u.isActive === false;
    return true;
  });

  if (isAuthLoading) {
    return (
      <AdminLayout activePage="crm">
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-stone-400">Verifying administrator credentials...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isLoggedIn || !isAdmin || !hasPermission('crm')) {
    return null;
  }

  return (
    <AdminLayout activePage="crm">
      <div className="space-y-6 w-full max-w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl shadow-xl w-full max-w-full">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              CRM & Customer Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Customer Relationship Management
            </h1>
            <p className="text-xs text-stone-400">
              Audit registered practitioners, lifetime spending volume, order records, and view ML behavioral telemetry.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Customers</span>
              <span className="text-lg font-black text-white">{users.length}</span>
            </div>
            <div className="w-px h-8 bg-stone-800"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Active</span>
              <span className="text-lg font-black text-emerald-400">
                {users.filter((u) => u.isActive !== false).length}
              </span>
            </div>
            <div className="w-px h-8 bg-stone-800"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-red-400 block">Suspended</span>
              <span className="text-lg font-black text-red-400">
                {users.filter((u) => u.isActive === false).length}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search yogis by name, email, or contact..."
              className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-saffron-500"
            />
            <span className="absolute left-3.5 top-3 text-stone-500 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'active', label: 'Active Only' },
              { id: 'suspended', label: 'Suspended' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-saffron-500 text-white'
                    : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl w-full max-w-full">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-stone-400">Loading customer profiles...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-stone-400">
              <p className="text-sm font-bold">No registered practitioners found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950/80 text-[10px] uppercase font-bold text-stone-400 tracking-wider font-mono">
                    <th className="py-4 px-6">Practitioner</th>
                    <th className="py-4 px-6">Orders</th>
                    <th className="py-4 px-6">Total Spent</th>
                    <th className="py-4 px-6">Courses</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-xs">
                  {filteredUsers.map((u) => {
                    const isActive = u.isActive !== false;
                    return (
                      <tr key={u._id} className="hover:bg-stone-800/40 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center font-bold text-saffron-400">
                              {(u.name || u.email || 'Y').charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/crm/user/${u._id}`)}
                                className="font-extrabold text-white text-sm hover:text-saffron-400 transition text-left block"
                              >
                                {u.name || 'Anonymous Yogi'}
                              </button>
                              <span className="text-stone-400 font-mono text-[11px] block">
                                {u.email} {u.contact ? `• ${u.contact}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-extrabold text-white">
                            {u.ordersCount || 0} order{u.ordersCount === 1 ? '' : 's'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-black text-emerald-400">
                            ₹{(u.totalSpent || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-stone-300 font-bold">
                            {u.enrolledCoursesCount || 0} course{u.enrolledCoursesCount === 1 ? '' : 's'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
                              isActive
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/crm/user/${u._id}`)}
                              className="px-3 py-1 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                              title="View Customer Profile & ML Telemetry Data on Dedicated Page"
                            >
                              <span>🤖 View Profile & ML</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                                isActive
                                  ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800'
                                  : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {isActive ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300"
                              title="Delete Customer"
                            >
                              🗑️
                            </button>
                          </div>
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
    </AdminLayout>
  );
};

export default AdminCRM;
