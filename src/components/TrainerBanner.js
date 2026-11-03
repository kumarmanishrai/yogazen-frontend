import React from 'react';
import { Link } from 'react-router-dom';

const TrainerBanner = ({ variant = 'full' }) => {
  if (variant === 'sidebar') {
    return (
      <div className="bg-gradient-to-br from-saffron-50 via-white to-saffron-100/50 p-6 rounded-3xl border border-saffron-200/70 shadow-sm space-y-4">
        <span className="text-2xl">🧘‍♀️</span>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-saffron-700 bg-saffron-100/80 px-2.5 py-1 rounded-full">
            Instructor Portal
          </span>
          <h4 className="text-base font-bold text-gray-900 mt-2">Train on YogaZen</h4>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Reach conscious students worldwide. Publish your courses, schedule live classes, and manage payouts.
          </p>
        </div>
        <Link
          to="/trainer/register"
          className="block w-full text-center py-2.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          Register as Trainer →
        </Link>
      </div>
    );
  }

  // Full-width in-between section banner
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white my-16 shadow-xl shadow-saffron-500/10">
      <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
        <span className="text-9xl font-black">ॐ</span>
      </div>

      <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14 max-w-4xl">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm mb-4">
          <span>🌿</span> Share Your Sacred Craft
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          Are you a Yoga or Meditation Instructor?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-saffron-100 max-w-2xl leading-relaxed">
          Create structured video courses, manage classes, and receive earnings directly into your bank account.
          YogaZen automates everything from student enrollments to official PDF invoicing.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            to="/trainer/register"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-saffron-700 hover:bg-saffron-50 font-bold rounded-full text-sm shadow-md transition"
          >
            Become a Certified Trainer →
          </Link>
          <Link
            to="/login?trainer=true"
            className="inline-flex items-center justify-center px-6 py-3 bg-saffron-700/40 hover:bg-saffron-700/60 text-white font-semibold rounded-full text-sm transition"
          >
            Trainer Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrainerBanner;
