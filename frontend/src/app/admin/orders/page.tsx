"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/services/apiClient"
import { Loader2, ShoppingCart, Clock, CheckCircle2, Truck, XCircle, Package, MapPin } from "lucide-react"

// تایپ‌های مربوط به فاکتور و وضعیت‌ها
type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

interface OrderItem {
  variant_id: string
  quantity: number
  unit_price: number
  variant: {
    color_name: string
    product: {
      title: string
    }
  }
}

interface Order {
  id: string
  total_amount: number
  shipping_address: string
  status: OrderStatus
  created_at: string
  items: OrderItem[]
}

// نگاشت وضعیت‌ها به فارسی و رنگ‌بندی استاندارد
const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "در انتظار پرداخت", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  PAID: { label: "پرداخت شده", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  PROCESSING: { label: "در حال پردازش", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
  SHIPPED: { label: "ارسال شده", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Truck },
  DELIVERED: { label: "تحویل داده شده", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  CANCELLED: { label: "لغو شده", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get("/orders/admin/all")
      setOrders(res.data)
    } catch (error) {
      console.error("خطا در دریافت سفارشات:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // تابع تغییر وضعیت فاکتور
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId)
      await apiClient.patch(`/orders/admin/${orderId}/status?status=${newStatus}`)
      
      // آپدیت کردن استیت بدون نیاز به رفرش صفحه
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      alert("خطا در تغییر وضعیت سفارش.")
    } finally {
      setUpdatingId(null)
    }
  }

  // فرمت تاریخ به شمسی
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-900" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            مدیریت سفارشات
          </h1>
          <p className="text-zinc-500 mt-2">پیگیری فاکتورها، تغییر وضعیت و مدیریت ارسال کالاها</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <Package className="w-16 h-16 text-zinc-300 mb-4" />
            <h3 className="text-xl font-bold text-zinc-700">هیچ سفارشی ثبت نشده است</h3>
            <p className="text-zinc-500 mt-2">به محض ثبت سفارش توسط کاربران، در اینجا نمایش داده می‌شود.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-100">
                <tr>
                  <th className="p-5">شماره فاکتور / تاریخ</th>
                  <th className="p-5">اطلاعات ارسال</th>
                  <th className="p-5 text-center">تعداد اقلام</th>
                  <th className="p-5">مبلغ کل (تومان)</th>
                  <th className="p-5">وضعیت فعلی</th>
                  <th className="p-5">عملیات (تغییر وضعیت)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon
                  const isUpdating = updatingId === order.id

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                      
                      <td className="p-5 align-top">
                        <div className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded inline-block mb-2" dir="ltr">
                          {order.id.split('-')[0]}...
                        </div>
                        <div className="text-xs text-zinc-500 font-medium">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      
                      <td className="p-5 align-top max-w-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-zinc-700 leading-relaxed line-clamp-2" title={order.shipping_address}>
                            {order.shipping_address}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-5 align-top text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 font-bold text-zinc-700">
                          {order.items.length}
                        </span>
                      </td>
                      
                      <td className="p-5 align-top">
                        <span className="font-black text-zinc-900 text-base">
                          {new Intl.NumberFormat("fa-IR").format(order.total_amount)}
                        </span>
                      </td>
                      
                      <td className="p-5 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${statusConfig[order.status].color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig[order.status].label}
                        </span>
                      </td>
                      
                      <td className="p-5 align-top">
                        <div className="relative">
                          {isUpdating && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                              <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
                            </div>
                          )}
                          <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="w-full text-sm font-bold p-2.5 border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-zinc-900 outline-none text-zinc-700 cursor-pointer"
                          >
                            <option value="PENDING">در انتظار پرداخت</option>
                            <option value="PAID">پرداخت شده</option>
                            <option value="PROCESSING">در حال پردازش</option>
                            <option value="SHIPPED">ارسال شده</option>
                            <option value="DELIVERED">تحویل داده شده</option>
                            <option value="CANCELLED">لغو شده</option>
                          </select>
                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}