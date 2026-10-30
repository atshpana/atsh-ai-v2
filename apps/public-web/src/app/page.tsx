"use client";

import { useMemo, useState } from "react";

const copy = {
  ar: {
    nav: ["الرئيسية", "خدماتنا", "حلولنا", "من نحن"],
    start: "ابدأ مشروعك",
    explore: "استكشف خدماتنا",
    eyebrow: "نبني المستقبل الرقمي",
    title: "حوّل فكرتك إلى",
    accent: "حل رقمي حقيقي",
    body: "من المواقع والتطبيقات إلى الأنظمة الذكية والأتمتة — نصمم ونبني حلولًا عملية تنمو مع أعمالك.",
    servicesTitle: "حلول رقمية تبدأ من احتياجك",
    servicesBody: "فريق واحد يجمع التصميم والهندسة والذكاء الاصطناعي لتقديم تجربة متكاملة.",
    services: [
      ["01", "المواقع والمنصات", "مواقع احترافية وتجارب رقمية سريعة ومتجاوبة."],
      ["02", "المتاجر الإلكترونية", "تجارب تجارة إلكترونية مصممة للتحويل والنمو."],
      ["03", "التطبيقات والأنظمة", "تطبيقات موبايل وأنظمة مخصصة لسير عملك."],
      ["04", "الذكاء الاصطناعي والأتمتة", "مساعدون أذكياء وتدفقات عمل تقلل المهام المتكررة."]
    ],
    footer: "حلول رقمية مصممة حول أعمالك."
  },
  en: {
    nav: ["Home", "Services", "Solutions", "About"],
    start: "Start a project",
    explore: "Explore services",
    eyebrow: "Building what comes next",
    title: "Turn your idea into a",
    accent: "real digital solution",
    body: "From websites and apps to intelligent systems and automation, we design and build practical solutions that grow with your business.",
    servicesTitle: "Digital solutions shaped around you",
    servicesBody: "One team bringing design, engineering and AI together in a connected experience.",
    services: [
      ["01", "Websites & platforms", "Professional, fast and responsive digital experiences."],
      ["02", "E-commerce", "Commerce experiences designed for conversion and growth."],
      ["03", "Apps & custom systems", "Mobile applications and systems built around your workflow."],
      ["04", "AI & automation", "Intelligent assistants and workflows that reduce repetitive work."]
    ],
    footer: "Digital solutions designed around your business."
  }
} as const;

export default function HomePage() {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const t = useMemo(() => copy[locale], [locale]);
  const isArabic = locale === "ar";

  return (
    <main className={isArabic ? "site" : "site site-en"} dir={isArabic ? "rtl" : "ltr"} lang={locale}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="ATSH AI home">
          <span className="brand-mark">A<span>✳</span></span>
          <span className="brand-name">ATSH <b>AI</b></span>
        </a>
        <nav className="nav-links" aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}>
          {t.nav.map((item) => <a href="#services" key={item}>{item}</a>)}
        </nav>
        <div className="top-actions">
          <button className="language" onClick={() => setLocale(isArabic ? "en" : "ar")} aria-label="Switch language">
            {isArabic ? "EN" : "عربي"} <span>↗</span>
          </button>
          <a className="button button-small" href="#contact">{t.start}</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="eyebrow"><span className="pulse" />{t.eyebrow}</div>
          <h1>{t.title}<br /><span>{t.accent}</span><i>.</i></h1>
          <p className="hero-copy">{t.body}</p>
          <div className="hero-actions">
            <a className="button" href="#contact">{t.start}<span>↗</span></a>
            <a className="text-link" href="#services">{t.explore}<span>↓</span></a>
          </div>
          <div className="hero-meta"><span>ATSH AI</span><span>DESIGN · ENGINEERING · INTELLIGENCE</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="core"><div className="core-inner">A<span>✳</span></div><small>ATSH AI</small></div>
          <div className="float-tag tag-top">AI / SYSTEMS <b>↗</b></div>
          <div className="float-tag tag-bottom"><span className="status-dot" /> BUILT FOR WHAT'S NEXT</div>
          <div className="grid-floor" />
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading">
          <div><span className="section-kicker">01 / WHAT WE BUILD</span><h2>{t.servicesTitle}</h2></div>
          <p>{t.servicesBody}</p>
        </div>
        <div className="service-grid">
          {t.services.map(([number, title, description]) => (
            <article className="service-card" key={number}>
              <span className="card-number">{number}</span>
              <div className="card-icon">{["⌘", "◈", "▧", "✳"][Number(number) - 1]}</div>
              <h3>{title}</h3><p>{description}</p><span className="card-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-strip" id="contact">
        <div><span className="section-kicker">LET'S BUILD SOMETHING MEANINGFUL</span><h2>{isArabic ? "مشروعك القادم يبدأ من هنا." : "Your next chapter starts here."}</h2></div>
        <a className="button" href="mailto:hello@atsh.ai">{isArabic ? "تواصل معنا" : "Contact us"} <span>↗</span></a>
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} ATSH AI</span><span>{t.footer}</span><span>CAIRO · EVERYWHERE</span></footer>
    </main>
  );
}
