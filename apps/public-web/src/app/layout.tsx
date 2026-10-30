import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = { applicationName: "ATSH AI", robots: { index: true, follow: true } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-site-locale") === "en" ? "en" : "ar";
  return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><body>{children}</body></html>;
}
