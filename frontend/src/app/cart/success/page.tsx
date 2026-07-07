"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShoppingBag } from "lucide-react"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-white p-8 md:p-12 rounded-3xl max-w-md w-full text-center border border-zinc-100 shadow-xl shadow-zinc-100/50">
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-zinc-900 mb-2">سفارش شما با موفقیت ثبت شد!</h1>
        <p className="text-zinc-500 mb-8 leading-relaxed">
          از خرید شما سپاسگزاریم. سفارش شما دریافت شد و به زودی پردازش و ارسال خواهد شد.
        </p>

        <div className="space-y-3">
          <Link href="/shop" className="block w-full">
            <Button className="w-full h-12 text-base font-bold bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              ادامه خرید در فروشگاه
            </Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button variant="outline" className="w-full h-12 text-base font-medium rounded-xl border-zinc-200">
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}