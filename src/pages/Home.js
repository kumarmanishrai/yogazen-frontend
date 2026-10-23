import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Reusable Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          {/* Gentle Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-saffron-50 text-saffron-700 border border-saffron-200 mb-6">
            <span>✨</span> Curated Wellness for Mind, Body & Soul
          </span>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Embrace Tranquility with{' '}
            <span className="text-saffron-600 underline decoration-saffron-200 decoration-wavy">
              YogaZen
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Discover ethically-crafted yoga mats, Tibetan singing bowls, sacred malas,
            organic wellness nutrition, and retreat bookings — designed to elevate your daily practice.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/products"
              className="w-full sm:w-auto px-8 py-3.5 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white font-bold rounded-full shadow-lg shadow-saffron-500/20 hover:shadow-xl transition-all"
            >
              Explore Catalog 🧘
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 hover:border-saffron-400 text-gray-700 hover:text-saffron-600 font-bold rounded-full transition-all"
            >
              Sign In / Join Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
