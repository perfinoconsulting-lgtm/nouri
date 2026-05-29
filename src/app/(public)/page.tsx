import type { Metadata } from 'next'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import LandingPageClient, { FAQ_ITEMS } from './LandingPageClient'

export const metadata: Metadata = {
  title: "NourAl — Apprendre l'Arabe pour Enfants | Familles Musulmanes France",
  description: "✨ Alphabet arabe, mots et Al-Fatiha pour vos enfants. Ludique, suivi parental, 2€/mois. Essai gratuit 7 jours.",
  keywords: ["apprendre arabe enfant", "alphabet arabe enfant france", "application arabe enfant", "cours arabe maison"],
  openGraph: {
    title: "NourAl — Apprendre l'Arabe en s'Amusant 🌙",
    description: "Application ludique pour enfants musulmans de France. À partir de 4 ans.",
    url: "https://nouralapp.fr",
    siteName: "NourAl",
    images: [{ url: "/og", width: 1200, height: 630, alt: "NourAl — Apprendre l'arabe" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NourAl — Apprendre l'Arabe pour Enfants",
    description: "Application ludique, suivi parental, 2€/mois.",
    images: ["/og"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nouralapp.fr" },
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "NourAl",
  "applicationCategory": "EducationApplication",
  "operatingSystem": "Web, iOS, Android",
  "inLanguage": "fr",
  "offers": {
    "@type": "Offer",
    "price": "2",
    "priceCurrency": "EUR",
    "priceValidUntil": "2026-12-31",
  },
  "audience": { "@type": "EducationalAudience", "educationalRole": "student" },
  "description": "Application d'apprentissage de l'arabe pour enfants 4-12 ans, familles musulmanes de France",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": { "@type": "Answer", "text": item.a },
  })),
}

export default function LandingPage() {
  return (
    <>
      <SchemaOrg schema={softwareSchema} />
      <SchemaOrg schema={faqSchema} />
      <LandingPageClient />
    </>
  )
}
