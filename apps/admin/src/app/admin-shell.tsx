"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  { label: "الرئيسية", items: [{ href: "/", label: "مركز القيادة", icon: "⌂" }] },
  { label: "العملاء والمبيعات", items: [{ href: "/customers", label: "العملاء", icon: "◉" }, { href: "/requests", label: "الطلبات والمبيعات", icon: "▤" }] },
  { label: "التنفيذ والخدمة", items: [{ href: "/projects", label: "المشروعات والتنفيذ", icon: "◫" }, { href: "/portal", label: "بوابة العملاء", icon: "▣" }, { href: "/support", label: "الدعم وخدمة العملاء", icon: "◎" }] },
  { label: "الأتمتة والذكاء", items: [{ href: "/workflows", label: "سير العمل والأتمتة", icon: "⌘" }, { href: "/ai-team", label: "فريق الذكاء الاصطناعي", icon: "✳" }] },
  { label: "إدارة الشركة", items: [{ href: "/team", label: "الفريق والصلاحيات", icon: "♙" }, { href: "/catalog", label: "الخدمات والباقات والتسعير", icon: "◈" }, { href: "/hosting", label: "الاستضافة والنطاقات", icon: "▥" }, { href: "/finance", label: "المالية", icon: "＄" }] },
  { label: "الموقع والتحليلات", items: [{ href: "/website", label: "الموقع والمحتوى والتصميم", icon: "▧" }, { href: "/reports", label: "التقارير", icon: "▥" }] },
  { label: "النظام", items: [{ href: "/settings", label: "الإعدادات والأمان", icon: "⚙" }] }
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav className={mobile ? "mobile-nav-list" : "side-nav"} aria-label="التنقل الرئيسي">
    {groups.map((group) => <section className="nav-group" key={group.label}>
      {!mobile && <div className="nav-group-title">{group.label}</div>}
      {group.items.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "nav-link active" : "nav-link"}>
        <span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
      </Link>)}
    </section>)}
  </nav>;
}

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-app">
    <aside className="sidebar">
      <Link href="/" className="brand-lockup"><span className="brand-emblem">A<span>✳</span></span><span><b>ATSH</b><strong>AI</strong><small>COMPANY OS</small></span></Link>
      <div className="workspace-switch"><span className="workspace-avatar">A</span><span><b>ATSH AI</b><small>مساحة الشركة</small></span><span className="switch-chevron">⌄</span></div>
      <Navigation />
      <div className="sidebar-bottom"><div className="system-pulse"><i /> بيئة التأسيس</div><div className="sidebar-version">ATSH AI · ADMIN 0.1</div></div>
    </aside>
    <div className="admin-main">
      <header className="topbar">
        <div className="topbar-context"><span className="context-dot" /> <span>مساحة الإدارة</span><span className="context-separator">/</span><b>التحكم المركزي</b></div>
        <div className="topbar-actions">
          <label className="global-search"><span>⌕</span><input disabled placeholder="البحث في المنظومة — قريبًا" aria-label="البحث في المنظومة" /></label>
          <Link href="/notifications" className="icon-action" aria-label="مركز التنبيهات">♧<i /></Link>
          <div className="topbar-divider" />
          <div className="owner-chip"><span className="owner-avatar">O</span><span><b>المالك</b><small>صلاحيات المالك</small></span><span className="switch-chevron">⌄</span></div>
        </div>
      </header>
      <div className="mobile-nav"><Navigation mobile /></div>
      <main className="admin-content">{children}</main>
      <footer className="admin-footer"><span>ATSH AI · نظام تشغيل الشركة</span><span>نسخة تأسيسية 0.1</span></footer>
    </div>
  </div>;
}
