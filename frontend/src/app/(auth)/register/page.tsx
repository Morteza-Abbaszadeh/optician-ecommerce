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

export default function RegisterPage() {
  const router = useRouter()
  
  // توابع Zustand
  const login = useAuthStore((state) => state.login)
  const fetchUser = useAuthStore((state) => state.fetchUser)

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    phone_number: "",
    password: "",
    full_name: "", // اضافه کردن نام و نام خانوادگی
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // ۱. ارسال اطلاعات برای ثبت‌نام (آدرس ممکن است در بک‌اند شما فرق کند، مثلا /users/register)
      const response = await apiClient.post("/users/register", formData)
      
      // ۲. فرض بر این است که بک‌اند بعد از ثبت‌نام موفق، مستقیماً توکن را هم برمی‌گرداند
      const { access_token } = response.data
      
      if (!access_token) {
        throw new Error("ثبت نام انجام شد اما توکنی دریافت نشد. لطفاً وارد شوید.")
      }

      // ۳. ذخیره توکن در مرورگر
      localStorage.setItem("access_token", access_token)
      
      // ۴. لاگین کردن خودکار کاربر در استور فرانت‌اند
      login(access_token)
      if(fetchUser) {
          await fetchUser()
      }

      // ۵. انتقال مستقیم به صفحه اصلی بدون نیاز به لاگین مجدد
      router.push("/")
      
    } catch (err: any) {
      setError(err.response?.data?.detail || "مشکلی در ثبت‌نام پیش آمد. شاید این شماره قبلاً ثبت شده باشد.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 p-4 font-sans" dir="rtl">
      {/* عرض را کوچکتر کردیم تا چون عکسی نداریم فرم جمع و جور و زیبا بماند */}
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
        
        <div className="w-full p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8 text-right">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">ساخت حساب کاربری</h1>
            <p className="text-sm text-zinc-500">
              برای عضویت در فروشگاه بینا، اطلاعات زیر را تکمیل کنید.
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 text-right">
                {error}
              </div>
            )}

            <div className="space-y-2 text-right">
              <Label htmlFor="full_name" className="text-zinc-700 font-medium block">نام و نام خانوادگی</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="مثال: علی رضایی"
                type="text"
                className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-xl transition-all px-4 text-right"
              />
            </div>

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

            <Button disabled={loading} type="submit" className="w-full h-12 text-base font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all mt-6">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "تکمیل ثبت نام"}
            </Button>
          </form>
          
          <div className="mt-8 relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-100"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs">قبلاً ثبت نام کرده‌اید؟</span>
            <div className="flex-grow border-t border-zinc-100"></div>
          </div>
          
          <Link href="/login" className="w-full mt-4">
            <Button type="button" variant="outline" className="w-full h-12 text-base font-medium rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all">
              ورود به حساب کاربری
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}