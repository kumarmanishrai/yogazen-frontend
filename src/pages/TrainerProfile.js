import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const TrainerProfile = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'payout'

  // Trainer Info State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [trainerData, setTrainerData] = useState({
    name: currentUser?.name || 'Guru Devanshu Sharma',
    email: currentUser?.email || 'devanshu.yoga@yogazen.com',
    contact: currentUser?.contact || '+91 98111 22334',
    headline: 'Senior Ashtanga & Breathwork Master (ERYT-500)',
    bio: 'Dedicated practitioner of classical Himalayan Hatha & Ashtanga Vinyasa for over 12 years. Certified from Rishikesh Yog Peeth. Passionate about guiding modern souls toward mindful stillness and bodily vigor.',
    experienceYears: currentUser?.experienceYears || 12,
    isApproved: currentUser?.isApproved ?? false,
    categories: currentUser?.categories?.length > 0 ? currentUser.categories : ['Hatha Yoga', 'Pranayama', 'Ashtanga Vinyasa', 'Meditation'],
  });

  // Tag Input State
  const [newTagInput, setNewTagInput] = useState('');

  // Payout Details State
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutData, setPayoutData] = useState({
    accountHolderName: currentUser?.payoutDetails?.accountHolderName || 'Devanshu Sharma',
    accountNumber: currentUser?.payoutDetails?.accountNumber || '91823746192837',
    ifscCode: currentUser?.payoutDetails?.ifscCode || 'HDFC0001234',
    upiId: currentUser?.payoutDetails?.upiId || 'devanshu@okaxis',
  });



  // Handle Tag Management
  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !trainerData.categories.includes(tag)) {
      setTrainerData({
        ...trainerData,
        categories: [...trainerData.categories, tag],
      });
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTrainerData({
      ...trainerData,
      categories: trainerData.categories.filter((c) => c !== tagToRemove),
    });
  };

  // Save Profile Handler
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditingProfile(false);
    setProfileMessage('Trainer profile updated successfully!');
    setTimeout(() => setProfileMessage(''), 3000);
  };

  // Save Payout Handler
  const handleSavePayout = (e) => {
    e.preventDefault();
    setIsEditingPayout(false);
    setPayoutMessage('Payout & bank details saved successfully!');
    setTimeout(() => setPayoutMessage(''), 3000);
  };



  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-saffron-600 flex items-center justify-center text-white text-3xl font-black shadow-md shadow-saffron-600/20">
                🧘‍♂️
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{trainerData.name || 'Trainer Profile'}</h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                    Certified Trainer
                  </span>
                </div>
                <p className="text-sm text-gray-500">{trainerData.headline}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {trainerData.experienceYears} Years Experience • {trainerData.categories.length} Specializations
                </p>
              </div>
            </div>

            {/* Verification Status Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div
                className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  trainerData.isApproved
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${trainerData.isApproved ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}
                ></span>
                <span>{trainerData.isApproved ? 'Verified & Approved' : 'Verification: Pending Admin Review'}</span>
              </div>
              <Link
                to="/trainer/dashboard"
                className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Go to Dashboard →
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              🌿 Bio & Specializations
            </button>
            <button
              onClick={() => setActiveTab('payout')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'payout'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              💳 Payout & Bank Account
            </button>

          </div>

          {/* TAB 1: Profile & Bio & Categories */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-saffron-100 shadow-sm max-w-3xl space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Professional Bio & Credentials</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Visible to students across courses and search results</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-1.5 text-xs font-bold text-saffron-600 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 rounded-xl transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {profileMessage && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  {profileMessage}
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Instructor Name</label>
                      <input
                        type="text"
                        value={trainerData.name}
                        onChange={(e) => setTrainerData({ ...trainerData, name: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={trainerData.contact}
                        onChange={(e) => setTrainerData({ ...trainerData, contact: e.target.value })}
                        placeholder="+91 98000 00000"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Professional Title / Headline</label>
                    <input
                      type="text"
                      value={trainerData.headline}
                      onChange={(e) => setTrainerData({ ...trainerData, headline: e.target.value })}
                      placeholder="e.g. Master Trainer in Vinyasa & Meditation"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Years of Teaching Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={trainerData.experienceYears}
                      onChange={(e) => setTrainerData({ ...trainerData, experienceYears: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Instructor Biography</label>
                    <textarea
                      rows={4}
                      value={trainerData.bio}
                      onChange={(e) => setTrainerData({ ...trainerData, bio: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm leading-relaxed"
                    />
                  </div>

                  {/* Specialization Tags in Edit Mode */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Specializations / Categories</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {trainerData.categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-100 text-saffron-800 text-xs font-bold"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(cat)}
                            className="hover:text-red-600 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Add tag (e.g. Kundalini, Sound Healing)"
                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-1.5 bg-saffron-500 text-white rounded-xl text-xs font-bold hover:bg-saffron-600"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      Save Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Headline</span>
                    <p className="text-gray-900 font-semibold">{trainerData.headline}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">About the Instructor</span>
                    <p className="text-gray-700 leading-relaxed">{trainerData.bio}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold block mb-2">Teaching Specializations</span>
                    <div className="flex flex-wrap gap-2">
                      {trainerData.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 rounded-full bg-saffron-50 text-saffron-700 border border-saffron-200 text-xs font-bold"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Email</span>
                      <span className="text-gray-800 font-bold">{trainerData.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Phone</span>
                      <span className="text-gray-800 font-bold">{trainerData.contact || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Payout & Bank Account Details */}
          {activeTab === 'payout' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-saffron-100 shadow-sm max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Direct Earnings Payout Setup</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Where your course revenue is disbursed each billing cycle</p>
                </div>
                {!isEditingPayout && (
                  <button
                    onClick={() => setIsEditingPayout(true)}
                    className="px-4 py-1.5 text-xs font-bold text-saffron-600 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 rounded-xl transition"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {payoutMessage && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  {payoutMessage}
                </div>
              )}

              {isEditingPayout ? (
                <form onSubmit={handleSavePayout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={payoutData.accountHolderName}
                      onChange={(e) => setPayoutData({ ...payoutData, accountHolderName: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={payoutData.accountNumber}
                      onChange={(e) => setPayoutData({ ...payoutData, accountNumber: e.target.value })}
                      required
                      placeholder="e.g. 91823746192837"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={payoutData.ifscCode}
                      onChange={(e) => setPayoutData({ ...payoutData, ifscCode: e.target.value.toUpperCase() })}
                      required
                      placeholder="HDFC0001234"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (Optional for fast payouts)</label>
                    <input
                      type="text"
                      value={payoutData.upiId}
                      onChange={(e) => setPayoutData({ ...payoutData, upiId: e.target.value })}
                      placeholder="e.g. trainer@okhdfcbank"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      Save Payout Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPayout(false)}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm divide-y divide-gray-100">
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Account Holder</span>
                    <span className="font-semibold text-gray-900">{payoutData.accountHolderName || 'Not configured'}</span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Bank Account</span>
                    <span className="font-semibold text-gray-900">
                      {payoutData.accountNumber ? `•••• •••• ${payoutData.accountNumber.slice(-4)}` : 'Not configured'}
                    </span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">IFSC Code</span>
                    <span className="font-semibold text-gray-900">{payoutData.ifscCode || 'Not configured'}</span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">UPI ID</span>
                    <span className="font-semibold text-gray-900">{payoutData.upiId || 'Not configured'}</span>
                  </div>
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      <Footer />
    </div>
  );
};

export default TrainerProfile;
