import { apiClient } from "./apiClient";

export const homeService = {
  getHomeLayout: async () => {
    // دریافت تنظیمات چیدمان و محصولاتِ هر بخش از بک‌اند
    const res = await apiClient.get("/home/layout");
    return res.data;
  }
};