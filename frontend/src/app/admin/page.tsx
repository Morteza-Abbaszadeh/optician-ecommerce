"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Package, Plus, Search, Edit, Trash2, Image as ImageIcon, Loader2, 
  LayoutDashboard, Layers, Power, Save, MonitorPlay 
} from "lucide-react"

// ==========================================
// کامپوننت اصلی (داشبورد ادمین با قابلیت تب‌بندی)
// ==========================================
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"products" | "home_layout">("products")

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20 font-sans" dir="rtl">
      
      {/* هدر و تب‌های داشبورد */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-zinc-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "products" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Package className="w-4 h-4" /> انبار محصولات
          </button>
          <button
            onClick={() => setActiveTab("home_layout")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "home_layout" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <MonitorPlay className="w-4 h-4" /> چیدمان صفحه اصلی
          </button>
        </div>

        {/* دکمه افزودن فقط در تب محصولات نمایش داده شود */}
        {activeTab === "products" && (
          <Link href="/admin/products/new">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2 h-12 px-6 rounded-xl shadow-md transition-all w-full md:w-auto">
              <Plus className="w-5 h-5" /> افزودن محصول جدید
            </Button>
          </Link>
        )}
      </div>

      {/* نمایش محتوای تب انتخاب شده */}
      {activeTab === "products" ? <ProductsManager /> : <HomeLayoutManager />}

    </div>
  )
}

// ==========================================
// تب 1: مدیریت محصولات (کد تکمیل شده شما)
// ==========================================
interface Product {
  id: string; title: string; slug: string; is_active: boolean; category: { name: string }; brand: { name: string };
  variants: { price: number; stock_quantity: number; images: { image_url: string; is_primary: boolean }[] }[]
}

function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get("/products/") 
        setProducts(response.data)
      } catch (err) {
        setError("خطا در دریافت لیست محصولات. لطفاً ارتباط با سرور را بررسی کنید.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleDelete = async (productId: string, productTitle: string) => {
    const isConfirmed = window.confirm(`آیا از حذف عینک "${productTitle}" مطمئن هستید؟ (این محصول فقط از دید کاربران مخفی می‌شود)`)
    if (!isConfirmed) return
    try {
      await apiClient.delete(`/products/admin/${productId}`)
      setProducts(products.filter(p => p.id !== productId))
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطایی در حذف محصول رخ داد.")
    }
  }

  const getMainImage = (product: Product) => {
    if (product.variants?.length > 0 && product.variants[0].images?.length > 0) return product.variants[0].images[0].image_url
    return null
  }

  const getTotalStock = (product: Product) => product.variants ? product.variants.reduce((total, v) => total + v.stock_quantity, 0) : 0
  const getBasePrice = (product: Product) => product.variants?.length > 0 ? product.variants[0].price.toLocaleString("fa-IR") : "۰"
  
  const filteredProducts = products.filter(p => p.title.includes(searchTerm) || (p.brand?.name && p.brand.name.includes(searchTerm)))

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h2 className="text-2xl font-black text-zinc-900">لیست محصولات</h2>
        <p className="text-zinc-500 mt-1">مدیریت عینک‌ها، موجودی‌ها و قیمت‌ها</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" placeholder="جستجوی نام عینک یا برند..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-zinc-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
              <p>در حال بارگذاری انبار...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4"><Package className="w-10 h-10 text-zinc-300" /></div>
              <h3 className="text-lg font-bold text-zinc-700">موردی یافت نشد!</h3>
            </div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                <tr>
                  <th className="p-4">تصویر</th><th className="p-4">نام محصول</th><th className="p-4">برند و دسته</th>
                  <th className="p-4 text-center">موجودی</th><th className="p-4">قیمت پایه (تومان)</th><th className="p-4 w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((product) => {
                  const totalStock = getTotalStock(product)
                  return (
                    <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4">
                        <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                          {getMainImage(product) ? <img src={getMainImage(product)!} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-zinc-300" />}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-zinc-800">{product.title}</td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">{product.brand?.name || "بدون برند"}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${totalStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {totalStock === 0 ? "ناموجود" : `${totalStock} عدد`}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-zinc-800">{getBasePrice(product)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/products/${product.id}/edit`}><button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button></Link>
                          <button onClick={() => handleDelete(product.id, product.title)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

// ==========================================
// تب 2: مدیریت چیدمان صفحه اصلی (همگام با UI شما)
// ==========================================
function HomeLayoutManager() {
  const [sections, setSections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSections = async () => {
    try {
      const res = await apiClient.get("/home/layout")
      setSections(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchSections() }, [])

  const handleUpdate = async (id: number, order: number, is_active: boolean) => {
    try {
      await apiClient.patch(`/home/${id}`, { order, is_active })
      fetchSections()
    } catch (error) {
      alert("خطا در به‌روزرسانی")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-2">
        <h2 className="text-2xl font-black text-zinc-900">چیدمان صفحه اصلی</h2>
        <p className="text-zinc-500 mt-1">ترتیب نمایش و فعال/غیرفعال بودن بخش‌های سایت را کنترل کنید.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p>در حال دریافت تنظیمات صفحه...</p>
          </div>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
              <tr>
                <th className="p-4 w-16">ردیف</th>
                <th className="p-4">نام بخش</th>
                <th className="p-4">نوع ساختار</th>
                <th className="p-4 text-center">اولویت نمایش (ترتیب)</th>
                <th className="p-4 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sections.map((sec, index) => (
                <tr key={sec.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-4 text-zinc-400 font-mono">{index + 1}</td>
                  <td className="p-4 font-bold text-zinc-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-zinc-400" /> {sec.title}
                  </td>
                  <td className="p-4 text-zinc-500 font-mono text-xs" dir="ltr">{sec.section_type}</td>
                  <td className="p-4 text-center">
                    <input 
                      type="number" 
                      className="w-20 text-center px-3 py-2 bg-white border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold"
                      defaultValue={sec.order} 
                      onBlur={(e) => handleUpdate(sec.id, parseInt(e.target.value) || 0, sec.is_active)}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <Button 
                      variant={sec.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdate(sec.id, sec.order, !sec.is_active)}
                      className={`rounded-xl gap-2 ${sec.is_active ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-zinc-500"}`}
                    >
                      <Power className="w-4 h-4" />
                      {sec.is_active ? "فعال است" : "غیرفعال"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}