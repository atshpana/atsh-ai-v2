import type { Metadata } from "next";
export const metadata: Metadata = { title: "ATSH AI | بوابة العميل", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body style={{margin:0,fontFamily:"Arial,sans-serif",background:"#f5f7f9",color:"#17232e"}}>{children}</body></html>;
}
