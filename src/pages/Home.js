import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrainerBanner from '../components/TrainerBanner';
import { apiGetProducts } from '../services/api';
import tracker from '../services/analyticsTracker';

const FEATURED_CATEGORIES = [
  { name: 'Yoga Mats', icon: '🧘‍♀️', label: 'Yoga Mats', desc: 'Organic cork & natural tree rubber' },
  { name: 'Yoga Props', icon: '🧱', label: 'Blocks & Straps', desc: 'Beveled cork & posture straps' },
  { name: 'Meditation & Rest', icon: '🪑', label: 'Zafu & Cushions', desc: 'Buckwheat bolsters & floor chairs' },
  { name: 'Sound Healing', icon: '🔔', label: 'Singing Bowls & Chimes', desc: '7-Metal Tibetan & 432Hz crystal' },
  { name: 'Spiritual Tools', icon: '📿', label: 'Malas & Crystals', desc: '108 Japa malas & selenite plates' },
  { name: 'Aromatherapy & Cleanse', icon: '🌿', label: 'Oils & Diffusers', desc: 'White sage, palo santo & resin' }
];

const Home = () => {
  const [heroSearch, setHeroSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      tracker.trackSearch(heroSearch.trim());
      navigate(`/products?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/products');
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await apiGetProducts({ limit: 4, sort: 'popular' });
        if (res?.success) {
          setFeaturedProducts(res.products || []);
        }
      } catch (err) {
        console.warn('Could not load featured products:', err.message);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            {/* Gentle Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-saffron-50 text-saffron-700 border border-saffron-200 mb-6">
              <span>✨</span> Curated Wellness for Mind, Body & Soul
            </span>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Embrace Tranquility with{' '}
              <span className="text-saffron-600 underline decoration-saffron-200 decoration-wavy">
                YogaZen
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
              Discover ethically-crafted yoga mats, Tibetan singing bowls, sacred malas,
              meditation chairs, and pure aromatherapy — crafted to elevate your daily practice.
            </p>

            {/* Hero Interactive Search Bar */}
            <form onSubmit={handleHeroSearch} className="mt-8 max-w-lg mx-auto relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <span className="pl-4 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search yoga mats, singing bowls, malas, props..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full py-3.5 px-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex-shrink-0"
              >
                Search Store
              </button>
            </form>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/products"
                className="px-6 py-2.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-700 font-bold text-xs rounded-full border border-saffron-200 transition"
              >
                Explore Full Catalog 🧘
              </Link>
              <Link
                to="/trainer/register"
                className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-full border border-gray-200 transition"
              >
                Teach on YogaZen 🌿
              </Link>
            </div>
          </div>

          {/* Shop By Mindful Categories Section */}
          <section className="mt-16 sm:mt-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Shop by Mindful Category
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Handcrafted tools dedicated to grounding, breathwork, and meditation
                </p>
              </div>
              <Link to="/products" className="text-xs font-bold text-saffron-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {FEATURED_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => tracker.trackCategoryBrowse(cat.name)}
                  className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-saffron-300 shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-between group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-300 mb-2">
                    {cat.icon}
                  </span>
                  <h3 className="text-xs font-bold text-gray-900 group-hover:text-saffron-600 transition">
                    {cat.label}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                    {cat.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured / Trending Products Showcase */}
          {featuredProducts.length > 0 && (
            <section className="mt-16 sm:mt-24">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Trending Mindful Essentials
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Our community's most beloved sacred wellness instruments
                  </p>
                </div>
                <Link to="/products?sort=popular" className="text-xs font-bold text-saffron-600 hover:underline">
                  Browse Popular &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((p) => {
                  const price = p.discountPrice || p.price;
                  const originalPrice = p.price;
                  const discount = originalPrice > price
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : 0;

                  return (
                    <Link
                      key={p._id}
                      to={`/products/${p._id}`}
                      onClick={() => tracker.trackProductClick(p, 'home_trending')}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-saffron-300 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group p-4"
                    >
                      <div className="h-48 bg-saffron-50/40 rounded-xl overflow-hidden flex items-center justify-center p-3 relative">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-4xl">🧘</span>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-saffron-600">
                          {p.category}
                        </span>
                        <h3 className="text-xs font-bold text-gray-900 group-hover:text-saffron-600 transition line-clamp-2 leading-snug">
                          {p.title}
                        </h3>

                        <div className="flex items-center gap-1 text-[11px] text-gray-500 pt-1">
                          <span className="text-amber-400">★</span>
                          <span className="font-bold text-gray-800">{p.rating ? p.rating.toFixed(1) : '5.0'}</span>
                          <span>({p.reviewsCount || 0})</span>
                        </div>

                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-base font-black text-gray-900">
                            ₹{price.toLocaleString()}
                          </span>
                          {originalPrice > price && (
                            <del className="text-xs text-gray-400">₹{originalPrice.toLocaleString()}</del>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Value Props */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-saffron-50/50 border border-saffron-100 text-center">
              <span className="text-4xl">🧘‍♂️</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4">Certified Instructors</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Learn from verified yoga masters and meditation guides across authentic lineages.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-saffron-50/50 border border-saffron-100 text-center">
              <span className="text-4xl">🌿</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4">Eco-Friendly Craft</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Handmade organic cork mats, brass singing bowls, and sustainably sourced malas.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-saffron-50/50 border border-saffron-100 text-center">
              <span className="text-4xl">📄</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4">Instant PDF Invoicing</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Permanent access to downloadable tax-compliant invoices and course enrollment receipts.
              </p>
            </div>
          </div>

          {/* In-Between Trainer Promotional Banner */}
          <TrainerBanner variant="full" />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
