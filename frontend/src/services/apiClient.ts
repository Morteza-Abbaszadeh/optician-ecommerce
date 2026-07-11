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

// توجه: تابع داخل interceptor حالا از نوع async است تا بتوانیم از await استفاده کنیم
apiClient.interceptors.request.use(
  async (config) => {
    if (IS_SERVER) {
      // ۱. سمت سرور (SSR / Server Components)
      try {
        // ایمپورت داینامیک فقط در زمان اجرا روی سرور انجام می‌شود
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        // خواندن کوکیِ ذخیره شده در قدم قبلی
        const token = cookieStore.get("auth_token")?.value;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // این خطا در زمان Static Build نکس‌جی‌اس طبیعی است و نباید مشکلی ایجاد کند
        console.warn("عدم دسترسی به کوکی در این مرحله از رندر سرور.");
      }
    } else {
      // ۲. سمت کلاینت (Browser Requests)
      try {
        // در سمت کلاینت همان روال قبلی شما (خواندن از zustand persist) را نگه می‌داریم 
        // چون سریع‌تر از خواندن کوکی با جاوااسکریپت است و نیازی به تغییر اضافی ندارد
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