import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiTrainerGetCourses, apiTrainerCreateCourse } from '../services/api';

const TrainerDashboard = () => {
  const { currentUser, role, isLoggedIn, isLoading, openAuthModal } = useAuth();

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

  // Handler: Add Class to Course
  const handleCreateClass = (e) => {
    e.preventDefault();
    const newClass = {
      id: `cls-${Date.now()}`,
      title: classFormData.title,
      description: classFormData.description,
      duration: Number(classFormData.duration) || 45,
      scheduledAt: new Date(classFormData.scheduledAt).toISOString(),
      type: classFormData.type,
      meetingUrl: classFormData.meetingUrl || 'https://meet.yogazen.com/live',
    };

    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if ((c._id || c.id) === targetCourseId) {
          return {
            ...c,
            classes: [...(c.classes || []), newClass],
          };
        }
        return c;
      })
    );

    setIsAddClassModalOpen(false);
  };

  // Handler: Delete Class
  const handleDeleteClass = (courseId, classId) => {
    if (window.confirm('Are you sure you want to remove this class from the curriculum?')) {
      setCourses((prev) =>
        prev.map((c) => {
          if ((c._id || c.id) === courseId) {
            return {
              ...c,
              classes: (c.classes || []).filter((cls) => (cls._id || cls.id) !== classId),
            };
          }
          return c;
        })
      );
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
                Apply to Teach on YogaZen 🌿
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Welcome & Instructor Status Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-saffron-600 text-white flex items-center justify-center text-3xl font-black shadow-md shadow-saffron-600/20">
                🧘‍♂️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentUser?.name || 'Instructor Portal'}
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                    Trainer View
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your course curriculums, schedule live sessions, and monitor student enrollments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/trainer/profile"
                className="px-4 py-2 text-xs font-bold text-saffron-700 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 rounded-xl transition"
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
            <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-900">Your Trainer Profile is Incomplete</h3>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed max-w-2xl">
                    To maintain quality teaching standards on YogaZen, trainers must complete their profile before adding or publishing courses. Please enter your <strong>Full Name</strong>, <strong>Contact Phone</strong>, <strong>Bio</strong>, and <strong>Teaching Specializations</strong>.
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
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Revenue</span>
              <p className="text-2xl font-black text-green-600 mt-1">₹{currentUser?.totalEarnings ?? 0}</p>
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

                      <button
                        onClick={() =>
                          alert(`Starting ${cls.type}: "${cls.title}". Meeting Link: ${cls.meetingUrl}`)
                        }
                        className="px-3.5 py-1.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        {cls.type === 'Live Stream' ? 'Go Live 🔴' : 'View Class'}
                      </button>
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
                      className="bg-white rounded-3xl border border-saffron-100/80 shadow-sm overflow-hidden transition"
                    >
                      {/* Course Card Header */}
                      <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-saffron-50/20">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                              {course.category}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {course.level}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                            {courseIndex + 1}. {course.title}
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                            {course.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-[11px] text-gray-400 block">Course Price</span>
                            <span className="text-lg font-extrabold text-saffron-600">
                              {course.price > 0 ? `₹${course.price}` : 'Free'}
                            </span>
                          </div>

                          {/* Button to add class to this specific course */}
                          <button
                            onClick={() => openAddClassForCourse(courseId)}
                            className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                          >
                            <span>+</span> Add Class
                          </button>

                          {/* Accordion Expand / Collapse Button */}
                          <button
                            onClick={() => toggleCourseExpand(courseId)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
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
                        <div className="border-t border-gray-100 bg-gray-50/50 p-6 sm:p-7 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                              Curriculum Classes ({courseClasses.length})
                            </h4>
                            <span className="text-xs text-gray-400">
                              Total Duration: {courseClasses.reduce((sum, c) => sum + (c.duration || 0), 0)} mins
                            </span>
                          </div>

                          {courseClasses.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center">
                              <p className="text-xs text-gray-500">No classes in this course yet.</p>
                              <button
                                onClick={() => openAddClassForCourse(courseId)}
                                className="mt-2 text-xs font-bold text-saffron-600 hover:underline"
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
                                    className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 hover:border-saffron-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                                  >
                                    <div className="flex items-start gap-3.5">
                                      <div className="w-8 h-8 rounded-full bg-saffron-50 text-saffron-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                        #{classIndex + 1}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h5 className="text-sm font-bold text-gray-900">{cls.title}</h5>
                                          <span
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                              cls.type === 'Live Stream'
                                                ? 'bg-red-50 text-red-600 border border-red-200'
                                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                                            }`}
                                          >
                                            {cls.type}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{cls.description}</p>
                                        <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-2 font-medium">
                                          <span>⏱️ {cls.duration} mins</span>
                                          {cls.scheduledAt && (
                                            <span className="text-saffron-700 font-semibold">
                                              📅 Scheduled: {formatDate(cls.scheduledAt)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                                      <button
                                        onClick={() =>
                                          alert(`Previewing Class #${classIndex + 1}: ${cls.title}\nLink: ${cls.meetingUrl}`)
                                        }
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-saffron-600 bg-gray-50 hover:bg-saffron-50 rounded-xl transition"
                                      >
                                        Preview
                                      </button>
                                      <button
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
              Before adding a course, YogaZen requires you to complete your instructor details (<strong>Full Name</strong>, <strong>Contact Number</strong>, <strong>Bio</strong>, and <strong>Teaching Specializations</strong>) so students can learn about your experience and expertise.
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
                  Scheduled Date & Time (Select date in next 7 days to feature on dashboard)
                </label>
                <input
                  type="datetime-local"
                  value={classFormData.scheduledAt}
                  onChange={(e) => setClassFormData({ ...classFormData, scheduledAt: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Meeting URL or Video Link</label>
                <input
                  type="url"
                  value={classFormData.meetingUrl}
                  onChange={(e) => setClassFormData({ ...classFormData, meetingUrl: e.target.value })}
                  placeholder="https://meet.yogazen.com/session-xyz"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Add Class
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

      <Footer />
    </div>
  );
};

export default TrainerDashboard;
