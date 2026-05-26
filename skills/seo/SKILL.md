# Skill : SEO Next.js

## Quand lire ce skill
Avant toute page publique ou configuration de metadata.

## Mots-clés cibles NourAl (par volume)
1. "apprendre arabe enfant" — très élevé
2. "alphabet arabe enfant" — élevé
3. "cours arabe enfant maison" — moyen
4. "application arabe enfant" — moyen
5. "apprendre al fatiha enfant" — faible mais fort intent
6. "arabe pour enfants musulmans france" — ciblé

## Metadata par page
```typescript
// app/(public)/page.tsx
export const metadata: Metadata = {
  title: "NourAl — Apprendre l'Arabe pour Enfants | Familles Musulmanes France",
  description: "✨ Alphabet arabe, mots et Al-Fatiha pour vos enfants. Ludique, suivi parental, 2€/mois. Essai gratuit 7 jours.",
  keywords: ["apprendre arabe enfant", "alphabet arabe", "application arabe enfant", "arabe musulman france"],
  openGraph: {
    title: "NourAl — Apprendre l'Arabe en s'Amusant 🌙",
    description: "Application d'apprentissage de l'arabe pour les enfants musulmans de France. À partir de 4 ans.",
    url: "https://nouralapp.fr",
    siteName: "NourAl",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NourAl — Apprendre l'Arabe pour Enfants",
    description: "Application ludique, suivi parental, 2€/mois.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nouralapp.fr" },
}
```

## Schema.org obligatoires
```typescript
// SoftwareApplication (page d'accueil)
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "NourAl",
  "applicationCategory": "EducationApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "2",
    "priceCurrency": "EUR",
    "priceValidUntil": "2025-12-31"
  },
  "description": "Application d'apprentissage de l'arabe pour enfants 4-12 ans",
  "inLanguage": "fr",
  "audience": { "@type": "EducationalAudience", "educationalRole": "student" }
}

// FAQPage (pages avec FAQ)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": questions.map(q => ({
    "@type": "Question",
    "name": q.question,
    "acceptedAnswer": { "@type": "Answer", "text": q.answer }
  }))
}
```

## Sitemap (app/sitemap.ts)
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://nouralapp.fr', lastModified: new Date(), priority: 1.0, changeFrequency: 'daily' },
    { url: 'https://nouralapp.fr/apprendre', lastModified: new Date(), priority: 0.9, changeFrequency: 'weekly' },
    { url: 'https://nouralapp.fr/tarifs', lastModified: new Date(), priority: 0.8, changeFrequency: 'monthly' },
    { url: 'https://nouralapp.fr/a-propos', lastModified: new Date(), priority: 0.6, changeFrequency: 'monthly' },
  ]
}
```

## OG Image dynamique (@vercel/og)
```typescript
// app/og/route.tsx
import { ImageResponse } from 'next/og'
export function GET() {
  return new ImageResponse(
    <div style={{ background: '#1A3A5C', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#F5A623', fontSize: 72 }}>🌙 NourAl</div>
      <div style={{ color: 'white', fontSize: 36 }}>Apprendre l'arabe n'a jamais été aussi simple</div>
    </div>,
    { width: 1200, height: 630 }
  )
}
```

## Robots.txt (app/robots.ts)
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/jouer/', '/api/', '/admin/'] }
    ],
    sitemap: 'https://nouralapp.fr/sitemap.xml',
  }
}
```

## Checklist SEO avant lancement
- ✅ Sitemap soumis Google Search Console
- ✅ Lighthouse SEO > 95
- ✅ Toutes les pages ont title + description uniques
- ✅ Images avec alt text
- ✅ Font arabe préchargée (preload)
- ✅ Core Web Vitals : LCP < 2.5s, FID < 100ms, CLS < 0.1
