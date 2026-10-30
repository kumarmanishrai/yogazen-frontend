import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-saffron-50/60 to-white py-16 sm:py-24 border-b border-saffron-100/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-saffron-100 text-saffron-800 border border-saffron-200">
              <span>🪷</span> Rooted in Tradition, Crafted for Modern Living
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              About <span className="text-saffron-600 underline decoration-saffron-200 decoration-wavy">YogaZen</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-600 leading-relaxed">
              We bridge timeless yogic wisdom and mindful living. From hand-hammered Himalayan singing bowls
              to sustainably harvested cork mats and live instructor courses, YogaZen is your sacred sanctuary for inner peace.
            </p>
          </div>
        </section>

        {/* Core Mission & Story */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-saffron-600 block">
                Our Genesis & Philosophy
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                Preserving Sacred Craftsmanship and Authentic Lineages
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                YogaZen was born out of a desire to return sacred wellness practice to its authentic roots. In a world
                filled with synthetic, mass-produced fitness plastic, we set out to partner directly with Himalayan
                metal artisans, organic cotton weavers, and traditional forest foragers.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every singing bowl is forged using a traditional 7-metal bell bronze alloy. Every meditation mala is hand-strung
                with intentional overhand knotting. Every bolster is packed with triple-cleaned natural buckwheat hulls to support
                effortless spinal alignment.
              </p>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-saffron-100 bg-saffron-50/50 p-8 shadow-sm text-center">
              <span className="text-7xl block mb-4">🧘‍♀️</span>
              <blockquote className="text-sm font-semibold text-gray-800 italic leading-relaxed">
                "Yoga is not about touching your toes; it is what you learn on the way down. Our gear and courses are crafted to honor that journey."
              </blockquote>
              <span className="block text-xs font-bold text-saffron-700 mt-4">— YogaZen Founders</span>
            </div>
          </div>

          {/* Pillars of YogaZen */}
          <section className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-black text-gray-900">The Four Pillars of Our Sanctuary</h2>
              <p className="text-xs text-gray-500 mt-1">Ethical principles that guide our marketplace and training curriculum</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-saffron-300 shadow-2xs hover:shadow-md transition text-center space-y-3">
                <span className="text-4xl block">🌿</span>
                <h3 className="font-bold text-sm text-gray-900">100% Eco-Conscious</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Natural oak cork, organic handloom cotton, and recyclable metals with zero harmful PVC or petrochemicals.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-saffron-300 shadow-2xs hover:shadow-md transition text-center space-y-3">
                <span className="text-4xl block">🔔</span>
                <h3 className="font-bold text-sm text-gray-900">Artisan Fair Trade</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Direct ethical compensation for traditional artisans across Rishikesh, Tibet, Varanasi, and Bengal.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-saffron-300 shadow-2xs hover:shadow-md transition text-center space-y-3">
                <span className="text-4xl block">📜</span>
                <h3 className="font-bold text-sm text-gray-900">Certified Instructors</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Only ERYT-certified instructors guide live courses, guaranteeing authentic breathing and asana alignment.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-saffron-300 shadow-2xs hover:shadow-md transition text-center space-y-3">
                <span className="text-4xl block">📦</span>
                <h3 className="font-bold text-sm text-gray-900">Zero-Plastic Delivery</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  All store orders arrive in biodegradable kraft cardboard sealed with water-activated plant starch tape.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Stats Banner */}
          <div className="rounded-3xl bg-saffron-500 text-white p-8 sm:p-12 shadow-xl shadow-saffron-500/20 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <span className="text-3xl sm:text-4xl font-black block">30+</span>
              <span className="text-xs font-semibold text-saffron-100 uppercase tracking-wider mt-1 block">
                Artisanal Products
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black block">210+</span>
              <span className="text-xs font-semibold text-saffron-100 uppercase tracking-wider mt-1 block">
                Exact Varieties
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black block">10,000+</span>
              <span className="text-xs font-semibold text-saffron-100 uppercase tracking-wider mt-1 block">
                Mindful Yogis
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black block">100%</span>
              <span className="text-xs font-semibold text-saffron-100 uppercase tracking-wider mt-1 block">
                Cruelty-Free Craft
              </span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="text-center pt-8 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Begin Your Mindful Journey Today</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/products"
                className="px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Browse Mindful Store 🛍️
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition"
              >
                Get in Touch with Us &rarr;
              </Link>
            </div>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default About;

