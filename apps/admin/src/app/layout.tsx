import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "ATSH AI | الإدارة", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
