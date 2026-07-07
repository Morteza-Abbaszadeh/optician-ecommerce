"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCartStore } from "@/store/useCartStore"
import { apiClient } from "@/services/apiClient" // یا "@/services/apiClient" بسته به مسیر فایل شما
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, User, CheckCircle, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const { items, getTotalPrice, clearCart } = useCartStore()

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    state: "",
    city: "",
    address: "",
    postal_code: "",
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return <div className="min-h-screen bg-zinc-50 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center pb-20">
        <h2 className="text-xl font-bold text-zinc-700 mb-4">سبد خرید شما خالی است</h2>
        <Link href="/cart">
          <Button variant="outline" className="rounded-xl">بازگشت به سبد خرید</Button>
        </Link>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // ۱. تبدیل آدرس به یک رشته یکپارچه (یا ارسال به صورت فیلدهای مجزا بسته به بک‌اند)
      const fullShippingAddress = `${formData.state}، ${formData.city}، ${formData.address} - کد پستی: ${formData.postal_code}`

      // ۲. آماده‌سازی آیتم‌ها دقیقا مطابق با اسکمای بک‌اند (OrderItemCreate)
      const orderItems = items.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        // اینجا اطلاعات پزشکی مستقیماً به بک‌اند پاس داده می‌شود!
        prescription: item.prescription || null 
      }))

      // ۳. ساخت پِی‌لود نهایی سفارش
      const payload = {
        shipping_address: fullShippingAddress,
        phone_number: formData.phone_number,
        full_name: formData.full_name,
        items: orderItems
      }

      // ۴. ارسال به بک‌اند
      await apiClient.post("/orders/", payload)

      // ۵. عملیات موفقیت‌آمیز
      clearCart() // خالی کردن سبد خرید محلی
      router.push("/cart/success") // انتقال به صفحه تشکر و موفقیت

    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || "خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 font-sans" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart">
            <Button variant="outline" size="icon" className="rounded-xl"><ArrowRight className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-3xl font-black text-zinc-900">تکمیل اطلاعات سفارش</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="flex flex-col lg:flex-row gap-8">
          
          {/* ستون راست: فرم اطلاعات گیرنده */}
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-4">
                <MapPin className="w-5 h-5 text-emerald-500" /> آدرس و مشخصات گیرنده
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><User className="w-4 h-4"/> نام و نام خانوادگی تحویل گیرنده</label>
                  <Input required name="full_name" value={formData.full_name} onChange={handleChange} className="h-12 bg-zinc-50 border-zinc-200" placeholder="مثال: علی رضایی" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><Phone className="w-4 h-4"/> شماره تماس</label>
                  <Input required name="phone_number" value={formData.phone_number} onChange={handleChange} className="h-12 bg-zinc-50 border-zinc-200" placeholder="0912..." dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">استان</label>
                  <Input required name="state" value={formData.state} onChange={handleChange} className="h-12 bg-zinc-50 border-zinc-200" placeholder="تهران" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">شهر</label>
                  <Input required name="city" value={formData.city} onChange={handleChange} className="h-12 bg-zinc-50 border-zinc-200" placeholder="تهران" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-zinc-700">آدرس دقیق</label>
                  <textarea required name="address" value={formData.address} onChange={handleChange} className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200 outline-none min-h-[100px]" placeholder="خیابان، کوچه، پلاک، واحد..."></textarea>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-zinc-700">کد پستی (۱۰ رقمی)</label>
                  <Input required name="postal_code" value={formData.postal_code} onChange={handleChange} className="h-12 bg-zinc-50 border-zinc-200" placeholder="1234567890" dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          {/* ستون چپ: خلاصه سفارش و دکمه پرداخت */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm sticky top-24">
              <h3 className="text-lg font-black text-zinc-900 mb-4">آیتم‌های سفارش</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {items.map(item => (
                  <div key={item.cartItemId} className="flex gap-3 items-center border-b border-zinc-50 pb-4">
                    <div className="relative w-16 h-16 bg-zinc-50 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                      <Image src={item.image} alt={item.title} fill className="object-cover p-1" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-zinc-800 line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{item.colorName} | تعداد: {item.quantity}</p>
                      {item.prescription && <p className="text-[10px] font-bold text-blue-600 mt-1 bg-blue-50 inline-block px-1 rounded">نسخه پزشکی دارد</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-6 mb-6 space-y-3">
                <div className="flex justify-between items-center text-zinc-600 font-medium text-sm">
                  <span>هزینه کالاها:</span>
                  <span>{new Intl.NumberFormat("fa-IR").format(getTotalPrice())} تومان</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 font-medium text-sm">
                  <span>هزینه ارسال:</span>
                  <span className="text-emerald-600">رایگان</span>
                </div>
                <div className="flex justify-between items-end pt-3">
                  <span className="font-bold text-zinc-800">مبلغ قابل پرداخت:</span>
                  <span className="text-2xl font-black text-zinc-900">
                    {new Intl.NumberFormat("fa-IR").format(getTotalPrice())} <span className="text-xs font-medium text-zinc-500">تومان</span>
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-16 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-lg font-black shadow-lg shadow-zinc-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>ثبت سفارش و پرداخت <CheckCircle className="w-5 h-5" /></>
                )}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}