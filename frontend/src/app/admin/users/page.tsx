"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { apiClient } from "@/services/apiClient"
import { Shield, User as UserIcon, Loader2, Phone, Calendar, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminUsersPage() {
  const router = useRouter()
  // گرفتن وضعیت لاگین، توکن و کاربر از استور
  const { isAuthenticated, isHydrated, user, token } = useAuthStore()
  
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // ۱. صبر می‌کنیم تا وضعیت لاگین از حافظه لود شود
    if (!isHydrated) return

    // ۲. اگر کاربر لاگین نبود، هدایت به صفحه ورود
    if (!isAuthenticated) {
      router.push("/login?redirect=/admin/users")
      return
    }

    // ۳. اگر لاگین بود اما ادمین نبود، هدایت به صفحه اصلی (امنیت بیشتر)
    if (user && !user.is_superuser) {
      router.push("/")
      return
    }

    // ۴. تزریق مجدد توکن به هدر (برای جلوگیری از ارور 401 هنگام رفرش صفحه)
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUsers()
    }
  }, [isHydrated, isAuthenticated, user, token, router])

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users/admin/all")
      setUsers(res.data)
    } catch (error) {
      console.error("خطا در دریافت لیست کاربران:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // فرمت کردن تاریخ
  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص"
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  // فیلتر کردن کاربران بر اساس جستجو (نام یا شماره موبایل)
  const filteredUsers = users.filter(u => 
    (u.full_name && u.full_name.includes(searchTerm)) || 
    (u.phone_number && u.phone_number.includes(searchTerm))
  )

  if (isLoading || !isHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-10 h-10 animate-spin text-zinc-900" /></div>
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans" dir="rtl">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-2">
              <UserIcon className="w-8 h-8" /> مدیریت کاربران
            </h1>
            <p className="text-zinc-500 mt-1">مشاهده و مدیریت مشتریان ثبت‌نام شده در فروشگاه</p>
          </div>
          
          {/* باکس جستجو */}
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <Input 
              placeholder="جستجو با نام یا موبایل..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 h-12 rounded-xl bg-white border-zinc-200 focus-visible:ring-zinc-900" 
            />
          </div>
        </div>

        {/* جدول کاربران */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-sm font-bold text-zinc-600">
                  <th className="p-4 whitespace-nowrap">ردیف</th>
                  <th className="p-4 whitespace-nowrap">نام و نام خانوادگی</th>
                  <th className="p-4 whitespace-nowrap">شماره موبایل</th>
                  <th className="p-4 whitespace-nowrap">تاریخ عضویت</th>
                  <th className="p-4 whitespace-nowrap">سطح دسترسی</th>
                </tr>
              </thead>
              <tbody className="text-zinc-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                      هیچ کاربری یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, index) => (
                    <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 text-zinc-400 font-mono text-sm">{index + 1}</td>
                      <td className="p-4 font-bold">{u.full_name || <span className="text-zinc-400 font-normal">ثبت نشده</span>}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-mono" dir="ltr">
                          <Phone className="w-4 h-4 text-zinc-400" />
                          {u.phone_number}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          {formatDate(u.created_at)}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.is_superuser ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                            <Shield className="w-3 h-3" /> مدیر ارشد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                            <UserIcon className="w-3 h-3" /> مشتری
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}