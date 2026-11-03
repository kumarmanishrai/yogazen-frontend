import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  apiTrainerGetCourseById,
  apiTrainerAddClass,
  apiTrainerUpdateClass,
  apiTrainerDeleteClass,
  apiTrainerSetClassLive
} from '../services/api';

// Helper to extract YouTube Video or Live Stream ID
const extractYouTubeId = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : '';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TrainerCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { trainerInfo } = useAuth();
  const { showNotification, showConfirmation } = useNotification();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'upcoming' | 'recorded'
  const [activePreviewClass, setActivePreviewClass] = useState(null);

  // Add / Edit Class Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classFormData, setClassFormData] = useState({
    title: '',
    description: '',
    duration: 45,
    scheduledAt: '',
    type: 'Live Stream',
    videoUrl: ''
  });

  // Calculate now in ISO string slice for datetime picker min attribute
  const minDateTime = new Date().toISOString().slice(0, 16);

  const fetchCourse = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiTrainerGetCourseById(courseId);
      if (res?.success && res.course) {
        setCourse(res.course);
      } else {
        showNotification(res?.message || 'Course not found', 'error');
        navigate('/trainer/dashboard');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to load course details', 'error');
      navigate('/trainer/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, navigate, showNotification]);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, fetchCourse]);

  // Open Modal for New Class
  const handleOpenAddModal = () => {
    const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const localIso = new Date(defaultTime.getTime() - defaultTime.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setEditingClassId(null);
    setClassFormData({
      title: '',
      description: '',
      duration: 45,
      scheduledAt: localIso,
      type: 'Live Stream',
      videoUrl: ''
    });
    setIsModalOpen(true);
  };

  // Open Modal for Editing Class
  const handleOpenEditModal = (cls) => {
    setEditingClassId(cls._id || cls.id);
    let schedIso = '';
    if (cls.scheduledAt) {
      const dt = new Date(cls.scheduledAt);
      schedIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }

    setClassFormData({
      title: cls.title || '',
      description: cls.description || '',
      duration: parseInt(cls.duration, 10) || 45,
      scheduledAt: schedIso,
      type: cls.type || 'Live Stream',
      videoUrl: cls.videoUrl || cls.meetingUrl || cls.recordingUrl || ''
    });
    setIsModalOpen(true);
  };

  // Save Class (Create or Update)
  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!classFormData.title.trim()) {
      showNotification('Class title is required', 'warning');
      return;
    }

    // STRICT VALIDATION: Prevent back-dating
    if (classFormData.scheduledAt) {
      const schedDate = new Date(classFormData.scheduledAt);
      if (schedDate < new Date(Date.now() - 2 * 60 * 1000)) {
        showNotification('Scheduled date & time cannot be in the past. Please select a future time.', 'warning');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const ytId = extractYouTubeId(classFormData.videoUrl);
      const payload = {
        title: classFormData.title.trim(),
        description: classFormData.description.trim(),
        duration: `${Number(classFormData.duration) || 45} mins`,
        scheduledAt: classFormData.scheduledAt ? new Date(classFormData.scheduledAt).toISOString() : new Date().toISOString(),
        type: classFormData.type,
        meetingUrl: classFormData.videoUrl.trim(),
        videoUrl: classFormData.videoUrl.trim(),
        recordingUrl: classFormData.type === 'Recorded' ? classFormData.videoUrl.trim() : '',
        youtubeVideoId: ytId
      };

      if (editingClassId) {
        const res = await apiTrainerUpdateClass(courseId, editingClassId, payload);
        if (res?.success) {
          showNotification('Class updated successfully!', 'success');
          setIsModalOpen(false);
          fetchCourse();
        } else {
          showNotification(res?.message || 'Failed to update class', 'error');
        }
      } else {
        const res = await apiTrainerAddClass(courseId, payload);
        if (res?.success) {
          showNotification('Class added to course curriculum successfully!', 'success');
          setIsModalOpen(false);
          fetchCourse();
        } else {
          showNotification(res?.message || 'Failed to add class', 'error');
        }
      }
    } catch (err) {
      showNotification(err.message || 'Error saving class', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Class with Confirmation
  const handleDeleteClass = (cls) => {
    const classId = cls._id || cls.id;
    showConfirmation({
      title: 'Delete Class Confirmation',
      message: `Are you sure you want to remove the class "${cls.title}"? This cannot be undone.`,
      confirmText: 'Delete Class',
      cancelText: 'Keep Class',
      onConfirm: async () => {
        try {
          const res = await apiTrainerDeleteClass(courseId, classId);
          if (res?.success) {
            showNotification('Class removed from course.', 'success');
            if (activePreviewClass?._id === classId || activePreviewClass?.id === classId) {
              setActivePreviewClass(null);
            }
            fetchCourse();
          } else {
            showNotification(res?.message || 'Failed to delete class', 'error');
          }
        } catch (err) {
          showNotification(err.message || 'Error deleting class', 'error');
        }
      }
    });
  };

  // Toggle Live Status (Start / End Stream)
  const handleToggleLive = async (cls) => {
    const classId = cls._id || cls.id;
    const willBeLive = !cls.isLive;

    try {
      const res = await apiTrainerSetClassLive(courseId, classId, {
        isLive: willBeLive,
        videoUrl: cls.videoUrl || cls.meetingUrl || '',
        youtubeVideoId: cls.youtubeVideoId || extractYouTubeId(cls.videoUrl || cls.meetingUrl)
      });
      if (res?.success) {
        showNotification(
          willBeLive ? '🔴 Class is now LIVE! Students can join stream.' : 'Live stream ended. Class saved to recordings archive.',
          'success'
        );
        fetchCourse();
      } else {
        showNotification(res?.message || 'Failed to update live status', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error updating live status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-between font-nunito">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading Course Studio...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) return null;

  const classes = course.classes || [];
  const now = new Date();

  // Categorize classes
  const liveOngoingClass = classes.find((c) => c.isLive || c.status === 'live');
  const upcomingClasses = classes.filter(
    (c) => !c.isLive && c.status !== 'live' && c.status !== 'completed' && c.type !== 'Recorded' && c.scheduledAt && new Date(c.scheduledAt) > now
  ).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const recordedClasses = classes.filter(
    (c) => c.status === 'completed' || c.recordingUrl || c.type === 'Recorded' || (c.scheduledAt && new Date(c.scheduledAt) <= now && !c.isLive)
  ).sort((a, b) => new Date(b.scheduledAt || b.createdAt || 0) - new Date(a.scheduledAt || a.createdAt || 0));

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/trainer/dashboard"
              className="text-xs font-bold text-saffron-600 hover:text-saffron-700 flex items-center gap-1.5 transition"
            >
              <span>←</span>
              <span>Back to Trainer Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to={`/courses/${courseId}`}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
              >
                <span>👁️ View Public Course Page</span>
              </Link>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-1.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-black transition shadow-sm flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Add Class</span>
              </button>
            </div>
          </div>

          {/* Course Hero Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-saffron-500 text-white">
                  {course.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-gray-200">
                  {course.level}
                </span>
                {liveOngoingClass && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1">
                    <span>●</span> LIVE STREAM ACTIVE
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{course.title}</h1>
              <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed">
                {course.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-stone-400 pt-1">
                <span>Trainer: <strong className="text-white">{trainerInfo?.name || course.trainer?.name || 'You'}</strong></span>
                <span>•</span>
                <span>Enrolled: <strong className="text-white">{course.enrolledCount || 0} Yogis</strong></span>
                <span>•</span>
                <span>Total Classes: <strong className="text-white">{classes.length}</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
                <span className="text-[10px] uppercase font-bold text-saffron-300 block">Upcoming</span>
                <span className="text-2xl font-black text-white">{upcomingClasses.length}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Recorded</span>
                <span className="text-2xl font-black text-white">{recordedClasses.length}</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ACTIVE LIVE BROADCAST / PREVIEW STUDIO PLAYER */}
          {/* ============================================================== */}
          {(liveOngoingClass || activePreviewClass) && (
            <div className="mb-10 bg-black text-white rounded-3xl overflow-hidden shadow-2xl border border-stone-800 animate-in fade-in zoom-in-95 duration-200">
              {(() => {
                const target = activePreviewClass || liveOngoingClass;
                const ytId = target.youtubeVideoId || extractYouTubeId(target.videoUrl || target.meetingUrl || target.recordingUrl);

                return (
                  <>
                    <div className="px-6 py-4 bg-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${target.isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <div>
                          <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                            <span>{target.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${target.isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-stone-800 text-stone-300'}`}>
                              {target.isLive ? '🔴 LIVE STREAM STUDIO' : '📼 CLASS PREVIEW'}
                            </span>
                          </h3>
                          <p className="text-stone-400 text-xs">
                            Course: {course.title} • Duration: {target.duration}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleLive(target)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md ${
                            target.isLive ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                          }`}
                        >
                          <span>{target.isLive ? '⏹ End Live Stream' : '🔴 Go Live Now'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePreviewClass(null)}
                          className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition text-xs"
                        >
                          ✕ Close View
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                      {ytId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                          title={target.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      ) : target.videoUrl ? (
                        <div className="p-8 text-center space-y-4">
                          <span className="text-5xl block">📹</span>
                          <p className="text-white text-sm font-semibold">Live Meeting URL Configured</p>
                          <a
                            href={target.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition shadow-md"
                          >
                            Open Meeting Room in New Tab (→)
                          </a>
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <span className="text-4xl block">🧘</span>
                          <p className="text-stone-400 text-xs">
                            No YouTube ID or URL attached yet. Edit this class to embed your YouTube Live stream or pre-recorded lecture.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-stone-200">
              {[
                { id: 'all', label: 'All Classes', count: classes.length },
                { id: 'upcoming', label: 'Upcoming Scheduled', count: upcomingClasses.length },
                { id: 'recorded', label: 'Recorded & Previous', count: recordedClasses.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-saffron-500 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <span>+ Add Class to Course</span>
            </button>
          </div>

          {/* Classes Content */}
          {classes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200 space-y-4">
              <span className="text-5xl block">🧘</span>
              <h3 className="text-base font-bold text-stone-800">No classes in this course yet</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Schedule your first live yoga masterclass or upload pre-recorded practice sessions with YouTube embedding.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-2"
              >
                <span>+</span>
                <span>Schedule First Class</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION: UPCOMING CLASSES */}
              {(activeTab === 'all' || activeTab === 'upcoming') && upcomingClasses.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-saffron-500"></span>
                    <h2 className="text-base font-black text-stone-900 tracking-tight">
                      📅 Upcoming Scheduled Classes ({upcomingClasses.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingClasses.map((cls, idx) => (
                      <div
                        key={cls._id || idx}
                        className="bg-white rounded-3xl p-5 border border-saffron-100 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          {/* Course Name Prominently Featured */}
                          <div className="text-[11px] font-black text-saffron-700 bg-saffron-50 px-2.5 py-1 rounded-xl border border-saffron-200/60 inline-flex items-center gap-1.5">
                            <span>📚 Course:</span>
                            <span className="truncate max-w-[220px]">{course.title}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                              {cls.type}
                            </span>
                            <span className="text-xs font-bold text-stone-500">
                              ⏱️ {cls.duration}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-stone-900 leading-snug">{cls.title}</h3>
                          <p className="text-xs text-stone-500 line-clamp-2">{cls.description}</p>
                        </div>

                        <div className="pt-3 border-t border-stone-100 space-y-3">
                          <div className="text-xs">
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">Scheduled Time</span>
                            <span className="font-extrabold text-stone-800 text-xs">
                              {formatDate(cls.scheduledAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleLive(cls)}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                            >
                              <span>🔴 Go Live</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePreviewClass(cls)}
                              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
                              title="Preview in Studio"
                            >
                              ▶ Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(cls)}
                              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition text-xs"
                              title="Edit Class"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClass(cls)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition text-xs"
                              title="Delete Class"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION: RECORDED & PREVIOUS CLASSES */}
              {(activeTab === 'all' || activeTab === 'recorded') && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h2 className="text-base font-black text-stone-900 tracking-tight">
                      📼 Recorded & Previous Classes ({recordedClasses.length})
                    </h2>
                  </div>

                  {recordedClasses.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-stone-200">
                      <p className="text-xs text-stone-500">
                        No recorded or completed classes available yet. Live sessions automatically transition here once ended.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recordedClasses.map((cls, idx) => (
                        <div
                          key={cls._id || idx}
                          className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2">
                            {/* Course Name Prominently Featured */}
                            <div className="text-[11px] font-black text-stone-700 bg-stone-100 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                              <span>📚 Course:</span>
                              <span className="truncate max-w-[220px]">{course.title}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                ✓ Recorded Session
                              </span>
                              <span className="text-xs font-bold text-stone-500">
                                ⏱️ {cls.duration}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-stone-900 leading-snug">{cls.title}</h3>
                            <p className="text-xs text-stone-500 line-clamp-2">{cls.description}</p>
                          </div>

                          <div className="pt-3 border-t border-stone-100 space-y-3">
                            <div className="text-xs">
                              <span className="text-[10px] uppercase font-bold text-stone-400 block">Conducted / Recorded Date</span>
                              <span className="font-bold text-stone-700 text-xs">
                                📅 {formatDate(cls.scheduledAt || cls.endedAt || cls.createdAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActivePreviewClass(cls)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                              >
                                <span>▶ Replay Session</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cls)}
                                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition text-xs"
                                title="Edit Class Details"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClass(cls)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition text-xs"
                                title="Delete Class"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* ============================================================== */}
      {/* ADD / EDIT CLASS MODAL WITH STRICT BACK-DATE PREVENTION */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
              <div>
                <h3 className="text-base font-black">
                  {editingClassId ? 'Edit Class Details' : 'Add New Class to Course'}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Course: {course.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Class Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Morning Surya Namaskār Alignment"
                  value={classFormData.title}
                  onChange={(e) => setClassFormData({ ...classFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-saffron-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Class Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Key postures covered, breath guidance, pranayama instructions..."
                  value={classFormData.description}
                  onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-saffron-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={classFormData.duration}
                    onChange={(e) => setClassFormData({ ...classFormData, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Class Format
                  </label>
                  <select
                    value={classFormData.type}
                    onChange={(e) => setClassFormData({ ...classFormData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-saffron-500 bg-white"
                  >
                    <option value="Live Stream">Live Stream</option>
                    <option value="Recorded">Recorded Session</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                  <span className="text-[10px] text-stone-400 font-normal ml-1">
                    (Past dates strictly blocked)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={minDateTime}
                  value={classFormData.scheduledAt}
                  onChange={(e) => setClassFormData({ ...classFormData, scheduledAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-saffron-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  YouTube Live / Video Link
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or YouTube Live URL"
                  value={classFormData.videoUrl}
                  onChange={(e) => setClassFormData({ ...classFormData, videoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-saffron-500"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Supports YouTube standard URLs, live stream URLs, youtu.be shortlinks, or Google Meet links.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingClassId ? 'Save Changes' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerCourseDetail;
