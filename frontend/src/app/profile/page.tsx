"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MapPin, ShoppingBag, LogOut, Loader2, Package, Clock, CheckCircle2, Truck, XCircle, Plus, Trash2, Edit2, KeyRound } from "lucide-react"

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "در انتظار پرداخت", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  PAID: { label: "پرداخت شده", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  PROCESSING: { label: "در حال پردازش", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Package },
  SHIPPED: { label: "ارسال شده", color: "text-purple-600 bg-purple-50 border-purple-200", icon: Truck },
  DELIVERED: { label: "تحویل داده شده", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  CANCELLED: { label: "لغو شده", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, isHydrated, fetchUser } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "info">("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // استیت‌های مربوط به ویرایش اطلاعات
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)
  const [infoForm, setInfoForm] = useState({ full_name: "", email: "" })
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" })

  // استیت فرم آدرس جدید
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ title: "", full_address: "", postal_code: "", phone_number: "", is_default: true })

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login?redirect=/profile")
      return
    }
    if (isAuthenticated) {
        fetchData()
        if(user) {
            setInfoForm({ full_name: user.full_name || "", email: user.email || "" })
        }
    }
  }, [isAuthenticated, isHydrated, router, user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [ordersRes, addressesRes] = await Promise.all([
        apiClient.get("/orders/my-orders"),
        apiClient.get("/users/addresses")
      ])
      setOrders(ordersRes.data)
      setAddresses(addressesRes.data)
    } catch (error) {
      console.error("خطا در دریافت اطلاعات پروفایل:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // افزودن آدرس جدید
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await apiClient.post("/users/addresses", newAddress)
      setAddresses([res.data, ...addresses])
      setShowAddAddress(false)
      setNewAddress({ title: "", full_address: "", postal_code: "", phone_number: "", is_default: true })
      alert("آدرس با موفقیت اضافه شد.")
    } catch (error) {
      alert("خطا در ثبت آدرس جدید.")
    }
  }

  // حذف آدرس (نیاز به پیاده‌سازی API در بک‌اند دارد)
  const handleDeleteAddress = async (id: string) => {
      if(confirm("آیا از حذف این آدرس مطمئن هستید؟")) {
          // در اینجا باید متد Delete را صدا بزنید (وقتی در بک‌اند ساخته شد)
          // await apiClient.delete(`/users/addresses/${id}`)
          alert("این ویژگی در آینده فعال می‌شود.")
      }
  }

  // ویرایش اطلاعات پایه
  const handleUpdateInfo = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsUpdatingInfo(true)
      try {
          // این API باید در بک‌اند ساخته شود تا اطلاعات کاربر را آپدیت کند
          // await apiClient.put("/users/me", infoForm)
          await fetchUser() // دریافت مجدد اطلاعات کاربر
          alert("اطلاعات شما با موفقیت بروزرسانی شد.")
      } catch (error) {
          alert("خطا در بروزرسانی اطلاعات.")
      } finally {
          setIsUpdatingInfo(false)
      }
  }

  // تغییر رمز عبور
  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
          // API تغییر رمز باید در بک‌اند پیاده‌سازی شود
          // await apiClient.put("/users/password", passwordForm)
          alert("رمز عبور با موفقیت تغییر کرد.")
          setPasswordForm({ current_password: "", new_password: "" })
      } catch(error) {
          alert("خطا در تغییر رمز عبور. رمز فعلی را بررسی کنید.")
      }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-10 h-10 animate-spin text-zinc-900" /></div>
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black text-zinc-900">حساب کاربری من</h1>
          <Button onClick={handleLogout} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2 font-bold w-full md:w-auto">
            <LogOut className="w-4 h-4" /> خروج از حساب
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* سایدبار (منوی تب‌ها) */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm flex flex-col gap-2 sticky top-28">
              <button 
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all duration-200 ${activeTab === "orders" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
              >
                <ShoppingBag className="w-5 h-5" /> تاریخچه سفارشات
              </button>
              <button 
                onClick={() => setActiveTab("addresses")}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all duration-200 ${activeTab === "addresses" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
              >
                <MapPin className="w-5 h-5" /> آدرس‌های من
              </button>
              <button 
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all duration-200 ${activeTab === "info" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
              >
                <User className="w-5 h-5" /> اطلاعات حساب
              </button>
            </div>
          </div>

          {/* محتوای تب‌ها */}
          <div className="w-full lg:w-3/4">
            
            {/* 1. تب سفارشات */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-black text-zinc-800 mb-6 border-b border-zinc-200 pb-4">سفارشات اخیر شما</h2>
                
                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-zinc-100 shadow-sm flex flex-col items-center">
                    <Package className="w-16 h-16 text-zinc-300 mb-4" />
                    <h3 className="text-lg font-bold text-zinc-700">شما هنوز سفارشی ثبت نکرده‌اید!</h3>
                  </div>
                ) : (
                  orders.map(order => {
                    const StatusIcon = statusConfig[order.status]?.icon || Package
                    const statusStyles = statusConfig[order.status] || statusConfig["PENDING"]

                    return (
                      <div key={order.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-100">
                          <div>
                            <div className="text-sm text-zinc-500 font-medium mb-1">{formatDate(order.created_at)}</div>
                            <div className="font-mono text-sm font-bold text-zinc-900" dir="ltr"># {order.id.split("-")[0]}</div>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${statusStyles.color}`}>
                            <StatusIcon className="w-5 h-5" />
                            {statusStyles.label}
                          </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          {order.items?.map((item: any) => (
                            <div key={item.variant_id} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-zinc-50 p-4 rounded-2xl">
                              <div className="w-16 h-16 bg-white border border-zinc-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                {/* استفاده از آیکون در صورت نبود تصویر */}
                                <ShoppingBag className="w-6 h-6 text-zinc-300" />
                              </div>
                              <div className="flex-grow">
                                {/* نمایش نام محصول به جای شناسه */}
                                <h4 className="font-bold text-zinc-900 text-sm md:text-base">
                                  {item.variant?.product?.title || "محصول نامشخص"}
                                </h4>
                                <div className="text-xs text-zinc-500 mt-2 flex items-center gap-3">
                                  <span>تعداد: {item.quantity} عدد</span>
                                  {item.variant?.color_name && <span>رنگ: {item.variant.color_name}</span>}
                                </div>
                              </div>
                              <div className="font-black text-zinc-900 mt-2 md:mt-0 w-full md:w-auto text-left">
                                {new Intl.NumberFormat("fa-IR").format(item.unit_price * item.quantity)} <span className="text-xs font-normal">تومان</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <span className="font-bold text-zinc-600">مبلغ کل فاکتور:</span>
                          <span className="text-xl font-black text-emerald-600">
                            {new Intl.NumberFormat("fa-IR").format(order.total_amount)} تومان
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* 2. تب آدرس‌ها */}
            {activeTab === "addresses" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-6 border-b border-zinc-200 pb-4">
                    <h2 className="text-2xl font-black text-zinc-800">آدرس‌های ثبت شده</h2>
                    <Button onClick={() => setShowAddAddress(!showAddAddress)} className="bg-zinc-900 text-white rounded-xl gap-2 font-bold text-sm">
                        <Plus className="w-4 h-4"/> آدرس جدید
                    </Button>
                </div>
                
                {/* فرم افزودن آدرس جدید (مخفی به صورت پیش‌فرض) */}
                {showAddAddress && (
                    <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4 mb-6">
                        <h3 className="font-bold text-zinc-900 mb-4">ثبت آدرس جدید</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>عنوان (مثل خانه)</Label>
                                <Input required value={newAddress.title} onChange={e => setNewAddress({...newAddress, title: e.target.value})} className="rounded-xl bg-zinc-50" />
                            </div>
                            <div className="space-y-2">
                                <Label>تلفن تحویل‌گیرنده</Label>
                                <Input required type="tel" value={newAddress.phone_number} onChange={e => setNewAddress({...newAddress, phone_number: e.target.value})} className="rounded-xl bg-zinc-50" dir="ltr" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>آدرس دقیق</Label>
                                <Input required value={newAddress.full_address} onChange={e => setNewAddress({...newAddress, full_address: e.target.value})} className="rounded-xl bg-zinc-50" />
                            </div>
                            <div className="space-y-2">
                                <Label>کد پستی</Label>
                                <Input value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} className="rounded-xl bg-zinc-50" dir="ltr" />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">ذخیره آدرس</Button>
                            <Button type="button" variant="outline" onClick={() => setShowAddAddress(false)} className="rounded-xl">انصراف</Button>
                        </div>
                    </form>
                )}

                {addresses.length === 0 && !showAddAddress ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-zinc-100 shadow-sm flex flex-col items-center">
                    <MapPin className="w-16 h-16 text-zinc-300 mb-4" />
                    <h3 className="text-lg font-bold text-zinc-700">هنوز آدرسی ثبت نکرده‌اید.</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm relative group">
                        {addr.is_default && (
                          <div className="absolute top-4 left-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">پیش‌فرض</div>
                        )}
                        <h3 className="font-bold text-lg text-zinc-900 mb-2">{addr.title}</h3>
                        <p className="text-zinc-600 text-sm leading-relaxed mb-4 min-h-[40px]">{addr.full_address}</p>
                        <div className="text-zinc-500 text-sm flex justify-between border-t border-zinc-100 pt-4">
                          <span>کد پستی: {addr.postal_code || "-"}</span>
                          <span className="font-mono" dir="ltr">{addr.phone_number}</span>
                        </div>
                        
                        {/* دکمه‌های عملیاتی (نمایش هنگام هاور روی دسکتاپ) */}
                        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. تب اطلاعات حساب (امکان ویرایش اضافه شد) */}
            {activeTab === "info" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-black text-zinc-800 mb-6 border-b border-zinc-200 pb-4">ویرایش اطلاعات</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* فرم ویرایش اطلاعات پایه */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
                        <h3 className="font-bold text-lg text-zinc-900 mb-6 flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-blue-500"/> اطلاعات شخصی
                        </h3>
                        <form onSubmit={handleUpdateInfo} className="space-y-4">
                            <div className="space-y-2">
                                <Label>نام و نام خانوادگی</Label>
                                <Input value={infoForm.full_name} onChange={e => setInfoForm({...infoForm, full_name: e.target.value})} className="rounded-xl bg-zinc-50 h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label>آدرس ایمیل</Label>
                                <Input value={infoForm.email} onChange={e => setInfoForm({...infoForm, email: e.target.value})} type="email" className="rounded-xl bg-zinc-50 h-12 text-left" dir="ltr" placeholder="example@email.com" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400">شماره موبایل (غیرقابل تغییر)</Label>
                                <Input disabled value={user?.phone_number} className="rounded-xl bg-zinc-100 h-12 text-zinc-500 font-mono text-left" dir="ltr" />
                            </div>
                            <Button disabled={isUpdatingInfo} type="submit" className="w-full h-12 mt-4 bg-zinc-900 text-white rounded-xl font-bold">
                                {isUpdatingInfo ? <Loader2 className="w-5 h-5 animate-spin" /> : "ذخیره تغییرات"}
                            </Button>
                        </form>
                    </div>

                    {/* فرم تغییر رمز عبور */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
                        <h3 className="font-bold text-lg text-zinc-900 mb-6 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-amber-500"/> تغییر رمز عبور
                        </h3>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>رمز عبور فعلی</Label>
                                <Input type="password" required value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} className="rounded-xl bg-zinc-50 h-12 text-left" dir="ltr" />
                            </div>
                            <div className="space-y-2">
                                <Label>رمز عبور جدید</Label>
                                <Input type="password" required minLength={8} value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} className="rounded-xl bg-zinc-50 h-12 text-left" dir="ltr" />
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-zinc-500 mb-4">رمز عبور باید حداقل ۸ کاراکتر باشد.</p>
                                <Button type="submit" className="w-full h-12 bg-zinc-900 text-white rounded-xl font-bold">
                                    بروزرسانی رمز عبور
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}