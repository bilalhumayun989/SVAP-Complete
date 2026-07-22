const API_URL = 'http://localhost:5000/api';

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
  getProductsByUser: async (userId: string) => {
    const res = await fetch(`${API_URL}/products/user/${encodeURIComponent(userId)}`);
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

  // Swap Requests
  createSwapRequest: async (data: any) => {
    const res = await fetch(`${API_URL}/swap-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateSwapRequestStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/swap-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  }
};
