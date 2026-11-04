import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordRequirementsModal, { validatePassword } from '../components/PasswordRequirementsModal';

const Register = () => {
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
  const location = useLocation();
  const { registerUser } = useAuth();

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
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      const checkout = params.get('checkout');
      await registerUser(formData.email, formData.password);
      if (redirect) {
        if (checkout === 'true') {
          try {
            sessionStorage.setItem('yogazen_pending_checkout', 'true');
          } catch (e) {}
        }
        navigate(redirect);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-saffron-50/20 flex flex-col justify-center px-4 py-12">
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

        {/* Member Register Card */}
        <div className="bg-white rounded-3xl border border-saffron-100 shadow-xl shadow-saffron-500/5 p-8 md:p-10">
          <div className="text-center mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-saffron-700 bg-saffron-50 border border-saffron-200/80 px-3 py-1 rounded-full inline-block mb-2">
              Member Account
            </span>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Join <span className="text-saffron-600">YogaZen</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Shop mindful wellness products & learn from certified trainers
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
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Member Account'}
            </button>
          </form>

          {/* Callout Link to Trainer Registration */}
          <div className="mt-8 pt-6 border-t border-gray-100 bg-saffron-50/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-600 font-medium">Are you a Yoga or Meditation Instructor?</p>
            <Link
              to="/trainer/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-700 hover:text-saffron-800 hover:underline mt-1"
            >
              <span>🌿</span> Register as a Trainer instead →
            </Link>
          </div>
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

      {/* Password Requirements Modal Popup */}
      <PasswordRequirementsModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        checks={passwordChecks}
      />
    </div>
  );
};

export default Register;
