"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { useCartStore } from "@/store/useCartStore" // 👈 استور سبد خرید ایمپورت شد
import { ShoppingBag, User, LogOut, ShieldCheck, Menu, Search, ChevronDown } from "lucide-react"

export default function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, isHydrated: isAuthHydrated, logout } = useAuthStore()
  
  // 👈 دریافت تعداد کل آیتم‌های سبد خرید
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  
  // استیت برای هماهنگ‌سازی (Hydration) سبد خرید
  const [isCartHydrated, setIsCartHydrated] = useState(false)
  
  // افکت شیشه‌ای شدن هدر هنگام اسکرول
  const [isScrolled, setIsScrolled] = useState(false)
  
  useEffect(() => {
    // مشخص می‌کنیم که کلاینت لود شده و می‌توانیم دیتای localStorage را نشان دهیم
    setIsCartHydrated(true)
    
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // برای جلوگیری از خطای Hydration (بررسی هر دو استور)
  if (!isAuthHydrated || !isCartHydrated) return <div className="h-20 bg-white w-full border-b border-zinc-100"></div>

  const totalItems = getTotalItems() // 👈 خواندن عدد واقعی

  // لینک‌های اصلی سایت
  const navLinks = [
    { name: "صفحه اصلی", href: "/" },
    { name: "فروشگاه", href: "/shop" },
    { name: "درباره ما", href: "/about" },
  ]

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        isScrolled ? "bg-white/80 backdrop-blur-lg border-zinc-200/50 shadow-sm" : "bg-white border-zinc-100"
      }`}
      dir="rtl"
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* بخش راست: لوگو */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl font-black text-zinc-900 tracking-tight group-hover:text-zinc-700 transition-colors">
              عینک<span className="text-zinc-400">‌بینا</span>
            </span>
          </Link>

          {/* نوار ناوبری دسکتاپ */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-sm font-bold transition-all hover:-translate-y-0.5 ${
                    isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* بخش چپ: آیکون‌ها و پروفایل */}
        <div className="flex items-center gap-2 md:gap-4">
          
          <button className="p-2.5 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors hidden sm:block">
            <Search className="w-5 h-5" />
          </button>

          {/* سبد خرید */}
          <Link href="/cart" className="p-2.5 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {/* 👈 عدد سبد خرید داینامیک شد و فقط اگر بزرگتر از ۰ باشد نمایش داده می‌شود */}
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-zinc-900 text-white flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-white">
                {totalItems}
              </span>
            )}
          </Link>

          <div className="w-px h-6 bg-zinc-200 mx-2 hidden sm:block"></div>

          {/* بخش کاربری */}
          {isAuthenticated ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 transition-colors">
                <div className="w-9 h-9 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600">
                  <User className="w-4 h-4" />
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors hidden sm:block" />
              </button>

              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-zinc-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <p className="text-xs text-zinc-500 mb-1">کاربر گرامی</p>
                  <p className="text-sm font-bold text-zinc-900 font-mono" dir="ltr">{user?.phone_number}</p>
                </div>
                
                <div className="p-2 flex flex-col gap-1">
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl transition-colors">
                    <User className="w-4 h-4" /> پروفایل من
                  </Link>
                  
                  {user?.is_superuser && (
                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
                      <ShieldCheck className="w-4 h-4" /> پنل مدیریت
                    </Link>
                  )}
                </div>

                <div className="p-2 border-t border-zinc-100">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> خروج از حساب
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <button className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors">
                ورود / عضویت
              </button>
            </Link>
          )}

          <button className="p-2.5 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors md:hidden">
            <Menu className="w-5 h-5" />
          </button>

        </div>
      </div>
    </header>
  )
}