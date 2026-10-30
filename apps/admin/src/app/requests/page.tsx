import Link from "next/link";

const lifecycle = [
  { key: "01", title: "استلام الطلب", detail: "submitted" },
  { key: "02", title: "المراجعة الأولية", detail: "under_review" },
  { key: "03", title: "استكمال المعلومات", detail: "awaiting_customer" },
  { key: "04", title: "إعداد العرض", detail: "quoted" },
  { key: "05", title: "القبول والتعاقد", detail: "accepted" },
  { key: "06", title: "الدفع والتنفيذ", detail: "paid / in_progress" }
];

const queueMetrics = [
  { title: "إجمالي الطلبات", note: "كل الطلبات المسجلة" },
  { title: "بانتظار المراجعة", note: "تحتاج فحصًا أوليًا" },
  { title: "عروض سعر مفتوحة", note: "تحتاج متابعة العميل" },
  { title: "طلبات تحتاج معلومات", note: "بانتظار رد العميل" }
];

export default function RequestsPage() {
  return <div className="requests-page">
    <div className="page-heading">
      <div>
        <div className="eyebrow">SALES OPERATIONS <span>•</span> REQUEST INTAKE</div>
        <h1>الطلبات والمبيعات</h1>
        <p>مراجعة طلبات العملاء وإدارة دورة عرض السعر والقبول قبل تحويل الطلب إلى مشروع.</p>
      </div>
      <div className="heading-status"><span className="status-led" /> مصدر الطلبات غير موصول</div>
    </div>

    <section className="request-notice">
      <span className="request-notice-icon">!</span>
      <div><b>قائمة الطلبات لم تُربط بقاعدة البيانات بعد</b><p>لن نعرض سجلات تجريبية أو أرقامًا افتراضية. هذه الشاشة تجهز بنية المراجعة ومسار العمل، وستظهر الطلبات الفعلية بعد تنفيذ المصادقة وواجهات API.</p></div>
    </section>

    <section className="request-kpis">
      {queueMetrics.map((metric, index) => <article className="request-kpi" key={metric.title}>
        <div className="request-kpi-top"><span>{metric.title}</span><i>0{index + 1}</i></div>
        <strong>—</strong>
        <small>{metric.note}</small>
      </article>)}
    </section>

    <section className="panel request-queue-panel">
      <div className="panel-heading">
        <div><span className="panel-kicker">REQUEST INBOX</span><h2>صندوق الطلبات</h2></div>
        <span className="panel-count">بانتظار ربط البيانات</span>
      </div>
      <div className="request-table-wrap">
        <table className="request-table">
          <thead><tr><th>رقم الطلب</th><th>العميل</th><th>الخدمة المطلوبة</th><th>الحالة</th><th>تاريخ الاستلام</th><th>القيمة</th></tr></thead>
          <tbody><tr><td colSpan={6}>
            <div className="request-empty">
              <span className="request-empty-icon">▤</span>
              <b>لا توجد سجلات معروضة</b>
              <p>سيتم تحميل الطلبات من الخادم بعد إكمال الهوية والصلاحيات وخدمة الطلبات.</p>
            </div>
          </td></tr></tbody>
        </table>
      </div>
      <div className="request-table-foot"><span>الترتيب والفلاتر والتصدير ستُفعّل حسب صلاحية المستخدم ومصدر البيانات.</span><span>0 سجل معروض</span></div>
    </section>

    <div className="request-lower-grid">
      <section className="panel request-lifecycle-panel">
        <div className="panel-heading"><div><span className="panel-kicker">CONTROLLED LIFECYCLE</span><h2>مسار الطلب المعتمد</h2></div><span className="panel-count">انتقالات خادمية</span></div>
        <div className="request-lifecycle">
          {lifecycle.map((step, index) => <div className="request-lifecycle-step" key={step.key}>
            <span className="request-step-number">{step.key}</span>
            <div><b>{step.title}</b><small>{step.detail}</small></div>
            {index < lifecycle.length - 1 && <span className="request-step-arrow">←</span>}
          </div>)}
        </div>
        <p className="request-policy-note">لا يغيّر الموظف الحالة مباشرة؛ يتحقق الخادم من الانتقال والصلاحية ويسجل الحدث وسجل التدقيق.</p>
      </section>

      <section className="panel request-review-panel">
        <div className="panel-heading"><div><span className="panel-kicker">REVIEW CHECKLIST</span><h2>ضوابط مراجعة الطلب</h2></div></div>
        <ul className="request-checklist">
          <li>مراجعة المواصفات والمرفقات والبيانات اللازمة فقط.</li>
          <li>الحفاظ على نسخة الطلب ولقطة السعر الأصلية دون تعديل.</li>
          <li>طلب معلومات إضافية مع تسجيل الرسالة والسبب.</li>
          <li>إنشاء إصدار جديد عند تعديل عرض السعر.</li>
          <li>عدم تحويل الطلب إلى تنفيذ قبل بوابات القبول والتعاقد والدفع المعتمدة.</li>
        </ul>
        <Link href="/catalog" className="request-related-link">إدارة الخدمات والباقات والتسعير <span>↗</span></Link>
      </section>
    </div>
    <div className="dashboard-bottom"><span>المتطلبات المرجعية: ADM-10 وADM-11 وتدفق مراجعة الطلبات.</span><Link href="/">العودة إلى مركز القيادة <b>↗</b></Link></div>
  </div>;
}
