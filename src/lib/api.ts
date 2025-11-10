import axios from "axios";
import { BookingPayload, RegisterPayload } from "./types";

// ✅ Create axios instance
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  timeout: 10000,
});

// // ✅ Add Authorization token automatically
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.group("🚨 API Error");
//     console.error("URL:", error.config?.url);
//     console.error("Status:", error.response?.status);
//     console.error("Response Data:", error.response?.data);
//     console.error("Message:", error.message);
//     console.error("Request:", error.request);
//     console.groupEnd();

//     if (typeof window !== "undefined" && error.response?.status === 401) {
//       const currentPath = window.location.pathname;
//       const isLoginPage =
//         currentPath === "/" ||
//         currentPath.includes("/login") ||
//         currentPath.includes("/verify");
//       const hasToken = localStorage.getItem("token");

//       if (!isLoginPage && hasToken) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         window.location.href = "/";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// ✅ Handle Unauthorized (401) responses safely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    if (typeof window !== "undefined" && error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isLoginPage =
        currentPath === "/" ||
        currentPath.includes("/login") ||
        currentPath.includes("/verify");
      const isLoginRequest = error.config?.url?.includes("/login");
      const hasToken = localStorage.getItem("token");

      // Prevent redirect loops & clear auth if necessary
      if (!isLoginPage && !isLoginRequest && hasToken) {
        console.warn("401 detected — clearing token and redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOtp: (email: string) => api.post("/user/send-otp", { email }),
  verifyOtp: (email: string, otp: string, token: string) => api.post("/user/verify-otp", { email, otp, token }),
  register: (data: RegisterPayload) => api.post("/user/register", data),
  getProfile: (token: string) => api.get("/user/profile", { headers: { Authorization: `Bearer ${token}` } }),
  updateProfile: (payload: Partial<Record<string, string>>, token: string) => api.put("/user/profile", payload, { headers: { Authorization: `Bearer ${token}` } }),
  getUserTrips: (userId: number, token: string) => api.get(`/user/trips/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
  confirmBooking: (payload: BookingPayload) => api.post(`/invoice/generate-invoice-send/${payload.tripId}`, payload),
};

export default api;
