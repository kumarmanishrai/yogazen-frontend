import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FAQ_ITEMS = [
  {
    q: 'How long does delivery take for store products?',
    a: 'All orders are packed from our central depot and delivered within 3-5 business days across India. Tracking details are emailed immediately upon dispatch.'
  },
  {
    q: 'How do I access my enrolled yoga courses?',
    a: 'Once enrolled, courses are instantly accessible from your User Profile or My Courses portal with permanent curriculum access, video streams, and downloadable invoices.'
  },
  {
    q: 'What is your return & exchange policy?',
    a: 'We offer a 7-day hassle-free return policy on all unused yoga gear and mindful props in their original biodegradable packaging.'
  },
  {
    q: 'How can I become an instructor on YogaZen?',
    a: 'Certified yoga and meditation trainers can apply directly by visiting the Trainer Registration portal or emailing us at www.yogazen@gmail.com.'
  }
];

const Contact = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('www.yogazen@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between font-nunito transition-colors duration-200">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-saffron-500/10 via-amber-500/5 to-transparent py-14 sm:py-20 border-b border-saffron-100 dark:border-stone-800">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-saffron-100 dark:bg-stone-800 text-saffron-800 dark:text-saffron-300 border border-saffron-200 dark:border-stone-700">
              <span>💬</span> We Are Here to Support Your Practice
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Contact <span className="text-saffron-600 dark:text-saffron-400">YogaZen Care</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
              Have questions regarding our authentic wellness gear, shipment dispatch timelines, live courses, or trainer collaborations?
              Reach out directly to our mindful team.
            </p>
          </div>
        </section>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          
          {/* Primary Featured Email Contact Card */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-saffron-50/60 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl p-8 sm:p-12 border border-saffron-200/80 dark:border-stone-800 shadow-sm dark:shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-saffron-500 text-white flex items-center justify-center text-3xl mx-auto shadow-md shadow-saffron-500/20">
              ✉️
            </div>
            
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-xs uppercase font-extrabold tracking-widest text-saffron-700 dark:text-saffron-400">
                Official Support Email
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                <a
                  href="mailto:www.yogazen@gmail.com"
                  className="hover:text-saffron-600 dark:hover:text-saffron-400 underline decoration-saffron-300 dark:decoration-saffron-700 underline-offset-4 transition"
                >
                  www.yogazen@gmail.com
                </a>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
                For order support, return requests, course curriculum inquiries, trainer onboarding, or general queries, write directly to our care team.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="mailto:www.yogazen@gmail.com"
                className="px-6 py-3 bg-saffron-500 hover:bg-saffron-600 active:bg-saffron-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-saffron-500/25 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>✉️</span>
                <span>Send Direct Email</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-6 py-3 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-2 cursor-pointer"
              >
                <span>📋</span>
                <span>{copied ? 'Copied to Clipboard! ✓' : 'Copy Email Address'}</span>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Average response window: within 2 to 4 hours</span>
            </div>
          </div>

          {/* Direct Support Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Channel 1: Phone Hotline */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xl">
                📞
              </div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Phone & WhatsApp Hotline
              </h3>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                +91 98765 43210
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Available Monday – Saturday from 7:00 AM to 8:00 PM IST for urgent order assistance.
              </p>
            </div>

            {/* Channel 2: Rishikesh Sanctuary */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-saffron-100 dark:bg-stone-800 text-saffron-800 dark:text-saffron-400 flex items-center justify-center text-xl">
                🪷
              </div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Spiritual Lineage Hub
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                YogaZen Ashram Lane, Tapovan, Rishikesh, Uttarakhand 249192, India
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Certified Vedic curriculum studio & instructor workshop centre.
              </p>
            </div>

            {/* Channel 3: Fulfillment Depot */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 flex items-center justify-center text-xl">
                📦
              </div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Fulfillment Depot
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Sector 4B, Prayagraj Eco Logistics Park, Uttar Pradesh 211001
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Central distribution center for pan-India courier dispatch and verified returns.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Quick answers to common questions about orders, courses, and instructor applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQ_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1.5"
                >
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="text-saffron-500">Q.</span>
                    <span>{item.q}</span>
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-4">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
