"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { 
  Package,   ShoppingCart,   Users,   LayoutDashboard, 
  LogOut,  LayoutTemplate,  Tags
} from "lucide-react"




export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user, isHydrated, logout } = useAuthStore()

  // نگهبان فرانت‌اند: اگر لاگین نبود یا ادمین نبود، پرت میشه بیرون
  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated || !user?.is_superuser) {
        router.replace("/") // هدایت به صفحه اصلی سایت
      }
    }
  }, [isAuthenticated, user, isHydrated, router])

  // تا زمانی که وضعیت کاربر از حافظه خوانده نشده، یک صفحه خالی/لودینگ نشان بده
  if (!isHydrated || !isAuthenticated || !user?.is_superuser) {
    return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">در حال احراز هویت...</div>
  }

  // 👈 دکمه چیدمان صفحه اصلی به لیست منوها اضافه شد
  const menuItems = [
    { name: "داشبورد", icon: LayoutDashboard, href: "/admin" },
    { name: "مدیریت محصولات", icon: Package, href: "/admin/products" },
    { name: "دسته‌ها و برندها", icon: Tags, href: "/admin/categories" }, 
    { name: "سفارشات", icon: ShoppingCart, href: "/admin/orders" },
    { name: "چیدمان صفحه", icon: LayoutTemplate, href: "/admin/home-layout" }, 
    { name: "کاربران", icon: Users, href: "/admin/users" },
  ]

  return (
    <div className="min-h-screen bg-zinc-100 flex" dir="rtl">
      
      {/* سایدبار (منوی کناری) */}
      <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col fixed h-full z-10">
        <div className="p-6 text-center border-b border-zinc-800">
          <h2 className="text-xl font-black text-white">پنل مدیریت</h2>
          <p className="text-xs text-zinc-500 mt-2">فروشگاه عینک</p>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => {
              logout()
              router.push("/")
            }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* محتوای اصلی پنل */}
      <main className="flex-1 mr-64 p-8">
        {children}
      </main>

    </div>
  )
}