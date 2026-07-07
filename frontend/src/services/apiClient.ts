import axios from "axios";

const IS_SERVER = typeof window === "undefined";

// تشخیص هوشمند محیط: در سمت سرور داکر از نام سرویس (backend) و در مرورگر از localhost استفاده می‌شود
const baseURL = IS_SERVER
  ? (process.env.INTERNAL_API_URL || "http://backend:8000/api/v1")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // دسترسی به localStorage فقط در سمت کلاینت (مرورگر) مجاز است
    if (!IS_SERVER) {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const parsedData = JSON.parse(authStorage);
          const token = parsedData?.state?.token;
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("خطا در خواندن توکن از localStorage:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);