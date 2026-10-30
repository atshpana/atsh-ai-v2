import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ATSH AI | حلول رقمية وهندسة ذكية",
    template: "%s | ATSH AI"
  },
  description:
    "نصمم ونبني المواقع والمتاجر والتطبيقات والأنظمة المخصصة وحلول الذكاء الاصطناعي والأتمتة، من تحليل الاحتياج إلى الاختبار والتسليم.",
  applicationName: "ATSH AI",
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
