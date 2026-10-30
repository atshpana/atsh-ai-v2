"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicServices, type SiteLocale } from "../../service-catalog";

const labels = {
  ar: { eyebrow:"ATSH AI / SERVICES", title:"حلول تبدأ من احتياجك", intro:"استكشف مجالات الخدمات، وقارن نطاق كل حل ومخرجاته. يتحدد النطاق التجاري والسعر بعد مراجعة المتطلبات.", search:"ابحث عن خدمة...", all:"كل المجالات", categories:[["web","المواقع"],["commerce","التجارة الإلكترونية"],["mobile","تطبيقات الموبايل"],["systems","الأنظمة"],["ai","الذكاء الاصطناعي"],["automation","الأتمتة"]], result:"خدمة", results:"خدمات", empty:"لا توجد خدمات تطابق البحث الحالي.", clear:"مسح البحث والفلاتر", open:"عرض التفاصيل", pricing:"تحديد النطاق وعرض السعر بعد المراجعة", sort:"الترتيب", order:"الترتيب الافتراضي", az:"الاسم: أ إلى ي" },
  en: { eyebrow:"ATSH AI / SERVICES", title:"Solutions that start with your needs", intro:"Explore our service areas and review each solution's scope and deliverables. Commercial scope and pricing are determined after requirements review.", search:"Search services...", all:"All categories", categories:[["web","Websites"],["commerce","E-commerce"],["mobile","Mobile apps"],["systems","Systems"],["ai","Artificial intelligence"],["automation","Automation"]], result:"service", results:"services", empty:"No services match your current search.", clear:"Clear search and filters", open:"View details", pricing:"Scope and quotation after review", sort:"Sort", order:"Default order", az:"Name: A to Z" }
} as const;

export default function ServicesPage() {
  const params = useParams<{locale:string}>();
  const locale: SiteLocale = params.locale === "en" ? "en" : "ar";
  const rtl = locale === "ar";
  const t = labels[locale];
  const services = getPublicServices(locale);
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("all");
  const [sort,setSort] = useState("default");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    const rows = services.filter((item) => (category === "all" || item.category === category) && (!normalized || (item.title + " " + item.summary).toLocaleLowerCase(locale).includes(normalized)));
    return sort === "az" ? [...rows].sort((a,b) => a.title.localeCompare(b.title,locale)) : rows;
  },[services,query,category,sort,locale]);
  return <main className={"public-subpage " + (rtl ? "is-rtl" : "is-ltr")} dir={rtl ? "rtl" : "ltr"}>
    <header className="subpage-header"><Link href={"/"+locale} className="subpage-brand">ATSH <b>AI</b></Link><nav><Link href={"/"+locale}>{rtl ? "الرئيسية" : "Home"}</Link><Link href={"/"+locale+"/services"}>{rtl ? "الخدمات" : "Services"}</Link></nav><Link className="subpage-language" href={"/"+(rtl ? "en" : "ar")+"/services"}>{rtl ? "EN" : "عربي"}</Link></header>
    <section className="service-list-hero"><span className="section-kicker">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.intro}</p></section>
    <section className="service-catalog-controls" aria-label={rtl ? "بحث وفلاتر الخدمات" : "Service search and filters"}>
      <label className="service-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/></label>
      <label className="service-sort"><span>{t.sort}</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="default">{t.order}</option><option value="az">{t.az}</option></select></label>
    </section>
    <div className="service-filter-row"><button className={category==="all"?"filter-chip selected":"filter-chip"} onClick={()=>setCategory("all")}>{t.all}</button>{t.categories.map(([key,label])=><button key={key} className={category===key?"filter-chip selected":"filter-chip"} onClick={()=>setCategory(key)}>{label}</button>)}</div>
    <div className="service-results-count">{filtered.length} {filtered.length===1?t.result:t.results}</div>
    {filtered.length ? <div className="public-service-grid">{filtered.map((item,index)=><article className="public-service-card" key={item.slug}><div className="public-service-card-top"><span>0{index+1}</span><span>{item.category.toUpperCase()}</span></div><div className="public-service-mark" aria-hidden="true">{["⌘","◈","▧","⌗","✳","⇄"][services.findIndex(x=>x.slug===item.slug)]}</div><h2>{item.title}</h2><p>{item.summary}</p><div className="public-service-card-bottom"><span>{t.pricing}</span><Link href={"/"+locale+"/services/"+item.slug}>{t.open}<b> ↗</b></Link></div></article>)}</div> : <div className="service-empty"><p>{t.empty}</p><button onClick={()=>{setQuery("");setCategory("all");setSort("default")}}>{t.clear}</button></div>}
    <footer className="subpage-footer"><Link href={"/"+locale}>ATSH AI</Link><span>© {new Date().getFullYear()} ATSH AI</span><span>CAIRO · EVERYWHERE</span></footer>
  </main>;
}
