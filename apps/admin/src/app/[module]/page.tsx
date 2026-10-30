import Link from "next/link";
import { notFound } from "next/navigation";

const modules: Record<string, { title: string; eyebrow: string; description: string; scope: string[] }> = {
  customers: { title: "العملاء", eyebrow: "CUSTOMER MANAGEMENT", description: "ملفات العملاء والجهات وسجل الطلبات والتواصل والموافقات، مع عزل كامل لبيانات كل عميل.", scope: ["ملفات العملاء والجهات", "سجل الطلبات والمشروعات", "وسائل التواصل والموافقات"] },
  requests: { title: "الطلبات والمبيعات", eyebrow: "SALES & INTAKE", description: "استقبال طلبات الخدمات ومراجعتها وطلب المعلومات وإدارة عروض الأسعار والإصدارات.", scope: ["قائمة الطلبات والفلاتر", "مراجعة المواصفات والمرفقات", "عروض الأسعار وسجل الحالات"] },
  projects: { title: "المشروعات والتنفيذ", eyebrow: "PROJECT DELIVERY", description: "إدارة الخطط والمراحل والمهام والاعتماديات والمراجعات والتسليم عبر بوابات محمية.", scope: ["قوالب وخطط المشروعات", "المراحل والمهام والإسناد", "المراجعة والاعتماد والتسليم"] },
  portal: { title: "بوابة العملاء", eyebrow: "CUSTOMER PORTAL", description: "تجربة موحدة للعميل لإدارة طلباته ومشروعاته وملفاته وموافقاته ووحدات المنتج المتعاقد عليها.", scope: ["حساب موحد وملف العميل", "متابعة المشروع والملفات", "المراجعات والموافقات"] },
  support: { title: "الدعم وخدمة العملاء", eyebrow: "CUSTOMER SUPPORT", description: "إدارة طلبات الدعم والتواصل والتصعيد وسجل الخدمة مع إظهار المعلومات الضرورية فقط.", scope: ["تذاكر الدعم والحالات", "المراسلات والتصعيد", "قوالب الإشعارات وسجل التسليم"] },
  workflows: { title: "سير العمل والأتمتة", eyebrow: "WORKFLOW ORCHESTRATION", description: "تعريف التدفقات ومتابعة تنفيذها وربط n8n بالأحداث الموثوقة في النظام.", scope: ["قوالب التدفقات وإصداراتها", "حالات التنفيذ وإعادة المحاولة", "Webhooks موقعة وسجل الأحداث"] },
  "ai-team": { title: "فريق الذكاء الاصطناعي", eyebrow: "AI WORKFORCE", description: "مدير AI مركزي ينسق وكلاء متخصصين بصلاحيات وأدوات وميزانيات ومراجعة مستقلة.", scope: ["مدير AI وسجل الوكلاء", "المهام والتشغيل والتكلفة", "المراجعة والتصعيد والموافقات"] },
  team: { title: "الفريق والصلاحيات", eyebrow: "TEAM & ACCESS CONTROL", description: "إدارة الموظفين والأدوار المخصصة والصلاحيات الدقيقة والإسناد والتفويض المؤقت.", scope: ["الموظفون والفرق", "الأدوار والصلاحيات", "الإسناد والتفويض وسجل التدقيق"] },
  catalog: { title: "الخدمات والباقات والتسعير", eyebrow: "CATALOG & PRICING", description: "إدارة الخدمات والباقات والخيارات وقواعد التسعير وإصداراتها واختبار الحساب قبل التفعيل.", scope: ["التصنيفات والخدمات والباقات", "الخيارات وقواعد الظهور", "التسعير والإصدارات والاختبارات"] },
  hosting: { title: "الاستضافة والنطاقات", eyebrow: "HOSTING OPERATIONS", description: "إدارة حسابات الاستضافة وتخصيصات العملاء والنطاقات والتجديدات والنسخ الاحتياطية.", scope: ["حسابات ومخصصات الاستضافة", "النطاقات والتجديدات", "النسخ الاحتياطي والحالة التشغيلية"] },
  finance: { title: "المالية", eyebrow: "FINANCE", description: "الفواتير والمدفوعات والتسويات والتقارير المالية وفق السياسات التجارية التي يعتمدها المالك.", scope: ["الفواتير وبنودها", "المدفوعات والتسويات", "التقارير وسجل الاعتماد"] },
  website: { title: "الموقع والمحتوى والتصميم", eyebrow: "CONTENT & EXPERIENCE", description: "إدارة الصفحات والمحتوى والترجمات والهوية ورموز التصميم والمعاينة والنشر والإصدارات.", scope: ["الصفحات والمحتوى وSEO", "الهوية والثيمات ورموز التصميم", "المعاينة والنشر والتراجع"] },
  reports: { title: "التقارير", eyebrow: "REPORTING & ANALYTICS", description: "تقارير تشغيلية ومالية من مصادر بيانات معروفة مع تحديد الفترة والصلاحيات ومصدر كل مؤشر.", scope: ["تقارير العملاء والطلبات والمشروعات", "تقارير الأداء والتكلفة", "تصدير مقيد ومسجل"] },
  settings: { title: "الإعدادات والأمان", eyebrow: "SYSTEM GOVERNANCE", description: "إعدادات النظام والتكاملات وسياسات الأمان والنسخ والاستعادة وسجل التغييرات.", scope: ["الإعدادات العامة والتكاملات", "الأمان والجلسات والصلاحيات", "النسخ والاستعادة والتدقيق"] },
  notifications: { title: "مركز التنبيهات", eyebrow: "NOTIFICATION CENTER", description: "مركز موحد للتنبيهات حسب القسم والخطورة مع الحفاظ على التنبيهات الأمنية والقرارات الإلزامية.", scope: ["التنبيهات حسب الخطورة والقسم", "قوالب الرسائل وسجل الإرسال", "إعادة المحاولة ومنع التكرار"] }
};

export function generateStaticParams() {
  return Object.keys(modules).map((module) => ({ module }));
}

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const item = modules[module];
  if (!item) notFound();

  return <div className="module-page">
    <div className="page-heading"><div><div className="eyebrow">{item.eyebrow}</div><h1>{item.title}</h1><p>{item.description}</p></div><span className="heading-status"><span className="status-led" /> وحدة غير موصولة</span></div>
    <section className="foundation-banner"><div className="banner-symbol">◈</div><div><b>تم تعريف نطاق الوحدة</b><p>هذه صفحة تأسيسية. لن تظهر بيانات وهمية؛ سيتم توصيل الوظائف والبيانات والصلاحيات بعد إكمال تصميم الوحدة واختبارها.</p></div><span className="banner-tag">PLANNED</span></section>
    <section className="panel module-scope"><div className="panel-heading"><div><span className="panel-kicker">MODULE SCOPE</span><h2>النطاق الوظيفي</h2></div><span className="panel-count">{item.scope.length} عناصر</span></div>
      <div className="scope-grid">{item.scope.map((scope, i) => <div className="scope-item" key={scope}><span>0{i + 1}</span><b>{scope}</b><small>بانتظار التصميم التفصيلي والتنفيذ</small></div>)}</div>
    </section>
    <Link href="/" className="back-link">← العودة إلى مركز القيادة</Link>
  </div>;
}
