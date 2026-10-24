import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const TrainerDashboard = () => {
  const { currentUser } = useAuth();

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

  // Helper to generate dynamic dates relative to now
  const getFutureDate = (daysAhead, hours = 7, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // State: Courses with Nested Classes
  const [courses, setCourses] = useState([
    {
      id: 'course-1',
      title: 'Hatha Yoga Foundations for Vitality',
      category: 'Hatha Yoga',
      level: 'All Levels',
      price: 1499,
      description: 'Master the 12 core classical asanas, pranic alignment, and grounded meditative breath.',
      classes: [
        {
          id: 'cls-101',
          title: 'Opening Sun Salutations & Breath Alignment',
          description: 'Surya Namaskar A & B with deep ujjayi breathing.',
          duration: 45,
          scheduledAt: getFutureDate(1, 7, 0), // Tomorrow 7:00 AM (Within next 7 days!)
          type: 'Live Stream',
          meetingUrl: 'https://meet.yogazen.com/hatha-foundations-1',
        },
        {
          id: 'cls-102',
          title: 'Standing Postures & Core Rooting',
          description: 'Trikonasana, Virabhadrasana series, and balance poses.',
          duration: 60,
          scheduledAt: getFutureDate(3, 7, 0), // 3 days ahead (Within next 7 days!)
          type: 'Live Stream',
          meetingUrl: 'https://meet.yogazen.com/hatha-foundations-2',
        },
        {
          id: 'cls-103',
          title: 'Seated Hip Openers & Restorative Forward Folds',
          description: 'Pashchimottanasana and gentle spinal unwinding.',
          duration: 50,
          scheduledAt: getFutureDate(10, 18, 30), // 10 days ahead (Beyond 7 days)
          type: 'Video Lesson',
          meetingUrl: 'https://video.yogazen.com/hatha-foundations-3',
        },
      ],
    },
    {
      id: 'course-2',
      title: '7-Day Sacred Pranayama & Mindful Stillness',
      category: 'Pranayama',
      level: 'Beginner',
      price: 999,
      description: 'Unlock energy channels through Nadi Shodhana, Kapalabhati, and Bhramari sound therapy.',
      classes: [
        {
          id: 'cls-201',
          title: 'Prana Vayu & Diaphragmatic Breath Awareness',
          description: 'Awakening the subtle body and breathing mechanics.',
          duration: 35,
          scheduledAt: getFutureDate(2, 6, 30), // 2 days ahead (Within next 7 days!)
          type: 'Live Stream',
          meetingUrl: 'https://meet.yogazen.com/pranayama-live-1',
        },
        {
          id: 'cls-202',
          title: 'Nadi Shodhana: Channel Purification',
          description: 'Alternate nostril rhythmic balancing for mental tranquility.',
          duration: 40,
          scheduledAt: getFutureDate(5, 6, 30), // 5 days ahead (Within next 7 days!)
          type: 'Live Stream',
          meetingUrl: 'https://meet.yogazen.com/pranayama-live-2',
        },
      ],
    },
  ]);

  // Expanded course cards tracking (open by default for convenience)
  const [expandedCourses, setExpandedCourses] = useState({
    'course-1': true,
    'course-2': true,
  });

  const toggleCourseExpand = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  // --- Add Course Modal State ---
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
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

  // Calculate Upcoming Classes in the next 7 days across ALL courses
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const upcomingClasses = [];
  courses.forEach((course) => {
    course.classes.forEach((cls) => {
      const classDate = new Date(cls.scheduledAt);
      if (classDate >= now && classDate <= next7Days) {
        upcomingClasses.push({
          ...cls,
          courseId: course.id,
          courseTitle: course.title,
          category: course.category,
        });
      }
    });
  });

  // Sort upcoming classes chronologically
  upcomingClasses.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  // Handler: Add New Course
  const handleCreateCourse = (e) => {
    e.preventDefault();
    const newCourse = {
      id: `course-${Date.now()}`,
      title: courseFormData.title,
      category: courseFormData.category,
      level: courseFormData.level,
      price: Number(courseFormData.price) || 0,
      description: courseFormData.description,
      classes: [],
    };
    setCourses([newCourse, ...courses]);
    setExpandedCourses((prev) => ({ ...prev, [newCourse.id]: true }));
    setIsAddCourseModalOpen(false);
    setCourseFormData({
      title: '',
      category: 'Hatha Yoga',
      level: 'Beginner',
      price: '',
      description: '',
    });
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
        if (c.id === targetCourseId) {
          return {
            ...c,
            classes: [...c.classes, newClass],
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
          if (c.id === courseId) {
            return {
              ...c,
              classes: c.classes.filter((cls) => cls.id !== classId),
            };
          }
          return c;
        })
      );
    }
  };

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
                onClick={() => setIsAddCourseModalOpen(true)}
                className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-saffron-500/20 flex items-center gap-1.5"
              >
                <span>+</span> Add New Course
              </button>
            </div>
          </div>

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
                {courses.reduce((acc, c) => acc + c.classes.length, 0)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Revenue</span>
              <p className="text-2xl font-black text-green-600 mt-1">₹{currentUser?.totalEarnings || '14,290'}</p>
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
                  onClick={() => openAddClassForCourse(courses[0].id)}
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
                    onClick={() => openAddClassForCourse(courses[0].id)}
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
                onClick={() => setIsAddCourseModalOpen(true)}
                className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <span>+</span> Add Course
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-dashed border-gray-300 text-center">
                <span className="text-4xl">🧘</span>
                <h3 className="text-lg font-bold text-gray-900 mt-3">No Courses Created Yet</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Create your first yoga or meditation course to start publishing classes for your students.
                </p>
                <button
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="mt-5 px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course, courseIndex) => (
                  <div
                    key={course.id}
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
                          onClick={() => openAddClassForCourse(course.id)}
                          className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                        >
                          <span>+</span> Add Class
                        </button>

                        {/* Accordion Expand / Collapse Button */}
                        <button
                          onClick={() => toggleCourseExpand(course.id)}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                          title="Toggle Curriculum View"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${
                              expandedCourses[course.id] ? 'rotate-180' : ''
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
                    {expandedCourses[course.id] && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-6 sm:p-7 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                            Curriculum Classes ({course.classes.length})
                          </h4>
                          <span className="text-xs text-gray-400">
                            Total Duration: {course.classes.reduce((sum, c) => sum + c.duration, 0)} mins
                          </span>
                        </div>

                        {course.classes.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center">
                            <p className="text-xs text-gray-500">No classes in this course yet.</p>
                            <button
                              onClick={() => openAddClassForCourse(course.id)}
                              className="mt-2 text-xs font-bold text-saffron-600 hover:underline"
                            >
                              + Add the first class
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {course.classes.map((cls, classIndex) => (
                              <div
                                key={cls.id}
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
                                    onClick={() => handleDeleteClass(course.id, cls.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition"
                                    title="Delete Class"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

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
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Create Course
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
                  {courses.find((c) => c.id === targetCourseId)?.title}
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
