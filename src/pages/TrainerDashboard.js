import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  apiTrainerGetCourses,
  apiTrainerCreateCourse,
  apiTrainerAddClass,
  apiTrainerDeleteClass,
  apiTrainerSetClassLive
} from '../services/api';

// Helper to extract YouTube Video or Live ID from various URL formats
const extractYouTubeId = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : '';
};

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, role, isLoggedIn, isLoading, openAuthModal } = useAuth();
  const { showNotification, showConfirm } = useNotification();

  // Helper to format dates
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // State: Courses with Nested Classes loaded dynamically from backend
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');

  // Expanded course cards tracking
  const [expandedCourses, setExpandedCourses] = useState({});

  const toggleCourseExpand = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  // Profile Completeness Check
  const isProfileComplete = Boolean(
    currentUser?.name?.trim() &&
    currentUser?.contact?.trim() &&
    currentUser?.bio?.trim() &&
    currentUser?.categories &&
    currentUser?.categories.length > 0
  );

  // Profile Required Warning Modal State
  const [isProfileRequiredModalOpen, setIsProfileRequiredModalOpen] = useState(false);

  // Live Studio Player Modal State (YouTube live/video embed)
  const [activeStreamingClass, setActiveStreamingClass] = useState(null); // { course, classItem }
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // --- Add Course Modal State ---
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [courseFormError, setCourseFormError] = useState('');
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    category: 'Hatha Yoga',
    level: 'Beginner',
    price: '',
    description: '',
  });

  // --- Add Class Modal State ---
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [classFormData, setClassFormData] = useState({
    title: '',
    description: '',
    duration: 45,
    scheduledAt: '',
    type: 'Live Stream',
    meetingUrl: '',
  });

  // Fetch Trainer's Courses from Backend
  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError('');
      const res = await apiTrainerGetCourses();
      if (res?.courses) {
        setCourses(res.courses);
        if (res.courses.length > 0) {
          const firstId = res.courses[0]._id || res.courses[0].id;
          setExpandedCourses((prev) => ({ ...prev, [firstId]: true }));
        }
      }
    } catch (err) {
      console.error('Failed to load trainer courses:', err);
      setCoursesError(err.message || 'Failed to load courses');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && role === 'trainer') {
      fetchCourses();
    }
  }, [isLoggedIn, role]);

  // Calculate Upcoming Classes in the next 7 days across ALL courses
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const upcomingClasses = [];
  courses.forEach((course) => {
    const courseId = course._id || course.id;
    (course.classes || []).forEach((cls) => {
      const classDate = new Date(cls.scheduledAt);
      if (classDate >= now && classDate <= next7Days) {
        upcomingClasses.push({
          ...cls,
          courseId,
          courseTitle: course.title,
          category: course.category,
        });
      }
    });
  });

  // Sort upcoming classes chronologically
  upcomingClasses.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  // Open Add Course with Profile Completeness Barrier
  const handleOpenAddCourse = () => {
    if (!isProfileComplete) {
      setIsProfileRequiredModalOpen(true);
      return;
    }
    setCourseFormData({
      title: '',
      category: currentUser?.categories?.[0] || 'Hatha Yoga',
      level: 'Beginner',
      price: '',
      description: '',
    });
    setCourseFormError('');
    setIsAddCourseModalOpen(true);
  };

  // Handler: Add New Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!isProfileComplete) {
      setIsAddCourseModalOpen(false);
      setIsProfileRequiredModalOpen(true);
      return;
    }

    try {
      setIsSubmittingCourse(true);
      setCourseFormError('');
      const res = await apiTrainerCreateCourse({
        title: courseFormData.title,
        category: courseFormData.category,
        level: courseFormData.level,
        price: Number(courseFormData.price) || 0,
        description: courseFormData.description,
        classes: [],
      });

      if (res?.course) {
        await fetchCourses();
        const newId = res.course._id || res.course.id;
        setExpandedCourses((prev) => ({ ...prev, [newId]: true }));
        setIsAddCourseModalOpen(false);
        setCourseFormData({
          title: '',
          category: currentUser?.categories?.[0] || 'Hatha Yoga',
          level: 'Beginner',
          price: '',
          description: '',
        });
      }
    } catch (err) {
      if (err.code === 'PROFILE_INCOMPLETE' || err.status === 403) {
        setIsAddCourseModalOpen(false);
        setIsProfileRequiredModalOpen(true);
      } else {
        setCourseFormError(err.message || 'Failed to create course. Please try again.');
      }
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Handler: Open Add Class Modal for specific Course
  const openAddClassForCourse = (courseId) => {
    setTargetCourseId(courseId);
    // Default scheduled time to tomorrow 7:00 AM in HTML datetime-local format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    const defaultLocalTime = tomorrow.toISOString().slice(0, 16);

    setClassFormData({
      title: '',
      description: '',
      duration: 45,
      scheduledAt: defaultLocalTime,
      type: 'Live Stream',
      meetingUrl: '',
    });
    setIsAddClassModalOpen(true);
  };

  // Handler: Add Class to Course (Persisted to Backend MongoDB)
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!targetCourseId) return;

    if (classFormData.scheduledAt) {
      const schedDate = new Date(classFormData.scheduledAt);
      if (schedDate < new Date(Date.now() - 2 * 60 * 1000)) {
        showNotification('Scheduled date & time cannot be in the past.', 'warning');
        return;
      }
    }

    try {
      setIsSubmittingClass(true);
      const ytId = extractYouTubeId(classFormData.meetingUrl);
      const payload = {
        title: classFormData.title.trim(),
        description: classFormData.description.trim(),
        duration: `${Number(classFormData.duration) || 45} mins`,
        scheduledAt: new Date(classFormData.scheduledAt).toISOString(),
        type: classFormData.type,
        meetingUrl: classFormData.meetingUrl.trim(),
        videoUrl: classFormData.meetingUrl.trim(),
        youtubeVideoId: ytId
      };

      const res = await apiTrainerAddClass(targetCourseId, payload);
      if (res?.success) {
        showNotification('Class scheduled and saved to course curriculum successfully!', 'success');
        await fetchCourses();
        setIsAddClassModalOpen(false);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save class to database', 'error');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Handler: Delete Class (Persisted to Backend)
  const handleDeleteClass = async (courseId, classId) => {
    const confirmed = await showConfirm({
      title: 'Remove Class',
      message: 'Are you sure you want to permanently remove this class from the course curriculum?',
      confirmText: 'Remove Class',
      cancelText: 'Keep Class',
      type: 'danger'
    });

    if (confirmed) {
      try {
        const res = await apiTrainerDeleteClass(courseId, classId);
        if (res?.success) {
          showNotification('Class removed from course curriculum.', 'success');
          await fetchCourses();
        }
      } catch (err) {
        showNotification(err.message || 'Failed to delete class', 'error');
      }
    }
  };

  // Handler: Start / End Live Stream for Class
  const handleToggleLiveStatus = async (courseId, cls) => {
    const nextLiveState = !cls.isLive;
    try {
      const res = await apiTrainerSetClassLive(courseId, cls._id || cls.id, {
        isLive: nextLiveState,
        youtubeVideoId: cls.youtubeVideoId || extractYouTubeId(cls.videoUrl || cls.meetingUrl),
        videoUrl: cls.videoUrl || cls.meetingUrl
      });
      if (res?.success) {
        showNotification(res.message, 'success');
        await fetchCourses();
        if (nextLiveState) {
          // Open the interactive studio player for the trainer
          const updatedCourse = courses.find((c) => (c._id || c.id) === courseId);
          setActiveStreamingClass({
            course: updatedCourse,
            classItem: res.class || { ...cls, isLive: true }
          });
        }
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update live stream status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
        <Navbar />
        <div className="py-32 text-center">
          <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Checking credentials...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Guest Barrier
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <span className="text-5xl">🧘‍♂️</span>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Trainer Sign In Required</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Please sign in with your verified instructor credentials to access the course studio, schedule classes, and manage live streams.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => openAuthModal('Please sign in with a Trainer account.')}
                className="w-full sm:w-auto px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Sign In as Trainer
              </button>
              <Link
                to="/trainer/register"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Register as Instructor
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Regular User Barrier (Role mismatch: user cannot access trainer dashboard)
  if (role !== 'trainer') {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <span className="text-5xl">🔒</span>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Access Restricted: Trainer Portal</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              You are currently signed in as a <span className="font-bold text-gray-800">Practitioner (User Account)</span>.
              The Trainer Dashboard is reserved for certified YogaZen instructors to create curriculums and view earnings.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/profile"
                className="w-full sm:w-auto px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Go to Your User Profile
              </Link>
              <Link
                to="/trainer/register"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Apply to Train on YogaZen 🌿
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Welcome & Instructor Status Header */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-saffron-100 dark:border-stone-800 shadow-sm dark:shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-saffron-600 text-white flex items-center justify-center text-3xl font-black shadow-md shadow-saffron-600/20">
                🧘‍♂️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                    {currentUser?.name || 'Instructor Portal'}
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-saffron-100 dark:bg-saffron-950/80 text-saffron-800 dark:text-saffron-300 border border-transparent dark:border-saffron-800">
                    Trainer View
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                  Manage your course curriculums, schedule live sessions, and monitor student enrollments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/trainer/profile"
                className="px-4 py-2 text-xs font-bold text-saffron-700 dark:text-saffron-300 bg-saffron-50 dark:bg-stone-800 hover:bg-saffron-100 dark:hover:bg-stone-700 border border-saffron-200 dark:border-stone-700 rounded-xl transition"
              >
                ✏️ Edit Profile & Payout
              </Link>
              <button
                onClick={handleOpenAddCourse}
                className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-saffron-500/20 flex items-center gap-1.5"
              >
                <span>+</span> Add New Course
              </button>
            </div>
          </div>

          {/* Profile Completeness Alert Banner */}
          {!isProfileComplete && (
            <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-900 border border-amber-200 dark:border-amber-800/40 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-2xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-900 dark:text-amber-300">Your Trainer Profile is Incomplete</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed max-w-2xl">
                    To maintain quality training standards on YogaZen, trainers must complete their profile before adding or publishing courses. Please enter your <strong>Full Name</strong>, <strong>Contact Phone</strong>, <strong>Bio</strong>, and <strong>Training Specializations</strong>.
                  </p>
                </div>
              </div>
              <Link
                to="/trainer/profile"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap text-center self-start sm:self-center"
              >
                Complete Profile Now →
              </Link>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Next 7 Days</span>
              <p className="text-2xl font-black text-saffron-600 mt-1">{upcomingClasses.length} Classes</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Courses</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{courses.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Classes</span>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {courses.reduce((acc, c) => acc + (c.classes?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Net Earnings (80%)</span>
              <p className="text-2xl font-black text-green-600 mt-1">₹{(currentUser?.totalEarnings ?? 0).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-gray-400 block mt-0.5">20% deducted as platform commission</span>
            </div>
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-gray-100 dark:border-stone-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Gross Course Sales</span>
              <p className="text-2xl font-black text-saffron-600 mt-1">
                ₹{Math.round((currentUser?.totalEarnings ?? 0) / 0.8).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                YogaZen Fee (20%): ₹{Math.round(((currentUser?.totalEarnings ?? 0) / 0.8) * 0.2).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 🌟 PRIORITY SECTION: UPCOMING CLASSES IN NEXT 7 DAYS          */}
          {/* ============================================================== */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-saffron-500 animate-ping"></span>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    Upcoming Classes in Next 7 Days
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Classes scheduled across all your courses between today and {next7Days.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              {courses.length > 0 && (
                <button
                  onClick={() => openAddClassForCourse(courses[0]._id || courses[0].id)}
                  className="text-xs font-bold text-saffron-600 hover:text-saffron-700 hover:underline"
                >
                  + Schedule Class
                </button>
              )}
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-300 text-center">
                <span className="text-3xl">📅</span>
                <h3 className="text-base font-bold text-gray-800 mt-2">No Classes Scheduled for Next 7 Days</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Schedule live streams or lessons in your courses to keep your students actively practicing.
                </p>
                {courses.length > 0 && (
                  <button
                    onClick={() => openAddClassForCourse(courses[0]._id || courses[0].id)}
                    className="mt-4 px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    + Schedule Next Class
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-3xl p-6 border border-saffron-100 shadow-sm hover:shadow-md transition relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-saffron-50 text-saffron-700 border border-saffron-200">
                          {cls.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            cls.type === 'Live Stream'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cls.type === 'Live Stream' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
                          ></span>
                          {cls.type}
                        </span>
                      </div>

                      {/* Prominent Course Name Badge */}
                      <div className="mb-2">
                        <span className="text-[11px] font-black text-saffron-700 bg-saffron-50 px-2.5 py-1 rounded-xl border border-saffron-200/70 inline-flex items-center gap-1.5 shadow-2xs">
                          <span>📚 Course:</span>
                          <span className="truncate max-w-[210px]">{cls.courseTitle}</span>
                        </span>
                      </div>

                      {/* Schedule Time */}
                      <div className="text-xs font-bold text-saffron-600 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                        </svg>
                        <span>{formatDate(cls.scheduledAt)}</span>
                      </div>

                      {/* Class Title */}
                      <h4 className="text-base font-bold text-gray-900 leading-snug">{cls.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cls.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                        Course: <span className="text-gray-700 font-semibold">{cls.courseTitle}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {cls.type === 'Live Stream' && (
                          <button
                            type="button"
                            onClick={() => handleToggleLiveStatus(cls.courseId, cls)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                              cls.isLive
                                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {cls.isLive ? 'End Live ⏹' : 'Go Live 🔴'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const targetCourse = courses.find((c) => (c._id || c.id) === cls.courseId);
                            setActiveStreamingClass({
                              course: targetCourse || { title: cls.courseTitle },
                              classItem: cls
                            });
                          }}
                          className="px-3.5 py-1.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
                        >
                          <span>Studio Player ▶</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ============================================================== */}
          {/* 📚 SECTION: COURSES & NESTED CLASSES CURRICULUM                */}
          {/* ============================================================== */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  My Courses & Curriculum
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Organize your courses and manage individual classes inside each course
                </p>
              </div>

              <button
                onClick={handleOpenAddCourse}
                className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <span>+</span> Add Course
              </button>
            </div>

            {coursesError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                <span>⚠️ {coursesError}</span>
                <button onClick={fetchCourses} className="font-bold underline hover:text-red-900 cursor-pointer">
                  Try Again
                </button>
              </div>
            )}

            {isLoadingCourses ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center">
                <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-semibold text-gray-500">Loading your courses curriculum...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-dashed border-gray-300 text-center">
                <span className="text-4xl">🧘</span>
                <h3 className="text-lg font-bold text-gray-900 mt-3">No Courses Created Yet</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Create your first yoga or meditation course to start publishing classes for your students.
                </p>
                <button
                  onClick={handleOpenAddCourse}
                  className="mt-5 px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course, courseIndex) => {
                  const courseId = course._id || course.id;
                  const courseClasses = course.classes || [];
                  return (
                    <div
                      key={courseId}
                      className="bg-white dark:bg-stone-900 rounded-3xl border border-saffron-100/80 dark:border-stone-800 shadow-sm overflow-hidden transition"
                    >
                      {/* Course Card Header */}
                      <div
                        onClick={() => navigate(`/trainer/courses/${courseId}`)}
                        className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-saffron-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 hover:bg-saffron-50/30 dark:hover:bg-stone-800/60 transition cursor-pointer group"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-saffron-100 dark:bg-saffron-950/80 text-saffron-800 dark:text-saffron-300 border border-transparent dark:border-saffron-800">
                              {course.category}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 border border-transparent dark:border-stone-700">
                              {course.level}
                            </span>
                            <span className="text-[10px] font-bold text-saffron-600 dark:text-saffron-400 opacity-0 group-hover:opacity-100 transition">
                              Click to open course studio →
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-stone-100 group-hover:text-saffron-700 dark:group-hover:text-saffron-400 transition">
                            {courseIndex + 1}. {course.title}
                          </h3>
                          <div className="flex items-center gap-2 pt-0.5 text-xs">
                            <span className="text-amber-500 font-bold flex items-center gap-0.5">
                              ★ {course.rating ? course.rating.toFixed(1) : '5.0'}
                            </span>
                            <span className="text-gray-400 dark:text-stone-400">
                              ({course.reviews?.length || course.reviewsCount || 0} reviews)
                            </span>
                            <span className="text-gray-300 dark:text-stone-600">•</span>
                            <span className="text-gray-500 dark:text-stone-400">
                              👥 {course.enrolledCount || 0} enrolled
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-stone-400 leading-relaxed max-w-3xl">
                            {course.description}
                          </p>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 sm:gap-3 justify-between md:justify-end border-t border-gray-100 dark:border-stone-800 md:border-0 pt-3 md:pt-0 flex-wrap"
                        >
                          <div className="text-left md:text-right mr-2">
                            <span className="text-[11px] text-gray-400 dark:text-stone-400 block">Course Price</span>
                            <span className="text-lg font-extrabold text-saffron-600 dark:text-saffron-400">
                              {course.price > 0 ? `₹${course.price}` : 'Free'}
                            </span>
                          </div>

                          {/* Dedicated Course Studio & Classes Page */}
                          <Link
                            to={`/trainer/courses/${courseId}`}
                            className="px-3 py-2 bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm border border-stone-800 dark:border-stone-700"
                            title="Open Course Studio with all upcoming and recorded classes"
                          >
                            <span>📹 Classes & Studio (→)</span>
                          </Link>

                          {/* View public course page */}
                          <Link
                            to={`/courses/${courseId}`}
                            className="px-3 py-2 bg-gray-100 dark:bg-stone-800 hover:bg-saffron-50 dark:hover:bg-stone-700 text-gray-700 dark:text-stone-300 hover:text-saffron-700 dark:hover:text-saffron-400 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-transparent dark:border-stone-700"
                            title="Open course details page"
                          >
                            <span>👁️ Course Page</span>
                          </Link>

                          {/* Button to add class to this specific course */}
                          <button
                            onClick={() => openAddClassForCourse(courseId)}
                            className="px-3 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
                          >
                            <span>+</span> Add Class
                          </button>

                          {/* Accordion Expand / Collapse Button */}
                          <button
                            onClick={() => toggleCourseExpand(courseId)}
                            className="p-2 text-gray-400 dark:text-stone-400 hover:text-gray-700 dark:hover:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-800 rounded-xl transition"
                            title="Toggle Curriculum View"
                          >
                            <svg
                              className={`w-5 h-5 transition-transform duration-200 ${
                                expandedCourses[courseId] ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* NESTED CLASSES LISTING */}
                      {expandedCourses[courseId] && (
                        <div className="border-t border-gray-100 dark:border-stone-800 bg-gray-50/50 dark:bg-stone-950 p-6 sm:p-7 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-stone-400">
                              Curriculum Classes ({courseClasses.length})
                            </h4>
                            <span className="text-xs text-gray-400 dark:text-stone-500">
                              Total Duration: {courseClasses.reduce((sum, c) => sum + (c.duration ? parseInt(c.duration) || 45 : 45), 0)} mins
                            </span>
                          </div>

                          {courseClasses.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-gray-200 dark:border-stone-800 text-center">
                              <p className="text-xs text-gray-500 dark:text-stone-400">No classes in this course yet.</p>
                              <button
                                onClick={() => openAddClassForCourse(courseId)}
                                className="mt-2 text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline"
                              >
                                + Add the first class
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {courseClasses.map((cls, classIndex) => {
                                const classId = cls._id || cls.id;
                                return (
                                  <div
                                    key={classId}
                                    className={`bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                      cls.isLive
                                        ? 'border-red-300 dark:border-red-600 ring-2 ring-red-500/20'
                                        : 'border-gray-200/80 dark:border-stone-800 hover:border-saffron-200 dark:hover:border-stone-700'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3.5">
                                      <div className="w-8 h-8 rounded-full bg-saffron-50 dark:bg-stone-800 text-saffron-700 dark:text-saffron-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-saffron-200 dark:border-stone-700">
                                        #{classIndex + 1}
                                      </div>
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h5 className="text-sm font-bold text-gray-900 dark:text-stone-100">{cls.title}</h5>
                                          <span
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                              cls.type === 'Live Stream'
                                                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40'
                                            }`}
                                          >
                                            {cls.type}
                                          </span>
                                          {cls.isLive && (
                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse flex items-center gap-1">
                                              <span>●</span> LIVE NOW
                                            </span>
                                          )}
                                          {cls.status === 'completed' && (
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                                              ✓ Recorded
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">{cls.description}</p>
                                        <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-stone-500 mt-2 font-medium">
                                          <span>⏱️ {cls.duration}</span>
                                          {cls.scheduledAt && (
                                            <span className="text-saffron-700 dark:text-saffron-400 font-semibold">
                                              📅 Scheduled: {formatDate(cls.scheduledAt)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-stone-800">
                                      {cls.type === 'Live Stream' && (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleLiveStatus(courseId, cls)}
                                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                                            cls.isLive
                                              ? 'bg-red-600 hover:bg-red-700 text-white'
                                              : 'bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                          }`}
                                        >
                                          {cls.isLive ? 'End Stream ⏹' : 'Go Live 🔴'}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveStreamingClass({
                                            course,
                                            classItem: cls
                                          })
                                        }
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-stone-300 hover:text-saffron-600 dark:hover:text-saffron-400 bg-gray-50 dark:bg-stone-800 hover:bg-saffron-50 dark:hover:bg-stone-700 rounded-xl transition flex items-center gap-1 border border-gray-200 dark:border-stone-700"
                                      >
                                        <span>▶ Studio Player</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClass(courseId, classId)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                                        title="Delete Class"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* STUDENT REVIEWS SECTION */}
                          <div className="mt-6 pt-5 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                <span>⭐</span> Student Reviews & Ratings ({course.reviews?.length || 0})
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                                <span>★ {course.rating ? course.rating.toFixed(1) : '5.0'}</span>
                                <span className="text-gray-400 font-normal">/ 5.0</span>
                              </div>
                            </div>

                            {!course.reviews || course.reviews.length === 0 ? (
                              <div className="p-4 rounded-xl bg-white border border-gray-100 text-center text-xs text-gray-400">
                                No student reviews yet for this course.
                              </div>
                            ) : (
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {course.reviews.map((rev, rIdx) => (
                                  <div key={rIdx} className="p-3 bg-white rounded-xl border border-gray-100 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-gray-900">{rev.userName || 'Student Yogi'}</span>
                                        <span className="text-amber-400 font-bold">
                                          {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-gray-400">
                                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 text-[11px] leading-relaxed">
                                      "{rev.comment}"
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ============================================================== */}
      {/* ⚠️ MODAL: PROFILE REQUIRED PROMPT                              */}
      {/* ============================================================== */}
      {isProfileRequiredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-200 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
              🧘‍♀️
            </div>
            <h3 className="text-lg font-bold text-gray-900">Complete Your Profile First</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Before adding a course, YogaZen requires you to complete your instructor details (<strong>Full Name</strong>, <strong>Contact Number</strong>, <strong>Bio</strong>, and <strong>Training Specializations</strong>) so students can learn about your experience and expertise.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/trainer/profile"
                className="w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md shadow-saffron-500/20 transition text-center"
              >
                Go to Profile & Complete Details →
              </Link>
              <button
                onClick={() => setIsProfileRequiredModalOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                I'll Do It Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📝 MODAL: ADD NEW COURSE                                       */}
      {/* ============================================================== */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Create New Course</h3>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            {courseFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {courseFormError}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Course Title</label>
                <input
                  type="text"
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  required
                  placeholder="e.g. 21-Day Mindful Ashtanga Journey"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={courseFormData.category}
                    onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="Hatha Yoga">Hatha Yoga</option>
                    <option value="Vinyasa Flow">Vinyasa Flow</option>
                    <option value="Pranayama">Pranayama</option>
                    <option value="Meditation">Meditation</option>
                    <option value="Yin Yoga">Yin Yoga</option>
                    <option value="Sound Healing">Sound Healing</option>
                    <option value="Ayurveda Wellness">Ayurveda Wellness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={courseFormData.level}
                    onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  min="0"
                  value={courseFormData.price}
                  onChange={(e) => setCourseFormData({ ...courseFormData, price: e.target.value })}
                  placeholder="1499 (or 0 for free)"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Course Description</label>
                <textarea
                  rows={3}
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  required
                  placeholder="What will students learn in this curriculum?"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {isSubmittingCourse ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📝 MODAL: ADD CLASS INSIDE A COURSE                            */}
      {/* ============================================================== */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Class to Curriculum</h3>
                <p className="text-xs text-saffron-600 font-medium">
                  {courses.find((c) => (c._id || c.id) === targetCourseId)?.title}
                </p>
              </div>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Class Title</label>
                <input
                  type="text"
                  value={classFormData.title}
                  onChange={(e) => setClassFormData({ ...classFormData, title: e.target.value })}
                  required
                  placeholder="e.g. Day 1: Sun Salutation & Core Rooting"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Class Description</label>
                <textarea
                  rows={2}
                  value={classFormData.description}
                  onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                  placeholder="Specific asanas or techniques covered in this session"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Class Type</label>
                  <select
                    value={classFormData.type}
                    onChange={(e) => setClassFormData({ ...classFormData, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="Live Stream">🔴 Live Stream</option>
                    <option value="Video Lesson">🎬 Pre-recorded Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={classFormData.duration}
                    onChange={(e) => setClassFormData({ ...classFormData, duration: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-400 font-normal ml-1">
                    (Past dates strictly blocked)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={classFormData.scheduledAt}
                  onChange={(e) => setClassFormData({ ...classFormData, scheduledAt: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  YouTube Live / Video Link (or Custom Meeting URL)
                </label>
                <input
                  type="text"
                  value={classFormData.meetingUrl}
                  onChange={(e) => setClassFormData({ ...classFormData, meetingUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Paste any YouTube Live stream or video URL. Students will be able to watch it live or replay it directly on YogaZen!
                </p>
                {extractYouTubeId(classFormData.meetingUrl) && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-bold">
                    <span>✓</span>
                    <span>YouTube ID Detected: <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-950 font-mono">{extractYouTubeId(classFormData.meetingUrl)}</code> (Ready for in-platform Live Studio embed)</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isSubmittingClass && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>{isSubmittingClass ? 'Saving to Database...' : 'Schedule & Save Class'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* IN-PLATFORM LIVE STUDIO PLAYER MODAL (TRAINER VIEW) */}
      {/* ============================================================== */}
      {activeStreamingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Player Header */}
            <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                <div>
                  <h3 className="text-white text-sm sm:text-base font-bold flex items-center gap-2">
                    <span>{activeStreamingClass.classItem?.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      activeStreamingClass.classItem?.isLive
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-gray-800 text-gray-300'
                    }`}>
                      {activeStreamingClass.classItem?.isLive ? '🔴 LIVE STREAMING' : '📼 CLASS PREVIEW'}
                    </span>
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Course: {activeStreamingClass.course?.title || 'YogaZen Course'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeStreamingClass.classItem?.type === 'Live Stream' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleLiveStatus(
                        activeStreamingClass.course?._id || activeStreamingClass.course?.id,
                        activeStreamingClass.classItem
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      activeStreamingClass.classItem?.isLive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {activeStreamingClass.classItem?.isLive ? 'End Live Stream ⏹' : 'Start Live Stream 🔴'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveStreamingClass(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Player Embed Area */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {(() => {
                const ytId =
                  activeStreamingClass.classItem?.youtubeVideoId ||
                  extractYouTubeId(activeStreamingClass.classItem?.videoUrl || activeStreamingClass.classItem?.meetingUrl);
                
                if (ytId) {
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                      title={activeStreamingClass.classItem?.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  );
                }

                if (activeStreamingClass.classItem?.meetingUrl) {
                  return (
                    <div className="p-8 text-center space-y-4">
                      <span className="text-4xl block">📹</span>
                      <p className="text-white text-sm font-semibold">
                        Custom External Session Link Configured
                      </p>
                      <a
                        href={activeStreamingClass.classItem.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition"
                      >
                        Open External Meeting Room (→)
                      </a>
                    </div>
                  );
                }

                return (
                  <div className="p-8 text-center space-y-2">
                    <span className="text-4xl block">🧘</span>
                    <p className="text-gray-400 text-xs">
                      No video stream URL configured for this class yet. Edit the class to attach a YouTube Live stream ID or video link.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Live Studio Controls & Instructions */}
            <div className="p-5 bg-gray-950 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
              <div className="space-y-1">
                <span className="text-white font-bold block">
                  Interactive Live Studio
                </span>
                <p className="text-[11px] text-gray-400">
                  Students enrolled in this course can view this session simultaneously in their dedicated Learning Studio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ytId =
                      activeStreamingClass.classItem?.youtubeVideoId ||
                      extractYouTubeId(activeStreamingClass.classItem?.videoUrl || activeStreamingClass.classItem?.meetingUrl);
                    if (ytId) {
                      window.open(`https://www.youtube.com/live_dashboard?v=${ytId}`, '_blank');
                    } else {
                      window.open('https://studio.youtube.com', '_blank');
                    }
                  }}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <span>📺 YouTube Live Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TrainerDashboard;
