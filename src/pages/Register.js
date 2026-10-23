import { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('Registration attempt:', {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
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

        {/* Register Card */}
        <div className="bg-white rounded-3xl border border-saffron-100 shadow-xl shadow-saffron-500/5 p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Join <span className="text-saffron-600">YogaZen</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Begin your path to mindfulness and holistic wellness
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Patanjali Sharma"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition"
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition"
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-saffron-600 hover:text-saffron-700 hover:underline transition ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
