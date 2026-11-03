import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  apiAdminGetSubAdmins,
  apiAdminCreateSubAdmin,
  apiAdminUpdateSubAdmin,
  apiAdminDeleteSubAdmin
} from '../services/api';

const AVAILABLE_PERMISSIONS = [
  { id: 'inventory', label: 'Inventory & Stock Management', icon: '📦', desc: 'Add products, update stock, audit low stock' },
  { id: 'orders', label: 'Orders & Invoices Fulfillment', icon: '🚚', desc: 'Process orders, track shipments, verify invoices' },
  { id: 'complaints', label: 'Customer Complaints & Support', icon: '🎫', desc: 'Resolve complaints, refunds, and replacements' },
  { id: 'crm', label: 'Customer CRM Directory', icon: '👥', desc: 'View customer lifetime orders and account status' },
  { id: 'trainers', label: 'Trainers & Courses Moderation', icon: '🧘', desc: 'Approve trainers, commissions, publish courses' },
  { id: 'financials', label: 'Financial Reports & PDF Ledger', icon: '📊', desc: 'Audit revenue, FY statements, download tax PDFs' },
  { id: 'audit', label: 'Audit & Security Logs', icon: '📜', desc: 'Inspect system logins, logouts, security violations, and data changes' }
];

const AdminSubAdmins = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoggedIn, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { showNotification, showConfirmation } = useNotification();

  const [adminsList, setAdminsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State: Create or Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    contact: '',
    role: 'admin',
    permissions: ['inventory', 'orders']
  });

  // Recently Created Credentials Popup Display
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Guard: Superadmin access only
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
      } else if (!isSuperAdmin) {
        showNotification('Access restricted exclusively to Chief Superadmin', 'error');
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, isSuperAdmin, isAuthLoading, navigate, showNotification]);

  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiAdminGetSubAdmins();
      if (res?.success && Array.isArray(res.admins)) {
        setAdminsList(res.admins);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to retrieve administrators', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin, fetchAdmins]);

  const handleOpenCreateModal = () => {
    setEditingAdminId(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      contact: '',
      role: 'admin',
      permissions: ['inventory', 'orders']
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (admin) => {
    setEditingAdminId(admin._id);
    setFormData({
      name: admin.name || '',
      username: admin.username || '',
      email: admin.email || '',
      password: '', // Blank unless superadmin wants to reset it
      contact: admin.contact || '',
      role: admin.role || 'admin',
      permissions: admin.permissions || []
    });
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (permId) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      const updated = current.includes(permId)
        ? current.filter((p) => p !== permId)
        : [...current, permId];
      return { ...prev, permissions: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showNotification('Please fill in name and email', 'warning');
      return;
    }

    if (!editingAdminId && (!formData.username.trim() || !formData.password.trim())) {
      showNotification('Username and initial password are required', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingAdminId) {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contact: formData.contact.trim(),
          role: formData.role,
          permissions: formData.permissions
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        const res = await apiAdminUpdateSubAdmin(editingAdminId, payload);
        if (res?.success) {
          showNotification('Admin account updated successfully!', 'success');
          setIsModalOpen(false);
          fetchAdmins();
        }
      } else {
        const payload = {
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
          contact: formData.contact.trim(),
          role: formData.role,
          permissions: formData.permissions
        };

        const res = await apiAdminCreateSubAdmin(payload);
        if (res?.success) {
          showNotification(`Admin account created for ${res.admin?.name}!`, 'success');
          setCreatedCredentials({
            name: res.admin?.name,
            username: res.admin?.username,
            email: res.admin?.email,
            password: formData.password.trim(),
            permissions: res.admin?.permissions
          });
          setIsModalOpen(false);
          fetchAdmins();
        }
      }
    } catch (err) {
      showNotification(err.message || 'Error processing administrator account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const newStatus = !admin.isActive;
    try {
      const res = await apiAdminUpdateSubAdmin(admin._id, { isActive: newStatus });
      if (res?.success) {
        showNotification(
          `Administrator ${admin.name} is now ${newStatus ? 'Active' : 'Deactivated'}`,
          'success'
        );
        fetchAdmins();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to toggle account status', 'error');
    }
  };

  const handleDeleteAdmin = (admin) => {
    showConfirmation({
      title: 'Delete Administrator Account',
      message: `Are you sure you want to permanently delete administrator account "${admin.name}" (@${admin.username})? They will lose all access immediately.`,
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await apiAdminDeleteSubAdmin(admin._id);
          if (res?.success) {
            showNotification('Administrator deleted successfully', 'success');
            fetchAdmins();
          }
        } catch (err) {
          showNotification(err.message || 'Failed to delete administrator', 'error');
        }
      }
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center font-nunito text-stone-900 dark:text-white transition-colors duration-200">
        <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-nunito flex flex-col justify-between transition-colors duration-200">
      <div>
        <AdminNavbar activePage="subadmins" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 rounded-3xl shadow-sm dark:shadow-xl">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-black">
                <span>🛡️ Superadmin Control Terminal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Role-Based Administrator Management
              </h1>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Superadmin can provision administrative staff accounts, assign granular page permissions, and distribute generated login credentials. Sub-admins can only visit authorized modules.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-saffron-600 to-amber-500 hover:from-saffron-500 hover:to-amber-400 text-white text-xs font-black transition shadow-lg shadow-saffron-500/20 flex items-center gap-2 self-start md:self-auto"
            >
              <span>+</span>
              <span>Create New Administrator</span>
            </button>
          </div>

          {/* Generated Credentials Spotlight Card (If just created) */}
          {createdCredentials && (
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <span>🎉</span> Admin Account Created! Provide These Credentials to Staff Member:
                </span>
                <button
                  type="button"
                  onClick={() => setCreatedCredentials(null)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white text-xs font-bold"
                >
                  ✕ Dismiss
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/80 dark:bg-stone-900/90 p-4 rounded-2xl border border-emerald-200 dark:border-stone-800 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Staff Name</span>
                  <strong className="text-stone-900 dark:text-white">{createdCredentials.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Username</span>
                  <code className="text-saffron-600 dark:text-saffron-400 font-mono font-bold">{createdCredentials.username}</code>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Staff Password</span>
                  <code className="text-emerald-700 dark:text-emerald-400 font-mono font-bold bg-emerald-100 dark:bg-black/40 px-2 py-0.5 rounded">
                    {createdCredentials.password}
                  </code>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Assigned Modules</span>
                  <span className="text-stone-700 dark:text-stone-300 font-semibold">
                    {createdCredentials.permissions?.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Administrators Table */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Registered Administrators</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">Total accounts with administrative clearance: {adminsList.length}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-stone-500 dark:text-stone-400">Loading administrators...</p>
              </div>
            ) : adminsList.length === 0 ? (
              <div className="p-12 text-center text-stone-500 dark:text-stone-400 text-xs">No administrators found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Administrator</th>
                      <th className="py-3.5 px-6">Role & Status</th>
                      <th className="py-3.5 px-6">Assigned Permissions</th>
                      <th className="py-3.5 px-6">Created On</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {adminsList.map((admin) => {
                      const isRootSuper = admin.role === 'superadmin';
                      return (
                        <tr key={admin._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm">
                                {isRootSuper ? '👑' : '👤'}
                              </span>
                              <div>
                                <span className="font-extrabold text-stone-900 dark:text-white text-sm block">
                                  {isRootSuper ? 'Super Administrator' : admin.name}
                                </span>
                                <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                                  {isRootSuper ? 'Primary Root System • Protected' : `@${admin.username || 'admin'} • ${admin.email}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
                                  isRootSuper
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {isRootSuper ? 'Superadmin' : admin.role || 'Admin'}
                              </span>
                              <span
                                className={`text-[10px] font-bold block ${
                                  admin.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {admin.isActive ? '● Active' : '○ Deactivated'}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {isRootSuper ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                                  ★ ALL MODULES (UNRESTRICTED)
                                </span>
                              ) : (admin.permissions || []).length === 0 ? (
                                <span className="text-stone-500 text-[11px]">No modules assigned</span>
                              ) : (
                                (admin.permissions || []).map((p) => (
                                  <span
                                    key={p}
                                    className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold border border-stone-200 dark:border-stone-700 capitalize"
                                  >
                                    {p}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6 text-stone-500 dark:text-stone-400 text-[11px]">
                            {new Date(admin.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          <td className="py-4 px-6 text-right">
                            {isRootSuper ? (
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Root Master</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(admin)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                                    admin.isActive
                                      ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                                      : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  }`}
                                  title={admin.isActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  {admin.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(admin)}
                                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                                  title="Edit Permissions"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(admin)}
                                  className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60"
                                  title="Delete Administrator"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <AdminFooter />

      {/* CREATE / EDIT SUB-ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  {editingAdminId ? 'Edit Administrator Privileges' : 'Provision Sub-Admin Account'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Decide exactly which pages and modules this administrator can visit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Staff Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-saffron-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingAdminId)}
                    placeholder="e.g. inventory_lead"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-saffron-500 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@yogazen.store"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {editingAdminId ? 'Reset Password (Leave blank to keep)' : 'Initial Password *'}
                  </label>
                  <input
                    type="text"
                    required={!editingAdminId}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-saffron-500 font-mono"
                  />
                </div>
              </div>

              {/* Module Permissions Checkbox Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-saffron-600 dark:text-saffron-400 mb-2 uppercase tracking-wider">
                  Module Permissions (Decides Which Pages Admin Can Visit)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handlePermissionToggle(perm.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-saffron-50 dark:bg-saffron-950/40 border-saffron-500 text-stone-900 dark:text-white'
                            : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-saffron-500"
                        />
                        <div>
                          <span className="font-bold block text-stone-800 dark:text-stone-200">
                            {perm.icon} {perm.label}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5">
                            {perm.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold border border-stone-200 dark:border-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-black transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAdminId ? 'Save Changes' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubAdmins;

