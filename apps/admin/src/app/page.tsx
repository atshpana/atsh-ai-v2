import Link from "next/link";

const metrics = [
  { label: "طلبات تحتاج مراجعة", source: "الطلبات والمبيعات", href: "/requests", hint: "تُعرض بعد ربط API الطلبات" },
  { label: "مشروعات قيد التنفيذ", source: "المشروعات والتنفيذ", href: "/projects", hint: "تُعرض بعد ربط دورة حياة المشروع" },
  { label: "مهام تتطلب تدخلًا", source: "الفريق والصلاحيات", href: "/team", hint: "تُعرض بعد تفعيل الإسناد والمهام" },
  { label: "ملخص الأداء المالي", source: "المالية", href: "/finance", hint: "تُعرض بعد اعتماد وربط مصادر المالية" }
];

const workspaces = [
  { number: "01", title: "مركز القيادة", description: "المؤشرات والتنبيهات والأولويات ونظرة المالك.", href: "/", group: "القيادة" },
  { number: "02", title: "العملاء", description: "ملفات العملاء والجهات وسجل التعاملات.", href: "/customers", group: "العملاء والمبيعات" },
  { number: "03", title: "الطلبات والمبيعات", description: "الطلبات والمراجعة وعروض الأسعار والعقود.", href: "/requests", group: "العملاء والمبيعات" },
  { number: "04", title: "المشروعات والتنفيذ", description: "الخطط والمراحل والمهام والمراجعات والتسليم.", href: "/projects", group: "التنفيذ والخدمة" },
  { number: "05", title: "بوابة العملاء", description: "حساب العميل وطلباته ومنتجاته المتعاقد عليها.", href: "/portal", group: "التنفيذ والخدمة" },
  { number: "06", title: "الدعم وخدمة العملاء", description: "التذاكر والمراسلات والتصعيد واتفاقيات الخدمة.", href: "/support", group: "التنفيذ والخدمة" },
  { number: "07", title: "سير العمل والأتمتة", description: "التدفقات وإصداراتها والتنفيذ وإعادة المحاولة.", href: "/workflows", group: "الأتمتة والذكاء" },
  { number: "08", title: "فريق الذكاء الاصطناعي", description: "مدير AI والوكلاء والمهام والمراجعة والتكلفة.", href: "/ai-team", group: "الأتمتة والذكاء" },
  { number: "09", title: "الفريق والصلاحيات", description: "الموظفون والأدوار والإسناد والتفويض والتدقيق.", href: "/team", group: "إدارة الشركة" },
  { number: "10", title: "الخدمات والباقات والتسعير", description: "الكتالوج والخيارات وقواعد وإصدارات الأسعار.", href: "/catalog", group: "إدارة الشركة" },
  { number: "11", title: "الاستضافة والنطاقات", description: "الحسابات والتخصيصات والتجديدات والنسخ الاحتياطي.", href: "/hosting", group: "إدارة الشركة" },
  { number: "12", title: "المالية", description: "الفواتير والمدفوعات والتسويات والتقارير.", href: "/finance", group: "إدارة الشركة" },
  { number: "13", title: "الموقع والمحتوى والتصميم", description: "الصفحات والترجمات والهوية والمعاينة والنشر.", href: "/website", group: "الموقع والتحليلات" },
  { number: "14", title: "التقارير", description: "الأداء التشغيلي والمالي والتكلفة والتصدير المقيد.", href: "/reports", group: "الموقع والتحليلات" },
  { number: "15", title: "الإعدادات والأمان", description: "التكاملات والسياسات والجلسات والنسخ وسجل التدقيق.", href: "/settings", group: "النظام" }
];

const readiness = [
  { label: "واجهة لوحة الإدارة", state: "هيكل الواجهة موجود", tone: "progress" },
  { label: "المصادقة والجلسات", state: "لم تُنفّذ بعد", tone: "pending" },
  { label: "الصلاحيات وعزل البيانات", state: "أساس الحماية فقط", tone: "pending" },
  { label: "قاعدة البيانات وواجهات API", state: "غير موصولة", tone: "pending" },
  { label: "التدفقات والوكلاء", state: "ضمن مراحل التنفيذ التالية", tone: "pending" }
];

export default function AdminHome() {
  return <div className="dashboard">
    <div className="page-heading">
      <div>
        <div className="eyebrow">ATSH AI <span>•</span> OWNER WORKSPACE</div>
        <h1>مركز القيادة</h1>
        <p>مركز موحد لمتابعة الشركة واتخاذ القرارات وإدارة وحدات التشغيل.</p>
      </div>
      <div className="heading-status"><span className="status-led" /> بيئة التأسيس · لا توجد بيانات تشغيلية موصولة</div>
    </div>

    <section className="owner-welcome">
      <div className="owner-welcome-copy">
        <span className="owner-welcome-kicker">OWNER COMMAND CENTER</span>
        <h2>إدارة ATSH AI من مكان واحد</h2>
        <p>تنتظم هنا الطلبات والمشروعات والفريق والذكاء الاصطناعي والمالية. ستتحول البطاقات والمؤشرات إلى بيانات تشغيلية عند اكتمال خدماتها وصلاحياتها.</p>
        <div className="owner-shortcuts">
          <Link href="/requests">مراجعة الطلبات <span>↗</span></Link>
          <Link href="/projects">متابعة المشروعات <span>↗</span></Link>
          <Link href="/team">إدارة الفريق <span>↗</span></Link>
          <Link href="/settings">إعدادات النظام <span>↗</span></Link>
        </div>
      </div>
      <div className="owner-welcome-mark" aria-hidden="true"><span>ATSH</span><b>AI</b><i>✳</i></div>
    </section>

    <section className="metrics-section">
      <div className="section-heading"><div><span className="panel-kicker">BUSINESS PULSE</span><h2>نبض الشركة</h2></div><span className="section-note">المؤشرات مرتبطة بمصادرها — لا توجد أرقام تجريبية</span></div>
      <div className="metrics-grid">
        {metrics.map((metric, index) => <Link href={metric.href} className="metric-card metric-link" key={metric.label}>
          <div className="metric-top"><span>{metric.label}</span><span className="metric-index">0{index + 1}</span></div>
          <div className="metric-value">—</div>
          <div className="metric-note">{metric.hint}</div>
          <div className="metric-source">المصدر: {metric.source} <span>↗</span></div>
        </Link>)}
      </div>
    </section>

    <div className="dashboard-columns">
      <section className="panel work-panel">
        <div className="panel-heading"><div><span className="panel-kicker">COMPANY WORKSPACE</span><h2>وحدات إدارة الشركة</h2></div><span className="panel-count">15 وحدة</span></div>
        <div className="workspace-grid">
          {workspaces.map((item) => <Link href={item.href} className={item.href === "/" ? "workspace-card workspace-card-current" : "workspace-card"} key={item.number}>
            <span className="workspace-card-top"><span className="workspace-number">{item.number}</span><span className="workspace-open">↗</span></span>
            <b>{item.title}</b>
            <small>{item.description}</small>
            <span className="workspace-card-footer">{item.group}<i>واجهة تأسيسية</i></span>
          </Link>)}
        </div>
      </section>

      <div className="right-column">
        <section className="panel priority-panel">
          <div className="panel-heading"><div><span className="panel-kicker">NEEDS ATTENTION</span><h2>الأولويات والتنبيهات</h2></div><Link href="/notifications" className="panel-action">مركز التنبيهات ↗</Link></div>
          <div className="empty-state"><span className="empty-icon">◎</span><b>لا توجد تنبيهات تشغيلية بعد</b><p>سيظهر هنا ما يحتاج قرارًا أو تدخلًا من المالك بعد تفعيل الأحداث والتنبيهات.</p></div>
        </section>

        <section className="panel readiness-panel">
          <div className="panel-heading"><div><span className="panel-kicker">PLATFORM READINESS</span><h2>حالة تأسيس المنظومة</h2></div><span className="panel-count">تحديث يدوي مع كل إصدار</span></div>
          {readiness.map((item) => <div className="readiness-row" key={item.label}><span>{item.label}</span><b className={item.tone === "progress" ? "readiness-progress" : ""}>{item.state}</b></div>)}
        </section>

        <section className="panel governance-panel">
          <div className="panel-heading"><div><span className="panel-kicker">OWNER GOVERNANCE</span><h2>بوابات لا يمكن تجاوزها</h2></div></div>
          <ul className="governance-list">
            <li>اعتماد الخطة قبل بدء التنفيذ المؤثر.</li>
            <li>موافقة مستقلة على النتائج الحساسة.</li>
            <li>اعتماد العميل لإصدار التسليم المحدد.</li>
            <li>موافقة صريحة قبل النشر الإنتاجي.</li>
          </ul>
        </section>
      </div>
    </div>
    <div className="dashboard-bottom"><span>كل عملية حساسة يجب أن ترتبط بصلاحية ومصدر بيانات وسجل تدقيق.</span><Link href="/reports">فتح مركز التقارير <b>↗</b></Link></div>
  </div>;
}
