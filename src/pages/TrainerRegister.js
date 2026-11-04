import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordRequirementsModal, { validatePassword } from '../components/PasswordRequirementsModal';

const TrainerRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({});
  const navigate = useNavigate();
  const { registerTrainer } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { isValid, checks } = validatePassword(formData.password);
    if (!isValid) {
      setPasswordChecks(checks);
      setShowPasswordModal(true);
      setError('Password does not satisfy all security requirements.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await registerTrainer(formData.email, formData.password);
      navigate('/trainer/dashboard');
    } catch (err) {
      setError(err.message || 'Trainer registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-saffron-50/30 flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img
              src="/yogazen_logo.svg"
              alt="YogaZen Logo"
              className="h-16 sm:h-20 w-auto object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* Trainer Register Card */}
        <div className="bg-white rounded-3xl border border-saffron-200/80 shadow-xl shadow-saffron-500/10 p-8 md:p-10 relative overflow-hidden">
          {/* Subtle Decorative Tag */}
          <div className="absolute top-0 right-0 bg-saffron-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-bl-2xl">
            Instructor Portal
          </div>

          <div className="text-center mb-8">
            <span className="text-2xl mb-1 inline-block">🧘‍♂️</span>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Train on <span className="text-saffron-600">YogaZen</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Create courses, train mindful students, and receive earnings directly
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Trainer Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="instructor@example.com"
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
                Create Password
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
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-saffron-600 hover:bg-saffron-700 active:bg-saffron-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register as Yoga Trainer'}
            </button>
          </form>

          {/* Switch to Member Registration */}
          <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50/70 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-600 font-medium">Looking to buy yoga gear or take classes as a student?</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-saffron-600 hover:underline mt-1"
            >
              <span>🛍️</span> Register as a Member instead →
            </Link>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Already registered as an instructor?{' '}
          <Link
            to="/login?trainer=true"
            className="font-bold text-saffron-600 hover:text-saffron-700 hover:underline transition ml-1"
          >
            Trainer Sign In
          </Link>
        </p>
      </div>

      {/* Password Requirements Modal Popup */}
      <PasswordRequirementsModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        checks={passwordChecks}
      />
    </div>
  );
};

export default TrainerRegister;
