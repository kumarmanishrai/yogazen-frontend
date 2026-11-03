import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  apiAdminGetTrainers,
  apiAdminUpdateTrainerApproval,
  apiAdminToggleTrainerStatus,
  apiAdminUpdateTrainerSettings,
  apiAdminDeleteTrainer,
  apiAdminGetCourses,
  apiAdminUpdateCourseStatus,
  apiAdminDeleteCourse
} from '../services/api';

const AdminTrainers = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, hasPermission, isLoading: isAuthLoading } = useAuth();
  const { showNotification, showConfirmation } = useNotification();

  const [activeTab, setActiveTab] = useState('trainers'); // 'trainers' | 'courses'

  // Trainers State
  const [trainers, setTrainers] = useState([]);
  const [trainersFilter, setTrainersFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [trainerSearch, setTrainerSearch] = useState('');
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);

  // Courses State
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Commission & Settings Modal
  const [settingsTrainer, setSettingsTrainer] = useState(null);
  const [commissionInput, setCommissionInput] = useState(20);
  const [isFeaturedInput, setIsFeaturedInput] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  // Permission Guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
      } else if (!hasPermission('trainers')) {
        showNotification('Access denied. Trainers & Courses permission required.', 'error');
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, hasPermission, isAuthLoading, navigate, showNotification]);

  const fetchTrainers = useCallback(async () => {
    try {
      setIsLoadingTrainers(true);
      const res = await apiAdminGetTrainers({
        search: trainerSearch,
        status: trainersFilter !== 'all' ? trainersFilter : undefined
      });
      if (res?.success && Array.isArray(res.trainers)) {
        setTrainers(res.trainers);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to load trainers', 'error');
    } finally {
      setIsLoadingTrainers(false);
    }
  }, [trainerSearch, trainersFilter, showNotification]);

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoadingCourses(true);
      const res = await apiAdminGetCourses();
      if (res?.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to load courses', 'error');
    } finally {
      setIsLoadingCourses(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (hasPermission('trainers')) {
      if (activeTab === 'trainers') {
        fetchTrainers();
      } else {
        fetchCourses();
      }
    }
  }, [hasPermission, activeTab, fetchTrainers, fetchCourses]);

  // Trainer Actions
  const handleApproveTrainer = async (trainerId, currentApproved) => {
    const nextStatus = !currentApproved;
    try {
      const res = await apiAdminUpdateTrainerApproval(trainerId, nextStatus);
      if (res?.success) {
        showNotification(
          nextStatus ? 'Trainer officially approved to train on YogaZen!' : 'Trainer approval revoked',
          'success'
        );
        fetchTrainers();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update trainer approval', 'error');
    }
  };

  const handleToggleTrainerActive = async (trainer) => {
    const nextActive = trainer.isActive === false ? true : false;
    try {
      const res = await apiAdminToggleTrainerStatus(trainer._id, nextActive);
      if (res?.success) {
        showNotification(
          `Trainer account is now ${nextActive ? 'Active' : 'Suspended'}`,
          'success'
        );
        fetchTrainers();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update trainer status', 'error');
    }
  };

  const handleOpenSettingsModal = (trainer) => {
    setSettingsTrainer(trainer);
    setCommissionInput(trainer.commissionRate ?? 20);
    setIsFeaturedInput(Boolean(trainer.isFeatured));
  };

  const handleSaveTrainerSettings = async (e) => {
    e.preventDefault();
    if (!settingsTrainer) return;
    try {
      setIsSubmittingSettings(true);
      const res = await apiAdminUpdateTrainerSettings(settingsTrainer._id, {
        commissionRate: commissionInput,
        isFeatured: isFeaturedInput
      });
      if (res?.success) {
        showNotification('Trainer platform settings updated!', 'success');
        setSettingsTrainer(null);
        fetchTrainers();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleDeleteTrainer = (trainer) => {
    const trainerId = trainer._id || trainer.id;
    showConfirmation({
      title: 'Delete Trainer',
      message: `Are you sure you want to delete instructor "${trainer.name || trainer.email}"? All trainer privileges and associated courses will be removed.`,
      confirmText: 'Delete Instructor',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await apiAdminDeleteTrainer(trainerId);
          if (res?.success) {
            showNotification('Instructor deleted successfully', 'success');
            fetchTrainers();
          } else {
            showNotification(res?.message || 'Failed to delete instructor', 'error');
          }
        } catch (err) {
          showNotification(err.message || 'Failed to delete instructor', 'error');
        }
      }
    });
  };

  // Course Actions
  const handleToggleCoursePublish = async (course) => {
    const nextPublished = !course.isPublished;
    try {
      const res = await apiAdminUpdateCourseStatus(course._id, {
        isPublished: nextPublished,
        status: nextPublished ? 'published' : 'under_review'
      });
      if (res?.success) {
        showNotification(
          nextPublished ? 'Course published to public sanctuary!' : 'Course unpublished and hidden from public',
          'success'
        );
        fetchCourses();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update course status', 'error');
    }
  };

  const handleToggleCourseFeatured = async (course) => {
    const nextFeatured = !course.isFeatured;
    try {
      const res = await apiAdminUpdateCourseStatus(course._id, { isFeatured: nextFeatured });
      if (res?.success) {
        showNotification(
          nextFeatured ? 'Course highlighted as Featured!' : 'Course removed from featured list',
          'success'
        );
        fetchCourses();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update featured flag', 'error');
    }
  };

  const handleDeleteCourse = (course) => {
    showConfirmation({
      title: 'Remove Course from Platform',
      message: `Are you sure you want to permanently delete the course "${course.title}"?`,
      confirmText: 'Delete Course',
      cancelText: 'Keep Course',
      onConfirm: async () => {
        try {
          const res = await apiAdminDeleteCourse(course._id);
          if (res?.success) {
            showNotification('Course deleted by administrator', 'success');
            fetchCourses();
          }
        } catch (err) {
          showNotification(err.message || 'Failed to delete course', 'error');
        }
      }
    });
  };

  const filteredCourses = courses.filter((c) => {
    if (!courseSearch.trim()) return true;
    const q = courseSearch.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.trainer?.name?.toLowerCase().includes(q) ||
      c.trainer?.email?.toLowerCase().includes(q)
    );
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center font-nunito text-stone-900 dark:text-white transition-colors duration-200">
        <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin || !hasPermission('trainers')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-nunito flex flex-col justify-between transition-colors duration-200">
      <div>
        <AdminNavbar activePage="trainers" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 rounded-3xl shadow-sm dark:shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Educator Governance
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Instructor & Course Moderation
              </h1>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Govern instructor onboarding approvals, platform revenue share splits, course publishing quality control, and disciplinary suspensions.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-950 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 self-start md:self-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('trainers')}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                  activeTab === 'trainers' ? 'bg-saffron-500 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span>🧘 Instructors Directory</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-black/40">
                  {trainers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('courses')}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                  activeTab === 'courses' ? 'bg-saffron-500 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span>📚 All Courses & Curriculums</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-black/40">
                  {courses.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: TRAINERS DIRECTORY */}
          {activeTab === 'trainers' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by instructor name, email, or category tags..."
                    value={trainerSearch}
                    onChange={(e) => setTrainerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-saffron-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto bg-stone-100 dark:bg-stone-900 p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                  {[
                    { id: 'all', label: 'All Instructors' },
                    { id: 'pending', label: 'Pending Approvals ⚠️' },
                    { id: 'approved', label: 'Approved Only ✓' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTrainersFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        trainersFilter === tab.id ? 'bg-saffron-500 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trainers List */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                {isLoadingTrainers ? (
                  <div className="p-12 text-center text-xs text-stone-500 dark:text-stone-400">
                    <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading educators...
                  </div>
                ) : trainers.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 dark:text-stone-400 text-xs">No educators found matching criteria.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="py-3.5 px-6">Instructor</th>
                          <th className="py-3.5 px-6">Onboarding Status</th>
                          <th className="py-3.5 px-6">Platform Share & Payout</th>
                          <th className="py-3.5 px-6">Courses Published</th>
                          <th className="py-3.5 px-6">Account Status</th>
                          <th className="py-3.5 px-6 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                        {trainers.map((tr) => {
                          const isActive = tr.isActive !== false;
                          const coursesCount = (tr.courses || []).length;

                          return (
                            <tr key={tr._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <span className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-saffron-500 text-base">
                                    {(tr.name || tr.email || 'A').charAt(0).toUpperCase()}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-stone-900 dark:text-white text-sm">
                                        {tr.name || 'Acharya Educator'}
                                      </span>
                                      {tr.isFeatured && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30">
                                          ★ FEATURED
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px] block">
                                      {tr.email} {tr.contact ? `• ${tr.contact}` : ''}
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(tr.categories || []).map((cat, i) => (
                                        <span key={i} className="text-[9px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.2 rounded border border-stone-200 dark:border-stone-700">
                                          {cat}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <span
                                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
                                    tr.isApproved
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                                  }`}
                                >
                                  {tr.isApproved ? '✓ Verified & Approved' : '⚠️ Pending Verification'}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <div className="space-y-0.5">
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block text-xs">
                                    Net (80%): ₹{(tr.totalEarnings || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-saffron-600 dark:text-saffron-300 font-mono text-[10px] block">
                                    Commission (20%): ₹{Math.round((tr.totalEarnings || 0) * 0.25).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-stone-500 dark:text-stone-400 text-[9px] block">
                                    Gross: ₹{Math.round((tr.totalEarnings || 0) * 1.25).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-extrabold text-stone-900 dark:text-white">
                                  {coursesCount} course{coursesCount === 1 ? '' : 's'}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <span
                                  className={`text-[10px] font-bold ${
                                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {isActive ? '● Active' : '○ Suspended'}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTrainer(tr._id, tr.isApproved)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                                      tr.isApproved
                                        ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                    }`}
                                  >
                                    {tr.isApproved ? 'Revoke Approval' : 'Approve Application ✓'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSettingsModal(tr)}
                                    className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                                    title="Edit Commission & Feature"
                                  >
                                    ⚙️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTrainerActive(tr)}
                                    className={`px-2 py-1 rounded-xl text-xs font-bold transition ${
                                      isActive ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    }`}
                                  >
                                    {isActive ? 'Suspend' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTrainer(tr)}
                                    className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60"
                                    title="Delete Instructor"
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
          )}

          {/* TAB 2: COURSES MODERATION */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="relative w-full sm:max-w-md">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Filter courses by title, category, or instructor..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-saffron-500"
                />
              </div>

              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                {isLoadingCourses ? (
                  <div className="p-12 text-center text-xs text-stone-500 dark:text-stone-400">
                    <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading courses...
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 dark:text-stone-400 text-xs">No courses registered yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="py-3.5 px-6">Course & Category</th>
                          <th className="py-3.5 px-6">Lead Educator</th>
                          <th className="py-3.5 px-6">Price & Enrolled</th>
                          <th className="py-3.5 px-6">Curriculum</th>
                          <th className="py-3.5 px-6">Publication Status</th>
                          <th className="py-3.5 px-6 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                        {filteredCourses.map((c) => {
                          const isPub = c.isPublished !== false;
                          const classesCount = (c.classes || []).length;

                          return (
                            <tr key={c._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-stone-900 dark:text-white text-sm">{c.title}</span>
                                    {c.isFeatured && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30">
                                        ★ FEATURED
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                                    <span className="px-2 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-saffron-600 dark:text-saffron-300 font-bold uppercase border border-stone-200 dark:border-stone-700">
                                      {c.category}
                                    </span>
                                    <span>{c.level}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-bold text-stone-900 dark:text-stone-200 block">{c.trainer?.name || 'YogaZen Acharya'}</span>
                                <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px] block">{c.trainer?.email}</span>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-black text-saffron-600 dark:text-saffron-400 text-sm block">
                                  {c.price > 0 ? `₹${c.price}` : 'Free'}
                                </span>
                                <span className="text-stone-500 dark:text-stone-400 text-[10px]">
                                  👥 {c.enrolledCount || 0} Yogis Enrolled
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-bold text-stone-800 dark:text-stone-300 block">{classesCount} Classes</span>
                                <span className="text-stone-500 text-[10px]">{c.duration || '4 Weeks'}</span>
                              </td>

                              <td className="py-4 px-6">
                                <span
                                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
                                    isPub
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                                  }`}
                                >
                                  {isPub ? '● Published' : '○ Under Review'}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    to={`/courses/${c._id}`}
                                    target="_blank"
                                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold border border-stone-200 dark:border-stone-700"
                                    title="View public page"
                                  >
                                    Preview 👁️
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCoursePublish(c)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                                      isPub
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        : 'bg-emerald-600 text-white'
                                    }`}
                                  >
                                    {isPub ? 'Unpublish' : 'Publish'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCourseFeatured(c)}
                                    className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                                    title={c.isFeatured ? 'Unmark Featured' : 'Mark as Featured Course'}
                                  >
                                    ★
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourse(c)}
                                    className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60"
                                    title="Delete Course"
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
          )}
        </main>
      </div>

      <AdminFooter />

      {/* TRAINER COMMISSION SETTINGS MODAL */}
      {settingsTrainer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Platform Educator Settings</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">{settingsTrainer.name || settingsTrainer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsTrainer(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrainerSettings} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Platform Fee / Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white font-mono font-bold focus:outline-none focus:border-saffron-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">%</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Educator retains remaining {100 - commissionInput}% of student enrollment revenues.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeaturedInput}
                    onChange={(e) => setIsFeaturedInput(e.target.checked)}
                    className="accent-saffron-500"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white block">Promote as Featured Educator</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                      Features profile on public landing page and course listings banner.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSettingsTrainer(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold border border-stone-200 dark:border-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSettings}
                  className="px-5 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-black transition disabled:opacity-50"
                >
                  {isSubmittingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrainers;

