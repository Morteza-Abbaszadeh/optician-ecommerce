import type { Metadata } from "next";
// فونت پیش‌فرض، اگر فونت دیگری دارید تغییر ندهید
import { Vazirmatn } from "next/font/google"; 
import "./globals.css";

// ۱. ایمپورت کردن کامپوننت هدری که ساختیم
import Header from "@/components/Header"; 

const vazirmatn = Vazirmatn({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "فروشگاه عینک بینا",
  description: "خرید آنلاین جدیدترین عینک‌های طبی و آفتابی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.className} bg-zinc-50 text-zinc-900`}>
        
        {/* ۲. قرار دادن هدر در بالاترین بخش بدنه سایت */}
        <Header /> 
        
        {/* محتوای صفحات مختلف مثل /shop یا /cart اینجا لود می‌شود */}
        <main>{children}</main>
        
      </body>
    </html>
  );
}