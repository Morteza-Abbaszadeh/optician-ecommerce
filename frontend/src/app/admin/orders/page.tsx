"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Loader2, Eye, Package, MapPin, Phone, User, 
  CheckCircle, X, Glasses, ClipboardList, Search, 
  ChevronRight, ChevronLeft, Filter
} from "lucide-react"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // === استیت‌های جدید برای صفحه‌بندی و فیلتر ===
  const [page, setPage] = useState(1)
  const limit = 20 // در هر صفحه ۲۰ سفارش نمایش داده می‌شود
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [hasMore, setHasMore] = useState(true) // برای بررسی وجود صفحه بعدی

  // هندل کردن تایپ کاربر (جلوگیری از ریکوئست‌های رگباری)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // با هر جستجوی جدید برمی‌گردیم صفحه اول
    }, 600)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // با تغییر تب وضعیت، برمی‌گردیم صفحه اول
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  // واکشی سفارشات از بک‌اند (همراه با پارامترهای جدید)
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const offset = (page - 1) * limit
      
      // ساختار URL هوشمند برای ارسال پارامترها به بک‌اند
      let url = `/orders/admin/all?limit=${limit}&offset=${offset}`
      if (debouncedSearch) url += `&search=${debouncedSearch}`
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`

      const res = await apiClient.get(url)
      setOrders(res.data)
      
      // اگر دیتای دریافتی کمتر از لیمیت ما بود یعنی به صفحه آخر رسیده‌ایم
      setHasMore(res.data.length === limit)
    } catch (error) {
      console.error("خطا در دریافت سفارشات:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // هر بار که صفحه، جستجو یا فیلتر تغییر کند، ریکوئست جدید زده می‌شود
  useEffect(() => {
    fetchOrders()
  }, [page, debouncedSearch, statusFilter])

  // تغییر وضعیت سفارش (متد PATCH)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(true)
      await apiClient.patch(`/orders/admin/${orderId}`, { status: newStatus })
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      alert("خطا در تغییر وضعیت سفارش")
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">در انتظار بررسی</span>
      case 'PROCESSING': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">در حال ساخت</span>
      case 'SHIPPED': return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">ارسال شده</span>
      case 'CANCELLED': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">لغو شده</span>
      default: return <span className="px-3 py-1 bg-zinc-100 text-zinc-800 rounded-full text-xs font-bold">{status}</span>
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans pb-24" dir="rtl">
      
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-zinc-800 flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-emerald-600" /> مدیریت سفارشات
        </h1>
        
        {/* نوار جستجو */}
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input 
            type="text" 
            placeholder="جستجوی شماره سفارش یا موبایل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-white border-zinc-200 rounded-2xl pr-12 font-bold shadow-sm"
          />
        </div>
      </div>

      {/* فیلتر تب‌ها (Tabs) */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
        {[
          { id: "ALL", label: "همه سفارشات" },
          { id: "PENDING", label: "در انتظار بررسی" },
          { id: "PROCESSING", label: "در حال ساخت" },
          { id: "SHIPPED", label: "ارسال شده" },
          { id: "CANCELLED", label: "لغو شده" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id 
                ? "bg-zinc-900 text-white shadow-md" 
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* جدول سفارشات */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-zinc-50/80 text-zinc-500 font-bold border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">کد سفارش</th>
                <th className="px-6 py-4">مشتری</th>
                <th className="px-6 py-4">تاریخ ثبت</th>
                <th className="px-6 py-4">مبلغ کل</th>
                <th className="px-6 py-4">وضعیت</th>
                <th className="px-6 py-4">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500 mb-4" />
                    <p className="text-zinc-400 font-bold">در حال دریافت اطلاعات...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500 font-bold">
                    سفارشی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500" dir="ltr">...{order.id.substring(order.id.length - 8)}</td>
                    <td className="px-6 py-4 font-bold text-zinc-800">{order.full_name}</td>
                    <td className="px-6 py-4 text-zinc-600 text-xs">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 font-black text-zinc-900">{new Intl.NumberFormat("fa-IR").format(order.total_price)} تومان</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => setSelectedOrder(order)} size="sm" className="bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 shadow-sm">
                        <Eye className="w-4 h-4 ml-1" /> بررسی
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* صفحه‌بندی (Pagination) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <Button 
          variant="outline" 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          className="rounded-xl font-bold gap-1"
        >
          <ChevronRight className="w-4 h-4" /> صفحه قبل
        </Button>
        <div className="text-sm font-bold text-zinc-600">
          صفحه <span className="text-zinc-900 mx-1">{page}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore || isLoading}
          className="rounded-xl font-bold gap-1"
        >
          صفحه بعد <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* مدال بررسی سفارش (مانند کدهای قبلی) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-black text-zinc-800">جزئیات سفارش</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1" dir="ltr">{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm"><User className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold">نام مشتری</p>
                    <p className="text-sm font-black text-zinc-800">{selectedOrder.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm"><Phone className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold">شماره تماس</p>
                    <p className="text-sm font-black text-zinc-800" dir="ltr">{selectedOrder.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm shrink-0"><MapPin className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold">آدرس ارسال</p>
                    <p className="text-sm font-medium text-zinc-800 leading-relaxed">{selectedOrder.shipping_address}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-zinc-400" /> اقلام سفارش داده شده
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900 text-lg">آیتم {index + 1}</p>
                          <p className="text-sm text-zinc-500 mt-1">شناسه تنوع: <span className="font-mono text-xs" dir="ltr">{item.variant_id}</span></p>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-zinc-900">{new Intl.NumberFormat("fa-IR").format(item.unit_price)} تومان</p>
                          <p className="text-sm text-zinc-500 font-bold mt-1">تعداد: {item.quantity}</p>
                        </div>
                      </div>

                      {item.prescription ? (
                        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 mt-4">
                          <h4 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                            <Glasses className="w-5 h-5 text-blue-600" /> نسخه چشم‌پزشکی (جهت ساخت عدسی)
                          </h4>
                          <div className="grid grid-cols-4 gap-2 text-center mb-2 text-xs font-bold text-blue-800/70">
                            <div className="text-right">چشم</div><div>SPH</div><div>CYL</div><div>AXIS</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center mb-2">
                            <div className="text-right text-sm font-black text-blue-900">راست (OD)</div>
                            <div className="bg-white py-1 rounded border border-blue-100 font-mono text-sm" dir="ltr">{item.prescription.rightEye?.sph || "-"}</div>
                            <div className="bg-white py-1 rounded border border-blue-100 font-mono text-sm" dir="ltr">{item.prescription.rightEye?.cyl || "-"}</div>
                            <div className="bg-white py-1 rounded border border-blue-100 font-mono text-sm" dir="ltr">{item.prescription.rightEye?.axis || "-"}</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="text-right text-sm font-black text-blue-900">چپ (OS)</div>
                            <div className="bg-white py-1 rounded border border-blue-100 font-mono text-sm" dir="ltr">{item.prescription.leftEye?.sph || "-"}</div>
                            <div className="bg-white py-1 rounded border border-blue-100 font-mono text-sm" dir="ltr">{item.prescription.leftEye?.cyl || "-"}</div>
                            <div className="bg-white py-1 rounded border border-blue-100 font-mono text-sm" dir="ltr">{item.prescription.leftEye?.axis || "-"}</div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-blue-200/50 flex justify-between items-center">
                            <span className="text-sm font-bold text-blue-900">فاصله مردمک (PD):</span>
                            <span className="bg-white px-4 py-1 rounded-lg border border-blue-100 font-mono font-bold" dir="ltr">{item.prescription.pd || "-"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 mt-4 text-center text-sm font-bold text-zinc-500">
                          این آیتم فاقد نسخه پزشکی است
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-600">تغییر وضعیت:</span>
                <select 
                  className="p-2 border border-zinc-200 rounded-xl bg-white text-sm font-bold outline-none"
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="PENDING">در انتظار بررسی</option>
                  <option value="PROCESSING">ارسال به لابراتوار (در حال ساخت)</option>
                  <option value="SHIPPED">ارسال شده برای مشتری</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
              </div>
              <Button onClick={() => window.print()} variant="outline" className="rounded-xl border-zinc-300">
                چاپ سفارش کار
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}