import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiUpdateTrainerProfile, apiUpdateTrainerPayout } from '../services/api';

const TrainerProfile = () => {
  const { currentUser, role, isLoggedIn, isLoading, openAuthModal, updateCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'payout'

  // Trainer Info State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [trainerData, setTrainerData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    contact: currentUser?.contact || '',
    headline: currentUser?.headline || '',
    bio: currentUser?.bio || '',
    experienceYears: currentUser?.experienceYears ?? '',
    isApproved: currentUser?.isApproved ?? false,
    categories: Array.isArray(currentUser?.categories) ? currentUser.categories : [],
  });

  // Tag Input State
  const [newTagInput, setNewTagInput] = useState('');

  // Payout Details State
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutData, setPayoutData] = useState({
    accountHolderName: currentUser?.payoutDetails?.accountHolderName || '',
    accountNumber: currentUser?.payoutDetails?.accountNumber || '',
    ifscCode: currentUser?.payoutDetails?.ifscCode || '',
    upiId: currentUser?.payoutDetails?.upiId || '',
  });

  // Sync state if currentUser changes or loads from session
  useEffect(() => {
    if (currentUser) {
      setTrainerData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.contact || '',
        headline: currentUser.headline || '',
        bio: currentUser.bio || '',
        experienceYears: currentUser.experienceYears ?? '',
        isApproved: currentUser.isApproved ?? false,
        categories: Array.isArray(currentUser.categories) ? currentUser.categories : [],
      });
      setPayoutData({
        accountHolderName: currentUser.payoutDetails?.accountHolderName || '',
        accountNumber: currentUser.payoutDetails?.accountNumber || '',
        ifscCode: currentUser.payoutDetails?.ifscCode || '',
        upiId: currentUser.payoutDetails?.upiId || '',
      });
    }
  }, [currentUser]);

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
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      setProfileMessage('');
      const res = await apiUpdateTrainerProfile({
        name: trainerData.name,
        contact: trainerData.contact,
        headline: trainerData.headline,
        bio: trainerData.bio,
        experienceYears: trainerData.experienceYears,
        categories: trainerData.categories,
      });
      if (res?.trainer) {
        if (updateCurrentUser) updateCurrentUser(res.trainer);
        setProfileMessage('Trainer profile updated successfully!');
        setIsEditingProfile(false);
        setTimeout(() => setProfileMessage(''), 3000);
      }
    } catch (err) {
      setProfileMessage(`Error: ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Payout Handler
  const handleSavePayout = async (e) => {
    e.preventDefault();
    try {
      setIsSavingPayout(true);
      setPayoutMessage('');
      const res = await apiUpdateTrainerPayout(payoutData);
      if (res?.payoutDetails) {
        if (updateCurrentUser) updateCurrentUser({ payoutDetails: res.payoutDetails });
        setPayoutMessage('Payout & bank details saved successfully!');
        setIsEditingPayout(false);
        setTimeout(() => setPayoutMessage(''), 3000);
      }
    } catch (err) {
      setPayoutMessage(`Error: ${err.message || 'Failed to update payout details'}`);
    } finally {
      setIsSavingPayout(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-nunito">
        <Navbar />
        <div className="py-32 text-center">
          <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Checking credentials...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Guest Barrier
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <span className="text-5xl">🧘‍♂️</span>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Trainer Sign In Required</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Please sign in with your instructor credentials to manage your verified bio, credentials, and payout methods.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => openAuthModal('Please sign in with your Trainer account.')}
                className="w-full sm:w-auto px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Sign In as Trainer
              </button>
              <Link
                to="/trainer/register"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Register as Instructor
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Regular User Barrier
  if (role !== 'trainer') {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-nunito">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-12 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <span className="text-5xl">🔒</span>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Access Restricted: Trainer Portal</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              You are currently signed in as a <span className="font-bold text-gray-800">Practitioner (User Account)</span>.
              The Trainer Profile is reserved for verified instructors.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/profile"
                className="w-full sm:w-auto px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Go to Your User Profile
              </Link>
              <Link
                to="/trainer/register"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Apply to Teach on YogaZen 🌿
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-saffron-600 flex items-center justify-center text-white text-3xl font-black shadow-md shadow-saffron-600/20">
                {trainerData.name ? trainerData.name.charAt(0).toUpperCase() : '🧘‍♂️'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{trainerData.name || 'Instructor Profile'}</h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                    Certified Trainer
                  </span>
                </div>
                <p className="text-sm text-gray-500">{trainerData.headline || 'No professional title set yet'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {trainerData.experienceYears !== '' ? `${trainerData.experienceYears} Years Experience` : 'Experience not set'} • {trainerData.categories.length} Specializations
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

          {/* Profile Completeness Alert */}
          {!Boolean(trainerData.name?.trim() && trainerData.contact?.trim() && trainerData.bio?.trim() && trainerData.categories?.length > 0) && (
            <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Your Instructor Profile is Incomplete</h3>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Please provide your <strong>Full Name</strong>, <strong>Contact Phone</strong>, <strong>Biography</strong>, and at least one <strong>Specialization Tag</strong>. Course creation is blocked until your profile is completed.
                  </p>
                </div>
              </div>
              {!isEditingProfile && (
                <button
                  onClick={() => { setActiveTab('profile'); setIsEditingProfile(true); }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap text-center"
                >
                  Complete Profile Now
                </button>
              )}
            </div>
          )}

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
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile'}
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
                    <p className="text-gray-900 font-semibold">
                      {trainerData.headline || <span className="text-gray-400 italic font-normal">No headline set yet (e.g. Master Instructor in Ashtanga & Pranayama)</span>}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">About the Instructor</span>
                    {trainerData.bio ? (
                      <p className="text-gray-700 leading-relaxed">{trainerData.bio}</p>
                    ) : (
                      <p className="text-gray-400 italic">
                        No instructor biography provided yet. Click "Edit Profile" to share your journey, lineage, and teaching philosophy with your students.
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold block mb-2">Teaching Specializations</span>
                    {trainerData.categories.length > 0 ? (
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
                    ) : (
                      <p className="text-gray-400 italic text-xs">
                        No specialization tags added yet (e.g. Hatha Yoga, Pranayama, Meditation).
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Email</span>
                      <span className="text-gray-800 font-bold">{trainerData.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Phone</span>
                      <span className="text-gray-800 font-bold">
                        {trainerData.contact || <span className="text-gray-400 italic font-normal">Not provided yet</span>}
                      </span>
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
                      placeholder="Name as registered with your bank"
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
                      disabled={isSavingPayout}
                      className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {isSavingPayout ? 'Saving...' : 'Save Payout Details'}
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
                <>
                  {!payoutData.accountHolderName && !payoutData.accountNumber && !payoutData.ifscCode && !payoutData.upiId ? (
                    <div className="text-center py-8">
                      <span className="text-3xl">💳</span>
                      <p className="text-gray-500 text-xs mt-2">No bank or UPI payout account linked yet.</p>
                      <button
                        onClick={() => setIsEditingPayout(true)}
                        className="mt-3 px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        + Set Up Direct Payouts
                      </button>
                    </div>
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
                </>
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
