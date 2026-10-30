import Link from "next/link";

const customerFields = [
  { label: "الاسم الكامل", detail: "customers.name · مطلوب" },
  { label: "البريد الإلكتروني", detail: "customers.email · مطلوب" },
  { label: "رقم الهاتف", detail: "customers.phone · اختياري" },
  { label: "الشركة", detail: "customers.company · اختياري" },
  { label: "الدولة", detail: "customers.country_code · اختياري" },
  { label: "حساب الدخول", detail: "customers.user_id · ربط اختياري بمستخدم" }
];

const customerSections = [
  { title: "البيانات الأساسية", description: "بيانات الاتصال والجهة المرتبطة بالعميل." },
  { title: "الطلبات وعروض الأسعار", description: "الطلبات المرتبطة بالعميل وإصدارات عروض الأسعار وقرارات القبول." },
  { title: "المشروعات والتسليم", description: "المشروعات والمهام والموافقات والملفات التي يملك العميل حق الوصول إليها." },
  { title: "التواصل والدعم", description: "سجل المراسلات والتذاكر والتصعيدات بعد إضافة وحدات الدعم." },
  { title: "سجل النشاط والتدقيق", description: "الأحداث المسموح بعرضها وفق صلاحية الموظف وسياسة الاحتفاظ." }
];

export default function CustomersPage() {
  return <div className="customers-page">
    <div className="page-heading">
      <div>
        <div className="eyebrow">CUSTOMER RELATIONSHIP <span>•</span> CUSTOMER RECORDS</div>
        <h1>إدارة العملاء</h1>
        <p>ملف موحد لكل عميل يربط بيانات الاتصال بالطلبات والعروض والمشروعات والتواصل.</p>
      </div>
      <div className="heading-status"><span className="status-led" /> قاعدة بيانات العملاء غير موصولة</div>
    </div>

    <section className="customer-foundation">
      <span className="customer-foundation-icon">◎</span>
      <div>
        <b>شاشة العملاء في مرحلة التأسيس — لا توجد سجلات فعلية معروضة</b>
        <p>نموذج البيانات الأولي موجود في Prisma، لكن لا توجد قاعدة بيانات موصولة أو مصادقة أو خدمة عملاء API. لذلك لا يمكن البحث أو إنشاء أو تعديل أو تصدير سجلات حاليًا.</p>
      </div>
      <span className="customer-foundation-tag">UNCONNECTED</span>
    </section>

    <section className="customer-kpis" aria-label="مؤشرات العملاء">
      {[
        ["إجمالي العملاء", "مصدره جدول customers"],
        ["عملاء لديهم حساب دخول", "ارتباط اختياري بجدول users"],
        ["عملاء لديهم طلبات", "مصدره service_requests"],
        ["عملاء جدد خلال الفترة", "يحتاج تحديد الفترة الزمنية"]
      ].map(([label, source], index) => <article className="customer-kpi" key={label}>
        <div><span>{label}</span><i>0{index + 1}</i></div>
        <strong>—</strong>
        <small>{source}</small>
      </article>)}
    </section>

    <section className="panel customer-directory">
      <div className="panel-heading">
        <div><span className="panel-kicker">CUSTOMER DIRECTORY</span><h2>دليل العملاء</h2></div>
        <span className="panel-count">بانتظار ربط قاعدة البيانات</span>
      </div>
      <div className="customer-toolbar">
        <label className="customer-search">⌕ <input type="search" disabled placeholder="البحث بالاسم أو البريد أو الهاتف" aria-label="البحث عن عميل" /></label>
        <select disabled aria-label="تصفية العملاء"><option>كل العملاء</option></select>
        <button type="button" className="customer-button" disabled>＋ إضافة عميل</button>
        <button type="button" className="customer-button secondary" disabled>تصدير</button>
      </div>
      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead><tr><th>العميل</th><th>الشركة</th><th>البريد الإلكتروني</th><th>الهاتف</th><th>تاريخ الإنشاء</th><th>حساب الدخول</th><th>الملف</th></tr></thead>
          <tbody><tr><td colSpan={7}>
            <div className="customer-empty">
              <span>◎</span>
              <b>لا توجد بيانات عملاء محمّلة</b>
              <p>سيظهر كل عميل هنا بعد ربط خدمة القراءة والتحقق من صلاحية المستخدم ونطاق الوصول.</p>
            </div>
          </td></tr></tbody>
        </table>
      </div>
      <div className="customer-table-footer"><span>لا توجد نتائج لأن مصدر البيانات غير متصل، وليس لأن عدد العملاء يساوي صفرًا.</span><span>— سجل</span></div>
    </section>

    <div className="customer-lower-grid">
      <section className="panel customer-profile">
        <div className="panel-heading"><div><span className="panel-kicker">CUSTOMER 360</span><h2>مكونات ملف العميل</h2></div><span className="panel-count">تصميم بنيوي</span></div>
        <div className="customer-field-list">
          {customerFields.map((field, index) => <div className="customer-field" key={field.label}>
            <span className="customer-field-index">0{index + 1}</span>
            <div><b>{field.label}</b><small>{field.detail}</small></div>
            <span className="customer-field-state">حقل مرجعي</span>
          </div>)}
        </div>
      </section>

      <section className="panel customer-activity">
        <div className="panel-heading"><div><span className="panel-kicker">CUSTOMER HISTORY</span><h2>أقسام سجل العميل</h2></div></div>
        <div className="customer-section-list">
          {customerSections.map((section, index) => <article className="customer-section-item" key={section.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><b>{section.title}</b><p>{section.description}</p></div>
          </article>)}
        </div>
      </section>
    </div>

    <section className="customer-policy">
      <div><b>ضوابط إدارة بيانات العملاء</b><p>لا يُسمح بتعديل البريد أو ربط حساب دخول أو دمج سجلين دون صلاحية خادمية وتسجيل سبب العملية في سجل التدقيق.</p></div>
      <Link href="/requests">الانتقال إلى دورة الطلبات <span>↗</span></Link>
    </section>
    <div className="dashboard-bottom"><span>مصدر نموذج البيانات: Prisma Customer / User / ServiceRequest.</span><Link href="/">العودة إلى مركز القيادة <b>↗</b></Link></div>
  </div>;
}
