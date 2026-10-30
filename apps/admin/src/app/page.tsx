import Link from "next/link";

const metrics = [
  ["الطلبات الجديدة", "الطلبات", "طلبات العملاء التي تنتظر المراجعة الأولية"],
  ["المشروعات النشطة", "التنفيذ", "المشروعات التي تعمل حاليًا عبر مراحلها"],
  ["المهام المتأخرة", "الفريق", "المهام التي تجاوزت موعدها وتحتاج تدخلًا"],
  ["إيرادات الفترة", "المالية", "المبالغ المسجلة والمعتمدة خلال الفترة"]
];

const workspaces = [
  ["الطلبات والمبيعات", "استقبال الطلبات ومراجعتها وإعداد عروض الأسعار.", "/requests", "01"],
  ["المشروعات والتنفيذ", "الخطط والمراحل والمهام والمراجعات والتسليم.", "/projects", "02"],
  ["فريق الذكاء الاصطناعي", "المدير المركزي والوكلاء والمهام والموافقات.", "/ai-team", "03"],
  ["الخدمات والتسعير", "الكتالوج والباقات والخيارات وإصدارات الأسعار.", "/catalog", "04"],
  ["الفريق والصلاحيات", "الموظفون والأدوار والإسناد والتفويض.", "/team", "05"],
  ["الموقع والمحتوى", "الصفحات والمحتوى والترجمات والهوية والنشر.", "/website", "06"]
];

export default function AdminHome() {
  return <div className="dashboard">
    <div className="page-heading">
      <div><div className="eyebrow">30 OCTOBER 2026 <span>•</span> COMMAND CENTER</div><h1>مركز القيادة</h1><p>نظرة موحدة على أعمال ATSH AI وعملياتها من مكان واحد.</p></div>
      <div className="heading-status"><span className="status-led" /> مرحلة التأسيس</div>
    </div>

    <section className="foundation-banner">
      <div className="banner-symbol">✳</div>
      <div><b>تم تجهيز الهيكل الأساسي للوحة الإدارة</b><p>مصادر البيانات والمصادقة والصلاحيات لم تُربط بعد. لن نعرض مؤشرات أو أرقامًا تشغيلية غير حقيقية.</p></div>
      <span className="banner-tag">FOUNDATION</span>
    </section>

    <section className="metrics-grid" aria-label="مؤشرات الأداء">
      {metrics.map(([title, section, description], index) => <article className="metric-card" key={title}>
        <div className="metric-top"><span>{title}</span><span className="metric-index">0{index + 1}</span></div>
        <div className="metric-value">—</div><div className="metric-note">{description}</div>
        <div className="metric-source">المصدر: وحدة {section} · غير متصل</div>
      </article>)}
    </section>

    <div className="dashboard-columns">
      <section className="panel work-panel">
        <div className="panel-heading"><div><span className="panel-kicker">COMPANY WORKSPACE</span><h2>وحدات إدارة الشركة</h2></div><span className="panel-count">06 وحدات</span></div>
        <div className="workspace-list">
          {workspaces.map(([title, description, href, number]) => <Link href={href} className="workspace-row" key={href}>
            <span className="workspace-number">{number}</span><span className="workspace-copy"><b>{title}</b><small>{description}</small></span><span className="workspace-state">قيد التأسيس</span><span className="row-arrow">↗</span>
          </Link>)}
        </div>
      </section>

      <div className="right-column">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><span className="panel-kicker">LIVE ACTIVITY</span><h2>النشاط الأخير</h2></div><span className="live-label"><i /> LIVE</span></div>
          <div className="empty-state"><span className="empty-icon">◷</span><b>لا يوجد نشاط مسجل بعد</b><p>سيظهر هنا سجل الأحداث بعد ربط وحدات النظام وتفعيل سجل التدقيق.</p></div>
        </section>
        <section className="panel readiness-panel">
          <div className="panel-heading"><div><span className="panel-kicker">PLATFORM READINESS</span><h2>جاهزية المنظومة</h2></div></div>
          <div className="readiness-row"><span>واجهة الإدارة</span><b className="readiness-progress">هيكل أولي</b></div>
          <div className="readiness-row"><span>الخادم وقاعدة البيانات</span><b>قيد الإعداد</b></div>
          <div className="readiness-row"><span>المصادقة والصلاحيات</span><b>لم تبدأ</b></div>
          <div className="readiness-row"><span>التدفقات والوكلاء</span><b>لم تبدأ</b></div>
        </section>
      </div>
    </div>
    <div className="dashboard-bottom"><span>كل مؤشر سيُربط بمصدر بيانات واضح وفترة زمنية قابلة للمراجعة.</span><Link href="/reports">عرض بنية التقارير <b>↗</b></Link></div>
  </div>;
}
