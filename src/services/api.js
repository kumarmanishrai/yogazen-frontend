const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Global singleton promise for silent token refresh to prevent concurrent race conditions
let refreshPromise = null;

async function silentlyRefreshToken() {
  if (!refreshPromise) {
    const role = localStorage.getItem('yogazen_role') || 'user';
    const refreshEndpoint = role === 'trainer' ? '/trainer/refresh-token' : '/user/refresh-token';

    refreshPromise = fetch(`${API_BASE}${refreshEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Refresh token invalid or expired');
        }
        return res.json();
      })
      .catch((err) => {
        // Refresh failed (e.g. 60-day token expired or revoked): clean up local session
        localStorage.removeItem('yogazen_user');
        localStorage.removeItem('yogazen_role');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('yogazen:auth-expired'));
        }
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Strictly required for cross-domain HTTP-only cookie exchange
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Check for token expiration (401 or TOKEN_EXPIRED)
      const isAuthEndpoint =
        endpoint.includes('/login') ||
        endpoint.includes('/register') ||
        endpoint.includes('/refresh-token') ||
        endpoint.includes('/logout');

      if ((response.status === 401 || data.code === 'TOKEN_EXPIRED') && !isRetry && !isAuthEndpoint) {
        try {
          await silentlyRefreshToken();
          // Token refreshed successfully: retry the original request transparently
          return await request(endpoint, options, true);
        } catch (refreshErr) {
          // Token refresh failed; proceed to throw original 401 error
        }
      }

      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Token Refresh Endpoint
export const apiRefreshToken = () => silentlyRefreshToken();

// User Endpoints
export const apiRegisterUser = (credentials) =>
  request('/user/register', { method: 'POST', body: JSON.stringify(credentials) });

export const apiLoginUser = (credentials) =>
  request('/user/login', { method: 'POST', body: JSON.stringify(credentials) });

export const apiGetUserProfile = () =>
  request('/user/profile', { method: 'GET' });

export const apiUpdateUserProfile = (userData) =>
  request('/user/profile', { method: 'PUT', body: JSON.stringify(userData) });

export const apiAddUserAddress = (addressData) =>
  request('/user/address', { method: 'POST', body: JSON.stringify(addressData) });

export const apiUpdateUserAddress = (id, addressData) =>
  request(`/user/address/${id}`, { method: 'PUT', body: JSON.stringify(addressData) });

export const apiDeleteUserAddress = (id) =>
  request(`/user/address/${id}`, { method: 'DELETE' });

export const apiLogoutUser = (data) =>
  request('/user/logout', { method: 'POST', body: JSON.stringify(data || {}) });

// Trainer Endpoints
export const apiRegisterTrainer = (credentials) =>
  request('/trainer/register', { method: 'POST', body: JSON.stringify(credentials) });

export const apiLoginTrainer = (credentials) =>
  request('/trainer/login', { method: 'POST', body: JSON.stringify(credentials) });

export const apiGetTrainerProfile = () =>
  request('/trainer/profile', { method: 'GET' });

export const apiUpdateTrainerProfile = (trainerData) =>
  request('/trainer/profile', { method: 'PUT', body: JSON.stringify(trainerData) });

export const apiUpdateTrainerPayout = (payoutData) =>
  request('/trainer/payout-details', { method: 'PUT', body: JSON.stringify(payoutData) });

export const apiTrainerGetCourses = () =>
  request('/trainer/courses', { method: 'GET' });

export const apiTrainerGetCourseById = (courseId) =>
  request(`/trainer/courses/${courseId}`, { method: 'GET' });

export const apiTrainerCreateCourse = (courseData) =>
  request('/trainer/courses', { method: 'POST', body: JSON.stringify(courseData) });

export const apiTrainerUpdateCourse = (courseId, courseData) =>
  request(`/trainer/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(courseData) });

export const apiTrainerDeleteCourse = (courseId) =>
  request(`/trainer/courses/${courseId}`, { method: 'DELETE' });

export const apiTrainerAddClass = (courseId, classData) =>
  request(`/trainer/courses/${courseId}/classes`, { method: 'POST', body: JSON.stringify(classData) });

export const apiTrainerUpdateClass = (courseId, classId, classData) =>
  request(`/trainer/courses/${courseId}/classes/${classId}`, { method: 'PUT', body: JSON.stringify(classData) });

export const apiTrainerDeleteClass = (courseId, classId) =>
  request(`/trainer/courses/${courseId}/classes/${classId}`, { method: 'DELETE' });

export const apiTrainerSetClassLive = (courseId, classId, liveData) =>
  request(`/trainer/courses/${courseId}/classes/${classId}/live-status`, { method: 'PUT', body: JSON.stringify(liveData) });

export const apiGetEnrolledCourses = () =>
  request('/user/courses', { method: 'GET' });

export const apiLogoutTrainer = (data) =>
  request('/trainer/logout', { method: 'POST', body: JSON.stringify(data || {}) });

// Cart Endpoints
export const apiGetCart = () =>
  request('/cart', { method: 'GET' });

export const apiAddToCart = (productId, quantity = 1, varietyData = {}) =>
  request('/cart/add', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      quantity,
      varietySku: varietyData.varietySku || '',
      varietyName: varietyData.varietyName || ''
    })
  });

export const apiUpdateCartItem = (productId, quantity) =>
  request('/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity }) });

export const apiRemoveFromCart = (productId) =>
  request(`/cart/remove/${productId}`, { method: 'DELETE' });

export const apiClearCart = () =>
  request('/cart/clear', { method: 'DELETE' });

// Public Store Products Endpoints
export const apiGetProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiGetCategories = () =>
  request('/products/categories', { method: 'GET' });

export const apiGetProductById = (id) =>
  request(`/products/${id}`, { method: 'GET' });

export const apiGetSimilarProducts = (id) =>
  request(`/products/${id}/similar`, { method: 'GET' });

export const apiAddProductReview = (id, reviewData) =>
  request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) });

// Wishlist Endpoints
export const apiGetWishlist = () =>
  request('/wishlist', { method: 'GET' });

export const apiAddToWishlist = (productId) =>
  request('/wishlist/add', { method: 'POST', body: JSON.stringify({ productId }) });

export const apiToggleWishlist = (productId) =>
  request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) });

export const apiRemoveFromWishlist = (productId) =>
  request(`/wishlist/remove/${productId}`, { method: 'DELETE' });

export const apiMoveWishlistToCart = (productId, quantity = 1) =>
  request('/wishlist/move-to-cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });

export const apiClearWishlist = () =>
  request('/wishlist/clear', { method: 'DELETE' });

// Admin Inventory Endpoints
export const apiAdminGetProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/products${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiAdminAddProduct = (productData) =>
  request('/admin/products', { method: 'POST', body: JSON.stringify(productData) });

export const apiAdminUpdateProduct = (id, productData) =>
  request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });

export const apiAdminUpdateStock = (id, stockData) =>
  request(`/admin/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(stockData) });

export const apiAdminDeleteProduct = (id) =>
  request(`/admin/products/${id}`, { method: 'DELETE' });

// Order Endpoints
export const apiGetMyOrders = () =>
  request('/orders/my-orders', { method: 'GET' });

export const apiCreateOrder = (orderData) =>
  request('/orders', { method: 'POST', body: JSON.stringify(orderData) });

export const apiGetOrderById = (id) =>
  request(`/orders/${id}`, { method: 'GET' });

export const apiValidateCoupon = (couponCode, subtotal) =>
  request('/orders/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ couponCode, subtotal })
  });

export const apiCancelOrder = (id, reason) =>
  request(`/orders/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });

export const apiRequestReturn = (id, reason) =>
  request(`/orders/${id}/return`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });

export const apiUpdateCourseProgress = (id, payload, totalClasses) => {
  const body = typeof payload === 'object' && payload !== null
    ? payload
    : { classId: payload, totalClasses };

  return request(`/orders/${id}/course-progress`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
};

// Admin Orders & Fulfillment Endpoints
export const apiAdminGetOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/orders/admin/all${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiAdminUpdateOrderStatus = (id, updateData) =>
  request(`/orders/admin/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });

// Admin Promotional Coupons Endpoints
export const apiAdminGetCoupons = () =>
  request('/orders/admin/coupons', { method: 'GET' });

export const apiAdminCreateCoupon = (couponData) =>
  request('/orders/admin/coupons', { method: 'POST', body: JSON.stringify(couponData) });

export const apiAdminToggleCoupon = (id) =>
  request(`/orders/admin/coupons/${id}/toggle`, { method: 'PUT' });

export const apiAdminDeleteCoupon = (id) =>
  request(`/orders/admin/coupons/${id}`, { method: 'DELETE' });

// Complaints & Support Endpoints
export const apiCreateComplaint = (complaintData) =>
  request('/complaints', { method: 'POST', body: JSON.stringify(complaintData) });

export const apiGetMyComplaints = () =>
  request('/complaints/my-complaints', { method: 'GET' });

// Admin Complaints Endpoints
export const apiAdminGetComplaintStats = () =>
  request('/complaints/admin/stats', { method: 'GET' });

export const apiAdminGetComplaints = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/complaints/admin/all${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiAdminUpdateComplaint = (id, updateData) =>
  request(`/complaints/admin/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });

// ==========================================
// --- Admin Platform Management APIs ---
// ==========================================

export const apiAdminLogin = (credentials) =>
  request('/admin/login', { method: 'POST', body: JSON.stringify(credentials) });

export const apiAdminLogout = (data) =>
  request('/admin/logout', { method: 'POST', body: JSON.stringify(data || {}) });

export const apiGetAdminProfile = () =>
  request('/admin/profile', { method: 'GET' });

export const apiAdminGetStats = () =>
  request('/admin/dashboard/stats', { method: 'GET' });

// Sub-Admin Management (Superadmin Only)
export const apiAdminGetSubAdmins = () =>
  request('/admin/subadmins', { method: 'GET' });

export const apiAdminCreateSubAdmin = (adminData) =>
  request('/admin/subadmins', { method: 'POST', body: JSON.stringify(adminData) });

export const apiAdminUpdateSubAdmin = (id, adminData) =>
  request(`/admin/subadmins/${id}`, { method: 'PUT', body: JSON.stringify(adminData) });

export const apiAdminDeleteSubAdmin = (id) =>
  request(`/admin/subadmins/${id}`, { method: 'DELETE' });

// CRM & User Management
export const apiAdminGetUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/users${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiAdminGetUserById = (id) =>
  request(`/admin/users/${id}`, { method: 'GET' });

export const apiAdminToggleUserStatus = (id, isActive) =>
  request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });

export const apiAdminDeleteUser = (id) =>
  request(`/admin/users/${id}`, { method: 'DELETE' });

// Trainer & Course Management
export const apiAdminGetTrainers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/trainers${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiAdminUpdateTrainerApproval = (id, isApproved) =>
  request(`/admin/trainers/${id}/approval`, { method: 'PATCH', body: JSON.stringify({ isApproved }) });

export const apiAdminToggleTrainerStatus = (id, isActive) =>
  request(`/admin/trainers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });

export const apiAdminUpdateTrainerSettings = (id, settings) =>
  request(`/admin/trainers/${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) });

export const apiAdminDeleteTrainer = (id) =>
  request(`/admin/trainers/${id}`, { method: 'DELETE' });

export const apiAdminGetCourses = () =>
  request('/admin/courses', { method: 'GET' });

export const apiAdminUpdateCourseStatus = (id, statusData) =>
  request(`/admin/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify(statusData) });

export const apiAdminDeleteCourse = (id) =>
  request(`/admin/courses/${id}`, { method: 'DELETE' });

// Financials & Transaction Ledger (with FY and Custom Date filters)
export const apiAdminGetFinancials = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/financials/transactions${query ? `?${query}` : ''}`, { method: 'GET' });
};

// Telemetry & Recommendation Dataset Endpoints
export const apiTrackAnalytics = (events) =>
  request('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ events: Array.isArray(events) ? events : [events] })
  });

export const apiExportAnalyticsDataset = (format = 'json') =>
  request(`/analytics/export-dataset?format=${format}`, { method: 'GET' });

// --- Yoga Courses Public & Student Endpoints ---
export const apiGetCourses = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/courses${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiGetCourseById = (id) =>
  request(`/courses/${id}`, { method: 'GET' });

export const apiAddCourseReview = (id, reviewData) =>
  request(`/courses/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });

export const apiEnrollInCourse = (id, enrollData = {}) =>
  request(`/courses/${id}/enroll`, {
    method: 'POST',
    body: JSON.stringify(enrollData)
  });


export const apiGetRecommendations = (sessionId, userId) => {
  const params = new URLSearchParams();
  if (sessionId) params.append('sessionId', sessionId);
  if (userId) params.append('userId', userId);
  const qs = params.toString();
  return request(`/analytics/recommendations${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

// Admin Audit & Security Logging Endpoints
export const apiAdminGetAuditLogs = (params = {}) => {
  const cleaned = Object.entries(params).reduce((acc, [k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') {
      acc[k] = v;
    }
    return acc;
  }, {});
  const query = new URLSearchParams(cleaned).toString();
  return request(`/admin/audit-logs${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const apiAdminExportAuditLogs = (params = {}) => {
  const cleaned = Object.entries(params).reduce((acc, [k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') {
      acc[k] = v;
    }
    return acc;
  }, {});
  cleaned.format = 'csv';
  const query = new URLSearchParams(cleaned).toString();
  return request(`/admin/audit-logs/export${query ? `?${query}` : ''}`, { method: 'GET' });
};
