"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, AlertCircle } from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="min-h-screen bg-zinc-50" />
  }

  const totalPrice = getTotalPrice()
  const shippingCost = totalPrice > 0 ? 50000 : 0

  // تغییر اساسی: این تابع دیگر فاکتور ثبت نمی‌کند، فقط کاربر را به صفحه انتخاب آدرس می‌برد
  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/cart")
      return
    }

    setIsSubmitting(true)
    // هدایت به صفحه جدید پرداخت و مدیریت آدرس‌ها
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-8 h-8 text-zinc-900" />
          <h1 className="text-3xl font-black text-zinc-900">سبد خرید شما</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-8 border border-red-200 shadow-sm flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-bold text-red-800 text-lg mb-1">خطا</span>
              <p className="font-medium text-sm md:text-base leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center border border-zinc-100 shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-zinc-300" />
            </div>
            <h2 className="text-xl font-bold text-zinc-700 mb-2">سبد خرید شما خالی است</h2>
            <p className="text-zinc-500 mb-8">هنوز هیچ محصولی به سبد خرید خود اضافه نکرده‌اید.</p>
            <Link href="/shop">
              <Button size="lg" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl px-8 transition-transform active:scale-95">
                بازگشت به فروشگاه
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 relative">
            
            <div className={`w-full lg:w-2/3 space-y-4 transition-opacity duration-300 ${isSubmitting ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {items.map((item) => (
                <div key={item.variantId} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex gap-4 md:gap-6 items-center hover:shadow-md transition-shadow">
                  
                  <div className="relative w-24 h-24 md:w-32 md:h-32 bg-zinc-50 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=400&auto=format&fit=crop"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-grow py-2 flex flex-col h-full justify-between">
                    <div>
                      <Link href={`/product/${item.slug}`}>
                        <h3 className="text-base md:text-lg font-bold text-zinc-900 hover:text-zinc-600 line-clamp-2 mb-1">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                        <span>رنگ:</span>
                        <div className="flex items-center gap-1">
                          <span 
                            className="w-3 h-3 rounded-full border border-zinc-300 inline-block" 
                            style={{ backgroundColor: item.colorCode || "#000" }} 
                          />
                          <span className="font-medium">{item.colorName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
                          disabled={item.quantity <= 1 || isSubmitting}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-zinc-900">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
                          disabled={item.quantity >= item.maxStock || isSubmitting}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-left flex flex-col items-end">
                        <span className="text-lg font-black text-zinc-900">
                          {new Intl.NumberFormat("fa-IR").format(item.price * item.quantity)} <span className="text-xs font-medium text-zinc-500">تومان</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-2">
                    <button 
                      onClick={() => removeItem(item.variantId)}
                      disabled={isSubmitting}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="حذف از سبد خرید"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>

            <div className="w-full lg:w-1/3">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-100/50 sticky top-28">
                <h3 className="text-lg font-black text-zinc-900 mb-6 border-b border-zinc-100 pb-4">خلاصه سفارش</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>مبلغ کل کالاها</span>
                    <span className="font-bold text-zinc-900">
                      {new Intl.NumberFormat("fa-IR").format(totalPrice)} <span className="text-xs font-normal">تومان</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>هزینه ارسال</span>
                    <span className="font-bold text-zinc-900">
                      {new Intl.NumberFormat("fa-IR").format(shippingCost)} <span className="text-xs font-normal">تومان</span>
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-6 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-zinc-900">مبلغ قابل پرداخت</span>
                    <span className="text-2xl font-black text-zinc-900 text-left">
                      {new Intl.NumberFormat("fa-IR").format(totalPrice + shippingCost)} <span className="text-sm font-medium text-zinc-500 block -mt-1">تومان</span>
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  size="lg" 
                  className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-200 
                    ${isSubmitting ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed opacity-90' : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      انتقال به مرحله بعد...
                    </>
                  ) : (
                    <>
                      تکمیل خرید و انتخاب آدرس
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
                
                {!isAuthenticated && (
                  <p className="text-xs text-center text-zinc-500 mt-4 font-medium bg-zinc-50 p-2 rounded-lg">
                    برای تکمیل خرید به حساب کاربری خود منتقل می‌شوید.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}