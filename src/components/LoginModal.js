import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginModal = () => {
  const { isAuthModalOpen, authModalReason, closeAuthModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTrainer, setIsTrainer] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password, isTrainer);
      if (loggedInUser.role === 'trainer') {
        navigate('/trainer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={closeAuthModal}></div>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-saffron-100 p-7 sm:p-8 z-10 transition-all">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-saffron-50 text-saffron-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In Required</h3>
          <p className="text-sm text-gray-500 mt-1.5">{authModalReason}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Quick Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm bg-gray-50/50 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm bg-gray-50/50 focus:bg-white transition"
            />
          </div>

          {/* Trainer Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTrainer}
                onChange={(e) => setIsTrainer(e.target.checked)}
                className="w-4 h-4 text-saffron-600 rounded border-gray-300 focus:ring-saffron-400"
              />
              <span className="text-xs font-semibold text-gray-700">Login as Trainer</span>
            </label>
            <Link
              to="/login"
              onClick={closeAuthModal}
              className="text-xs text-saffron-600 hover:underline font-medium"
            >
              Full Login Page
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
          >
            {isSubmitting ? 'Signing in...' : isTrainer ? 'Sign In as Trainer' : 'Sign In as Member'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
          <span>New to YogaZen? </span>
          <Link
            to="/register"
            onClick={closeAuthModal}
            className="font-bold text-saffron-600 hover:underline"
          >
            Create an Account
          </Link>
          <span className="mx-1">•</span>
          <Link
            to="/trainer/register"
            onClick={closeAuthModal}
            className="font-bold text-gray-600 hover:text-saffron-600 hover:underline"
          >
            Join as Trainer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
