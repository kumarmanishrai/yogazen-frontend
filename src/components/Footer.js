import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-saffron-50/40 border-t border-saffron-100 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/yogazen_logo.svg" alt="YogaZen" className="h-9 w-auto" />
              <span className="text-2xl font-extrabold text-saffron-600 tracking-tight">YogaZen</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Curating authentic yogic traditions, ethical wellness gear, and transformative training sessions for your holistic journey.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-4">Mindful Store</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/products" className="hover:text-saffron-600 transition">Yoga Mats & Props</Link></li>
              <li><Link to="/products" className="hover:text-saffron-600 transition">Tibetan Singing Bowls</Link></li>
              <li><Link to="/products" className="hover:text-saffron-600 transition">Meditation Malas</Link></li>
              <li><Link to="/products" className="hover:text-saffron-600 transition">Herbal & Organic Wellness</Link></li>
            </ul>
          </div>

          {/* Community & Learning */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-4">Courses & Classes</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/products?cat=yoga" className="hover:text-saffron-600 transition">Yoga Asana Courses</Link></li>
              <li><Link to="/products?cat=meditation" className="hover:text-saffron-600 transition">Guided Meditation</Link></li>
              <li><Link to="/products?cat=pranayama" className="hover:text-saffron-600 transition">Pranayama & Breathwork</Link></li>
              <li><Link to="/products?cat=sound" className="hover:text-saffron-600 transition">Sound Healing Sessions</Link></li>
            </ul>
          </div>

          {/* For Trainers & Instructors (PROMINENT FOOTER SECTION) */}
          <div className="bg-white p-5 rounded-2xl border border-saffron-100 shadow-sm space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-700 bg-saffron-50 px-2.5 py-1 rounded-full">
              <span>🌿</span> Teach on YogaZen
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you a certified Yoga or Meditation trainer? Share your courses, host live sessions, and earn revenue.
            </p>
            <Link
              to="/trainer/register"
              className="inline-block w-full text-center py-2 px-3 text-xs font-bold text-white bg-saffron-500 hover:bg-saffron-600 rounded-xl transition shadow-sm"
            >
              Join as a Trainer →
            </Link>
            <div className="text-center">
              <Link to="/login?trainer=true" className="text-[11px] text-gray-500 hover:text-saffron-600 font-medium">
                Already registered? Trainer Login
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-saffron-100/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} YogaZen. Mindful Living & Learning. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-saffron-600">Privacy Policy</a>
            <a href="#terms" className="hover:text-saffron-600">Terms of Service</a>
            <a href="#contact" className="hover:text-saffron-600">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
