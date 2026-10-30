import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "../home-page";

const localeMetadata = {
  ar: { title: "ATSH AI | حلول رقمية وهندسة ذكية", description: "نصمم ونبني المواقع والمتاجر والتطبيقات والأنظمة المخصصة وحلول الذكاء الاصطناعي والأتمتة، من تحليل الاحتياج إلى الاختبار والتسليم." },
  en: { title: "ATSH AI | Digital Engineering & Intelligent Solutions", description: "We design and build websites, commerce, applications, custom systems, AI and automation solutions—from discovery and engineering to testing and delivery." }
} as const;
type Locale = keyof typeof localeMetadata;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "ar";
  const metadata = localeMetadata[locale];
  return {
    title: metadata.title, description: metadata.description,
    alternates: { canonical: "/" + locale, languages: { ar: "/ar", en: "/en" } },
    openGraph: { title: metadata.title, description: metadata.description, locale: locale === "ar" ? "ar_EG" : "en_US", type: "website" }
  };
}

export default async function LocalizedHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "ar" && locale !== "en") {
    notFound();
  }
  return <HomePage />;
}
