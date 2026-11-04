import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGetCourses } from '../services/api';

const YOGA_CATEGORIES = [
  'All',
  'Hatha Yoga',
  'Vinyasa Flow',
  'Kundalini Yoga',
  'Ashtanga',
  'Meditation',
  'Pranayama'
];

const DIFFICULTY_LEVELS = [
  'All Levels',
  'Beginner',
  'Intermediate',
  'Advanced'
];

const Courses = () => {
  const navigate = useNavigate();
  // State
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under1500' | '1500to2500' | 'above2500'

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLevel && selectedLevel !== 'All Levels') params.level = selectedLevel;
      if (sortBy) params.sort = sortBy;

      if (priceRange === 'under1500') {
        params.maxPrice = 1499;
      } else if (priceRange === '1500to2500') {
        params.minPrice = 1500;
        params.maxPrice = 2500;
      } else if (priceRange === 'above2500') {
        params.minPrice = 2501;
      }

      const res = await apiGetCourses(params);
      if (res?.success) {
        setCourses(res.courses || []);
        setTotalCourses(res.total || 0);
        setCategoryCounts(res.categoryCounts || {});
      } else {
        setError(res?.message || 'Failed to load yoga courses.');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Unable to connect to course catalog.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLevel, sortBy, priceRange]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All Levels');
    setSortBy('rating_desc');
    setPriceRange('all');
  };

  const renderStars = (rating = 5) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    return (
      <div className="flex items-center text-amber-400 text-xs">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < fullStars ? '★' : (i === fullStars && hasHalf ? '★' : '☆')}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-nunito transition-colors duration-200">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Hero Banner */}
        <section className="bg-gradient-to-b from-saffron-500/10 via-amber-500/5 to-transparent pt-10 pb-12 border-b border-saffron-100 dark:border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-saffron-100 dark:bg-stone-800 text-saffron-800 dark:text-saffron-300 border border-saffron-200 dark:border-stone-700">
                🧘 Sacred Practice • Verified Yogacharyas
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-stone-100 tracking-tight mt-3 leading-tight">
                Authentic Yoga & Breathwork Courses
              </h1>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-3 leading-relaxed">
                Deepen your daily Sadhana with immersive video curriculums, alignment tutorials, guided meditation, and direct trainer reviews from certified practitioners.
              </p>
            </div>

            {/* Search & Top Action Bar */}
            <div className="mt-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
                <input
                  type="text"
                  placeholder="Search courses by asana, pranayama, kundalini, trainer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-24 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-saffron-400 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 shadow-xs"
                />
                <div className="absolute left-4 top-3.5 text-stone-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-4 py-1.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-xs font-bold text-stone-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-saffron-400 cursor-pointer shadow-xs"
                >
                  <option value="rating_desc">Highest Rated (★ 5.0)</option>
                  <option value="students">Most Popular (Enrolled)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>
            </div>

            {/* Category Pills Bar */}
            <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {YOGA_CATEGORIES.map((cat) => {
                const count = cat === 'All' ? totalCourses : (categoryCounts[cat] || 0);
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-xs ${
                      isActive
                        ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:text-saffron-600 dark:hover:text-saffron-400 border border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    {cat} {count > 0 && <span className={`ml-1 text-[10px] ${isActive ? 'text-amber-200' : 'text-stone-400'}`}>({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content Section: Sidebar Filters + Courses Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Filter Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Filters & Practice
                  </h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-saffron-600 hover:text-saffron-700 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Level Filter */}
                <div>
                  <h4 className="text-xs font-extrabold text-stone-800 mb-2.5">Difficulty Level</h4>
                  <div className="space-y-1.5">
                    {DIFFICULTY_LEVELS.map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer">
                        <input
                          type="radio"
                          name="difficultyLevel"
                          value={lvl}
                          checked={selectedLevel === lvl}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className="accent-saffron-500 cursor-pointer"
                        />
                        <span>{lvl}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="border-t border-stone-100 pt-5">
                  <h4 className="text-xs font-extrabold text-stone-800 mb-2.5">Course Fee (₹)</h4>
                  <div className="space-y-1.5 text-xs text-stone-600">
                    {[
                      { id: 'all', label: 'All Price Ranges' },
                      { id: 'under1500', label: 'Under ₹1,500' },
                      { id: '1500to2500', label: '₹1,500 – ₹2,500' },
                      { id: 'above2500', label: 'Above ₹2,500' }
                    ].map((p) => (
                      <label key={p.id} className="flex items-center gap-2.5 hover:text-stone-900 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          value={p.id}
                          checked={priceRange === p.id}
                          onChange={(e) => setPriceRange(e.target.value)}
                          className="accent-saffron-500 cursor-pointer"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mindful Guarantee Box */}
                <div className="border-t border-stone-100 pt-5">
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                      <span>✓</span> YogaZen Promise
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Lifetime access to all video modules, class updates, live Q&A sessions, and authentic completion certificates.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Courses Grid */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header metrics */}
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span>
                  Showing <strong className="text-stone-800">{courses.length}</strong> yoga courses
                  {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                </span>
                {(searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All Levels' || priceRange !== 'all') && (
                  <span className="font-semibold text-saffron-600">Filters active</span>
                )}
              </div>

              {/* Error Notice */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                  <span>⚠️ {error}</span>
                  <button onClick={fetchCourses} className="font-bold underline hover:text-red-900 cursor-pointer">
                    Try Again
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3 animate-pulse">
                      <div className="w-full h-44 bg-stone-200 rounded-2xl"></div>
                      <div className="h-4 bg-stone-200 rounded-full w-3/4"></div>
                      <div className="h-3 bg-stone-200 rounded-full w-1/2"></div>
                      <div className="h-8 bg-stone-200 rounded-xl mt-4"></div>
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                /* Empty Catalog State */
                <div className="bg-white rounded-3xl p-12 border border-dashed border-stone-300 text-center">
                  <span className="text-4xl block mb-2">🧘‍♀️</span>
                  <h3 className="text-lg font-bold text-stone-900">No Courses Match Your Selection</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your search query, switching categories, or resetting the difficulty level.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                /* Courses Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const courseId = course._id || course.id;
                    const reviewsNum = course.reviewsCount || course.reviews?.length || 0;
                    const ratingVal = reviewsNum > 0 && course.reviews?.length
                      ? (course.reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / course.reviews.length)
                      : (course.rating || 0);
                    const trainerName = course.trainer?.name || 'YogaZen Acharya';
                    const classesCount = course.classes?.length || 0;

                    return (
                      <div
                        key={courseId}
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 hover:border-saffron-300 dark:hover:border-saffron-500 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                      >
                        {/* Course Thumbnail Image */}
                        <div className="relative aspect-video w-full overflow-hidden bg-stone-100 dark:bg-stone-950">
                          <img
                            src={course.thumbnail || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent"></div>

                          {/* Level Badge */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-stone-900/80 text-white backdrop-blur-xs border border-white/20">
                              {course.level || 'All Levels'}
                            </span>
                          </div>

                          {/* Duration Badge */}
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-saffron-500 text-white shadow-xs">
                              {course.duration || '4 Weeks'}
                            </span>
                          </div>

                          {/* Quick category tag bottom */}
                          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-xs">
                            <span className="text-[11px] font-bold text-amber-200">
                              {course.category}
                            </span>
                            <span className="text-[10px] text-stone-200 font-mono">
                              📚 {classesCount} Lessons
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            {/* Trainer Info */}
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-saffron-100 dark:bg-stone-800 text-saffron-700 dark:text-saffron-300 text-[10px] font-bold flex items-center justify-center">
                                🧘
                              </div>
                              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 truncate">
                                {trainerName}
                              </span>
                            </div>

                            {/* Title */}
                            <Link to={`/courses/${courseId}`}>
                              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition line-clamp-2 leading-snug">
                                {course.title}
                              </h3>
                            </Link>

                            {/* Short Description */}
                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>

                            {/* Ratings & Enrolled yogis */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <div className="flex items-center gap-1.5">
                                {renderStars(ratingVal || 5)}
                                <span className="font-extrabold text-stone-900 dark:text-stone-100 text-xs">
                                  {reviewsNum > 0 || ratingVal > 0 ? ratingVal.toFixed(1) : 'New'}
                                </span>
                                <span className="text-[10px] text-stone-400 dark:text-stone-500">
                                  ({reviewsNum})
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                                👥 {course.enrolledCount || 0} yogis
                              </span>
                            </div>
                          </div>

                          {/* Card Footer: Price & View CTA */}
                          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-bold block">
                                Full Access Fee
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-stone-900 dark:text-stone-100">
                                  ₹{course.price?.toLocaleString()}
                                </span>
                                {course.price > 0 && (
                                  <span className="text-xs text-stone-400 dark:text-stone-500 line-through">
                                    ₹{Math.round(course.price * 1.5).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Link
                              to={`/courses/${courseId}`}
                              className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                            >
                              <span>View Course</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
