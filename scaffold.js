const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src');

const files = {
  'middleware.ts': `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Placeholder pour l'initialisation de Supabase
  // const supabase = createClient()
  // const { data: { session } } = await supabase.auth.getSession()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/jouer')

  /*
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/connexion', request.url))
  }

  if ((request.nextUrl.pathname.startsWith('/connexion') || request.nextUrl.pathname.startsWith('/inscription')) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  */

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/jouer/:path*', '/connexion', '/inscription'],
}
`,

  'lib/supabase.ts': `import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

/**
 * Client Supabase pour requêtes standards (à adapter avec @supabase/ssr pour les Server Actions)
 */
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
`,

  'lib/stripe.ts': `import Stripe from 'stripe'

// Initialisation de Stripe (côté serveur uniquement)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
  appInfo: {
    name: 'NourAl App',
    version: '0.1.0'
  }
})
`,

  'lib/utils.ts': `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fusionner les classes TailwindCSS de manière sécurisée
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,

  'types/index.ts': `// Types pour le projet NourAl

export interface User {
  id: string
  email: string
  role: 'parent'
}

export interface ChildProfile {
  id: string
  parentId: string
  name: string
  age: number
  avatarUrl: string | null
}

export interface Subscription {
  id: string
  userId: string
  status: 'active' | 'canceled' | 'past_due'
  stripeCustomerId: string
}
`,

  'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 26 58 92; /* #1A3A5C */
    --color-accent: 245 166 35; /* #F5A623 */
    --color-success: 0 201 177; /* #00C9B1 */
    --color-kids: 255 107 157; /* #FF6B9D */
    --color-validation: 39 174 96; /* #27AE60 */
    
    --background: 255 255 255;
    --foreground: 26 58 92;
  }
}

body {
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
  font-family: var(--font-inter), sans-serif;
}
`,

  'app/layout.tsx': `import type { Metadata } from "next";
import { Noto_Naskh_Arabic, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const notoNaskh = Noto_Naskh_Arabic({ 
  subsets: ["arabic"],
  variable: '--font-noto-naskh',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "NourAl - Apprendre l'arabe",
  description: "L'apprentissage ludique de l'arabe pour les enfants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={\`\${inter.variable} \${notoNaskh.variable}\`}>
      <body className="min-h-screen antialiased bg-white text-primary">
        {children}
      </body>
    </html>
  );
}
`,

  'app/(public)/page.tsx': `import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-blue-50/50">
      <h1 className="text-6xl font-bold text-primary mb-6 text-center tracking-tight">NourAl</h1>
      <p className="text-2xl text-primary/80 mb-12 text-center max-w-2xl font-medium">
        L'apprentissage ludique de l'arabe pour vos enfants.
      </p>
      <div className="flex gap-6">
        <Link href="/inscription" className="px-8 py-4 bg-accent text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-accent/90 transition transform hover:-translate-y-1">
          Commencer l'essai gratuit
        </Link>
        <Link href="/apprendre" className="px-8 py-4 bg-white text-primary border-2 border-primary/10 rounded-2xl font-bold text-lg shadow-sm hover:bg-gray-50 transition">
          Voir la démo
        </Link>
      </div>
    </main>
  )
}
`,

  'app/(public)/apprendre/page.tsx': `export default function DemoPage() {
  return (
    <div className="min-h-screen p-12 max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold text-primary mb-8">Démo Gratuite</h1>
      <p className="text-xl text-gray-600">Découvrez l'interface ludique conçue pour les 4-12 ans.</p>
    </div>
  )
}
`,

  'app/(public)/tarifs/page.tsx': `export default function PricingPage() {
  return (
    <div className="min-h-screen p-12 text-center">
      <h1 className="text-5xl font-bold text-primary mb-12">Un tarif simple</h1>
      <div className="p-10 border-2 border-primary/10 rounded-3xl max-w-md mx-auto shadow-xl bg-white relative">
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full font-bold text-sm">Populaire</div>
        <h2 className="text-3xl font-bold mb-4">Mensuel</h2>
        <p className="text-7xl font-bold text-accent my-6">2€ <span className="text-xl text-gray-400 font-medium">/enfant</span></p>
        <ul className="text-left space-y-4 mb-8 text-gray-600">
          <li className="flex items-center gap-3">✅ <span>Accès à tous les mini-jeux</span></li>
          <li className="flex items-center gap-3">✅ <span>Suivi de progression parent</span></li>
          <li className="flex items-center gap-3">✅ <span>Sans engagement</span></li>
        </ul>
        <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition">Choisir cette offre</button>
      </div>
    </div>
  )
}
`,

  'app/(public)/a-propos/page.tsx': `export default function AboutPage() {
  return (
    <div className="min-h-screen p-12 max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold text-primary mb-8">À Propos</h1>
      <p className="text-xl text-gray-600 leading-relaxed">
        NourAl est né d'une volonté simple : permettre aux familles francophones de transmettre 
        l'arabe à leurs enfants de manière ludique, moderne et accessible à tous.
      </p>
    </div>
  )
}
`,

  'app/(public)/connexion/page.tsx': `export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center">Espace Parent</h1>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <input type="email" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Mot de passe</label>
            <input type="password" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="••••••••" />
          </div>
          <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition shadow-md">Se connecter</button>
        </form>
      </div>
    </div>
  )
}
`,

  'app/(public)/inscription/page.tsx': `export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center">Créer un compte</h1>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <input type="email" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Mot de passe</label>
            <input type="password" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="••••••••" />
          </div>
          <button className="w-full py-4 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent/90 transition shadow-md">S'inscrire</button>
        </form>
      </div>
    </div>
  )
}
`,

  'app/(dashboard)/layout.tsx': `import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm z-10">
        <h2 className="text-3xl font-bold text-primary mb-10 px-4">NourAl<span className="text-accent">.</span></h2>
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Tableau de bord</Link>
          <Link href="/enfants" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Mes Enfants</Link>
          <Link href="/abonnement" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Abonnement</Link>
          <Link href="/parametres" className="px-4 py-3 rounded-2xl hover:bg-blue-50 text-gray-700 hover:text-primary font-semibold transition">Paramètres</Link>
        </nav>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
`,

  'app/(dashboard)/dashboard/page.tsx': `export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-2">Tableau de bord</h1>
      <p className="text-lg text-gray-500 mb-10">Suivez la progression de vos enfants.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-primary mb-4">Progression</h2>
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Aucune donnée pour le moment</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Prêt à apprendre ?</h2>
          <button className="px-8 py-4 bg-kids text-white font-bold text-lg rounded-2xl hover:bg-kids/90 transition shadow-md w-full">
            Lancer le jeu
          </button>
        </div>
      </div>
    </div>
  )
}
`,

  'app/(dashboard)/enfants/page.tsx': `import Link from 'next/link'

export default function ChildrenPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Mes Enfants</h1>
          <p className="text-gray-500">Gérez les profils de vos enfants.</p>
        </div>
        <button className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition shadow-sm">
          + Ajouter un enfant
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/enfants/1" className="block bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-accent hover:shadow-md transition text-center cursor-pointer group">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-6 group-hover:scale-105 transition"></div>
          <h2 className="text-2xl font-bold text-primary mb-1">Yanis</h2>
          <p className="text-gray-500 font-medium">6 ans</p>
        </Link>
      </div>
    </div>
  )
}
`,

  'app/(dashboard)/enfants/[id]/page.tsx': `export default function ChildDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-10">Profil de l'enfant</h1>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <p className="text-lg text-gray-600">ID de l'enfant : <span className="font-mono font-bold text-primary">{params.id}</span></p>
      </div>
    </div>
  )
}
`,

  'app/(dashboard)/abonnement/page.tsx': `export default function SubscriptionPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-2">Abonnement</h1>
      <p className="text-gray-500 mb-10">Gérez votre facturation et vos options.</p>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-primary">Statut</h3>
            <p className="text-success font-semibold mt-1">Actif</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-primary">Prochain prélèvement</h3>
            <p className="text-gray-500 mt-1">12 Juin 2026</p>
          </div>
        </div>
        <button className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition">
          Accéder au portail Stripe
        </button>
      </div>
    </div>
  )
}
`,

  'app/(dashboard)/parametres/page.tsx': `export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-10">Paramètres du compte</h1>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email Parent</label>
            <input type="email" defaultValue="parent@email.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" disabled />
          </div>
          <button className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition mt-8">
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  )
}
`,

  'app/(jeu)/jouer/[childId]/page.tsx': `import Link from 'next/link'

export default function GameMainMenu({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-blue-50/50 flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold text-primary mb-12">Choisis ton jeu !</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link href={\`/jouer/\${params.childId}/alphabet\`} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center border-b-8 border-accent cursor-pointer group">
          <div className="text-7xl font-arabic mb-6 text-primary group-hover:scale-110 transition-transform duration-300">أ ب ت</div>
          <h2 className="text-3xl font-bold text-primary">Alphabet</h2>
        </Link>
        <Link href={\`/jouer/\${params.childId}/syllabes\`} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center border-b-8 border-kids cursor-pointer group">
          <div className="text-7xl font-arabic mb-6 text-primary group-hover:scale-110 transition-transform duration-300">بَ بِ بُ</div>
          <h2 className="text-3xl font-bold text-primary">Syllabes</h2>
        </Link>
        <Link href={\`/jouer/\${params.childId}/mots\`} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center border-b-8 border-success cursor-pointer group">
          <div className="text-7xl font-arabic mb-6 text-primary group-hover:scale-110 transition-transform duration-300">قِطَّة</div>
          <h2 className="text-3xl font-bold text-primary">Mots</h2>
        </Link>
      </div>
      <Link href="/dashboard" className="mt-16 px-8 py-4 bg-white text-gray-500 font-bold rounded-2xl shadow-sm hover:bg-gray-50 transition">
        Quitter le jeu
      </Link>
    </main>
  )
}
`,

  'app/(jeu)/jouer/[childId]/alphabet/page.tsx': `import Link from 'next/link'

export default function AlphabetGame({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <Link href={\`/jouer/\${params.childId}\`} className="absolute top-8 left-8 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
        Retour
      </Link>
      <div className="bg-accent/10 w-64 h-64 rounded-full flex flex-col items-center justify-center mb-12 shadow-inner">
        <div className="text-[12rem] font-arabic text-accent leading-none">ب</div>
      </div>
      <p className="text-5xl font-bold text-primary mb-12">Baa</p>
      <div className="flex gap-4">
        <button className="px-10 py-5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-xl hover:bg-gray-200">Précédent</button>
        <button className="px-10 py-5 bg-accent text-white font-bold rounded-2xl text-xl hover:bg-accent/90 shadow-md">Suivant</button>
      </div>
    </main>
  )
}
`,

  'app/(jeu)/jouer/[childId]/syllabes/page.tsx': `import Link from 'next/link'

export default function SyllablesGame({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <Link href={\`/jouer/\${params.childId}\`} className="absolute top-8 left-8 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
        Retour
      </Link>
      <div className="bg-kids/10 w-64 h-64 rounded-full flex flex-col items-center justify-center mb-12 shadow-inner">
        <div className="text-[12rem] font-arabic text-kids leading-none">بَ</div>
      </div>
      <p className="text-5xl font-bold text-primary mb-12">Ba</p>
      <div className="flex gap-4">
        <button className="px-10 py-5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-xl hover:bg-gray-200">Précédent</button>
        <button className="px-10 py-5 bg-kids text-white font-bold rounded-2xl text-xl hover:bg-kids/90 shadow-md">Suivant</button>
      </div>
    </main>
  )
}
`,

  'app/(jeu)/jouer/[childId]/mots/page.tsx': `import Link from 'next/link'

export default function WordsGame({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <Link href={\`/jouer/\${params.childId}\`} className="absolute top-8 left-8 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
        Retour
      </Link>
      <div className="bg-success/10 px-16 py-12 rounded-[3rem] flex flex-col items-center justify-center mb-12 shadow-inner">
        <div className="text-[10rem] font-arabic text-success leading-none">قِطَّة</div>
      </div>
      <p className="text-5xl font-bold text-primary mb-12">Chat</p>
      <div className="flex gap-4">
        <button className="px-10 py-5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-xl hover:bg-gray-200">Précédent</button>
        <button className="px-10 py-5 bg-success text-white font-bold rounded-2xl text-xl hover:bg-success/90 shadow-md">Suivant</button>
      </div>
    </main>
  )
}
`
};

Object.entries(files).forEach(([filePath, content]) => {
  let fullPath;
  if (filePath === 'middleware.ts') {
    fullPath = path.join(__dirname, filePath);
  } else {
    fullPath = path.join(basePath, filePath);
  }
  
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log('Created:', filePath);
});

// Création des dossiers composants
['ui', 'arabic', 'dashboard', 'game'].forEach(dir => {
  const dirPath = path.join(basePath, 'components', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});
