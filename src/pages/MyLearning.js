import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiGetEnrolledCourses, apiUpdateCourseProgress } from '../services/api';

// Helper to extract YouTube Video or Live ID from various URL formats
const extractYouTubeId = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : '';
};

const MyLearning = () => {
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const { showNotification } = useNotification();

  const [enrolledList, setEnrolledList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || null);
  const [activePlayingClass, setActivePlayingClass] = useState(null);
  const [curriculumFilter, setCurriculumFilter] = useState('all'); // 'all' | 'live' | 'recorded'

  // Helper to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch enrolled courses from backend
  const fetchMyCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGetEnrolledCourses();
      if (res?.success && Array.isArray(res.enrolledCourses)) {
        setEnrolledList(res.enrolledCourses);
      }
    } catch (err) {
      console.warn('Failed to fetch enrolled courses:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn) {
        openAuthModal('Please sign in to access your enrolled courses and live classes.');
      } else {
        fetchMyCourses();
      }
    }
  }, [isLoggedIn, isAuthLoading, openAuthModal, fetchMyCourses]);

  // Aggregate ongoing live classes across all enrolled courses
  const ongoingLiveClasses = [];
  // Aggregate upcoming scheduled classes across all enrolled courses
  const upcomingClasses = [];

  enrolledList.forEach((enrollment) => {
    const course = enrollment.course;
    if (!course || !Array.isArray(course.classes)) return;

    course.classes.forEach((cls) => {
      const clsData = {
        ...cls,
        courseId: course._id || course.id,
        courseTitle: course.title,
        trainerName: course.trainer?.name || 'Acharya Instructor',
        trainerBio: course.trainer?.bio || '',
        enrollmentId: enrollment._id
      };

      if (cls.isLive || cls.status === 'live') {
        ongoingLiveClasses.push(clsData);
      } else if (cls.scheduledAt && new Date(cls.scheduledAt) > new Date() && cls.status !== 'completed') {
        upcomingClasses.push(clsData);
      }
    });
  });

  // Sort upcoming classes chronologically
  upcomingClasses.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  // Find currently active selected course
  const selectedEnrollment = enrolledList.find(
    (e) => (e.course?._id || e.course?.id) === selectedCourseId
  );
  const selectedCourse = selectedEnrollment?.course || null;

  // Toggle class completion attendance progress
  const handleToggleComplete = async (courseId, classId, currentCompleted = []) => {
    const idStr = String(classId);
    const isCompleted = currentCompleted.includes(idStr);
    const updatedCompleted = isCompleted
      ? currentCompleted.filter((id) => String(id) !== idStr)
      : [...currentCompleted, idStr];

    const totalClasses = selectedCourse?.classes?.length || 1;
    const progressPercentage = Math.min(100, Math.round((updatedCompleted.length / totalClasses) * 100));

    try {
      const orderId = selectedEnrollment?.orderId || selectedEnrollment?._id || courseId;
      if (orderId) {
        await apiUpdateCourseProgress(orderId, {
          courseId,
          completedClasses: updatedCompleted,
          progressPercentage
        });
      }

      // Update local state
      setEnrolledList((prev) =>
        prev.map((item) => {
          if ((item.course?._id || item.course?.id) === courseId) {
            return {
              ...item,
              progress: progressPercentage,
              completedClasses: updatedCompleted
            };
          }
          return item;
        })
      );

      showNotification(
        isCompleted ? 'Class marked as uncompleted' : 'Class marked as completed! Keep up your practice.',
        'success'
      );
    } catch (err) {
      showNotification(err.message || 'Failed to update progress', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-saffron-600 via-saffron-500 to-amber-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-saffron-500/15 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wide">
                <span>🧘</span>
                <span>Mindful Learning Sanctuary</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                My Learning & Live Yoga Studio
              </h1>
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
                Experience real-time interactive live yoga classes, access recorded session archives, and track your daily mindful asana progress.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                className="px-5 py-2.5 rounded-xl bg-white text-saffron-700 hover:bg-saffron-50 text-xs font-black transition shadow-sm"
              >
                + Browse More Courses
              </Link>
              <Link
                to="/profile"
                className="px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition border border-white/20"
              >
                User Profile
              </Link>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ACTIVE IN-PLATFORM VIDEO / LIVE PLAYER VIEW (IF CLASS SELECTED) */}
          {/* ============================================================== */}
          {activePlayingClass && (
            <div className="mb-10 bg-gray-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-gray-800 animate-in fade-in zoom-in-95 duration-200">
              {/* Player Top Bar */}
              <div className="px-6 py-4 bg-gray-900/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      activePlayingClass.isLive || activePlayingClass.status === 'live'
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                  ></span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                      <span>{activePlayingClass.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          activePlayingClass.isLive || activePlayingClass.status === 'live'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {activePlayingClass.isLive || activePlayingClass.status === 'live'
                          ? '🔴 LIVE CLASSROOM'
                          : '📼 RECORDED SESSION'}
                      </span>
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {activePlayingClass.courseTitle} • Instructor: {activePlayingClass.trainerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActivePlayingClass(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition text-sm"
                    title="Close Video Player"
                  >
                    ✕ Close Player
                  </button>
                </div>
              </div>

              {/* Video Embed */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                {(() => {
                  const isFutureScheduled =
                    activePlayingClass.scheduledAt &&
                    new Date(activePlayingClass.scheduledAt) > new Date() &&
                    !activePlayingClass.isLive;

                  if (isFutureScheduled) {
                    return (
                      <div className="p-8 text-center space-y-3 max-w-md mx-auto">
                        <span className="text-4xl block">🗓️</span>
                        <h4 className="text-sm font-bold text-white">{activePlayingClass.title}</h4>
                        <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold rounded-full">
                          Upcoming Scheduled Class
                        </span>
                        <p className="text-stone-300 text-xs leading-relaxed">
                          This class is scheduled for{' '}
                          <strong>
                            {new Date(activePlayingClass.scheduledAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </strong>
                          . The video and live session will unlock at the scheduled class time.
                        </p>
                      </div>
                    );
                  }

                  const ytId =
                    activePlayingClass.youtubeVideoId ||
                    extractYouTubeId(activePlayingClass.videoUrl || activePlayingClass.meetingUrl || activePlayingClass.recordingUrl);

                  if (ytId) {
                    return (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                        title={activePlayingClass.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    );
                  }

                  if (activePlayingClass.meetingUrl) {
                    return (
                      <div className="p-8 text-center space-y-4">
                        <span className="text-5xl block">📹</span>
                        <p className="text-white text-sm font-semibold">
                          Live Session Room Hosted via Meeting Link
                        </p>
                        <a
                          href={activePlayingClass.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition shadow-md"
                        >
                          Join External Session Room (→)
                        </a>
                      </div>
                    );
                  }

                  return (
                    <div className="p-8 text-center space-y-2">
                      <span className="text-4xl block">🧘</span>
                      <p className="text-gray-400 text-xs">
                        This session is scheduled to broadcast soon. Your instructor will activate the live stream at the scheduled time.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Lesson Summary & Completion */}
              <div className="p-5 sm:p-6 bg-gray-900/60 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-400">Class Overview</h4>
                  <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                    {activePlayingClass.description || 'Guided yoga asana sequences, mindful breathing, and focused alignment cues.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleComplete(
                        activePlayingClass.courseId,
                        activePlayingClass._id || activePlayingClass.id,
                        selectedEnrollment?.completedClasses || []
                      )
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <span>✓ Mark Session Completed</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 1: ONGOING LIVE CLASSES (ACROSS ALL ENROLLED COURSES) */}
          {/* ============================================================== */}
          {ongoingLiveClasses.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span>🔴 Ongoing Live Classes Right Now</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider">
                    Live Stream Active
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingLiveClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-6 border-2 border-red-300 ring-4 ring-red-500/10 shadow-lg shadow-red-500/5 flex flex-col justify-between gap-4 transition hover:border-red-400"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse flex items-center gap-1">
                          <span>●</span> LIVE BROADCAST
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">
                          Duration: {cls.duration || '45 mins'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-gray-900">{cls.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{cls.description}</p>
                      <p className="text-xs text-saffron-700 font-bold">
                        Course: {cls.courseTitle} • Trainer: {cls.trainerName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(cls.courseId);
                        setActivePlayingClass(cls);
                        window.scrollTo({ top: 180, behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/25 flex items-center justify-center gap-2"
                    >
                      <span>▶ Join Live Classroom Studio</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: UPCOMING SCHEDULED CLASSES */}
          {/* ============================================================== */}
          {upcomingClasses.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span>📅 Upcoming Scheduled Classes</span>
                  <span className="text-xs font-bold text-gray-400">({upcomingClasses.length} Scheduled)</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingClasses.slice(0, 6).map((cls, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-5 border border-saffron-100/90 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Prominent Course Name Badge */}
                      <div className="mb-2.5">
                        <span className="text-[11px] font-black text-saffron-700 bg-saffron-50 px-2.5 py-1 rounded-xl border border-saffron-200/70 inline-flex items-center gap-1.5 shadow-2xs">
                          <span>📚 Course:</span>
                          <span className="truncate max-w-[200px]">{cls.courseTitle}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-saffron-50 text-saffron-700 border border-saffron-200">
                          {cls.type}
                        </span>
                        <span className="text-xs font-extrabold text-saffron-600 flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{cls.duration || '45 mins'}</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{cls.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{cls.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Scheduled</span>
                        <span className="font-extrabold text-gray-700 text-[11px]">
                          {formatDate(cls.scheduledAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(cls.courseId);
                          setActivePlayingClass(cls);
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-saffron-50 text-gray-700 hover:text-saffron-700 rounded-xl text-xs font-bold transition"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: COURSE CLASSROOM VIEW (IF SPECIFIC COURSE SELECTED) */}
          {/* ============================================================== */}
          {selectedCourse ? (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm space-y-6">
              {/* Selected Course Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(null)}
                      className="text-xs font-bold text-saffron-600 hover:underline flex items-center gap-1"
                    >
                      ← Back to All Courses
                    </button>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                      {selectedCourse.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {selectedCourse.level}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">{selectedCourse.title}</h2>
                  <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">{selectedCourse.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-saffron-50/70 p-3 rounded-2xl border border-saffron-100 text-right">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Learning Progress</span>
                    <span className="text-sm font-black text-saffron-700">
                      {selectedEnrollment?.progress || 0}% Completed
                    </span>
                  </div>
                  <Link
                    to={`/courses/${selectedCourse._id || selectedCourse.id}`}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                  >
                    Course Details Page
                  </Link>
                </div>
              </div>

              {/* Curriculum Classes Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl">
                  {[
                    { id: 'all', label: 'All Classes', count: selectedCourse.classes?.length || 0 },
                    {
                      id: 'live',
                      label: 'Live & Scheduled',
                      count: (selectedCourse.classes || []).filter(
                        (c) => c.isLive || (c.scheduledAt && new Date(c.scheduledAt) > new Date())
                      ).length
                    },
                    {
                      id: 'recorded',
                      label: 'Recorded Sessions',
                      count: (selectedCourse.classes || []).filter(
                        (c) => c.status === 'completed' || c.recordingUrl || c.type === 'Recorded' || (c.scheduledAt && new Date(c.scheduledAt) <= new Date() && !c.isLive)
                      ).length
                    }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCurriculumFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        curriculumFilter === tab.id
                          ? 'bg-saffron-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          curriculumFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Classes List */}
              {(!selectedCourse.classes || selectedCourse.classes.length === 0) ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <span className="text-4xl block">🧘</span>
                  <p className="text-xs text-gray-500 font-semibold">
                    No classes have been added to this course curriculum yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCourse.classes
                    .filter((cls) => {
                      if (curriculumFilter === 'live') {
                        return cls.isLive || (cls.scheduledAt && new Date(cls.scheduledAt) > new Date());
                      }
                      if (curriculumFilter === 'recorded') {
                        return cls.status === 'completed' || cls.recordingUrl || cls.type === 'Recorded' || (cls.scheduledAt && new Date(cls.scheduledAt) <= new Date() && !cls.isLive);
                      }
                      return true;
                    })
                    .map((cls, classIdx) => {
                      const classId = cls._id || cls.id;
                      const isCompleted = (selectedEnrollment?.completedClasses || []).includes(String(classId));

                      return (
                        <div
                          key={classId || classIdx}
                          className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            cls.isLive
                              ? 'bg-red-50/50 border-red-300 ring-2 ring-red-500/10'
                              : isCompleted
                              ? 'bg-emerald-50/30 border-emerald-200'
                              : 'bg-white border-gray-200 hover:border-saffron-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleComplete(
                                  selectedCourse._id || selectedCourse.id,
                                  classId,
                                  selectedEnrollment?.completedClasses || []
                                )
                              }
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition mt-0.5 ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'border-2 border-gray-300 hover:border-emerald-500 text-gray-400'
                              }`}
                              title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                            >
                              {isCompleted ? '✓' : classIdx + 1}
                            </button>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900">{cls.title}</h4>
                                {cls.isLive && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white animate-pulse">
                                    🔴 LIVE NOW
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {cls.type}
                                </span>
                                {cls.status === 'completed' && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    ✓ Recorded
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{cls.description}</p>
                              <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium pt-1">
                                <span>⏱️ {cls.duration || '45 mins'}</span>
                                {cls.scheduledAt && (
                                  <span className="text-saffron-700 font-semibold">
                                    📅 {formatDate(cls.scheduledAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setActivePlayingClass({
                                  ...cls,
                                  courseId: selectedCourse._id || selectedCourse.id,
                                  courseTitle: selectedCourse.title,
                                  trainerName: selectedCourse.trainer?.name || 'Instructor'
                                });
                                window.scrollTo({ top: 180, behavior: 'smooth' });
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                                cls.isLive
                                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                  : 'bg-saffron-500 hover:bg-saffron-600 text-white'
                              }`}
                            >
                              <span>{cls.isLive ? '🔴 Join Live Stream' : '▶ Play Class'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          ) : (
            /* ============================================================== */
            /* SECTION 4: ALL ENROLLED COURSES CARDS VIEW */
            /* ============================================================== */
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    Your Enrolled Courses ({enrolledList.length})
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click any course card to open its classes, scheduled live streams, and session recordings.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-bold text-gray-400">Loading your enrolled courses...</p>
                </div>
              ) : enrolledList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-saffron-100 shadow-sm space-y-4">
                  <span className="text-5xl block">🧘‍♀️</span>
                  <h3 className="text-lg font-bold text-gray-800">No Enrolled Courses Yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    You haven't enrolled in any yoga or meditation programs yet. Explore certified courses led by top Acharya instructors!
                  </p>
                  <Link
                    to="/courses"
                    className="inline-block px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Discover Yoga Courses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledList.map((enrollment, idx) => {
                    const course = enrollment.course;
                    if (!course) return null;
                    const courseId = course._id || course.id;
                    const classesCount = course.classes?.length || 0;
                    const progress = enrollment.progress || 0;

                    return (
                      <div
                        key={courseId || idx}
                        onClick={() => {
                          setSelectedCourseId(courseId);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="bg-white rounded-3xl border border-saffron-100/90 hover:border-saffron-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          {/* Thumbnail */}
                          <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                            <img
                              src={course.thumbnail || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-white uppercase tracking-wider">
                                {course.category || 'Yoga Course'}
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-gray-800 shadow-sm">
                                {classesCount} Classes
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-2">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-saffron-600 transition leading-snug">
                              {course.title}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                            <p className="text-xs text-gray-400 font-semibold pt-1">
                              Trainer: <strong className="text-gray-700">{course.trainer?.name || 'Acharya'}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar & Footer */}
                        <div className="p-5 pt-0 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
                              <span>Course Progress</span>
                              <span className="text-saffron-600 font-black">{progress}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full bg-saffron-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-saffron-600 font-extrabold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                              Open Classroom & Classes →
                            </span>
                            <span className="text-gray-400 text-[11px]">
                              {course.duration || '4 Weeks'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MyLearning;
