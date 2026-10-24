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
