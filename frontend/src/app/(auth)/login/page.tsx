"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/services/apiClient"
import { useAuthStore } from "@/store/useAuthStore"

export default function LoginPage() {
  const router = useRouter()
  // توابع Zustand را فراخوانی می‌کنیم
  const setToken = useAuthStore((state) => state.setToken)
  const fetchUser = useAuthStore((state) => state.fetchUser)

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // State برای نگهداری مقادیر فرم
  const [formData, setFormData] = useState({
    phone_number: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // ۱. ارسال درخواست به بک‌اند (فقط شماره تلفن و رمز)
      // توجه: در برخی بک‌اند‌ها (FastAPI OAuth2) ورود با form-data است نه JSON.
      // اگر اینجا ارور دریافت کردید، مسیر بک‌اند را چک کنید.
      const response = await apiClient.post("/users/login", formData)
      
      // ۲. دریافت توکن و ذخیره آن
      const { access_token } = response.data;
      if (!access_token) {
           throw new Error("توکن در پاسخ یافت نشد")
      }
      
      // ۳. آپدیت استور (فقط توکن را می‌فرستیم، fetchUser خودش یوزر را می‌گیرد)
      setToken(access_token);
      
      // ۴. گرفتن اطلاعات کاربر (اختیاری اگر در اپ لازم است)
      if(fetchUser) {
          await fetchUser();
      }

      // ۵. کاربر را به صفحه اصلی سایت (یا داشبورد) هدایت می‌کنیم
      router.push("/")
      
    } catch (err: any) {
      // خطا را مدیریت می‌کنیم. استور به هیچ وجه آپدیت نمی‌شود
      setError(err.response?.data?.detail || "شماره موبایل یا رمز عبور اشتباه است.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 p-4 font-sans" dir="rtl">
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
        
        <div className="w-full p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8 text-right">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">ورود به حساب</h1>
            <p className="text-sm text-zinc-500">
              جهت ورود، شماره موبایل و رمز عبور خود را وارد نمایید.
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* نمایش ارور در صورت اشتباه بودن رمز */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 text-right">
                {error}
              </div>
            )}

            <div className="space-y-2 text-right">
              <Label htmlFor="phone_number" className="text-zinc-700 font-medium block">شماره موبایل</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="09123456789"
                type="tel"
                className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-xl transition-all text-left px-4"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="text-zinc-700 font-medium block">رمز عبور</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-xl transition-all text-left pl-4 pr-12"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="text-right pt-1">
              <Link href="/forgot-password" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                فراموشی رمز عبور؟
              </Link>
            </div>

            <Button disabled={loading} type="submit" className="w-full h-12 text-base font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all mt-6">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "ورود"}
            </Button>
          </form>
          
          <div className="mt-8 relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-100"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs">حساب کاربری ندارید؟</span>
            <div className="flex-grow border-t border-zinc-100"></div>
          </div>
          
          <Link href="/register" className="w-full mt-4">
            <Button type="button" variant="outline" className="w-full h-12 text-base font-medium rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all">
              ثبت نام سریع
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}