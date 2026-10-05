import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname || "";
      const publicPath =
        path === "/login" ||
        path === "/register" ||
        path === "/about" ||
        path.startsWith("/blog") ||
        path === "/" ||
        path.startsWith("/explore");
      // Don't bounce marketing/public pages to login on a stray 401
      if (!publicPath) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);