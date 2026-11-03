import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTrainer, setIsTrainer] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // If redirected with ?trainer=true, pre-check the trainer checkbox
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('trainer') === 'true') {
      setIsTrainer(true);
    }
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      const checkout = params.get('checkout');
      const account = await login(email, password, isTrainer);
      if (account.role === 'trainer') {
        navigate('/trainer/dashboard');
      } else if (redirect) {
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
      setError(err.message || 'Invalid email or password');
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

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-saffron-100 shadow-xl shadow-saffron-500/5 p-8 md:p-10">
          <div className="text-center mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-saffron-700 bg-saffron-50 border border-saffron-200/80 px-3 py-1 rounded-full inline-block mb-2">
              {isTrainer ? 'Trainer Login' : 'Member Login'}
            </span>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Welcome to <span className="text-saffron-600">YogaZen</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isTrainer
                ? 'Sign in to access your instructor dashboard & courses'
                : 'Sign in to your mindful wellness journey'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

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

            {/* Trainer Checkbox (Default unchecked -> user login) */}
            <div className="p-3 rounded-xl bg-saffron-50/70 border border-saffron-100 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="trainerCheckbox"
                  checked={isTrainer}
                  onChange={(e) => setIsTrainer(e.target.checked)}
                  className="w-4 h-4 text-saffron-600 rounded border-gray-300 focus:ring-saffron-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-800">
                  Login as a Trainer
                </span>
              </label>
              <span className="text-[11px] text-saffron-700 font-semibold">
                {isTrainer ? 'Instructor Account' : 'Default: Member'}
              </span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Signing In...'
                : isTrainer
                ? 'Sign In as Trainer'
                : 'Sign In'}
            </button>
          </form>

          {/* Links for Registration */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-2 text-xs text-gray-600">
            <p>
              New Member?{' '}
              <Link to="/register" className="font-bold text-saffron-600 hover:underline">
                Create an account
              </Link>
            </p>
            <p>
              Are you a trainer?{' '}
              <Link to="/trainer/register" className="font-bold text-saffron-700 hover:underline">
                Register as a Trainer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
