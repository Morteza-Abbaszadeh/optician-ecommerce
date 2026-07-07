"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Package, Plus, Search, Edit, Trash2, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react"

interface Product {
  id: string
  title: string
  slug: string
  is_active: boolean
  category: { name: string }
  brand: { name: string }
  variants: {
    price: number
    stock_quantity: number
    images: { image_url: string; is_primary: boolean }[]
  }[]
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // دریافت تمام محصولات (حتی مخفی شده‌ها) از روتر جدید ادمین
        const response = await apiClient.get("/products/admin/all") 
        setProducts(response.data)
      } catch (err) {
        setError("خطا در دریافت لیست محصولات.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleDelete = async (productId: string, productTitle: string) => {
    const isConfirmed = window.confirm(`آیا از مخفی کردن عینک "${productTitle}" مطمئن هستید؟`)
    if (!isConfirmed) return
    try {
      await apiClient.delete(`/products/admin/${productId}`)
      // آپدیت ظاهر جدول بدون رفرش (تغییر وضعیت به غیرفعال)
      setProducts(products.map(p => p.id === productId ? { ...p, is_active: false } : p))
    } catch (err: any) {
      alert("خطایی در حذف محصول رخ داد.")
    }
  }

  // تابع بازگردانی که در کد قبلی شما وجود نداشت
  const handleRestore = async (productId: string, productTitle: string) => {
    const isConfirmed = window.confirm(`آیا می‌خواهید "${productTitle}" دوباره در فروشگاه نمایش داده شود؟`)
    if (!isConfirmed) return
    try {
      await apiClient.patch(`/products/admin/${productId}/restore`)
      // بازگردانی رنگ و وضعیت محصول در جدول به حالت فعال
      setProducts(products.map(p => p.id === productId ? { ...p, is_active: true } : p))
    } catch (err: any) {
      alert("خطایی در بازگردانی محصول رخ داد.")
    }
  }

  const getMainImage = (product: Product) => {
    if (product.variants?.length > 0 && product.variants[0].images?.length > 0) return product.variants[0].images[0].image_url
    return null
  }
  const getTotalStock = (product: Product) => {
    if (!product.variants) return 0
    return product.variants.reduce((total, variant) => total + variant.stock_quantity, 0)
  }
  const getBasePrice = (product: Product) => {
    if (product.variants?.length > 0) return product.variants[0].price.toLocaleString("fa-IR")
    return "۰"
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" /> لیست محصولات (انبار)
          </h1>
          <p className="text-zinc-500 mt-2">مدیریت عینک‌ها، موجودی‌ها و وضعیت نمایش</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2 h-12 px-6 rounded-xl shadow-md">
            <Plus className="w-5 h-5" /> افزودن محصول جدید
          </Button>
        </Link>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-zinc-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
              <p>در حال بارگذاری انبار...</p>
            </div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                <tr>
                  <th className="p-4">تصویر</th>
                  <th className="p-4">نام محصول</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">موجودی کل</th>
                  <th className="p-4">قیمت پایه (تومان)</th>
                  <th className="p-4 w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((product) => {
                  const totalStock = getTotalStock(product)
                  return (
                    // استایل‌های جدید برای ردیف‌های مخفی شده
                    <tr key={product.id} className={`transition-colors ${product.is_active ? 'hover:bg-zinc-50/50' : 'bg-zinc-50/80 opacity-75 grayscale-[30%]'}`}>
                      <td className="p-4">
                        <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                          {getMainImage(product) ? <img src={getMainImage(product)!} alt={product.title} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-zinc-300" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`font-bold ${product.is_active ? 'text-zinc-800' : 'text-zinc-500'}`}>{product.title}</div>
                        <div className="text-xs text-zinc-500 mt-1 font-mono" dir="ltr">{product.slug}</div>
                      </td>
                      <td className="p-4">
                        {product.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">فعال در سایت</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-200 text-zinc-600 text-xs font-bold border border-zinc-300">مخفی شده</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-zinc-700">{totalStock === 0 ? "ناموجود" : `${totalStock} عدد`}</span>
                      </td>
                      <td className="p-4 font-bold text-zinc-800">{getBasePrice(product)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="ویرایش"><Edit className="w-4 h-4" /></button>
                          </Link>
                          
                          {/* شرط‌بندی نمایش دکمه حذف و بازگردانی */}
                          {product.is_active ? (
                            <button onClick={() => handleDelete(product.id, product.title)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="مخفی کردن از سایت">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleRestore(product.id, product.title)} className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="بازگردانی به سایت">
                              <RefreshCw className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}