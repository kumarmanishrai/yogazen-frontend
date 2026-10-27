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

export const apiLogoutUser = () =>
  request('/user/logout', { method: 'POST' });

// Trainer Endpoints
export const apiRegisterTrainer = (credentials) =>
  request('/trainer/register', { method: 'POST', body: JSON.stringify(credentials) });

export const apiLoginTrainer = (credentials) =>
  request('/trainer/login', { method: 'POST', body: JSON.stringify(credentials) });

export const apiGetTrainerProfile = () =>
  request('/trainer/profile', { method: 'GET' });

export const apiLogoutTrainer = () =>
  request('/trainer/logout', { method: 'POST' });

// Cart Endpoints
export const apiGetCart = () =>
  request('/cart', { method: 'GET' });

export const apiAddToCart = (productId, quantity = 1) =>
  request('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }) });

export const apiUpdateCartItem = (productId, quantity) =>
  request('/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity }) });

export const apiRemoveFromCart = (productId) =>
  request(`/cart/remove/${productId}`, { method: 'DELETE' });

export const apiClearCart = () =>
  request('/cart/clear', { method: 'DELETE' });

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
