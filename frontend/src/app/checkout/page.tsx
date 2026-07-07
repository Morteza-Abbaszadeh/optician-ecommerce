"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import { apiClient } from "@/services/apiClient"
import { orderService } from "@/services/orderService"
import { Button } from "@/components/ui/button"
import { MapPin, Plus, CheckCircle2, Loader2, ArrowRight, Wallet } from "lucide-react"

// تایپ اسکریپت برای مدل آدرس
interface Address {
  id: string
  title: string
  full_address: string
  postal_code: string
  phone_number: string
  is_default: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // استیت‌های فرم افزودن آدرس
  const [newAddress, setNewAddress] = useState({
    title: "",
    full_address: "",
    postal_code: "",
    phone_number: "",
    is_default: true
  })

  // هدایت کاربر در صورت خالی بودن سبد خرید یا لاگین نبودن
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout")
      return
    }
    if (items.length === 0) {
      router.push("/cart")
      return
    }
    fetchAddresses()
  }, [isAuthenticated, items])

  // دریافت آدرس‌ها از سرور
  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true)
      const res = await apiClient.get("/users/addresses")
      setAddresses(res.data)
      if (res.data.length > 0) {
        // انتخاب خودکار آدرس پیش‌فرض یا اولین آدرس
        const defaultAddr = res.data.find((a: Address) => a.is_default) || res.data[0]
        setSelectedAddressId(defaultAddr.id)
      } else {
        setShowAddForm(true) // اگر آدرسی نداشت، مستقیماً فرم را باز کن
      }
    } catch (error) {
      console.error("خطا در دریافت آدرس‌ها", error)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  // ثبت آدرس جدید در دیتابیس
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await apiClient.post("/users/addresses", newAddress)
      setAddresses([res.data, ...addresses]) // اضافه کردن به بالای لیست
      setSelectedAddressId(res.data.id) // انتخاب خودکار آن
      setShowAddForm(false) // بستن فرم
      setNewAddress({ title: "", full_address: "", postal_code: "", phone_number: "", is_default: true })
    } catch (error) {
      alert("خطا در ثبت آدرس جدید.")
    }
  }

  // ثبت نهایی سفارش
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("لطفاً یک آدرس برای ارسال انتخاب کنید.")
      return
    }

    // پیدا کردن اطلاعات کامل آدرس انتخاب شده
    const address = addresses.find(a => a.id === selectedAddressId)
    const formattedShippingAddress = `${address?.title} - ${address?.full_address} (تلفن: ${address?.phone_number}, کد پستی: ${address?.postal_code || "ندارد"})`

    try {
      setIsSubmittingOrder(true)
      
      const orderPayload = {
        items: items.map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity
        })),
        shipping_address: formattedShippingAddress
      }

      await orderService.createOrder(orderPayload)
      clearCart()
      alert("پرداخت موفقیت‌آمیز بود! سفارش شما ثبت شد 🎉")
      router.push("/profile") // در آینده می‌توانیم آن را به صفحه success ببریم

    } catch (err: any) {
      alert(err.response?.data?.detail || "خطایی در ثبت سفارش رخ داد.")
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const totalPrice = getTotalPrice()
  const shippingCost = 50000
  const finalPrice = totalPrice + shippingCost

  if (isLoadingAddresses) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-900" /></div>
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        
        <div className="flex items-center gap-3 mb-8">
          <MapPin className="w-8 h-8 text-zinc-900" />
          <h1 className="text-3xl font-black text-zinc-900">تکمیل اطلاعات ارسال</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ستون سمت راست: انتخاب یا ثبت آدرس */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-zinc-100 pb-4">
                <h2 className="text-xl font-bold text-zinc-800">آدرس گیرنده</h2>
                {!showAddForm && (
                  <Button variant="outline" onClick={() => setShowAddForm(true)} className="gap-2 text-sm font-bold border-zinc-200">
                    <Plus className="w-4 h-4" /> آدرس جدید
                  </Button>
                )}
              </div>

              {/* فرم افزودن آدرس جدید */}
              {showAddForm ? (
                <form onSubmit={handleAddAddress} className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">عنوان آدرس (مثلاً: خانه) *</label>
                      <input required value={newAddress.title} onChange={e => setNewAddress({...newAddress, title: e.target.value})} className="w-full p-3 border rounded-xl bg-zinc-50 outline-none focus:border-zinc-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">شماره تماس تحویل گیرنده *</label>
                      <input required type="tel" value={newAddress.phone_number} onChange={e => setNewAddress({...newAddress, phone_number: e.target.value})} className="w-full p-3 border rounded-xl bg-zinc-50 outline-none focus:border-zinc-400" dir="ltr" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-zinc-700">آدرس دقیق پستی *</label>
                      <textarea required value={newAddress.full_address} onChange={e => setNewAddress({...newAddress, full_address: e.target.value})} className="w-full p-3 border rounded-xl bg-zinc-50 outline-none focus:border-zinc-400 min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">کد پستی (اختیاری)</label>
                      <input value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} className="w-full p-3 border rounded-xl bg-zinc-50 outline-none focus:border-zinc-400" dir="ltr" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl px-8 font-bold">ثبت آدرس</Button>
                    {addresses.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl font-bold">انصراف</Button>
                    )}
                  </div>
                </form>
              ) : (
                /* لیست آدرس‌های قبلی */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 
                        ${selectedAddressId === addr.id 
                          ? 'border-zinc-900 bg-zinc-50' 
                          : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
                    >
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="absolute top-4 left-4 w-6 h-6 text-zinc-900" />
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-zinc-900 text-lg">{addr.title}</span>
                        {addr.is_default && <span className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full font-bold">پیش‌فرض</span>}
                      </div>
                      <p className="text-sm text-zinc-600 mb-4 line-clamp-2 leading-relaxed">{addr.full_address}</p>
                      <div className="text-xs text-zinc-500 font-medium font-mono" dir="ltr">{addr.phone_number}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ستون سمت چپ: فاکتور و پرداخت */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-100/50 sticky top-28">
              <h3 className="text-lg font-black text-zinc-900 mb-6 border-b border-zinc-100 pb-4">مبلغ قابل پرداخت</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>مبلغ کالاها ({items.length} عدد)</span>
                  <span className="font-bold text-zinc-900">{new Intl.NumberFormat("fa-IR").format(totalPrice)} تومان</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>هزینه ارسال</span>
                  <span className="font-bold text-zinc-900">{new Intl.NumberFormat("fa-IR").format(shippingCost)} تومان</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-zinc-900">جمع کل نهایی</span>
                  <span className="text-2xl font-black text-emerald-600 text-left">
                    {new Intl.NumberFormat("fa-IR").format(finalPrice)} <span className="text-sm font-medium text-emerald-600 block -mt-1">تومان</span>
                  </span>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder || !selectedAddressId || showAddForm}
                size="lg" 
                className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-200 
                  ${(isSubmittingOrder || !selectedAddressId || showAddForm) ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'}`}
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    در حال اتصال به درگاه...
                  </>
                ) : (
                  <>
                    پرداخت نهایی و ثبت سفارش
                    <Wallet className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}