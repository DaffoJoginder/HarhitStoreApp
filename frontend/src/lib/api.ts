import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth APIs
export const authAPI = {
  registerB2C: (data: any) => api.post("/auth/register/b2c", data),
  registerB2B: (data: FormData) =>
    api.post("/auth/register/b2b", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  login: (data: { identifier: string; password: string }) =>
    api.post("/auth/login", data),
};

// Category APIs
export const categoryAPI = {
  getCategories: () => api.get("/categories"),
  getSubcategories: (categoryId: string) =>
    api.get(`/categories/${categoryId}/subcategories`),
  createCategory: (data: FormData) => api.post("/categories", data),
  createSubcategory: (
    categoryId: string,
    data: { name: string; description?: string }
  ) => api.post(`/categories/${categoryId}/subcategories`, data),
};

// Product APIs
export const productAPI = {
  getProducts: (params?: {
    account_type?: string;
    category_id?: string;
    search?: string;
  }) => api.get("/products", { params }),
  getProduct: (productId: string, accountType?: string) =>
    api.get(`/products/${productId}`, {
      params: { account_type: accountType },
    }),
  createProduct: (data: FormData) => api.post("/products", data),
};

// Cart APIs
export const cartAPI = {
  getCart: () => api.get("/cart"),
  addToCart: (data: { product_id: string; quantity: number }) =>
    api.post("/cart/add", data),
  addToCartB2B: (data: { product_id: string; quantity: number }) =>
    api.post("/cart/b2b/add", data),
  updateCartItem: (cartItemId: string, data: { quantity: number }) =>
    api.put(`/cart/items/${cartItemId}`, data),
  removeCartItem: (cartItemId: string) =>
    api.delete(`/cart/items/${cartItemId}`),
  clearCart: () => api.delete("/cart/clear"),
};

// Order APIs
export const orderAPI = {
  placeOrderB2C: (data: any) => api.post("/orders/b2c/place", data),
  placeOrderB2B: (data: any) => api.post("/orders/b2b/place", data),
  getOrders: (params?: { page?: number; limit?: number }) =>
    api.get("/orders", { params }),
  getOrder: (orderId: string) => api.get(`/orders/${orderId}`),
  cancelOrder: (orderId: string, data: { reason: string }) =>
    api.post(`/orders/${orderId}/cancel`, data),
  reorderB2B: (orderId: string) => api.post(`/orders/b2b/reorder/${orderId}`),
};

// B2B APIs
export const b2bAPI = {
  getProfile: () => api.get("/b2b/profile"),
  getCreditDashboard: () => api.get("/b2b/credit/dashboard"),
  getAddresses: () => api.get("/b2b/addresses"),
  addAddress: (data: any) => api.post("/b2b/addresses", data),
  updateAddress: (addressId: string, data: any) =>
    api.put(`/b2b/addresses/${addressId}`, data),
  deleteAddress: (addressId: string) =>
    api.delete(`/b2b/addresses/${addressId}`),
};

// Admin APIs
export const adminAPI = {
  getPendingB2B: () => api.get("/admin/b2b/pending"),
  approveB2B: (businessId: string, data: any) =>
    api.post(`/admin/b2b/approve/${businessId}`, data),
  getOrders: (params?: {
    order_type?: string;
    order_status?: string;
    page?: number;
  }) => api.get("/admin/orders", { params }),
  updateOrderStatus: (orderId: string, data: { order_status: string }) =>
    api.put(`/admin/orders/${orderId}/status`, data),
};

export default api;
