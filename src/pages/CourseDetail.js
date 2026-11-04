import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGetCourseById, apiAddCourseReview, apiEnrollInCourse } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CourseDetail = () => {
  const { id } = useParams();
  const { isLoggedIn, openAuthModal, currentUser, role } = useAuth();

  // Course State
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if current logged-in user is the course instructor
  const isTrainerOwner = Boolean(
    currentUser && (
      (role === 'trainer' && (
        (course?.trainer?._id && currentUser._id && course.trainer._id.toString() === currentUser._id.toString()) ||
        (course?.trainer && currentUser._id && course.trainer.toString() === currentUser._id.toString()) ||
        (course?.trainer?.email && currentUser.email && course.trainer.email.toLowerCase() === currentUser.email.toLowerCase())
      )) ||
      (course?.trainer?._id && currentUser._id && course.trainer._id.toString() === currentUser._id.toString()) ||
      (course?.trainer?.email && currentUser.email && course.trainer.email.toLowerCase() === currentUser.email.toLowerCase())
    )
  );
  const [error, setError] = useState(null);

  // Review Form State
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);

  // Enrollment Modal & Promo State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponStatus, setCouponStatus] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(null);

  // Expanded curriculum lessons
  const [expandedClasses, setExpandedClasses] = useState({});

  const loadCourseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGetCourseById(id);
      if (res?.success && res.course) {
        setCourse(res.course);
        setIsEnrolled(Boolean(res.isEnrolled));
        if (res.userReview) {
          setRatingInput(res.userReview.rating || 5);
          setCommentInput(res.userReview.comment || '');
        }
      } else {
        setError(res?.message || 'Yoga course not found.');
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.message || 'Failed to load course details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCourseData();
  }, [loadCourseData]);

  const toggleClassExpand = (classIndex) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classIndex]: !prev[classIndex]
    }));
  };

  // Submit Course Rating & Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      if (openAuthModal) openAuthModal();
      return;
    }

    if (!isEnrolled) {
      setReviewMessage({
        type: 'error',
        text: 'Only enrolled students can rate and submit reviews for this course.'
      });
      return;
    }

    if (!commentInput.trim()) {
      setReviewMessage({
        type: 'error',
        text: 'Please write your mindful feedback or practice reflection.'
      });
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewMessage(null);
      const res = await apiAddCourseReview(id, {
        rating: ratingInput,
        comment: commentInput.trim()
      });

      if (res?.success) {
        setReviewMessage({
          type: 'success',
          text: res.message || 'Review submitted successfully!'
        });
        // Update local course reviews
        setCourse((prev) => ({
          ...prev,
          rating: res.rating,
          reviewsCount: res.reviewsCount,
          reviews: res.reviews
        }));
      } else {
        setReviewMessage({
          type: 'error',
          text: res?.message || 'Failed to submit review.'
        });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewMessage({
        type: 'error',
        text: err.message || 'Failed to submit course review.'
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Quick Enroll / Buy Flow
  const handleOpenEnrollModal = () => {
    if (!isLoggedIn) {
      if (openAuthModal) openAuthModal();
      return;
    }
    setIsEnrollModalOpen(true);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'YOGA10') {
      const disc = Math.round(((course?.price || 0) * 10) / 100);
      setAppliedDiscount(disc);
      setCouponStatus({ type: 'success', text: '10% OFF Applied with code YOGA10!' });
    } else if (clean === 'ZEN20') {
      const disc = Math.round(((course?.price || 0) * 20) / 100);
      setAppliedDiscount(disc);
      setCouponStatus({ type: 'success', text: '20% OFF Applied with code ZEN20!' });
    } else {
      setCouponStatus({ type: 'error', text: 'Invalid or expired promotional code.' });
    }
  };

  const handleConfirmEnroll = async () => {
    try {
      setIsEnrolling(true);
      setCouponStatus(null);
      const res = await apiEnrollInCourse(id, {
        couponCode: couponCode.trim(),
        paymentMethod: 'Mindful Direct Access'
      });

      if (res?.success) {
        setEnrollSuccess(res);
        setIsEnrolled(true);
        // Refresh course data in background
        loadCourseData();
      } else {
        alert(res?.message || 'Enrollment failed. Please try again.');
      }
    } catch (err) {
      console.error('Error enrolling:', err);
      alert(err.message || 'Enrollment failed.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const renderStars = (rating = 5, size = 'text-xs') => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    return (
      <div className={`flex items-center text-amber-400 ${size}`}>
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < fullStars ? '★' : (i === fullStars && hasHalf ? '★' : '☆')}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-nunito">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-stone-500">Loading course curriculum & reviews...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-nunito">
        <Navbar />
        <div className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center">
          <span className="text-5xl block mb-3">🧘‍♂️</span>
          <h2 className="text-2xl font-black text-stone-900">Course Unavailable</h2>
          <p className="text-sm text-stone-500 mt-2">{error || 'The requested yoga course could not be found.'}</p>
          <Link
            to="/courses"
            className="inline-block mt-6 px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            ← Back to Courses Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const finalPrice = Math.max(0, (course.price || 0) - appliedDiscount);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-nunito transition-colors duration-200">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Breadcrumb Header */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-stone-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-saffron-600 font-semibold">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-saffron-600 font-semibold">Courses</Link>
            <span>/</span>
            <span className="text-stone-700">{course.category}</span>
            <span>/</span>
            <span className="text-stone-900 font-bold truncate max-w-xs">{course.title}</span>
          </div>
        </div>

        {/* Hero Banner with Course Title & Stats */}
        <section className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Info (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-saffron-500 text-white">
                    {course.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-stone-200 border border-white/20">
                    {course.level || 'All Levels'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-stone-200 border border-white/20">
                    ⏱ {course.duration || '4 Weeks'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-stone-50 tracking-tight leading-tight">
                  {course.title}
                </h1>

                <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-3xl">
                  {course.description}
                </p>

                {/* Trainer & Ratings Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-saffron-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                      🧘
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Taught By</span>
                      <span className="font-bold text-stone-100">{course.trainer?.name || 'YogaZen Acharya'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const reviewsList = course.reviews || [];
                      const revCount = reviewsList.length;
                      const dynamicAvg = revCount > 0
                        ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / revCount)
                        : (course.rating || 0);

                      return (
                        <>
                          {renderStars(dynamicAvg || 5, 'text-sm')}
                          <span className="font-extrabold text-stone-100 text-sm">
                            {revCount > 0 ? dynamicAvg.toFixed(1) : (course.rating ? course.rating.toFixed(1) : 'New')}
                          </span>
                          <a href="#reviews" className="text-saffron-400 hover:underline">
                            ({revCount} student review{revCount === 1 ? '' : 's'})
                          </a>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-300">
                    <span>👥</span>
                    <span><strong>{course.enrolledCount || 0}</strong> practitioners enrolled</span>
                  </div>
                </div>

                {/* Enrolled Status / Instructor Pill */}
                {isTrainerOwner ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mt-2">
                    <span>👨‍🏫 You are the Instructor of this Course</span>
                    <Link to={`/trainer/courses/${id}`} className="underline hover:text-white ml-2">
                      Manage in Trainer Studio →
                    </Link>
                  </div>
                ) : isEnrolled ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mt-2">
                    <span>✅ You are enrolled in this course</span>
                    <Link to="/my-courses" className="underline hover:text-white ml-2">
                      Open Practice Studio →
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* Right Hero Preview Thumbnail (4 cols) */}
              <div className="lg:col-span-4 hidden lg:block">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-700/60 aspect-video relative group">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center group-hover:bg-stone-900/20 transition">
                    <div className="w-14 h-14 rounded-full bg-saffron-500/90 text-white flex items-center justify-center text-xl shadow-xl">
                      ▶
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Content Body: Left Details & Right Sticky Card */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* What You'll Learn */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <h2 className="text-lg font-black text-stone-900">
                  What You Will Cultivate & Practice
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold text-sm">✓</span>
                    <span>Anatomically correct alignment and steady posture retention (Sthira Sukham).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold text-sm">✓</span>
                    <span>Traditional Vedic breath control (Pranayama) to soothe the nervous system.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold text-sm">✓</span>
                    <span>Release of accumulated somatic stress, muscular rigidity, and mental fog.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold text-sm">✓</span>
                    <span>Subtle energy grounding through Chakra meditation and restorative Nidra.</span>
                  </div>
                </div>
              </div>

              {/* Course Curriculum & Lessons */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-stone-900">
                      Curriculum & Class Breakdown
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {course.classes?.length || 0} Structured Sessions • Lifetime Access
                    </p>
                  </div>
                </div>

                {!course.classes || course.classes.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">
                    Classes curriculum is currently being structured by the Yogacharya.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {course.classes.map((cls, idx) => {
                      const isExpanded = expandedClasses[idx];
                      return (
                        <div
                          key={idx}
                          className="border border-stone-200 rounded-2xl overflow-hidden hover:border-saffron-300 transition"
                        >
                          <button
                            type="button"
                            onClick={() => toggleClassExpand(idx)}
                            className="w-full px-5 py-4 bg-stone-50/70 hover:bg-stone-50 flex items-center justify-between text-left cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 font-black text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                                  {cls.title}
                                </h4>
                                <span className="text-[11px] text-stone-500 block">
                                  Duration: {cls.duration || '30 mins'} • HD Audio Guided
                                </span>
                              </div>
                            </div>
                            <span className="text-stone-400 text-xs">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="p-5 bg-white border-t border-stone-100 text-xs text-stone-600 space-y-2">
                              <p className="leading-relaxed">
                                {cls.description || 'Practice guidance and sequential alignment steps.'}
                              </p>
                              {isEnrolled ? (
                                cls.scheduledAt && new Date(cls.scheduledAt) > new Date() && !cls.isLive ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                                    🗓️ Scheduled Class: {new Date(cls.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                ) : (
                                  <Link
                                    to={`/my-learning?courseId=${id}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-600 hover:underline pt-1"
                                  >
                                    ▶ Watch / Stream in Live Practice Studio
                                  </Link>
                                )
                              ) : (
                                <span className="text-[11px] text-stone-400 italic">
                                  🔒 Enroll to unlock this lesson
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Instructor Bio */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <h2 className="text-lg font-black text-stone-900">
                  Meet Your Yogacharya Instructor
                </h2>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-saffron-100 text-saffron-700 text-2xl font-bold flex items-center justify-center shrink-0">
                    🧘
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-stone-900">
                      {course.trainer?.name || 'YogaZen Acharya'}
                    </h3>
                    <p className="text-xs font-semibold text-saffron-700">
                      Master Instructor • {course.trainer?.experienceYears || 10}+ Years Traditional Lineage
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed pt-1">
                      {course.trainer?.bio || 'Dedicated practitioner devoted to disseminating authentic Vedic wisdom, postural mechanics, and holistic inner calm.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CUSTOMER REVIEWS & RATINGS SECTION */}
              <div id="reviews" className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-8">
                <div>
                  <h2 className="text-xl font-black text-stone-900">
                    Student Ratings & Verified Reviews
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Authentic reflections shared by practitioners enrolled in this course
                  </p>
                </div>

                {/* Rating Overview Score Box (100% Dynamic from Course Reviews) */}
                {(() => {
                  const revs = course.reviews || [];
                  const count = revs.length;
                  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                  revs.forEach((r) => {
                    const s = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
                    starCounts[s] = (starCounts[s] || 0) + 1;
                  });

                  const avgVal = count > 0
                    ? (revs.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / count)
                    : (course.rating || 0);

                  const getPct = (c) => (count > 0 ? Math.round((c / count) * 100) : 0);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-stone-50/80 p-6 rounded-2xl border border-stone-200 items-center">
                      <div className="text-center md:text-left space-y-1">
                        <div className="text-5xl font-black text-stone-900">
                          {count > 0 ? avgVal.toFixed(1) : (course.rating ? course.rating.toFixed(1) : 'New')}
                        </div>
                        <div>{renderStars(avgVal || 5, 'text-base')}</div>
                        <span className="text-xs text-stone-500 font-medium block">
                          {count > 0 ? `Based on ${count} review${count === 1 ? '' : 's'}` : 'No ratings yet'}
                        </span>
                      </div>

                      <div className="md:col-span-2 space-y-1.5 text-xs text-stone-600 border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-6">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const pct = getPct(starCounts[stars]);
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="w-14 text-stone-700 font-bold">{stars} Stars</span>
                              <div className="flex-1 bg-stone-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="w-14 text-right font-mono text-[11px] text-stone-500">
                                {pct}% <span className="text-[10px] text-stone-400">({starCounts[stars]})</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Submit Review Card (Enrolled Users) */}
                <div className="bg-amber-50/40 p-6 rounded-2xl border border-amber-200/70 space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900">
                      Rate & Review This Course
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Help fellow yogis understand how this practice supported your mental and physical balance.
                    </p>
                  </div>

                  {reviewMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${
                        reviewMessage.type === 'error'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {reviewMessage.text}
                    </div>
                  )}

                  {!isLoggedIn ? (
                    <div className="text-center py-4 bg-white rounded-xl border border-stone-200">
                      <p className="text-xs text-stone-600 mb-2">
                        Sign in to leave a verified rating and review.
                      </p>
                      <button
                        onClick={openAuthModal}
                        className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Sign In to Review
                      </button>
                    </div>
                  ) : !isEnrolled ? (
                    <div className="p-4 bg-white rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between gap-4">
                      <span>
                        🔒 Only students enrolled in this course can post ratings and reviews.
                      </span>
                      <button
                        onClick={handleOpenEnrollModal}
                        className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
                      >
                        Enroll Now
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-3 bg-white p-5 rounded-2xl border border-stone-200">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Select Star Rating (1 to 5):
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setRatingInput(star)}
                              className={`text-2xl cursor-pointer transition ${
                                star <= ratingInput ? 'text-amber-400 scale-110' : 'text-stone-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="text-xs font-bold text-stone-700 ml-2">
                            {ratingInput} Star{ratingInput > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Your Practice Review:
                        </label>
                        <textarea
                          rows="3"
                          required
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="How did this course deepen your asanas, pranayama, or meditation practice?"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-saffron-500 bg-stone-50"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Post Course Review'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Reviews Feed */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-stone-900 border-b border-stone-100 pb-2">
                    All Reviews ({course.reviews?.length || 0})
                  </h3>

                  {!course.reviews || course.reviews.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100">
                      <span className="text-3xl block mb-2">📝</span>
                      <p className="text-xs text-stone-500 font-semibold">
                        No reviews posted yet. Be the first enrolled student to share your thoughts!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 space-y-4">
                      {course.reviews.map((rev, rIdx) => (
                        <div key={rIdx} className="pt-4 first:pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-saffron-100 text-saffron-800 font-black flex items-center justify-center text-xs">
                                {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'Y'}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-stone-900 block">
                                  {rev.userName || 'YogaZen Yogi'}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-semibold">
                                  ✓ Verified Enrolled Student
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] text-stone-400">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 'Recently'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {renderStars(rev.rating, 'text-xs')}
                            <span className="text-[11px] font-bold text-stone-700">
                              {rev.rating}.0 / 5.0
                            </span>
                          </div>

                          <p className="text-xs text-stone-700 leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Right Sticky Buy / Enrollment Card (4 cols) */}
            <div className="lg:col-span-4 sticky top-6">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-7 space-y-6">
                
                {/* Cover Preview Image */}
                <div className="rounded-2xl overflow-hidden aspect-video bg-stone-100">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Price Display */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Lifetime Course Fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-stone-900">
                      ₹{finalPrice.toLocaleString()}
                    </span>
                    {course.price > 0 && (
                      <span className="text-sm text-stone-400 line-through">
                        ₹{Math.round(course.price * 1.5).toLocaleString()}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      33% OFF
                    </span>
                  </div>
                  {appliedDiscount > 0 && (
                    <span className="text-xs text-emerald-600 font-bold block mt-1">
                      Promo applied: Saved ₹{appliedDiscount}
                    </span>
                  )}
                </div>

                {/* Primary CTA Button */}
                {isTrainerOwner ? (
                  <Link
                    to={`/trainer/courses/${id}`}
                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>👨‍🏫 You are the Instructor</span>
                    <span>•</span>
                    <span>Manage in Studio →</span>
                  </Link>
                ) : isEnrolled ? (
                  <Link
                    to="/my-courses"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>✓ Already Enrolled</span>
                    <span>•</span>
                    <span>Enter Practice Studio</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenEnrollModal}
                    className="w-full py-3.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white rounded-2xl text-sm font-black transition shadow-lg shadow-saffron-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enroll Now (Buy Course)</span>
                    <span>→</span>
                  </button>
                )}

                {/* What's Included */}
                <div className="space-y-2.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
                  <h4 className="text-[11px] font-extrabold uppercase text-stone-800 tracking-wider">
                    Course Features Include:
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-saffron-500">▶</span>
                    <span>{course.classes?.length || 0} HD Video Streaming Classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-saffron-500">⏱</span>
                    <span>Full Lifetime Access (Self-paced)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-saffron-500">🏆</span>
                    <span>Verified YogaZen Digital Certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-saffron-500">📱</span>
                    <span>Accessible on Mobile, Tablet & Desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-saffron-500">💬</span>
                    <span>Access to Q&A discussion & reviews</span>
                  </div>
                </div>

                {/* 100% Satisfaction Guarantee */}
                <div className="pt-2 text-center">
                  <span className="text-[11px] text-stone-400">
                    🔒 Secure 256-bit Encrypted Transaction
                  </span>
                </div>

              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Quick Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                Confirm Mindful Enrollment
              </h3>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {enrollSuccess ? (
              <div className="text-center py-6 space-y-4">
                <span className="text-5xl block">🎉</span>
                <h4 className="text-lg font-black text-emerald-700">
                  Enrollment Successful!
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  You are now enrolled in <strong>{course.title}</strong>. Your curriculum is unlocked in your practice studio.
                </p>
                <div className="pt-2">
                  <Link
                    to="/my-courses"
                    className="inline-block px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Go to My Practice Studio →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                  <span className="font-bold text-stone-900 block">{course.title}</span>
                  <span className="text-stone-500 block mt-0.5">
                    Trainer: {course.trainer?.name || 'YogaZen Acharya'}
                  </span>
                </div>

                {/* Promo Code Input */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Have a Promo Code? (e.g. YOGA10)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs uppercase font-mono rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:border-saffron-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      Apply
                    </button>
                  </div>
                  {couponStatus && (
                    <p
                      className={`text-[11px] font-semibold mt-1.5 ${
                        couponStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {couponStatus.text}
                    </p>
                  )}
                </div>

                {/* Fee Breakdown */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Course Subtotal:</span>
                    <span>₹{course.price?.toLocaleString()}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promotional Discount:</span>
                      <span>-₹{appliedDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-stone-900 text-sm">
                    <span>Total Amount:</span>
                    <span>₹{finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Confirm Enroll Button */}
                <button
                  type="button"
                  disabled={isEnrolling}
                  onClick={handleConfirmEnroll}
                  className="w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isEnrolling ? 'Enrolling...' : `Confirm & Pay ₹${finalPrice.toLocaleString()}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
