import { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img
              src="/yogazen_logo.svg"
              alt="YogaZen Logo"
              className="h-20 sm:h-22 w-auto object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-saffron-100 shadow-xl shadow-saffron-500/5 p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Welcome to <span className="text-saffron-600">YogaZen</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your mindful wellness journey
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Sign In
            </button>
          </form>

          {/* Forgot Password */}
          <div className="text-center mt-5">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-saffron-600 hover:text-saffron-700 hover:underline transition"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-sm text-gray-600">
          New to YogaZen?{' '}
          <Link
            to="/register"
            className="font-bold text-saffron-600 hover:text-saffron-700 hover:underline transition ml-1"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
