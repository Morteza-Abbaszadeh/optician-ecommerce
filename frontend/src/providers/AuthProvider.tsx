"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, token, isHydrated, user } = useAuthStore((state) => ({
    fetchUser: state.fetchUser,
    token: state.token,
    isHydrated: state.isHydrated,
    user: state.user
  }))

  useEffect(() => {
    // منطق اصلی: 
    // ۱. اطمینان از اینکه کلاینت (isHydrated) لود شده است.
    // ۲. توکن در استور وجود داشته باشد.
    // ۳. اگر قبلاً دیتای کاربر را نگرفته‌ایم، حالا درخواست می‌زنیم.
    if (isHydrated && token && !user) {
      fetchUser()
    }
  }, [isHydrated, token, user, fetchUser])

  return <>{children}</>
}