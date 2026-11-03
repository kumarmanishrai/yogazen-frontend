import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin, isLoggedIn, isAdmin } = useAuth();
  const { showNotification } = useNotification();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated as admin, jump to command center
  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      navigate('/admin');
    }
  }, [isLoggedIn, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showNotification('Please enter username/email and password', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      const adminData = await loginAdmin({
        identifier: identifier.trim(),
        password: password.trim()
      });

      showNotification(
        `Welcome ${adminData.name || 'Administrator'}! Session established.`,
        'success'
      );
      navigate('/admin');
    } catch (err) {
      showNotification(err.message || 'Administrative authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 font-nunito relative overflow-hidden selection:bg-saffron-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-saffron-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Header Branding */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-saffron-600 via-saffron-500 to-amber-400 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-saffron-500/20 mb-3">
            👑
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            YogaZen Control Hub
          </h1>
          <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
            Restricted entry for authorized administrators only.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
              Username or Registered Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                👤
              </span>
              <input
                type="text"
                required
                placeholder="Enter username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 font-semibold focus:outline-none focus:border-saffron-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
              Secret Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 font-semibold focus:outline-none focus:border-saffron-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-saffron-600 to-amber-500 hover:from-saffron-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg shadow-saffron-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <span>Unlock Admin Terminal (→)</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-800 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-stone-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <span>←</span>
            <span>Return to YogaZen Public Sanctuary</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

