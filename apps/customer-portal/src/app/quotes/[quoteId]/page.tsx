import Link from "next/link";

type PageProps = { params: Promise<{ quoteId: string }> };

export default async function CustomerQuotePage({ params }: PageProps) {
  const { quoteId } = await params;
  return <main className="portal-shell">
    <header className="portal-header">
      <Link href="/" className="portal-brand"><span className="portal-mark">A</span><span><b>ATSH <i>AI</i></b><small>CLIENT SPACE</small></span></Link>
      <div className="portal-header-right"><span className="portal-secure-dot" /> بوابة العميل <span className="portal-header-divider" /> <span>AR</span></div>
    </header>
    <div className="portal-breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><span>عروض الأسعار</span><span>/</span><b>مراجعة العرض</b></div>
    <section className="portal-welcome">
      <div><span className="portal-eyebrow">YOUR COMMERCIAL WORKSPACE</span><h1>مراجعة عرض السعر</h1><p>راجع تفاصيل العرض وشروطه قبل اتخاذ قرارك. ستظهر البيانات بعد التحقق من هويتك وصلاحية الوصول.</p></div>
      <div className="portal-doc-icon">▤<small>QUOTE</small></div>
    </section>
    <div className="portal-privacy-notice"><b>العرض غير متاح للعرض حاليًا</b><span>لم يتم تحميل بيانات إصدار من الخادم. معرّف الرابط وحده لا يمنح حق الوصول إلى عرض أو بيانات عميل. يلزم تسجيل الدخول والتحقق من ملكية العرض قبل إظهار التفاصيل.</span></div>
    <div className="portal-quote-layout">
      <div className="portal-main-column">
        <section className="portal-card">
          <div className="portal-card-heading"><div><small>QUOTE DETAILS</small><h2>بيانات العرض</h2></div><span className="portal-state">بانتظار التحقق</span></div>
          <div className="portal-detail-grid">
            <div><span>مرجع العرض</span><b dir="ltr">{quoteId}</b></div>
            <div><span>رقم الإصدار</span><b>—</b></div>
            <div><span>تاريخ الإصدار</span><b>—</b></div>
            <div><span>صالح حتى</span><b>—</b></div>
            <div><span>حالة العرض</span><b>غير متاحة</b></div>
            <div><span>العملة</span><b>—</b></div>
          </div>
        </section>
        <section className="portal-card">
          <div className="portal-card-heading"><div><small>ITEMIZED SCOPE</small><h2>الخدمات ونطاق العمل</h2></div></div>
          <div className="portal-empty"><span>▤</span><b>لا توجد بنود متاحة</b><p>ستظهر الخدمات والكميات والمخرجات والأسعار المعتمدة من إصدار العرض المحفوظ.</p></div>
        </section>
        <section className="portal-card">
          <div className="portal-card-heading"><div><small>TERMS & DELIVERY</small><h2>الشروط ومراحل التسليم</h2></div></div>
          <div className="portal-empty portal-empty-compact"><b>لم يتم تحميل الشروط</b><p>تظهر الشروط التجارية ومراحل التسليم من نسخة العرض نفسها لضمان تطابق ما تراجعه مع ما توافق عليه.</p></div>
        </section>
      </div>
      <aside className="portal-side-column">
        <section className="portal-card portal-total-card">
          <small className="portal-eyebrow">QUOTE SUMMARY</small><h2>ملخص القيمة</h2>
          <div className="portal-total-line"><span>الإجمالي الفرعي</span><b>—</b></div>
          <div className="portal-total-line"><span>الخصم</span><b>—</b></div>
          <div className="portal-total-line"><span>الضريبة</span><b>—</b></div>
          <div className="portal-total-final"><span>الإجمالي النهائي</span><b>—</b></div>
          <p>لا تُعرض قيمة مالية قبل التحقق من إصدار العرض ومصدر التسعير.</p>
        </section>
        <section className="portal-card portal-decision-card">
          <small className="portal-eyebrow">YOUR DECISION</small><h2>قرارك بشأن العرض</h2>
          <p>بعد تسجيل الدخول ومراجعة الإصدار، يمكنك إرسال قرارك وتسجيله على النسخة المحددة.</p>
          <button type="button" disabled>قبول عرض السعر</button>
          <button type="button" className="portal-reject" disabled>طلب تعديل / رفض العرض</button>
          <small className="portal-disabled-note">الإجراءات غير مفعّلة قبل اكتمال المصادقة والتوقيع الإلكتروني وسجل الموافقات.</small>
        </section>
        <section className="portal-help-card"><b>هل لديك استفسار؟</b><p>قنوات التواصل ستظهر هنا بعد ربط بيانات الدعم الرسمية.</p></section>
      </aside>
    </div>
    <footer className="portal-footer"><span>ATSH AI · Client Portal</span><span>مساحة آمنة لمتابعة خدماتك ومشروعاتك</span></footer>
  </main>;
}
