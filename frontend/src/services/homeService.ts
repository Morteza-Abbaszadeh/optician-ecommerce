import { apiClient } from "@/services/apiClient"; // یا "./apiClient" بسته به مسیر فایل شما

export const homeService = {
  getHomeLayout: async () => {
    // دریافت تنظیمات چیدمان و محصولاتِ هر بخش از بک‌اند
    const res = await apiClient.get("/home/layout");
    return res.data;
  },
  
  // متد جدید برای آپدیت کردن یک بخش
  updateSection: async (id: number, data: { order: int, is_active: boolean }) => {
    const res = await apiClient.patch(`/home/${id}`, data);
    return res.data;
  }
};