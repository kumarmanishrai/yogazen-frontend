import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        {/* Hero Header */}
        <section className="bg-gradient-to-b from-saffron-50/60 to-white py-16 sm:py-20 border-b border-saffron-100/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-saffron-100 text-saffron-800 border border-saffron-200">
              <span>🛡️</span> Transparent, Mindful Data Privacy
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500">
              Last Updated: October 30, 2026 • Effective Date: January 1, 2026
            </p>
          </div>
        </section>

        {/* Policy Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          
          {/* Summary Box */}
          <div className="p-6 rounded-2xl bg-saffron-50/70 border border-saffron-200/80 shadow-sm space-y-2">
            <h2 className="text-base font-bold text-saffron-900 flex items-center gap-2">
              <span>🌿</span> Our Core Commitment to Your Privacy
            </h2>
            <p className="text-xs sm:text-sm text-saffron-800 leading-relaxed">
              At YogaZen, we honor your privacy with the same mindfulness and sacred care that we bring to our yoga gear
              and spiritual teachings. We will never sell, rent, or trade your personal data to advertisers.
              This document outlines how we protect and responsibly handle your information.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              1. Information We Collect
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              When you create an account, purchase mindful products, enroll in yoga courses, or communicate with instructors,
              we collect the following categories of information:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-600 pl-2">
              <li><strong className="text-gray-800">Account Credentials:</strong> Name, email address, password hash, role (practitioner or trainer), and optional profile avatar.</li>
              <li><strong className="text-gray-800">Order & Shipping Details:</strong> Delivery address, phone number, purchased items, inventory variety SKU, invoice copies, and order statuses.</li>
              <li><strong className="text-gray-800">Course Participation:</strong> Enrolled courses, trainer session logs, and course reviews submitted by you.</li>
              <li><strong className="text-gray-800">Support & Feedback:</strong> Inquiries sent via our contact form, order complaints raised to administrators, and customer review submissions.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              2. How We Use Your Information
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We process personal information only for legitimate service delivery purposes, specifically to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                <h4 className="text-xs font-bold text-gray-900">📦 Order Fulfillment</h4>
                <p className="text-xs text-gray-600">
                  Pick, pack, ship, and trace authentic wellness gear, and deliver email notifications regarding package delivery status.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                <h4 className="text-xs font-bold text-gray-900">🧘 Course Access</h4>
                <p className="text-xs text-gray-600">
                  Grant instant, lifetime access to purchased yoga courses, practice video streams, and live meditation sessions.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                <h4 className="text-xs font-bold text-gray-900">🔒 Security & Authentication</h4>
                <p className="text-xs text-gray-600">
                  Verify user and trainer identities, protect restricted admin panels, and safeguard account access with JWT tokenization.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                <h4 className="text-xs font-bold text-gray-900">💬 Customer Support & Complaints</h4>
                <p className="text-xs text-gray-600">
                  Directly investigate order disputes or product queries submitted through our order complaint and contact system.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              3. Payment & Financial Data Security
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              YogaZen does <strong className="text-gray-900">not</strong> store, log, or have access to your full credit card numbers, debit PINs, or UPI security pins.
              All monetary transactions are processed directly by PCI-DSS compliant payment gateways utilizing end-to-end 256-bit SSL encryption.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              4. Cookies, Session Tokens, and Local Storage
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use strictly necessary browser storage mechanisms to maintain your signed-in state, remember your active shopping cart items,
              and sync your wishlist across sessions. You can clear your browser storage or sign out at any time to immediately invalidate session tokens.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              5. Third-Party Disclosures
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We never sell your information. We disclose data solely to trustworthy service providers under strict non-disclosure obligations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-600 pl-2">
              <li><strong className="text-gray-800">Logistics & Courier Couriers:</strong> Name, shipping address, and phone number to deliver physical packages.</li>
              <li><strong className="text-gray-800">Cloud Infrastructure:</strong> Encrypted database and server clusters hosted with industry-standard security protocols.</li>
              <li><strong className="text-gray-800">Legal Compliance:</strong> When strictly mandated by applicable laws or regulatory authorities.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              6. Your Rights & Data Control
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              You maintain complete ownership of your personal data. At any time, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600 pl-2">
              <li>Review and edit your profile details from the <Link to="/profile" className="text-saffron-600 font-semibold underline">User Profile page</Link>.</li>
              <li>Review all your previous orders, invoices, and active complaints.</li>
              <li>Request full account deletion and personal data erasure by contacting our support team.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 p-6 rounded-2xl border border-gray-200 bg-gray-50/70">
            <h3 className="text-base font-bold text-gray-900">
              7. Questions, Grievances & Contact Information
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              If you have any questions regarding this Privacy Policy, your personal information, or wish to exercise your data rights,
              please reach out through our <Link to="/contact" className="text-saffron-600 font-semibold underline">Contact Us</Link> portal
              or write to our Data Protection Officer at:
            </p>
            <div className="text-xs text-gray-700 font-mono bg-white p-3 rounded-lg border border-gray-200 inline-block">
              privacy@yogazen.com • YogaZen Sanctuary, Rishikesh, Uttarakhand, India
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;

