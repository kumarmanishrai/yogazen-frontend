import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const { currentUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'addresses' | 'courses'

  // Personal Info State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [userInfo, setUserInfo] = useState({
    name: currentUser?.name || 'Aarav Patel',
    email: currentUser?.email || 'aarav.patel@example.com',
    contact: currentUser?.contact || '+91 98765 43210',
  });

  // Addresses State
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      street: '42 Lotus Bloom Avenue, Flat 3B',
      landmark: 'Near Isha Yoga Center',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
      contact: '+91 98765 43210',
      isDefault: true,
    },
    {
      id: 2,
      street: '15 Nirvana Residency, Lane 4',
      landmark: 'Opposite Bodhi Tree Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India',
      contact: '+91 98765 11223',
      isDefault: false,
    },
  ]);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    contact: '',
    isDefault: false,
  });

  // Enrolled Courses & Invoices State
  const [enrolledCourses] = useState([
    {
      id: 'c1',
      title: 'Hatha Yoga for Flexibility & Inner Balance',
      trainer: 'Acharya Devansh',
      category: 'Yoga Asana',
      enrolledAt: '15 Oct 2026',
      amountPaid: 1499,
      invoiceId: 'YZ-INV-2026-8821',
      progress: 65,
    },
    {
      id: 'c2',
      title: '7-Day Sacred Pranayama & Breath Mastery',
      trainer: 'Yogini Ananya',
      category: 'Pranayama',
      enrolledAt: '20 Oct 2026',
      amountPaid: 899,
      invoiceId: 'YZ-INV-2026-9044',
      progress: 25,
    },
  ]);



  // Handle Info Update
  const handleSaveInfo = (e) => {
    e.preventDefault();
    setIsEditingInfo(false);
    setInfoMessage('Profile details updated successfully!');
    setTimeout(() => setInfoMessage(''), 3000);
  };

  // Open Address Modal
  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressFormData({
      street: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      contact: userInfo.contact || '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressFormData(addr);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (editingAddressId) {
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingAddressId
            ? { ...addressFormData, id: editingAddressId }
            : addressFormData.isDefault
            ? { ...addr, isDefault: false }
            : addr
        )
      );
    } else {
      const newAddr = {
        ...addressFormData,
        id: Date.now(),
      };
      setAddresses((prev) => {
        if (newAddr.isDefault) {
          return [...prev.map((a) => ({ ...a, isDefault: false })), newAddr];
        }
        return [...prev, newAddr];
      });
    }
    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    }
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };



  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 text-2xl font-black shadow-inner">
              {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{userInfo.name || 'Member'}</h1>
                <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 px-2.5 py-0.5 rounded-full border border-saffron-200 w-fit mx-auto sm:mx-0">
                  Mindful Member
                </span>
              </div>
              <p className="text-sm text-gray-500">{userInfo.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Member since October 2026 • {enrolledCourses.length} active courses • {addresses.length} saved addresses
              </p>
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
              👤 Personal Details
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              📍 Shipping Addresses ({addresses.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                  : 'bg-white text-gray-600 hover:text-saffron-600 border border-gray-200'
              }`}
            >
              🧘 My Courses & Invoices ({enrolledCourses.length})
            </button>

          </div>

          {/* TAB 1: Personal Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-saffron-100 shadow-sm max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage your name and direct contact details</p>
                </div>
                {!isEditingInfo && (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="px-4 py-1.5 text-xs font-bold text-saffron-600 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 rounded-xl transition"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {infoMessage && (
                <div className="mb-6 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  {infoMessage}
                </div>
              )}

              {isEditingInfo ? (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={userInfo.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={userInfo.contact}
                      onChange={(e) => setUserInfo({ ...userInfo, contact: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm divide-y divide-gray-100">
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Full Name</span>
                    <span className="font-semibold text-gray-900">{userInfo.name || 'Not provided'}</span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Email</span>
                    <span className="font-semibold text-gray-900">{userInfo.email}</span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-gray-500 text-xs font-medium">Contact Phone</span>
                    <span className="font-semibold text-gray-900">{userInfo.contact || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Addresses Management */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delivery Addresses</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Used for delivery of wellness mats, singing bowls, and malas</p>
                </div>
                <button
                  onClick={openAddAddressModal}
                  className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <span>+</span> Add New Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-6 rounded-3xl border bg-white relative transition-all ${
                      addr.isDefault
                        ? 'border-saffron-400 shadow-md shadow-saffron-500/5 ring-1 ring-saffron-400'
                        : 'border-gray-200 hover:border-saffron-200'
                    }`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-5 right-5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                        Default Address
                      </span>
                    )}

                    <p className="text-sm font-bold text-gray-900">{addr.street}</p>
                    {addr.landmark && <p className="text-xs text-gray-500 mt-0.5">Landmark: {addr.landmark}</p>}
                    <p className="text-xs text-gray-600 mt-1">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-xs text-gray-600">{addr.country}</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">📞 {addr.contact}</p>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditAddressModal(addr)}
                          className="font-bold text-saffron-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="font-bold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-gray-500 hover:text-gray-800 font-medium"
                        >
                          Make Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Enrolled Courses & Downloadable Invoices */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saffron-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Enrolled Courses & PDF Invoices</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Access your course curriculums and download official tax receipts anytime
                </p>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">You haven't enrolled in any courses yet.</p>
                  <Link
                    to="/products?cat=yoga"
                    className="inline-block mt-3 px-5 py-2 bg-saffron-500 text-white rounded-xl text-xs font-bold"
                  >
                    Browse Yoga Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-5 rounded-2xl border border-gray-100 hover:border-saffron-200 bg-gray-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-50 text-saffron-700 border border-saffron-200">
                          {course.category}
                        </span>
                        <h4 className="text-base font-bold text-gray-900">{course.title}</h4>
                        <p className="text-xs text-gray-500">
                          Instructor: <span className="font-semibold text-gray-700">{course.trainer}</span> • Enrolled on {course.enrolledAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <span className="text-xs text-gray-400 block">Amount Paid</span>
                          <span className="text-sm font-extrabold text-gray-900">₹{course.amountPaid}</span>
                        </div>

                        {/* Download PDF Invoice Button */}
                        <button
                          onClick={() =>
                            alert(`Downloading PDF Invoice for ${course.invoiceId} (Amount: ₹${course.amountPaid}). Feature connected to invoice generator!`)
                          }
                          className="px-4 py-2 bg-white hover:bg-saffron-50 text-saffron-700 border border-saffron-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <svg className="w-4 h-4 text-saffron-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Invoice PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {/* Address Add / Edit Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Address'}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Street Address & Flat / House No.</label>
                <input
                  type="text"
                  value={addressFormData.street}
                  onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                  required
                  placeholder="e.g. 108 Shanti Niwas, 2nd Cross"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressFormData.landmark}
                  onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })}
                  placeholder="e.g. Near Shiv Temple"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    required
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={addressFormData.state}
                    onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                    required
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={addressFormData.pincode}
                    onChange={(e) => setAddressFormData({ ...addressFormData, pincode: e.target.value })}
                    required
                    placeholder="560001"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={addressFormData.country}
                    onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone for Delivery</label>
                <input
                  type="text"
                  value={addressFormData.contact}
                  onChange={(e) => setAddressFormData({ ...addressFormData, contact: e.target.value })}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressFormData.isDefault}
                  onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-saffron-600 focus:ring-saffron-400"
                />
                <span className="text-xs font-medium text-gray-700">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-xl transition"
                >
                  {editingAddressId ? 'Save Address' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserProfile;
