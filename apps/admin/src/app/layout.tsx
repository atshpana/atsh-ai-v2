import type { Metadata } from "next";
import { AdminShell } from "./admin-shell";
import "./style.css";

export const metadata: Metadata = {
  title: "ATSH AI | لوحة الإدارة",
  description: "مركز إدارة وتشغيل ATSH AI",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><AdminShell>{children}</AdminShell></body></html>;
}
