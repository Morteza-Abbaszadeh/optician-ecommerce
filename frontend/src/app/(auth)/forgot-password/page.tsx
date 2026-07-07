"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/services/apiClient"

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // این API را در فاز بعدی در بک‌اند خواهیم ساخت
      // فعلاً ساختار درخواست آن را آماده می‌کنیم
      // await apiClient.post("/users/forgot-password", { phone_number: phoneNumber })
      
      // شبیه‌سازی تاخیر شبکه برای تست UI
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setIsSubmitted(true)
    } catch (err: any) {
      setError("خطایی در ارسال کد رخ داد. لطفاً شماره موبایل را بررسی کنید.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 p-4 font-sans" dir="rtl">
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 relative">
        
        {/* دکمه بازگشت به لاگین */}
        <Link href="/login" className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition-colors">
          <ArrowRight className="h-6 w-6" />
        </Link>

        {!isSubmitted ? (
          <div className="mt-6">
            <div className="mb-8 text-right">
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">فراموشی رمز عبور</h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                شماره موبایل خود را وارد کنید. ما یک لینک یا کد یکبار مصرف برای بازیابی رمز عبور به شما پیامک خواهیم کرد.
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 text-right">
                  {error}
                </div>
              )}

              <div className="space-y-2 text-right">
                <Label htmlFor="phone" className="text-zinc-700 font-medium block">شماره موبایل</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09123456789"
                  type="tel"
                  className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 rounded-xl text-left px-4"
                  dir="ltr"
                  required
                />
              </div>

              <Button disabled={loading} type="submit" className="w-full h-12 text-base font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all mt-4">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "ارسال کد تایید"}
              </Button>
            </form>
          </div>
        ) : (
          /* پیام موفقیت پس از ارسال فرم */
          <div className="mt-8 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">پیامک ارسال شد!</h2>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
              کد بازیابی به شماره <span className="font-bold text-zinc-800" dir="ltr">{phoneNumber}</span> ارسال گردید. لطفا تلفن همراه خود را بررسی کنید.
            </p>
            <Button variant="outline" className="w-full h-12 text-base font-medium rounded-xl border-zinc-200 text-zinc-700" onClick={() => setIsSubmitted(false)}>
              اصلاح شماره موبایل
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}