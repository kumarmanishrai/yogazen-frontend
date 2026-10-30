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
    a: 'Once enrolled, courses are instantly accessible from your User Profile under the "Enrolled Courses" tab with downloadable invoices and video stream links.'
  },
  {
    q: 'What is your return & exchange policy?',
    a: 'We offer a 7-day hassle-free return policy on all unused yoga gear and mindful props in their original biodegradable packaging.'
  },
  {
    q: 'How can I become an instructor on YogaZen?',
    a: 'Certified yoga and meditation teachers can apply directly by clicking "Teach on YogaZen" or visiting the Trainer Registration portal.'
  }
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'Store Order & Delivery',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    // Simulate inquiry dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedFeedback('Thank you for reaching out! A YogaZen care specialist will reply within 24 hours.');
      setFormData({
        name: '',
        email: '',
        inquiryType: 'Store Order & Delivery',
        subject: '',
        message: ''
      });
      setTimeout(() => setSubmittedFeedback(null), 5000);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-saffron-50/60 to-white py-14 sm:py-20 border-b border-saffron-100/60">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-saffron-100 text-saffron-800 border border-saffron-200">
              <span>💬</span> We Are Here to Support Your Practice
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Contact <span className="text-saffron-600">YogaZen Care</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
              Have questions regarding our authentic products, shipping timelines, live courses, or trainer onboarding?
              Our dedicated mindful support team is here to assist.
            </p>
          </div>
        </section>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Contact Form (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Send Us a Message</h2>
                <p className="text-xs text-gray-500 mt-1">Fill out the form below and we will respond to your email promptly.</p>
              </div>

              {submittedFeedback && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <span>✅</span>
                  <span>{submittedFeedback}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Inquiry Topic</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500 bg-white"
                    >
                      <option value="Store Order & Delivery">Store Order & Delivery</option>
                      <option value="Product Variety & Sizing">Product Variety & Sizing</option>
                      <option value="Yoga Course & Live Stream">Yoga Course & Live Stream</option>
                      <option value="Trainer Partnership Application">Trainer Partnership</option>
                      <option value="Wholesale & Studio Bulk Orders">Studio Bulk Orders</option>
                      <option value="Other Feedback">Other Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Question about Singing Bowl overtones"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message *</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="How can we help your yoga practice or wellness journey today?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-saffron-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message to YogaZen Care →'}
                </button>
              </form>
            </div>

            {/* Right: Direct Contact Details & Info (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-saffron-50/50 border border-saffron-100 space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Direct Support Channels</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Reach out via email, phone, or visit our central depot.</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📧</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Email Support</span>
                      <a href="mailto:care@yogazen.com" className="text-saffron-600 hover:underline">
                        care@yogazen.com
                      </a>
                      <span className="text-gray-400 block text-[11px]">Average response: within 4 hours</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-xl">📞</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Phone & WhatsApp Hotline</span>
                      <span className="text-gray-700 font-medium">+91 98765 43210</span>
                      <span className="text-gray-400 block text-[11px]">Mon – Sat: 7:00 AM – 8:00 PM IST</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-xl">🪷</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Spiritual Sanctuary & Lineage Hub</span>
                      <p className="text-gray-600 leading-relaxed">
                        YogaZen Ashram Lane, Tapovan, Rishikesh, Uttarakhand 249192, India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-xl">📦</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Warehouse Fulfillment Depot</span>
                      <p className="text-gray-600 leading-relaxed">
                        Sector 4B, Prayagraj Eco Logistics Park, Uttar Pradesh 211001 (WH-PRAYAG-B2)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick FAQ Box */}
              <div className="p-6 rounded-3xl bg-white border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Frequently Asked Questions</h3>
                <div className="space-y-3 divide-y divide-gray-100 text-xs">
                  {FAQ_ITEMS.map((item, idx) => (
                    <div key={idx} className="pt-2.5 first:pt-0">
                      <p className="font-bold text-gray-800 mb-1">{item.q}</p>
                      <p className="text-gray-500 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;

