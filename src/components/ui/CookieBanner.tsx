'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_accepted')
    if (!accepted) setVisible(true)
  }, [])

  function handleAccept() {
    localStorage.setItem('cookie_accepted', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A3A5C] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm leading-relaxed">
          🍪 Nous utilisons uniquement les cookies nécessaires au fonctionnement de l&apos;application.{' '}
          <Link
            href="/politique-confidentialite"
            className="underline text-[#F5A623] hover:text-[#F5A623]/80 transition-colors"
          >
            En savoir plus →
          </Link>
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-5 py-3 bg-[#F5A623] text-[#1A3A5C] font-semibold rounded-lg text-sm min-h-[48px] transition-colors hover:bg-[#F5A623]/90 active:bg-[#F5A623]/80 whitespace-nowrap"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  )
}
