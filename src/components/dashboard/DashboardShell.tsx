'use client'

/**
 * components/dashboard/DashboardShell.tsx — Shell interactif du dashboard
 * Gère : sidebar desktop, hamburger mobile, drawer, bottom nav, déconnexion
 */

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Home, Users, CreditCard, Settings, LogOut, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/dashboard',   label: 'Tableau de bord', Icon: Home       },
  { href: '/enfants',     label: 'Mes enfants',      Icon: Users      },
  { href: '/abonnement',  label: 'Abonnement',       Icon: CreditCard },
  { href: '/parrainage',  label: 'Parrainage',       Icon: Gift       },
  { href: '/parametres',  label: 'Paramètres',       Icon: Settings   },
]

interface Props {
  prenom: string
  children: React.ReactNode
}

export default function DashboardShell({ prenom, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const initial = prenom.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/connexion')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all min-h-[48px] ${
      isActive(href)
        ? 'bg-[#F5A623]/20 text-[#F5A623]'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  const sidebarContent = (
    <>
      {/* Avatar parent */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-lg font-bold shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{prenom}</p>
          <p className="text-white/40 text-xs">Espace Parent</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setDrawerOpen(false)}
            className={navLinkClass(href)}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 pb-6">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold text-sm transition-all min-h-[48px]"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── SIDEBAR DESKTOP ────────────────────────────────────── */}
      <aside className="hidden md:flex w-[280px] bg-[#1A3A5C] flex-col shrink-0 sticky top-0 h-screen z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-[#F5A623] text-2xl font-bold tracking-tight">🌙 NourAl</span>
        </div>
        {sidebarContent}
      </aside>

      {/* ── HEADER MOBILE ──────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1A3A5C] flex items-center justify-between px-4 z-40 shadow-lg">
        <span className="text-[#F5A623] text-xl font-bold">🌙 NourAl</span>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          className="w-10 h-10 flex items-center justify-center text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── DRAWER MOBILE ──────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="md:hidden fixed top-0 left-0 h-full w-[280px] bg-[#1A3A5C] z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <span className="text-[#F5A623] text-xl font-bold">🌙 NourAl</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fermer le menu"
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </>
      )}

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────── */}
      <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>

      {/* ── BOTTOM NAV MOBILE ──────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40 shadow-lg">
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
              isActive(href) ? 'text-[#F5A623]' : 'text-gray-400'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-semibold">{label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
