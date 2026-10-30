import Link from "next/link";

type PageProps = { params: Promise<{ requestId: string }> };

const sections = [
  ["بيانات العرض", "العملة ومدة الصلاحية والمرجع تُحمّل من الطلب وإعدادات الشركة بعد ربط API."],
  ["بنود عرض السعر", "كل بند يحمل وصفًا وكمية وسعر وحدة وإجماليًا محفوظًا ضمن إصدار العرض."],
  ["الضرائب والخصومات", "تُطبق وفق سياسة مالية معتمدة؛ لا توجد نسبة افتراضية أو عملية حساب محلية."],
  ["الشروط ومراحل التسليم", "تُضاف الشروط التجارية ونطاق العمل ومراحل التسليم من قوالب معتمدة."],
];

export default async function NewQuotePage({ params }: PageProps) {
  const { requestId } = await params;
  return <div className="quote-editor-page">
    <Link href={`/requests/${encodeURIComponent(requestId)}`} className="request-detail-back">↩ العودة إلى مراجعة الطلب</Link>
    <div className="page-heading quote-editor-heading">
      <div>
        <div className="eyebrow">SALES OPERATIONS <span>•</span> QUOTE WORKSPACE</div>
        <h1>إعداد عرض سعر</h1>
        <p>مساحة إعداد ومراجعة إصدار جديد مرتبط بطلب الخدمة، مع الاحتفاظ بكل إصدار سابق.</p>
      </div>
      <div className="heading-status"><span className="status-led" /> وضع التصميم — غير متصل</div>
    </div>

    <div className="quote-editor-alert">
      <b>لا يمكن إنشاء عرض فعلي الآن</b>
      <span>هذه واجهة تأسيسية فقط. لا توجد بيانات طلب محمّلة أو أسعار قابلة للاعتماد، كما أن الحفظ والإرسال والاعتماد تتطلب API ومصادقة وصلاحيات وتسجيل تدقيق.</span>
    </div>

    <div className="quote-editor-layout">
      <main className="quote-editor-main">
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">QUOTE IDENTITY</span><h2>بيانات الإصدار</h2></div><small>نسخة مستقلة غير قابلة للاستبدال</small></div>
          <div className="quote-field-grid">
            <label>الطلب المرتبط<input value={requestId} readOnly dir="ltr" /></label>
            <label>رقم الإصدار<input value="يُخصص عند الحفظ الخادمي" readOnly /></label>
            <label>العملة<input value="تُحدد من الطلب وسياسة الشركة" readOnly /></label>
            <label>حالة العرض<input value="Draft — غير منشأ" readOnly /></label>
            <label>تاريخ الإصدار<input value="يُحدد عند الإنشاء" readOnly /></label>
            <label>تاريخ انتهاء الصلاحية<input value="يُحدد وفق سياسة الصلاحية" readOnly /></label>
          </div>
        </section>

        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">QUOTE LINE ITEMS</span><h2>بنود عرض السعر</h2></div><small>QuoteItem</small></div>
          <div className="quote-items-table-wrap"><table className="quote-items-table">
            <thead><tr><th>وصف البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
            <tbody><tr><td colSpan={4}><div className="request-detail-empty"><b>لا توجد بنود محمّلة</b>تُنشأ البنود من نطاق العمل الذي تمت مراجعته، ولا تُنسخ أسعار لقطة الطلب تلقائيًا باعتبارها عرضًا جديدًا.</div></td></tr></tbody>
          </table></div>
          <div className="quote-disabled-row"><button type="button" disabled>＋ إضافة بند</button><span>يتطلب كتالوجًا معتمدًا وصلاحية تعديل العرض.</span></div>
        </section>

        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">COMMERCIAL TERMS</span><h2>الملخص المالي والشروط</h2></div></div>
          <div className="quote-summary-grid">
            {["الإجمالي الفرعي","الخصم","الضريبة","الإجمالي النهائي"].map((label)=><div className="quote-summary-cell" key={label}><span>{label}</span><b>—</b><small>يُحسب ويُحفظ خادميًا</small></div>)}
          </div>
          <div className="quote-field-grid quote-terms">
            <label>الشروط التجارية<textarea readOnly value="تُحمّل من قالب الشروط المعتمد — لا يوجد نص افتراضي." /></label>
            <label>مراحل التسليم<textarea readOnly value="تُحدد بعد اعتماد نطاق العمل وخطة التسليم." /></label>
          </div>
        </section>
      </main>

      <aside className="quote-editor-side">
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">VERSION CONTROL</span><h2>حوكمة الإصدارات</h2></div></div>
          <div className="request-gate-list">
            {[
              ["إنشاء إصدار جديد","رقم إصدار مستقل لكل تعديل تجاري."],
              ["مراجعة داخلية","اعتماد البنود والأسعار والشروط."],
              ["إرسال للعميل","إرسال موثق بعد اجتياز الصلاحيات."],
              ["قبول العميل","تسجيل الإصدار المقبول ودليل الموافقة."],
            ].map(([title,detail],i)=><div className="request-gate" key={title}><span className="request-gate-mark">{String(i+1).padStart(2,"0")}</span><div><b>{title}</b><small>{detail}</small></div></div>)}
          </div>
        </section>
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">CONTROLLED ACTIONS</span><h2>إجراءات العرض</h2></div></div>
          <div className="request-detail-actions">
            <button type="button" disabled>حفظ كمسودة</button>
            <button type="button" disabled>إرسال للمراجعة الداخلية</button>
            <button type="button" disabled>اعتماد وإرسال للعميل</button>
          </div>
          <p className="request-detail-empty">جميع الإجراءات معطلة حتى اكتمال API والمصادقة والصلاحيات وسجل التدقيق.</p>
        </section>
      </aside>
    </div>
    <div className="dashboard-bottom"><span>نموذج البيانات المرجعي: Quote · QuoteItem · QuoteAcceptance.</span><Link href={`/requests/${encodeURIComponent(requestId)}`}>تفاصيل الطلب <b>↗</b></Link></div>
  </div>;
}
