"use client";

import { useMemo, useState } from "react";

type Locale = "ar" | "en";

const content = {
  ar: {
    nav: [{ label: "الرئيسية", href: "#home" }, { label: "الحلول", href: "#solutions" }, { label: "قدراتنا", href: "#capabilities" }, { label: "منهجية العمل", href: "#approach" }, { label: "الأسئلة الشائعة", href: "#faq" }],
    start: "ناقش مشروعك",
    explore: "استكشف الحلول",
    eyebrow: "هندسة رقمية · ذكاء اصطناعي · أتمتة",
    headline: "نبني التقنية التي",
    headlineAccent: "تحرّك أعمالك للأمام",
    intro: "من أول تصور للفكرة إلى منتج رقمي قابل للاستخدام والتطوير. نجمع التصميم والهندسة والأنظمة الذكية في مسار عمل واحد.",
    heroNote: "حلول مصممة حول احتياجك، لا قوالب مفروضة عليك.",
    proofLabel: "كيف نعمل",
    proofTitle: "من الاحتياج إلى حل قابل للتشغيل",
    proofText: "نبدأ بفهم طريقة عملك، ثم نحدد النطاق ونبني ونختبر قبل التسليم. لا نعرض نتائج أو أرقامًا غير موثقة.",
    steps: [{ n: "01", title: "نفهم", text: "نحلل الهدف والمستخدمين وسير العمل والقيود." }, { n: "02", title: "نخطط", text: "نحدد النطاق والمخرجات والأولويات قبل التنفيذ." }, { n: "03", title: "نبني ونختبر", text: "نطور الحل ونراجع الجودة والسلوك المتوقع." }, { n: "04", title: "نسلّم ونطوّر", text: "نراجع معك النسخة ونجهز التسليم والدعم المتفق عليه." }],
    solutionsKicker: "01 / WHAT WE BUILD",
    solutionsTitle: "حلول رقمية تبدأ من طبيعة عملك",
    solutionsIntro: "اختر نقطة البداية المناسبة؛ ويمكن تركيب أكثر من خدمة ضمن نطاق مشروع واحد بعد مراجعة المتطلبات.",
    services: [
      { n: "01", title: "المواقع والمنصات", text: "مواقع مؤسسية وتجارب ويب سريعة ومتجاوبة، بهيكل واضح وقابلة للتوسع.", tag: "WEB" },
      { n: "02", title: "المتاجر الإلكترونية", text: "متاجر رقمية، كتالوجات، رحلات شراء وإدارة محتوى المنتجات.", tag: "COMMERCE" },
      { n: "03", title: "تطبيقات الموبايل", text: "تطبيقات iOS وAndroid وتجارب مرتبطة بالخدمات والأنظمة.", tag: "MOBILE" },
      { n: "04", title: "الأنظمة المخصصة", text: "لوحات تشغيل وإدارة، بوابات داخلية، وأنظمة تلائم إجراءات مؤسستك.", tag: "SYSTEMS" },
      { n: "05", title: "الذكاء الاصطناعي", text: "مساعدون أذكياء، تكاملات AI، وتحليل محتوى وبيانات ضمن ضوابط واضحة.", tag: "AI" },
      { n: "06", title: "الأتمتة والتكامل", text: "ربط الأدوات والأنظمة وأتمتة الإجراءات المتكررة مع مسارات مراجعة بشرية.", tag: "AUTOMATION" }
    ],
    capabilitiesKicker: "02 / ENGINEERED AS A SYSTEM",
    capabilitiesTitle: "ليست واجهات منفصلة؛ منظومة مترابطة",
    capabilitiesIntro: "نصمم الحل على أساس مكوناته وتدفق بياناته وصلاحياته، حتى تكون التجربة مفهومة وقابلة للصيانة.",
    capabilities: [
      ["تجربة المستخدم", "رحلات واضحة، واجهات متجاوبة، ودعم العربية RTL والإنجليزية LTR عند الحاجة."],
      ["الهندسة والتكامل", "واجهات API، قواعد بيانات، وربط الخدمات وفق حدود ومسؤوليات محددة."],
      ["الذكاء والأتمتة", "وكلاء ومساعدون وتدفقات عمل مع إشراف وتصعيد عند الحاجة."],
      ["الأمان والحوكمة", "صلاحيات، مراجعات، سجلات تدقيق، وموافقات للعمليات الحساسة."]
    ],
    demoKicker: "03 / A CLEAR DELIVERY FLOW",
    demoTitle: "شاهد كيف ينتقل المشروع بين مراحله",
    demoIntro: "هذا نموذج توضيحي لطريقة تنظيم العمل، وليس عرضًا لنظام حي أو بيانات عميل.",
    flowTabs: ["تحليل المتطلبات", "خطة التنفيذ", "المراجعة والاختبار", "المعاينة والتسليم"],
    flowDescriptions: [
      "تجميع ملف المتطلبات، تحديد الأسئلة المفتوحة، وتوثيق النطاق والمخرجات المتوقعة.",
      "تقسيم النطاق إلى مراحل ومهام واعتماديات ومسؤوليات قابلة للمراجعة.",
      "مراجعة مستقلة للكود والسلوك، وتشغيل الاختبارات ومعالجة الملاحظات.",
      "إتاحة نسخة معاينة، تسجيل التعديلات، ثم اعتماد إصدار محدد قبل النشر المتفق عليه."
    ],
    flowFoot: "كل انتقال يعتمد على اكتمال متطلباته وموافقاته؛ ولا يُعد إنجاز الوكيل اعتمادًا نهائيًا.",
    approachKicker: "04 / OUR APPROACH",
    approachTitle: "وضوح قبل التنفيذ. ومراجعة قبل التسليم.",
    approachText: "نحدد ما الذي سيتم بناؤه، وما الذي يقع خارج النطاق، وكيف ستتم المراجعة والاعتماد. وإذا تغيرت المتطلبات، تُقيّم آثار التغيير قبل تنفيذه.",
    approachPoints: ["نطاق ومخرجات متفق عليها", "مراجعات واختبارات قبل المعاينة", "تعديلات موثقة مرتبطة بالملاحظات", "اعتماد صريح للإصدار النهائي"],
    faqKicker: "05 / FAQ",
    faqTitle: "أسئلة تساعدك على تحديد البداية",
    faqs: [
      ["هل يمكن الجمع بين أكثر من خدمة في مشروع واحد؟", "نعم، يمكن أن يجمع المشروع موقعًا أو متجرًا أو تطبيقًا أو نظامًا مخصصًا أو تكاملات ذكاء اصطناعي. يتم تحديد الترابط والنطاق بعد مراجعة الاحتياج."],
      ["هل السعر ثابت لكل مشروع؟", "ليس بالضرورة. بعض الخدمات يمكن تسعيرها وفق نطاق واضح، بينما تحتاج الأنظمة المخصصة والتكاملات إلى مراجعة المتطلبات وإعداد عرض مناسب."],
      ["كيف أتابع المشروع أثناء التنفيذ؟", "تُحدد آلية المتابعة والمعاينة والمراجعات ضمن طريقة إدارة المشروع المتفق عليها قبل بدء التنفيذ."],
      ["هل يمكن طلب تعديلات بعد المعاينة؟", "نعم، تُراجع الملاحظات مقابل النطاق المتفق عليه. ما يخالف النطاق يُقيّم كتغيير مستقل من حيث الأثر والوقت والتكلفة قبل اعتماده."]
    ],
    ctaKicker: "LET'S SHAPE THE RIGHT SOLUTION",
    ctaTitle: "ابدأ من التحدي الذي تريد حله.",
    ctaText: "شاركنا وصفًا أوليًا لاحتياجك، وسنحدد معك المسار الأنسب بعد مراجعة المتطلبات.",
    ctaButton: "استكشف الخدمات",
    footer: "حلول رقمية مصممة حول أعمالك.",
    location: "CAIRO · EVERYWHERE",
    backTop: "العودة للأعلى"
  },
  en: {
    nav: [{ label: "Home", href: "#home" }, { label: "Solutions", href: "#solutions" }, { label: "Capabilities", href: "#capabilities" }, { label: "Our approach", href: "#approach" }, { label: "FAQ", href: "#faq" }],
    start: "Discuss a project",
    explore: "Explore solutions",
    eyebrow: "DIGITAL ENGINEERING · AI · AUTOMATION",
    headline: "We build technology",
    headlineAccent: "that moves business forward",
    intro: "From the first idea to a usable, evolving digital product. We bring design, engineering and intelligent systems into one delivery path.",
    heroNote: "Solutions shaped around your needs, not imposed templates.",
    proofLabel: "HOW WE WORK",
    proofTitle: "From business need to a working solution",
    proofText: "We start by understanding your workflow, define the scope, then build and test before handover. We do not publish unverified results or metrics.",
    steps: [{ n: "01", title: "Discover", text: "Understand goals, users, workflows and constraints." }, { n: "02", title: "Plan", text: "Agree scope, deliverables and priorities before execution." }, { n: "03", title: "Build & test", text: "Develop the solution and review quality and expected behavior." }, { n: "04", title: "Handover & evolve", text: "Review the release and prepare the agreed handover and support." }],
    solutionsKicker: "01 / WHAT WE BUILD",
    solutionsTitle: "Digital solutions shaped around your business",
    solutionsIntro: "Choose a suitable starting point. Multiple services can be combined in one project after requirements review.",
    services: [
      { n: "01", title: "Websites & platforms", text: "Corporate websites and fast, responsive web experiences with clear, extensible structure.", tag: "WEB" },
      { n: "02", title: "E-commerce", text: "Online stores, catalogs, purchase journeys and product content operations.", tag: "COMMERCE" },
      { n: "03", title: "Mobile applications", text: "iOS and Android apps connected to your services and systems.", tag: "MOBILE" },
      { n: "04", title: "Custom systems", text: "Operational dashboards, internal portals and systems tailored to your processes.", tag: "SYSTEMS" },
      { n: "05", title: "Artificial intelligence", text: "AI assistants, integrations, and content or data analysis within clear controls.", tag: "AI" },
      { n: "06", title: "Automation & integration", text: "Connect tools and systems; automate repetitive processes with human review paths.", tag: "AUTOMATION" }
    ],
    capabilitiesKicker: "02 / ENGINEERED AS A SYSTEM",
    capabilitiesTitle: "Not disconnected interfaces. A connected system.",
    capabilitiesIntro: "We design around components, data flows and permissions so the result is understandable and maintainable.",
    capabilities: [
      ["User experience", "Clear journeys, responsive interfaces, and Arabic RTL / English LTR support when required."],
      ["Engineering & integration", "APIs, databases and service connections with defined boundaries and responsibilities."],
      ["AI & automation", "Agents, assistants and workflows with oversight and escalation when needed."],
      ["Security & governance", "Permissions, reviews, audit trails and approvals for sensitive operations."]
    ],
    demoKicker: "03 / A CLEAR DELIVERY FLOW",
    demoTitle: "See how a project moves through delivery",
    demoIntro: "This is an illustrative workflow model, not a live system demo or customer data.",
    flowTabs: ["Requirements", "Delivery plan", "Review & testing", "Preview & handover"],
    flowDescriptions: [
      "Collect the specification, identify open questions, and document scope and expected deliverables.",
      "Break scope into reviewable stages, tasks, dependencies and responsibilities.",
      "Run independent code and behavior reviews, execute tests and resolve findings.",
      "Share a preview, record revisions, then approve a specific release before agreed deployment."
    ],
    flowFoot: "Each transition depends on its required evidence and approvals; an agent's output is not final acceptance.",
    approachKicker: "04 / OUR APPROACH",
    approachTitle: "Clarity before execution. Review before handover.",
    approachText: "We define what will be built, what is out of scope, and how reviews and acceptance work. If requirements change, impact is assessed before implementation.",
    approachPoints: ["Agreed scope and deliverables", "Reviews and tests before preview", "Revisions linked to recorded feedback", "Explicit acceptance of the final release"],
    faqKicker: "05 / FAQ",
    faqTitle: "Questions to help define your starting point",
    faqs: [
      ["Can multiple services be combined in one project?", "Yes. A project may combine a website, store, app, custom system or AI integrations. Dependencies and scope are defined after reviewing the need."],
      ["Is every project fixed-price?", "Not necessarily. Some services can be priced against a clear scope, while custom systems and integrations require requirements review and a tailored proposal."],
      ["How do I follow progress during delivery?", "The project follow-up, preview and review method is agreed as part of the delivery approach before work begins."],
      ["Can I request changes after preview?", "Feedback is reviewed against the agreed scope. Out-of-scope work is assessed separately for impact, time and cost before approval."]
    ],
    ctaKicker: "LET'S SHAPE THE RIGHT SOLUTION",
    ctaTitle: "Start with the challenge you want to solve.",
    ctaText: "Share an initial description of your needs, and we can identify a suitable path after reviewing the requirements.",
    ctaButton: "Explore services",
    footer: "Digital solutions designed around your business.",
    location: "CAIRO · EVERYWHERE",
    backTop: "Back to top"
  }
} as const;

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [activeFlow, setActiveFlow] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const t = useMemo(() => content[locale], [locale]);
  const rtl = locale === "ar";

  return (
    <main className={rtl ? "site" : "site site-en"} dir={rtl ? "rtl" : "ltr"} lang={locale}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="ATSH AI home">
          <span className="brand-wordmark">ATSH <b>AI</b></span>
        </a>
        <nav className="nav-links" aria-label={rtl ? "التنقل الرئيسي" : "Main navigation"}>
          {t.nav.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <div className="top-actions">
          <button className="language" onClick={() => setLocale(rtl ? "en" : "ar")} aria-label={rtl ? "Switch to English" : "التبديل إلى العربية"}>
            {rtl ? "EN" : "عربي"} <span>↗</span>
          </button>
          <a className="button button-small" href="#contact">{t.start}<span>↗</span></a>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy-block">
          <div className="eyebrow"><span className="pulse" />{t.eyebrow}</div>
          <h1>{t.headline}<br /><span>{t.headlineAccent}</span><i>.</i></h1>
          <p className="hero-copy">{t.intro}</p>
          <div className="hero-actions">
            <a className="button" href="#contact">{t.start}<span>↗</span></a>
            <a className="text-link" href="#solutions">{t.explore}<span>↓</span></a>
          </div>
          <div className="hero-note"><span className="note-line" />{t.heroNote}</div>
        </div>
        <div className="hero-visual" aria-label="ATSH AI visual identity">
          <div className="hero-visual-frame">
            <div className="visual-topline"><span>ATSH AI / DIGITAL SYSTEMS</span><span>01 — 04</span></div>
            <div className="visual-monogram" aria-hidden="true"><span>ATSH</span><b>AI</b></div>
            <div className="visual-baseline"><span>DESIGN</span><span>ENGINEERING</span><span>INTELLIGENCE</span></div>
            <div className="visual-redlight" />
          </div>
          <div className="visual-caption"><span>01 / BUILT AROUND YOUR BUSINESS</span><span className="caption-status"><i /> SYSTEM THINKING</span></div>
        </div>
      </section>

      <section className="intro-band">
        <div><span className="section-kicker">{t.proofLabel}</span><h2>{t.proofTitle}</h2></div>
        <p>{t.proofText}</p>
      </section>

      <section className="process-section">
        <div className="process-grid">
          {t.steps.map((step) => <article className="process-step" key={step.n}>
            <span className="step-number">{step.n}</span><span className="step-rule" />
            <h3>{step.title}</h3><p>{step.text}</p>
          </article>)}
        </div>
      </section>

      <section className="solutions-section" id="solutions">
        <div className="section-heading">
          <div><span className="section-kicker">{t.solutionsKicker}</span><h2>{t.solutionsTitle}</h2></div>
          <p>{t.solutionsIntro}</p>
        </div>
        <div className="service-grid">
          {t.services.map((service) => <article className="service-card" key={service.n}>
            <div className="service-card-top"><span>{service.n}</span><span className="service-tag">{service.tag}</span></div>
            <div className="service-symbol" aria-hidden="true">{["⌘", "◈", "▧", "⌗", "✳", "⇄"][Number(service.n) - 1]}</div>
            <h3>{service.title}</h3><p>{service.text}</p><span className="card-arrow">↗</span>
          </article>)}
        </div>
      </section>

      <section className="capabilities-section" id="capabilities">
        <div className="capabilities-heading"><span className="section-kicker">{t.capabilitiesKicker}</span><h2>{t.capabilitiesTitle}</h2><p>{t.capabilitiesIntro}</p></div>
        <div className="capabilities-list">
          {t.capabilities.map(([title, description], index) => <article className="capability-row" key={title}>
            <span className="capability-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p><span className="capability-arrow">↗</span>
          </article>)}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <div><span className="section-kicker">{t.demoKicker}</span><h2>{t.demoTitle}</h2></div>
          <p>{t.demoIntro}</p>
        </div>
        <div className="workflow-demo">
          <div className="workflow-tabs" role="tablist" aria-label={rtl ? "مراحل سير العمل" : "Workflow stages"}>
            {t.flowTabs.map((tab, index) => <button className={activeFlow === index ? "workflow-tab active" : "workflow-tab"} key={tab} onClick={() => setActiveFlow(index)} role="tab" aria-selected={activeFlow === index}>
              <span>0{index + 1}</span>{tab}
            </button>)}
          </div>
          <div className="workflow-detail" role="tabpanel">
            <span className="workflow-detail-index">STAGE / 0{activeFlow + 1}</span>
            <div className="workflow-node"><span className="node-core">ATSH</span><span className="node-orbit" /></div>
            <p>{t.flowDescriptions[activeFlow]}</p>
            <div className="workflow-progress"><span style={{ width: ((activeFlow + 1) * 25) + "%" }} /></div>
            <div className="workflow-progress-label"><span>{t.flowTabs[activeFlow]}</span><span>0{activeFlow + 1} / 04</span></div>
          </div>
        </div>
        <p className="workflow-footnote"><span>i</span>{t.flowFoot}</p>
      </section>

      <section className="approach-section" id="approach">
        <div className="approach-main"><span className="section-kicker">{t.approachKicker}</span><h2>{t.approachTitle}</h2><p>{t.approachText}</p></div>
        <ul className="approach-points">{t.approachPoints.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-heading"><span className="section-kicker">{t.faqKicker}</span><h2>{t.faqTitle}</h2></div>
        <div className="faq-list">
          {t.faqs.map(([question, answer], index) => <article className={openFaq === index ? "faq-item faq-open" : "faq-item"} key={question}>
            <button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
              <span className="faq-number">0{index + 1}</span><strong>{question}</strong><span className="faq-toggle">{openFaq === index ? "−" : "+"}</span>
            </button>
            {openFaq === index && <p>{answer}</p>}
          </article>)}
        </div>
      </section>

      <section className="contact-strip" id="contact">
        <div><span className="section-kicker">{t.ctaKicker}</span><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p></div>
        <a className="button" href="#solutions">{t.ctaButton}<span>↗</span></a>
      </section>
      <footer className="footer"><a className="footer-brand" href="#home">ATSH <b>AI</b></a><span>© {new Date().getFullYear()} ATSH AI</span><span>{t.footer}</span><a href="#home">{t.backTop} ↑</a><span>{t.location}</span></footer>
    </main>
  );
}
