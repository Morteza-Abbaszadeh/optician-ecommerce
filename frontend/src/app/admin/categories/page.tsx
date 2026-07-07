"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Loader2, Tags, FolderTree, Plus, Trash2, Edit, AlertCircle 
} from "lucide-react"

export default function CategoriesAndBrandsPage() {
  const [activeTab, setActiveTab] = useState<"CATEGORIES" | "BRANDS">("CATEGORIES")
  
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // استیت‌های ساخت آیتم جدید
  const [newItemName, setNewItemName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // واکشی اطلاعات از سرور
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [catRes, brandRes] = await Promise.all([
        apiClient.get("/products/categories/"),
        apiClient.get("/products/brands/")
      ])
      setCategories(catRes.data)
      setBrands(brandRes.data)
    } catch (error) {
      console.error("خطا در دریافت اطلاعات:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // تابع ساخت دسته یا برند جدید
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    setIsSubmitting(true)
    const slug = newItemName.trim().toLowerCase().replace(/\s+/g, '-')

    try {
      if (activeTab === "CATEGORIES") {
        const res = await apiClient.post("/products/categories/admin/", { name: newItemName, slug })
        setCategories([...categories, res.data])
      } else {
        const res = await apiClient.post("/products/brands/admin/", { name: newItemName, slug })
        setBrands([...brands, res.data])
      }
      setNewItemName("") // خالی کردن فرم بعد از ساخت موفق
    } catch (error) {
      alert("خطا در ایجاد آیتم جدید. ممکن است این نام از قبل وجود داشته باشد.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // تابع حذف (نیاز به وجود متد DELETE در بک‌اند دارد)
  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا از حذف این مورد اطمینان دارید؟ (در صورت داشتن محصول، حذف نخواهد شد)")) return

    try {
      if (activeTab === "CATEGORIES") {
        await apiClient.delete(`/products/categories/admin/${id}`)
        setCategories(categories.filter(c => c.id !== id))
      } else {
        await apiClient.delete(`/products/brands/admin/${id}`)
        setBrands(brands.filter(b => b.id !== id))
      }
    } catch (error) {
      alert("خطا در حذف! احتمالاً محصولاتی با این دسته/برند در فروشگاه وجود دارند و امکان حذف آن نیست.")
    }
  }

  // انتخاب لیست فعال بر اساس تب
  const activeList = activeTab === "CATEGORIES" ? categories : brands

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto font-sans pb-24" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-800 flex items-center gap-3">
            <Tags className="w-8 h-8 text-emerald-600" /> مدیریت دسته‌ها و برندها
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">دسته‌بندی‌های محصولات و برندهای عینک را اضافه یا مدیریت کنید.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ستون راست: فرم افزودن */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-zinc-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" /> 
              افزودن {activeTab === "CATEGORIES" ? "دسته‌بندی" : "برند"} جدید
            </h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-zinc-700 block mb-2">عنوان (فارسی یا انگلیسی)</label>
                <Input 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={activeTab === "CATEGORIES" ? "مثال: عینک آفتابی" : "مثال: Ray-Ban"}
                  className="bg-zinc-50 border-zinc-200 h-12"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || !newItemName.trim()}
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ثبت و ذخیره"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
              <p>لینک لاتین (Slug) به صورت خودکار از روی عنوان ساخته می‌شود تا در آدرس سایت استفاده شود.</p>
            </div>
          </div>
        </div>

        {/* ستون چپ: لیست اطلاعات */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* تب‌ها */}
          <div className="flex p-1 bg-zinc-200/50 rounded-2xl w-full max-w-sm">
            <button 
              onClick={() => setActiveTab("CATEGORIES")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === "CATEGORIES" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              <FolderTree className="w-4 h-4" /> دسته‌بندی‌ها
            </button>
            <button 
              onClick={() => setActiveTab("BRANDS")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === "BRANDS" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              <Tags className="w-4 h-4" /> برندها
            </button>
          </div>

          {/* لیست */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : activeList.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-bold">هیچ موردی ثبت نشده است.</div>
            ) : (
              <table className="w-full text-sm text-right">
                <thead className="bg-zinc-50/80 text-zinc-500 font-bold border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4">عنوان</th>
                    <th className="px-6 py-4">لینک (Slug)</th>
                    <th className="px-6 py-4 w-24">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {activeList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-800">{item.name}</td>
                      <td className="px-6 py-4 font-mono text-zinc-500 text-xs" dir="ltr">{item.slug}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}