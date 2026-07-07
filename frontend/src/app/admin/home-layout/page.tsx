"use client"

import { useState, useEffect, useRef } from "react"
import { homeService } from "@/services/homeService"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  GripVertical,   Eye,   EyeOff,   Save, 
  LayoutTemplate,   Loader2,   Image as ImageIcon,
  LayoutGrid,  Star,  MapPin,  Settings,
  X,  Search,  CheckSquare,
  Square
} from "lucide-react"


export default function HomeLayoutAdminPage() {
  const [sections, setSections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // استیت‌های مربوط به پاپ‌آپ ویرایش محتوا
  const [editingSection, setEditingSection] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editProductIds, setEditProductIds] = useState<string[]>([])
  const [isSavingContent, setIsSavingContent] = useState(false)

  // استیت‌های مربوط به لیست محصولات در پاپ‌آپ
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Ref های مربوط به سیستم Drag & Drop بومی مرورگر
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setIsLoading(true)
      const data = await homeService.getHomeLayout()
      const sortedData = data.sort((a: any, b: any) => a.order - b.order)
      setSections(sortedData)
    } catch (error) {
      console.error("خطا در دریافت چیدمان:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // === منطق Drag and Drop ===
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return

    const _sections = [...sections]
    const draggedItemContent = _sections.splice(dragItem.current, 1)[0]
    _sections.splice(dragOverItem.current, 0, draggedItemContent)

    dragItem.current = null
    dragOverItem.current = null
    setSections(_sections)
  }

  const toggleVisibility = (index: number) => {
    const _sections = [...sections]
    _sections[index].is_active = !_sections[index].is_active
    setSections(_sections)
  }

  // ذخیره ترتیب (Order) و وضعیت فعال بودن
  const handleSaveLayout = async () => {
    setIsSaving(true)
    try {
      const promises = sections.map((section, index) => {
        return homeService.updateSection(section.id, {
          order: index + 1,
          is_active: section.is_active
        })
      })
      await Promise.all(promises)
      alert("چیدمان صفحه اصلی با موفقیت ذخیره شد!")
    } catch (error) {
      console.error(error)
      alert("خطا در ذخیره‌سازی تغییرات")
    } finally {
      setIsSaving(false)
    }
  }

  // باز کردن پاپ‌آپ ویرایش و واکشی محصولات
  const openEditModal = async (section: any) => {
    setEditingSection(section)
    setEditTitle(section.title || "")
    setEditProductIds(section.product_ids || [])
    setProductSearch("")

    // اگر بخش از نوع گرید محصولات بود، لیست عینک‌ها را از بک‌اند می‌گیریم
    if (section.section_type === "PRODUCT_GRID" || section.section_type === "BRAND_COLLECTION") {
      try {
        setIsLoadingProducts(true)
        // واکشی ۱۰۰ محصول آخر برای انتخاب سریع در منو
        const res = await apiClient.get("/products?limit=100")
        setAvailableProducts(res.data)
      } catch (error) {
        console.error("خطا در دریافت لیست محصولات", error)
      } finally {
        setIsLoadingProducts(false)
      }
    }
  }

  // ذخیره عنوان و محصولات انتخاب شده در پاپ‌آپ
  const handleSaveContent = async () => {
    if (!editingSection) return
    setIsSavingContent(true)
    try {
      await homeService.updateSection(editingSection.id, { 
        title: editTitle,
        product_ids: editProductIds
      })
      
      setSections(sections.map(s => 
        s.id === editingSection.id 
          ? { ...s, title: editTitle, product_ids: editProductIds } 
          : s
      ))
      setEditingSection(null)
    } catch (error) {
      alert("خطا در ذخیره محتوای بخش")
    } finally {
      setIsSavingContent(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    if (editProductIds.includes(productId)) {
      setEditProductIds(editProductIds.filter(id => id !== productId))
    } else {
      setEditProductIds([...editProductIds, productId])
    }
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "HERO": return <ImageIcon className="w-6 h-6 text-blue-500" />
      case "PRODUCT_GRID": return <LayoutGrid className="w-6 h-6 text-purple-500" />
      case "BRAND_COLLECTION": return <Star className="w-6 h-6 text-amber-500" />
      case "SOCIAL_LOCATION": return <MapPin className="w-6 h-6 text-emerald-500" />
      default: return <LayoutTemplate className="w-6 h-6 text-zinc-500" />
    }
  }

  const filteredProducts = availableProducts.filter(p => 
    p.title.includes(productSearch) || (p.slug && p.slug.includes(productSearch))
  )

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-400" /></div>
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto font-sans pb-24" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-800 flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-emerald-600" /> چیدمان صفحه اصلی
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">بخش‌ها را بکشید و رها کنید (Drag & Drop) تا ترتیب نمایش در سایت تغییر کند.</p>
        </div>
        
        <Button 
          onClick={handleSaveLayout} 
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-bold text-lg w-full md:w-auto shadow-lg shadow-emerald-600/20"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-5 h-5 ml-2" /> ذخیره ترتیب</>}
        </Button>
      </div>

      {/* لیست Drag & Drop */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleSort}
            onDragOver={(e) => e.preventDefault()}
            className={`
              flex items-center gap-4 bg-white p-4 md:p-6 rounded-2xl border-2 shadow-sm transition-all cursor-move hover:shadow-md
              ${section.is_active ? 'border-zinc-200' : 'border-zinc-100 bg-zinc-50/50 opacity-70'}
            `}
          >
            <div className="text-zinc-400 hover:text-zinc-600 p-2 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-6 h-6" />
            </div>

            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 hidden sm:block">
              {getSectionIcon(section.section_type)}
            </div>

            <div className="flex-1">
              <h3 className={`text-lg font-bold ${section.is_active ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {section.title || "بدون عنوان"}
              </h3>
              <p className="text-sm font-mono text-zinc-400 mt-1" dir="ltr">{section.section_type}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  openEditModal(section)
                }}
                className="p-3 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition-colors flex items-center gap-2 font-bold text-sm"
                title="تنظیمات محتوا"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggleVisibility(index)
                }}
                className={`p-3 rounded-xl border transition-colors flex items-center gap-2 font-bold text-sm ${
                  section.is_active 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                }`}
              >
                {section.is_active ? (
                  <><Eye className="w-5 h-5" /> <span className="hidden sm:inline">فعال</span></>
                ) : (
                  <><EyeOff className="w-5 h-5" /> <span className="hidden sm:inline">مخفی</span></>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================== */}
      {/* پاپ‌آپ (Modal) ویرایش محتوا و انتخاب محصولات */}
      {/* ============================================== */}
      {editingSection && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h3 className="text-xl font-black text-zinc-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" /> ویرایش محتوای بخش
              </h3>
              <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* ویرایش عنوان */}
              <div>
                <label className="text-sm font-bold text-zinc-700 mb-2 block">عنوان نمایشی در سایت</label>
                <Input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-12 bg-zinc-50 border-zinc-200 font-bold"
                  placeholder="مثال: جدیدترین عینک‌های آفتابی"
                />
              </div>

              {/* بخش انتخاب محصولات (فقط برای گریدها) */}
              {(editingSection.section_type === "PRODUCT_GRID" || editingSection.section_type === "BRAND_COLLECTION") && (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                  <div className="bg-zinc-50 p-4 border-b border-zinc-200">
                    <p className="text-sm font-bold text-zinc-800 mb-3">عینک‌های این بخش را انتخاب کنید:</p>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input 
                        placeholder="جستجوی نام عینک..." 
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="bg-white pl-4 pr-10 border-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-2">
                    {isLoadingProducts ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
                    ) : filteredProducts.length === 0 ? (
                      <p className="text-center text-sm text-zinc-500 py-8 font-bold">عینکی یافت نشد.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredProducts.map((product) => {
                          const isSelected = editProductIds.includes(product.id)
                          return (
                            <div 
                              key={product.id}
                              onClick={() => toggleProductSelection(product.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-zinc-50 border border-transparent'
                              }`}
                            >
                              <div className={`${isSelected ? 'text-emerald-500' : 'text-zinc-300'}`}>
                                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-zinc-700'}`}>
                                  {product.title}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="bg-zinc-50 p-3 text-xs font-bold text-zinc-500 text-center border-t border-zinc-200">
                    {editProductIds.length} محصول انتخاب شده است
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl">
              <Button 
                onClick={handleSaveContent}
                disabled={isSavingContent}
                className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-lg font-black shadow-lg transition-all hover:-translate-y-1"
              >
                {isSavingContent ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "ثبت نهایی محتوا"}
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}