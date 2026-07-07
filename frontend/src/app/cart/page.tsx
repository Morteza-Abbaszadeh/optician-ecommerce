"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCartStore } from "@/store/useCartStore"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus, ShoppingBag, Eye, ArrowLeft, ShieldCheck } from "lucide-react"

export default function CartPage() {
  // جلوگیری از خطای Hydration در Next.js
  const [isClient, setIsClient] = useState(false)
  
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // در زمان رندر اولیه سرور، یک صفحه خالی یا لودینگ برمی‌گردانیم
  if (!isClient) {
    return <div className="min-h-screen bg-zinc-50 flex items-center justify-center" dir="rtl"><div className="animate-pulse flex items-center gap-2"><ShoppingBag className="text-zinc-400" /> در حال بارگذاری سبد خرید...</div></div>
  }

  // حالت سبد خرید خالی
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-zinc-300" />
        </div>
        <h2 className="text-2xl font-black text-zinc-800 mb-4">سبد خرید شما خالی است</h2>
        <p className="text-zinc-500 mb-8 max-w-md">هنوز هیچ محصولی به سبد خرید خود اضافه نکرده‌اید. برای مشاهده عینک‌ها و محصولات جدید به فروشگاه سر بزنید.</p>
        <Link href="/shop">
          <Button className="h-14 px-8 bg-zinc-900 text-white rounded-2xl text-lg font-bold hover:bg-zinc-800 transition-all hover:-translate-y-1">
            مشاهده محصولات
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl font-black text-zinc-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-emerald-600" /> سبد خرید
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ستون راست: لیست محصولات */}
          <div className="w-full lg:w-2/3 space-y-4">
            {items.map((item) => (
              <div key={item.cartItemId} className="bg-white p-4 md:p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center relative">
                
                {/* دکمه حذف */}
                <button 
                  onClick={() => removeItem(item.cartItemId)}
                  className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="حذف از سبد"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* تصویر کالا */}
                <Link href={`/product/${item.slug}`} className="relative w-28 h-28 shrink-0 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                  <Image src={item.image} alt={item.title} fill className="object-cover p-2" />
                </Link>

                {/* اطلاعات کالا */}
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="text-lg font-bold text-zinc-900 hover:text-blue-600 line-clamp-1">{item.title}</h3>
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-zinc-500 font-medium">
                      {item.colorName && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: item.colorCode || '#000' }}></span> {item.colorName}</span>}
                      {item.size && <span>| سایز: <span dir="ltr">{item.size}</span></span>}
                    </div>
                  </div>

                  {/* نمایش اطلاعات نمره چشم (اگر وجود داشت) */}
                  {item.prescription && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mt-2 w-full max-w-sm">
                      <div className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><Eye className="w-4 h-4"/> اطلاعات نمره چشم:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-900">
                        <div><span className="opacity-70">راست (OD):</span> <span dir="ltr">{item.prescription.rightEye.sph} / {item.prescription.rightEye.cyl} / {item.prescription.rightEye.axis}</span></div>
                        <div><span className="opacity-70">چپ (OS):</span> <span dir="ltr">{item.prescription.leftEye.sph} / {item.prescription.leftEye.cyl} / {item.prescription.leftEye.axis}</span></div>
                        <div className="col-span-2"><span className="opacity-70">فاصله مردمک (PD):</span> {item.prescription.pd}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-black text-zinc-900 text-lg">
                      {new Intl.NumberFormat("fa-IR").format(item.price)} <span className="text-sm font-medium text-zinc-500">تومان</span>
                    </span>

                    {/* کنترل تعداد */}
                    <div className="flex items-center bg-zinc-100 rounded-xl border border-zinc-200 h-10">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-10 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-10 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ستون چپ: فاکتور و پرداخت */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm sticky top-24">
              <h3 className="text-xl font-black text-zinc-900 mb-6">خلاصه سفارش</h3>
              
              <div className="space-y-4 mb-6 text-zinc-600 font-medium">
                <div className="flex justify-between">
                  <span>تعداد اقلام:</span>
                  <span className="font-bold text-zinc-900">{items.reduce((acc, item) => acc + item.quantity, 0)} کالا</span>
                </div>
                <div className="flex justify-between">
                  <span>هزینه ارسال:</span>
                  <span className="font-bold text-emerald-600">رایگان</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-zinc-800">مبلغ قابل پرداخت:</span>
                  <span className="text-3xl font-black text-zinc-900">
                    {new Intl.NumberFormat("fa-IR").format(getTotalPrice())} <span className="text-sm font-medium text-zinc-500">تومان</span>
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-black shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  تایید و تکمیل سفارش <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400">
                <ShieldCheck className="w-4 h-4" /> پرداخت امن و تضمین اصالت کالا
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}