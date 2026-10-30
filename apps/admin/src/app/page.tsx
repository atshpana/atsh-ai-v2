export default function AdminHome() {
  return <main className="admin-shell">
    <aside className="sidebar"><div className="brand">ATSH <b>AI</b></div><div className="side-label">مساحة العمل</div><a className="active">مركز القيادة</a><a>العملاء</a><a>الطلبات والمبيعات</a><a>المشروعات والتنفيذ</a><a>فريق الذكاء الاصطناعي</a><a>الفريق والصلاحيات</a><a>الخدمات والتسعير</a><a>المالية</a><a>الإعدادات والأمان</a></aside>
    <section className="workspace"><header><div><small>ATSH AI / الإدارة</small><h1>مركز القيادة</h1></div><div className="owner">مساحة المالك <span>●</span></div></header>
      <div className="notice"><b>الهيكل التأسيسي</b><span>هذه واجهة أولية فقط. لا توجد بيانات تشغيل أو صلاحيات أو مؤشرات موصولة بعد.</span></div>
      <div className="welcome"><span>منظومة ATSH AI</span><h2>إدارة أعمالك من مركز واحد.</h2><p>سيتم بناء وحدات الإدارة تدريجيًا وربط كل شاشة بواجهات API وصلاحيات واختبارات فعلية.</p></div>
      <div className="tiles"><article><small>01 / العملاء</small><h3>إدارة علاقات العملاء</h3><p>ملفات العملاء وسجل التواصل والطلبات.</p></article><article><small>02 / التنفيذ</small><h3>المشروعات والمهام</h3><p>المراحل والاعتماديات والمراجعات.</p></article><article><small>03 / الذكاء الاصطناعي</small><h3>فريق AI</h3><p>الوكلاء والمهام والموافقات والتكلفة.</p></article></div>
    </section>
  </main>;
}
