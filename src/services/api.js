const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
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

export const apiLogoutUser = () =>
  request('/user/logout', { method: 'POST' });

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

export const apiTrainerCreateCourse = (courseData) =>
  request('/trainer/courses', { method: 'POST', body: JSON.stringify(courseData) });

export const apiLogoutTrainer = () =>
  request('/trainer/logout', { method: 'POST' });

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

// Telemetry & Recommendation Dataset Endpoints
export const apiTrackAnalytics = (events) =>
  request('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ events: Array.isArray(events) ? events : [events] })
  });

export const apiExportAnalyticsDataset = (format = 'json') =>
  request(`/analytics/export-dataset?format=${format}`, { method: 'GET' });

export const apiGetRecommendations = (sessionId) =>
  request(`/analytics/recommendations${sessionId ? `?sessionId=${sessionId}` : ''}`, { method: 'GET' });
