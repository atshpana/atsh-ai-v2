import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicService, getPublicServices, type SiteLocale } from "../../../service-catalog";

const ui = {
  ar: { back:"كل الخدمات", eyebrow:"ATSH AI / SERVICE DETAIL", benefits:"القيمة التي يقدمها الحل", scope:"نطاق العمل", deliverables:"المخرجات المتوقعة", quote:"تحديد النطاق وعرض السعر", quoteText:"لا نعرض سعرًا ثابتًا أو تقديرًا غير معتمد هنا. يتم تحديد الخيارات والنطاق التجاري بعد مراجعة احتياج المشروع وقواعد التسعير المعتمدة.", contact:"ناقش احتياجك", related:"خدمات ذات صلة", note:"تختلف التفاصيل النهائية بحسب المتطلبات والاتفاق المعتمد." },
  en: { back:"All services", eyebrow:"ATSH AI / SERVICE DETAIL", benefits:"What this solution enables", scope:"Scope of work", deliverables:"Expected deliverables", quote:"Scope review & quotation", quoteText:"No fixed or unverified estimate is displayed here. Options and commercial scope are defined after reviewing project requirements and approved pricing rules.", contact:"Discuss your needs", related:"Related services", note:"Final details depend on the requirements and approved agreement." }
} as const;

export function generateStaticParams() {
  return (["ar","en"] as SiteLocale[]).flatMap(locale => getPublicServices(locale).map(service => ({ locale, slug:service.slug })));
}
export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}) {
  const {locale:raw,slug}=await params;
  const locale:SiteLocale=raw==="en"?"en":"ar";
  const service=getPublicService(locale,slug);
  if(!service) return {};
  return { title: service.title+" | ATSH AI", description:service.summary, alternates:{canonical:"/"+locale+"/services/"+slug,languages:{ar:"/ar/services/"+slug,en:"/en/services/"+slug}} };
}
export default async function ServiceDetailPage({params}:{params:Promise<{locale:string;slug:string}>}) {
  const {locale:raw,slug}=await params;
  if(raw!=="ar"&&raw!=="en") notFound();
  const locale:SiteLocale=raw;
  const service=getPublicService(locale,slug);
  if(!service) notFound();
  const t=ui[locale];
  const related=getPublicServices(locale).filter(item=>service.related.includes(item.slug));
  return <main className={"public-subpage service-detail-page "+(locale==="ar"?"is-rtl":"is-ltr")} dir={locale==="ar"?"rtl":"ltr"}>
    <header className="subpage-header"><Link href={"/"+locale} className="subpage-brand">ATSH <b>AI</b></Link><nav><Link href={"/"+locale}>{locale==="ar"?"الرئيسية":"Home"}</Link><Link href={"/"+locale+"/services"}>{t.back}</Link></nav><Link className="subpage-language" href={"/"+(locale==="ar"?"en":"ar")+"/services/"+slug}>{locale==="ar"?"EN":"عربي"}</Link></header>
    <section className="service-detail-hero"><Link className="service-back" href={"/"+locale+"/services"}>← {t.back}</Link><span className="section-kicker">{t.eyebrow} / {service.category.toUpperCase()}</span><h1>{service.title}</h1><p>{service.summary}</p><a className="button" href="#service-contact">{t.contact}<span>↗</span></a></section>
    <section className="service-detail-columns"><article><span className="section-kicker">01 / VALUE</span><h2>{t.benefits}</h2><ul>{service.benefits.map(x=><li key={x}><span>✓</span>{x}</li>)}</ul></article><article><span className="section-kicker">02 / SCOPE</span><h2>{t.scope}</h2><ol>{service.scope.map(x=><li key={x}>{x}</li>)}</ol></article><article><span className="section-kicker">03 / OUTPUT</span><h2>{t.deliverables}</h2><ul>{service.deliverables.map(x=><li key={x}><span>↗</span>{x}</li>)}</ul></article></section>
    <section className="service-quote-panel" id="service-contact"><div><span className="section-kicker">ATSH AI / COMMERCIAL SCOPE</span><h2>{t.quote}</h2><p>{t.quoteText}</p><small>{t.note}</small></div><Link className="button" href={"/"+locale+"#contact"}>{t.contact}<span>↗</span></Link></section>
    <section className="related-services"><span className="section-kicker">04 / EXPLORE MORE</span><h2>{t.related}</h2><div>{related.map(item=><Link key={item.slug} href={"/"+locale+"/services/"+item.slug}><span>{item.category.toUpperCase()}</span><strong>{item.title}</strong><b>↗</b></Link>)}</div></section>
    <footer className="subpage-footer"><Link href={"/"+locale}>ATSH AI</Link><span>© {new Date().getFullYear()} ATSH AI</span><span>CAIRO · EVERYWHERE</span></footer>
  </main>;
}
