import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <footer className="bg-gradient-to-b from-white to-saffron-50/40 dark:from-stone-900 dark:to-stone-950 border-t border-saffron-100 dark:border-stone-800 pt-16 pb-12 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 ${isAdminRoute ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-10`}>
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/yogazen_logo.svg" alt="YogaZen" className="h-9 w-auto" />
              <span className="text-2xl font-extrabold text-saffron-600 tracking-tight">YogaZen</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-stone-400 leading-relaxed">
              Curating authentic yogic traditions, ethical wellness gear, and transformative training sessions for your holistic journey.
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-stone-400">
                <span>✉️</span>
                <a href="mailto:www.yogazen@gmail.com" className="font-semibold text-saffron-600 dark:text-saffron-400 hover:underline">
                  www.yogazen@gmail.com
                </a>
              </div>
              <div>
                <Link to="/about" className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 underline underline-offset-2">
                  About YogaZen →
                </Link>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-stone-200 mb-4">Mindful Store</h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-stone-400">
              <li><Link to="/products" className="hover:text-saffron-600 transition">Yoga Mats & Props</Link></li>
              <li><Link to="/products" className="hover:text-saffron-600 transition">Tibetan Singing Bowls</Link></li>
              <li><Link to="/products" className="hover:text-saffron-600 transition">Meditation Malas</Link></li>
              <li><Link to="/products" className="hover:text-saffron-600 transition">Herbal & Organic Wellness</Link></li>
            </ul>
          </div>

          {/* Community & Learning */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-stone-200 mb-4">Courses & Classes</h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-stone-400">
              <li><Link to="/products?cat=yoga" className="hover:text-saffron-600 transition">Yoga Asana Courses</Link></li>
              <li><Link to="/products?cat=meditation" className="hover:text-saffron-600 transition">Guided Meditation</Link></li>
              <li><Link to="/products?cat=pranayama" className="hover:text-saffron-600 transition">Pranayama & Breathwork</Link></li>
              <li><Link to="/products?cat=sound" className="hover:text-saffron-600 transition">Sound Healing Sessions</Link></li>
            </ul>
          </div>

          {/* For Trainers & Instructors (Strictly hidden on Admin pages per requirements) */}
          {!isAdminRoute && (
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-saffron-100 dark:border-stone-800 shadow-sm space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-saffron-950/60 px-2.5 py-1 rounded-full">
                <span>🌿</span> Join as Trainer
              </span>
              <p className="text-xs text-gray-600 dark:text-stone-400 leading-relaxed">
                Are you a certified Yoga or Meditation trainer? Share your courses, host live sessions, and earn revenue.
              </p>
              <Link
                to="/trainer/register"
                className="inline-block w-full text-center py-2 px-3 text-xs font-bold text-white bg-saffron-500 hover:bg-saffron-600 rounded-xl transition shadow-sm"
              >
                Join as a Trainer →
              </Link>
              <div className="text-center">
                <Link to="/login?trainer=true" className="text-[11px] text-gray-500 dark:text-stone-400 hover:text-saffron-600 font-medium">
                  Already registered? Trainer Login
                </Link>
              </div>
            </div>
          )}

        </div>

        <div className="mt-12 pt-8 border-t border-saffron-100/60 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} YogaZen. Mindful Living & Learning. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/about" className="hover:text-saffron-600 transition">About Us</Link>
            <Link to="/privacy" className="hover:text-saffron-600 transition">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-saffron-600 transition">Contact Us & Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
