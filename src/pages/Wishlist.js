import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { isLoggedIn, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('Please sign in to view your saved wishlist.');
    }
  }, [isLoggedIn, openAuthModal]);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <span className="text-5xl">💛</span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Your Saved Wishlist</h1>

          {!isLoggedIn ? (
            <div className="mt-8 p-8 max-w-md mx-auto bg-saffron-50/60 rounded-3xl border border-saffron-200">
              <p className="text-sm text-gray-700 font-medium">
                Please sign in to view and save your favorite wellness products and courses.
              </p>
              <button
                onClick={() => openAuthModal('Please sign in to view your saved wishlist.')}
                className="mt-5 w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl shadow-md transition"
              >
                Sign In to View Wishlist
              </button>
            </div>
          ) : (
            <div className="mt-8 p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-gray-500 text-sm">Your wishlist is currently empty.</p>
              <Link
                to="/products"
                className="inline-block mt-4 px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-sm font-bold rounded-xl shadow-sm transition"
              >
                Discover Wellness Products
              </Link>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;
