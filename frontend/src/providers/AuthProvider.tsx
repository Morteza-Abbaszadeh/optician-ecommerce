"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchUser = useAuthStore((state) => state.fetchUser)

  useEffect(() => {
    // به محض لود شدن سایت، اطلاعات کاربر را از بک‌اند می‌گیرد
    fetchUser()
  }, [fetchUser])

  return <>{children}</>
}