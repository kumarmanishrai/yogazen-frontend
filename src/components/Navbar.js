import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, role, isLoggedIn, logout, openAuthModal } = useAuth();

  // Dummy badge counts for state
  const cartCount = 2;
  const wishlistCount = 3;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openAuthModal('Please sign in to access your shopping cart.');
    } else {
      navigate('/cart');
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openAuthModal('Please sign in to view your saved wishlist.');
    } else {
      navigate('/wishlist');
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-saffron-100 transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-saffron-50 border-b border-saffron-100/60 text-xs text-saffron-800 py-1.5 px-4 text-center tracking-wide">
        🌿 <span>Pure & Mindful Wellness • Free delivery on orders over ₹999 • 100% Eco-Friendly Packaging</span>
      </div>

      {/* Main Navbar */}
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-4">
          
          {/* Left: Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/yogazen_logo.svg"
                alt="YogaZen"
                className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="text-xl sm:text-2xl font-extrabold text-saffron-600 tracking-tight block leading-none">
                  YogaZen
                </span>
                <span className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase block mt-0.5">
                  Mindful Commerce
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search yoga mats, singing bowls, malas, organic tea..."
                  className="w-full pl-11 pr-24 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent bg-gray-50/70 hover:bg-white focus:bg-white text-sm text-gray-800 placeholder-gray-400 transition"
                />
                <div className="absolute left-4 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="absolute right-1.5 px-4 py-1.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white rounded-full text-xs font-bold transition shadow-sm"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Catalog/Store Link */}
            <Link
              to="/products"
              className="hidden lg:flex items-center text-sm font-semibold text-gray-700 hover:text-saffron-600 px-3 py-2 rounded-lg transition"
            >
              Shop All
            </Link>

            {/* Wishlist Button (Protected: prompts login popup if not signed in) */}
            <button
              onClick={handleWishlistClick}
              className="relative p-2.5 text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 rounded-full transition"
              title="Wishlist"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isLoggedIn && wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-saffron-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button (Protected: prompts login popup if not signed in) */}
            <button
              onClick={handleCartClick}
              className="relative p-2.5 text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 rounded-full transition"
              title="Shopping Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {isLoggedIn && cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-saffron-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-saffron-600 hover:bg-saffron-50 rounded-full sm:rounded-xl transition border border-transparent hover:border-saffron-200"
                aria-expanded={isProfileOpen}
              >
                <div className="w-8 h-8 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 font-bold text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="hidden xl:inline text-sm font-semibold">
                  {isLoggedIn ? (role === 'trainer' ? 'Trainer' : 'Account') : 'Account'}
                </span>
                <svg className="hidden xl:inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-saffron-100 py-2 z-20">
                    
                    {/* Header: User Info or Guest */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      {isLoggedIn ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                              {role === 'trainer' ? 'Trainer Portal' : 'Member'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900 mt-1 truncate">
                            {currentUser?.name || currentUser?.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-400">Welcome to YogaZen</p>
                          <p className="text-sm font-bold text-gray-800">Guest User</p>
                        </>
                      )}
                    </div>

                    {/* If NOT logged in: Show only Sign In & Register */}
                    {!isLoggedIn ? (
                      <div className="py-1">
                        <Link
                          to="/login"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-semibold transition"
                        >
                          <svg className="w-4 h-4 text-saffron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign In
                        </Link>

                        <Link
                          to="/register"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-semibold transition"
                        >
                          <svg className="w-4 h-4 text-saffron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create Account
                        </Link>

                        <div className="border-t border-gray-100 my-1"></div>

                        <Link
                          to="/trainer/register"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-saffron-700 hover:bg-saffron-50 font-semibold transition"
                        >
                          <span>🌿</span> Teach on YogaZen
                        </Link>
                      </div>
                    ) : (
                      /* If LOGGED IN: Show all options */
                      <div className="py-1">
                        {role === 'trainer' ? (
                          <>
                            <Link
                              to="/trainer/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              📊 Trainer Dashboard
                            </Link>
                            <Link
                              to="/trainer/profile"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              🧘 Trainer Profile & Payouts
                            </Link>
                            <Link
                              to="/trainer/dashboard#courses"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              📚 Manage Courses
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/profile"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              👤 My Profile & Addresses
                            </Link>
                            <Link
                              to="/cart"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              🛒 Shopping Cart
                            </Link>
                            <Link
                              to="/wishlist"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              💛 Saved Wishlist
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-700 font-medium transition"
                            >
                              📦 My Orders & Invoices
                            </Link>
                          </>
                        )}

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wellness products..."
              className="w-full pl-10 pr-20 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 bg-gray-50 text-gray-800 placeholder-gray-400"
            />
            <div className="absolute left-3.5 top-2.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="absolute right-1 top-1 px-3 py-1 bg-saffron-500 text-white rounded-full text-xs font-bold"
            >
              Search
            </button>
          </form>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-2">
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-saffron-50 hover:text-saffron-600"
            >
              🛍️ All Products
            </Link>
            <button
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleWishlistClick(e);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-saffron-50 hover:text-saffron-600 text-left"
            >
              <span>💛 Wishlist</span>
              {isLoggedIn && wishlistCount > 0 && (
                <span className="bg-saffron-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleCartClick(e);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-saffron-50 hover:text-saffron-600 text-left"
            >
              <span>🛒 Shopping Cart</span>
              {isLoggedIn && cartCount > 0 && (
                <span className="bg-saffron-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {!isLoggedIn ? (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-sm font-bold text-saffron-600 border border-saffron-300 rounded-xl hover:bg-saffron-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-sm font-bold text-white bg-saffron-500 rounded-xl hover:bg-saffron-600"
                  >
                    Register
                  </Link>
                </div>
                <Link
                  to="/trainer/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center py-2 text-xs font-semibold text-saffron-700 bg-saffron-50 rounded-xl"
                >
                  🌿 Teach on YogaZen (Join as Trainer)
                </Link>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-2 space-y-1">
                {role === 'trainer' ? (
                  <>
                    <Link
                      to="/trainer/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-saffron-50 hover:text-saffron-600"
                    >
                      📊 Trainer Dashboard
                    </Link>
                    <Link
                      to="/trainer/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-saffron-50 hover:text-saffron-600"
                    >
                      🧘 Trainer Profile & Payouts
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-saffron-50 hover:text-saffron-600"
                  >
                    👤 My Profile & Addresses
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
