import Link from "next/link";

type PageProps = { params: Promise<{ requestId: string; quoteId: string }> };

const approvalChecks = [
  ["نطاق العمل", "مطابقة البنود مع نطاق الطلب والمخرجات المتفق عليها."],
  ["التسعير", "التحقق من مصدر السعر والعملة والخصومات والضرائب المعتمدة."],
  ["الشروط", "مراجعة الصلاحية والشروط التجارية ومراحل التسليم."],
  ["الصلاحيات", "التحقق من هوية المراجع وصلاحية الاعتماد وتسجيل التدقيق."],
];

export default async function QuoteReviewPage({ params }: PageProps) {
  const { requestId, quoteId } = await params;
  return <div className="quote-editor-page">
    <Link href={`/requests/${encodeURIComponent(requestId)}/quotes/new`} className="request-detail-back">↩ العودة إلى مساحة إعداد العرض</Link>
    <div className="page-heading quote-editor-heading">
      <div>
        <div className="eyebrow">SALES OPERATIONS <span>•</span> QUOTE REVIEW</div>
        <h1>مراجعة واعتماد عرض السعر</h1>
        <p>مراجعة إصدار محدد قبل السماح بإرساله إلى العميل أو تسجيل قبوله.</p>
      </div>
      <div className="heading-status"><span className="status-led" /> لا توجد بيانات إصدار متصلة</div>
    </div>
    <div className="quote-editor-alert">
      <b>لم يتم تحميل عرض السعر</b>
      <span>معرّف العرض في عنوان الصفحة ليس إثباتًا لوجود سجل أو صلاحية الوصول إليه. يجب على الخادم التحقق من الطلب والعرض وملكيتهما وصلاحيات المستخدم قبل إظهار أي بيانات.</span>
    </div>
    <div className="quote-editor-layout">
      <main className="quote-editor-main">
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">QUOTE VERSION SNAPSHOT</span><h2>ملخص الإصدار</h2></div><small>Immutable after sent</small></div>
          <div className="quote-field-grid">
            <label>معرّف الطلب<input value={requestId} readOnly dir="ltr" /></label>
            <label>معرّف العرض<input value={quoteId} readOnly dir="ltr" /></label>
            <label>رقم الإصدار<input value="يُقرأ من سجل العرض" readOnly /></label>
            <label>الحالة<input value="غير معروفة — لم يتم التحميل" readOnly /></label>
            <label>العملة<input value="تُقرأ من إصدار العرض" readOnly /></label>
            <label>الصلاحية<input value="تُقرأ من إصدار العرض" readOnly /></label>
          </div>
        </section>
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">CUSTOMER PREVIEW</span><h2>معاينة العميل</h2></div><small>Read-only presentation</small></div>
          <div className="quote-preview-paper">
            <div className="quote-preview-brand"><b>ATSH AI</b><span>عرض سعر — معاينة غير متاحة</span></div>
            <div className="request-detail-empty"><b>لا توجد بيانات للمعاينة</b>ستُعرض هنا نسخة مطابقة لما سيراه العميل، من بيانات الإصدار المحفوظة فقط، دون إظهار الملاحظات الداخلية أو بيانات تشغيلية غير مخصصة له.</div>
            <div className="quote-preview-foot">نسخة العميل يجب أن تكون مرتبطة بإصدار ثابت ومحدد.</div>
          </div>
        </section>
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">APPROVAL CHECKLIST</span><h2>قائمة المراجعة والاعتماد</h2></div><small>Human approval required</small></div>
          <div className="request-gate-list">
            {approvalChecks.map(([title,detail],i)=><div className="request-gate" key={title}><span className="request-gate-mark">{String(i+1).padStart(2,"0")}</span><div><b>{title}</b><small>{detail}</small></div><span className="quote-check-pending">بانتظار التحقق</span></div>)}
          </div>
        </section>
      </main>
      <aside className="quote-editor-side">
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">VERSION HISTORY</span><h2>سجل الإصدارات</h2></div></div>
          <div className="request-detail-empty"><b>لا يوجد سجل محمّل</b>كل تعديل تجاري يجب أن ينشئ إصدارًا جديدًا مع الاحتفاظ بالإصدارات السابقة وسجل منشئها وتوقيتها.</div>
        </section>
        <section className="request-detail-card quote-section">
          <div className="request-detail-card-head"><div><span className="panel-kicker">LIFECYCLE CONTROLS</span><h2>إجراءات الإصدار</h2></div></div>
          <div className="request-detail-actions">
            <button type="button" disabled>إرجاع للتعديل</button>
            <button type="button" disabled>اعتماد داخلي</button>
            <button type="button" disabled>إرسال للعميل</button>
            <button type="button" disabled>تسجيل قبول العميل</button>
          </div>
          <p className="request-detail-empty">الإجراءات لا تعمل قبل وجود API آمن، وفحص انتقال الحالة، وتحقق الصلاحيات، وسجل تدقيق، وإثبات قبول موثوق.</p>
        </section>
      </aside>
    </div>
    <div className="dashboard-bottom"><span>مرجع البيانات: Quote · QuoteItem · QuoteAcceptance · AuditEvent.</span><Link href={`/requests/${encodeURIComponent(requestId)}`}>العودة إلى الطلب <b>↗</b></Link></div>
  </div>;
}
