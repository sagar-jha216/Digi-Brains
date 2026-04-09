import axios from "axios";

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";
export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("access_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  }
  return Promise.reject(e);
});

export const authAPI = {
  register: (d: any) => api.post("/api/auth/register", d),
  login: (email: string, pw: string) => {
    const f = new URLSearchParams();
    f.append("username", email);
    f.append("password", pw);
    return api.post("/api/auth/login", f, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  },
  getMe: () => api.get("/api/auth/me"),
  updateMe: (d: any) => api.patch("/api/auth/me", d),
};

export const brandsAPI = {
  list: () => api.get("/api/brands"),
  get: (id: number) => api.get(`/api/brands/${id}`),
  create: (d: any) => api.post("/api/brands", d),
  update: (id: number, d: any) => api.patch(`/api/brands/${id}`, d),
  delete: (id: number) => api.delete(`/api/brands/${id}`),
  uploadLogo: (id: number, file: File) => {
    const f = new FormData(); f.append("file", file);
    return api.post(`/api/brands/${id}/logo`, f);
  },
};

export const productsAPI = {
  listByBrand: (brandId: number) => api.get(`/api/products/brand/${brandId}`),
  get: (id: number) => api.get(`/api/products/${id}`),
  create: (brandId: number, d: any) => api.post(`/api/products/brand/${brandId}`, d),
  update: (id: number, d: any) => api.patch(`/api/products/${id}`, d),
  delete: (id: number) => api.delete(`/api/products/${id}`),
  uploadMedia: (productId: number, file: File) => {
    const f = new FormData(); f.append("file", file);
    return api.post(`/api/products/${productId}/media`, f);
  },
  uploadMediaBulk: (productId: number, files: File[]) => {
    const f = new FormData();
    files.forEach((file) => f.append("files", file));
    return api.post(`/api/products/${productId}/media/bulk`, f);
  },
  listMedia: (productId: number) => api.get(`/api/products/${productId}/media`),
  deleteMedia: (pid: number, mid: number) => api.delete(`/api/products/${pid}/media/${mid}`),
};

export const contentAPI = {
  generate: (d: any) => api.post("/api/content/generate", d),
  list: (params?: any) => api.get("/api/content", { params }),
  get: (id: number) => api.get(`/api/content/${id}`),
  update: (id: number, d: any) => api.patch(`/api/content/${id}`, d),
  approve: (id: number) => api.post(`/api/content/${id}/approve`),
  delete: (id: number) => api.delete(`/api/content/${id}`),
};

export const socialAPI = {
  listAccounts: (brandId?: number) => api.get("/api/social/accounts", { params: { brand_id: brandId } }),
  connectAccount: (d: any) => api.post("/api/social/accounts/connect", null, { params: d }),
  disconnectAccount: (id: number) => api.delete(`/api/social/accounts/${id}`),
  schedulePost: (d: any) => api.post("/api/social/schedule", d),
  listScheduled: (params?: any) => api.get("/api/social/schedule", { params }),
  cancelPost: (id: number) => api.delete(`/api/social/schedule/${id}`),
  publishNow: (id: number) => api.post(`/api/social/schedule/${id}/publish-now`),
};

export const analyticsAPI = {
  getSummary: (brandId?: number) => api.get("/api/analytics/summary", { params: { brand_id: brandId } }),
  getTimeline: (params?: any) => api.get("/api/analytics/timeline", { params }),
};

export const videosAPI = {
  generate: (d: any) => api.post("/api/videos/generate", d),
  generateBatch: (d: any) => api.post("/api/videos/generate-batch", d),
  autoSchedule: (d: any) => api.post("/api/videos/auto-schedule", d),
  list: (params?: any) => api.get("/api/videos", { params }),
  get: (id: number) => api.get(`/api/videos/${id}`),
  render: (id: number) => api.post(`/api/videos/${id}/render`),
};
