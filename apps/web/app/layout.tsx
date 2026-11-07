import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "اسمارت‌جیم", template: "%s · اسمارت‌جیم" },
  description: "پلتفرم هوشمند مدیریت باشگاه‌های ورزشی",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
