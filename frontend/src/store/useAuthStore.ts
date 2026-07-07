import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/services/apiClient" // مسیر apiClient خود را چک کنید

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
  isHydrated: boolean
  
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
      
      // گرفتن اطلاعات کاربر از سرور (برای چک کردن is_superuser)
      fetchUser: async () => {
        try {
          const token = get().token;
          if (token) {
             apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          }
          // مسیر گرفتن اطلاعات کاربر در بک‌اند شما (اگر مسیرش فرق دارد اینجا اصلاح کنید)
          const response = await apiClient.get('/users/me') 
          set({ user: response.data })
        } catch (error) {
          console.error("Failed to fetch user profile:", error)
          // اگر توکن منقضی شده بود، کاربر را خارج می‌کنیم
          get().logout()
        }
      },

      // خروج از حساب
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        delete apiClient.defaults.headers.common['Authorization']
        localStorage.removeItem("access_token")
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