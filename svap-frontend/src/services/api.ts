export const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  // Auth
  signup: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  login: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  sendOtp: async (email: string) => {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },
  verifyOtp: async (email: string, otp: string) => {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },
  updateProfile: async (userId: string, data: any) => {
    const res = await fetch(`${API_URL}/auth/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getProfile: async (userId: string) => {
    const res = await fetch(`${API_URL}/auth/profile/${encodeURIComponent(userId)}`);
    return res.json();
  },
  createGoogleProfile: async (data: {
    userId: string;
    email: string;
    name: string;
    avatar_url?: string;
    provider?: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/create-google-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  refreshProfile: async (userId: string) => {
    const res = await fetch(`${API_URL}/auth/refresh-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Upload
  uploadImage: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  uploadVideo: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/upload/video`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // Products
  getProducts: async (params?: { category?: string; search?: string; stories?: boolean }) => {
    const query = new URLSearchParams();

    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.stories) query.set('stories', 'true');

    const res = await fetch(`${API_URL}/products${query.toString() ? `?${query.toString()}` : ''}`);
    return res.json();
  },
  getStories: async () => {
    const res = await fetch(`${API_URL}/products/stories`);
    return res.json();
  },
  getProductsByCategory: async (category: string) => {
    const res = await fetch(`${API_URL}/products?category=${encodeURIComponent(category)}`);
    return res.json();
  },
  getProductById: async (id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`);
    return res.json();
  },
  getProductsByUser: async (userId: string, activeOnly = false) => {
    const query = activeOnly ? '?active=true' : '';
    const res = await fetch(`${API_URL}/products/user/${encodeURIComponent(userId)}${query}`);
    return res.json();
  },
  createProduct: async (data: any) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateProduct: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Swap Requests
  createSwapRequest: async (data: any) => {
    const res = await fetch(`${API_URL}/swap-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  checkSwapEligibility: async (userId: string, productId: string) => {
    const res = await fetch(`${API_URL}/swap-requests/check/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`);
    return res.json();
  },

  // Orders
  createOrder: async (data: any) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateSwapRequestStatus: async (id: string, status: string, updated_by?: string) => {
    const res = await fetch(`${API_URL}/swap-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updated_by }),
    });
    return res.json();
  },
  getSwapRequestsByUser: async (userId: string) => {
    const res = await fetch(`${API_URL}/swap-requests/user/${encodeURIComponent(userId)}`);
    return res.json();
  },

  // Notifications
  getNotifications: async (userId: string) => {
    const res = await fetch(`${API_URL}/notifications/user/${encodeURIComponent(userId)}`);
    return res.json();
  },
  markAllNotificationsRead: async (userId: string) => {
    const res = await fetch(`${API_URL}/notifications/user/${encodeURIComponent(userId)}/read-all`, {
      method: 'PATCH',
    });
    return res.json();
  },
  markNotificationRead: async (id: string) => {
    const res = await fetch(`${API_URL}/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    });
    return res.json();
  },

  // Saved Products
  getSavedProducts: async (userId: string) => {
    const res = await fetch(`${API_URL}/saved/${encodeURIComponent(userId)}`);
    return res.json();
  },
  getSavedProductIds: async (userId: string) => {
    const res = await fetch(`${API_URL}/saved/${encodeURIComponent(userId)}/ids`);
    return res.json();
  },
  saveProduct: async (userId: string, productId: string) => {
    const res = await fetch(`${API_URL}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, product_id: productId }),
    });
    return res.json();
  },
  unsaveProduct: async (userId: string, productId: string) => {
    const res = await fetch(`${API_URL}/saved`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, product_id: productId }),
    });
    return res.json();
  },
};
