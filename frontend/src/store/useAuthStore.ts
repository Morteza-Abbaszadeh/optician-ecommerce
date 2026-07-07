import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/services/apiClient" // در قدم‌های قبلی فایل کلاینت شبکه را در lib اصلاح کردیم

interface User {
  id: string
  full_name?: string
  phone_number: string
  is_superuser: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean // این مقدار برای هماهنگی با SSR در Next.js حیاتی است
  
  setToken: (token: string) => void
  fetchUser: () => Promise<void>
  logout: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      // لاگین و ذخیره توکن
      setToken: (token) => {
        set({ token, isAuthenticated: !!token })
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },
      
      // گرفتن اطلاعات کاربر از سرور بهینه شده
      fetchUser: async () => {
        try {
          const token = get().token;
          // جلوگیری از ارسال درخواست اضافی (۴۰۱) وقتی کاربر اصلا لاگین نیست
          if (!token) return;

          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await apiClient.get('/users/me') 
          set({ user: response.data })
        } catch (error) {
          console.error("خطا در دریافت پروفایل کاربری:", error)
          // خروج امن در صورت منقضی شدن توکن
          get().logout()
        }
      },

      // خروج از حساب یکپارچه و تمیز
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        delete apiClient.defaults.headers.common['Authorization']
        // نیازی به پاک کردن دستی localStorage نیست، پلاگین persist مقادیر null را ذخیره می‌کند
      },
      
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated()
      },
    }
  )
)