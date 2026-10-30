import Link from "next/link";

type PageProps = { params: Promise<{ requestId: string }> };

export default async function RequestDetailPage({ params }: PageProps) {
  const { requestId } = await params;

  return <div className="request-detail-page">
    <Link href="/requests" className="request-detail-back">↩ العودة إلى صندوق الطلبات</Link>
    <div className="page-heading">
      <div>
        <div className="eyebrow">SALES OPERATIONS <span>•</span> REQUEST REVIEW</div>
        <h1>مراجعة تفاصيل الطلب</h1>
        <p>فحص بيانات الطلب ولقطته المالية وسجل مراجعته، ثم إعداد عرض سعر مستقل عند توفر الخدمة والصلاحية.</p>
      </div>
      <div className="heading-status"><span className="status-led" /> لا توجد بيانات طلب متصلة</div>
    </div>

    <div className="request-detail-warning">
      هذه صفحة تفاصيل مرتبطة بمعرّف المسار <b dir="ltr">{requestId}</b> فقط. لم يتم جلب سجل من قاعدة البيانات؛ لا تعتبر قيمة المسار إثباتًا لوجود الطلب أو صلاحية الوصول إليه.
    </div>

    <div className="request-detail-grid">
      <div className="request-detail-main">
        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">REQUEST OVERVIEW</span><h2>ملخص الطلب</h2></div><small>ADM-11 · Request detail</small></div>
          <div className="request-detail-fields">
            {[
              ["المرجع العام","يُحمّل من الخادم"],
              ["حالة الطلب","غير متاحة — API غير متصل"],
              ["تاريخ الاستلام","—"],
              ["مسؤول المتابعة","—"],
              ["اسم جهة التواصل","بيانات محمية حتى التحقق من الصلاحية"],
              ["البريد الإلكتروني","بيانات محمية حتى التحقق من الصلاحية"],
              ["رقم الهاتف","بيانات محمية حتى التحقق من الصلاحية"],
              ["العميل المرتبط","يُحدد من علاقة customerId الخادمية"]
            ].map(([label,value])=><div className="request-detail-field" key={label}><span>{label}</span><b className="request-detail-placeholder">{value}</b></div>)}
          </div>
        </section>

        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">IMMUTABLE REQUEST SNAPSHOT</span><h2>تفاصيل الخدمات واللقطة المالية الأصلية</h2></div><small>لا تُعدّل بعد الإرسال</small></div>
          <div className="request-snapshot-wrap"><table className="request-snapshot-table">
            <thead><tr><th>الخدمة / البند</th><th>الخيارات</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
            <tbody><tr><td colSpan={5}><div className="request-detail-empty"><b>لم يتم تحميل لقطة الطلب</b>سيتم عرض أسماء الخدمات والخيارات والأسعار المحفوظة وقت الإرسال دون إعادة حساب أو تعديل بيانات الطلب الأصلية.</div></td></tr></tbody>
          </table></div>
          <div className="request-detail-fields" style={{marginTop:12}}>
            {[["الإجمالي الفرعي","—"],["الخصم","—"],["الضريبة","—"],["الإجمالي النهائي","—"],["العملة","—"],["نسخة قواعد التسعير","—"]].map(([label,value])=><div className="request-detail-field" key={label}><span>{label}</span><b className="request-detail-placeholder">{value}</b></div>)}
          </div>
        </section>

        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">QUOTE VERSIONS</span><h2>إصدارات عروض الأسعار</h2></div><small>سجل غير قابل للاستبدال الصامت</small></div>
          <div className="request-detail-empty"><b>لا توجد إصدارات محمّلة</b>كل عرض جديد يجب أن يُنشأ كإصدار مستقل مع البنود والأسعار والشروط ومدة الصلاحية، مع الاحتفاظ بالإصدارات السابقة.</div>
          <div className="request-version-list">
            <div className="request-version"><div><b>الإصدار الأول</b><small>سيظهر بعد إنشاء عرض سعر محفوظ من الخادم</small></div><span className="request-version-state">غير منشأ</span></div>
          </div>
        </section>

        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">EVENT TIMELINE</span><h2>سجل الأحداث والمراجعة</h2></div><small>Actor · Time · Evidence</small></div>
          <div className="request-detail-empty"><b>سجل الأحداث غير متصل</b>يجب تسجيل كل انتقال حالة أو طلب معلومات أو إرسال عرض أو قبول مع الفاعل والتوقيت والدليل المرتبط.</div>
        </section>
      </div>

      <aside className="request-detail-side">
        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">REVIEW WORKSPACE</span><h2>قائمة المراجعة</h2></div></div>
          <div className="request-gate-list">
            {[
              ["التحقق من هوية وصلاحية المراجع","يُنفذ خادميًا قبل قراءة أي بيانات."],
              ["فحص اكتمال بيانات التواصل","لا تعرض بيانات العميل قبل نجاح التفويض."],
              ["مراجعة نطاق الخدمة والخيارات","تحقق من النسخة التي أرسلها العميل."],
              ["مراجعة لقطة السعر الأصلية","لا تستبدل السعر الأصلي بحساب حالي."],
              ["تحديد الحاجة لمعلومات إضافية","سجّل الطلب والسبب وانتظر رد العميل."],
              ["إعداد عرض سعر جديد","إصدار مستقل ومراجعة واعتماد وفق الصلاحيات."]
            ].map(([title,detail])=><div className="request-gate" key={title}><span className="request-gate-mark">·</span><div><b>{title}</b><small>{detail}</small></div></div>)}
          </div>
        </section>

        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">CONTROLLED ACTIONS</span><h2>إجراءات المراجع</h2></div></div>
          <div className="request-detail-actions">
            <button type="button" disabled>إضافة ملاحظة داخلية</button>
            <button type="button" disabled>طلب معلومات من العميل</button>
            <button type="button" disabled>إنشاء عرض سعر</button>
            <button type="button" disabled>تغيير حالة الطلب</button>
          </div>
          <p className="request-detail-empty">الإجراءات معطلة حتى اكتمال المصادقة وواجهات API والتحقق من صلاحيات الانتقال وتسجيل التدقيق.</p>
        </section>

        <section className="request-detail-card">
          <div className="request-detail-card-head"><div><span className="panel-kicker">LIFECYCLE GATES</span><h2>بوابات الانتقال</h2></div></div>
          <div className="request-gate-list">
            {[
              ["طلب مستلم","submitted"],
              ["مراجعة أولية","under_review"],
              ["معلومات إضافية","needs_information"],
              ["عرض سعر مرسل","quote_sent"],
              ["قبول العميل","accepted"],
              ["تحويل إلى مشروع","converted"]
            ].map(([title,key],index)=><div className="request-gate" key={key}><span className="request-gate-mark">{String(index+1).padStart(2,"0")}</span><div><b>{title}</b><small dir="ltr">{key}</small></div></div>)}
          </div>
        </section>
      </aside>
    </div>
    <div className="dashboard-bottom"><span>مرجع التدفق: Administration request-review flow · Executive Reference v2.0.</span><Link href="/requests">صندوق الطلبات <b>↗</b></Link></div>
  </div>;
}
