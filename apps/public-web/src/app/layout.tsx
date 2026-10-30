import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATSH AI — حلول رقمية وذكاء اصطناعي",
  description: "نبني تجارب رقمية وأنظمة ذكية تساعد أعمالك على النمو."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
