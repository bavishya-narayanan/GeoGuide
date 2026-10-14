import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

let unauthorizedHandler = null;
let authToken = localStorage.getItem('geoguide_token');

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

client.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && unauthorizedHandler) unauthorizedHandler();
  return Promise.reject(error);
});

const unwrap = (request) => request.then(({ data }) => data);

export const api = {
  register: (payload) => unwrap(client.post('/auth/register', payload)),
  login: (payload) => unwrap(client.post('/auth/login', payload)),
  logout: () => unwrap(client.post('/auth/logout')),
  getCurrentUser: () => unwrap(client.get('/auth/me')),
  updateProfile: (name) => unwrap(client.put('/auth/profile', { name })),
  changePassword: (currentPassword, newPassword) => unwrap(client.put('/auth/change-password', { currentPassword, newPassword })),
  searchPlaces: (params) => unwrap(client.get('/places/search', { params })),
  getPlace: (osmId) => unwrap(client.get(`/places/${osmId}`)),
  getRatings: (osmId) => unwrap(client.get(`/places/${osmId}/ratings`)),
  addRating: (osmId, userId, rating) => unwrap(client.post(`/places/${osmId}/rating`, { rating })),
  updateRating: (osmId, rating) => unwrap(client.put(`/places/${osmId}/rating`, { rating })),
  getReviews: (osmId) => unwrap(client.get(`/places/${osmId}/reviews`)),
  addReview: (osmId, userId, reviewText) => unwrap(client.post(`/places/${osmId}/review`, { reviewText })),
  updateReview: (reviewId, reviewText) => unwrap(client.put(`/reviews/${reviewId}`, { reviewText })),
  deleteReview: (reviewId) => unwrap(client.delete(`/reviews/${reviewId}`)),
  addFavorite: (osmId) => unwrap(client.post(`/places/${osmId}/favorite`)),
  removeFavorite: (osmId) => unwrap(client.delete(`/places/${osmId}/favorite`)),
  getFavorites: () => unwrap(client.get('/users/me/favorites')),
  getSearchHistory: () => unwrap(client.get('/users/me/search-history')),
  clearSearchHistory: () => unwrap(client.delete('/users/me/search-history')),
  getPreferences: () => unwrap(client.get('/users/me/preferences')),
  updatePreferences: (categories, city) => unwrap(client.put('/users/me/preferences', { categories, city })),
  getDashboard: () => unwrap(client.get('/users/me/dashboard')),
  getUserRatings: () => unwrap(client.get('/users/me/ratings')),
  getUserReviews: () => unwrap(client.get('/users/me/reviews')),
  getProfile: () => unwrap(client.get('/auth/me'))
};

export function setAuthToken(token) {
  authToken = token || null;
  if (authToken) localStorage.setItem('geoguide_token', authToken);
  else localStorage.removeItem('geoguide_token');
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function getApiError(error, fallback = 'Unable to connect to GeoGuide server.') {
  return error.response?.data?.error || fallback;
}