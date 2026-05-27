'use client'

import { useState } from 'react'
import { Theme } from '@/lib/data/mots'

interface ThemeCardProps {
  theme: Theme
  progression: { learned: number; total: number }
}

export function ThemeCard({ theme, progression }: ThemeCardProps) {
  const [hovered, setHovered] = useState(false)
  const { learned, total } = progression
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded-2xl p-5 text-left"
      style={{
        background: hovered ? `${theme.couleur}40` : `${theme.couleur}26`,
        border: `2px solid ${theme.couleur}`,
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'background 200ms ease-out, transform 200ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Emoji thème */}
        <span aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1 }}>
          {theme.emoji}
        </span>

        {/* Titres */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-center font-semibold text-white"
            style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.2rem' }}
          >
            {theme.titre_fr}
          </span>
          <span
            dir="rtl"
            className="text-center"
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: '1rem',
              color: '#F5A623',
              direction: 'rtl',
            }}
          >
            {theme.titre_ar}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="w-full">
          <div className="mb-1 flex justify-between text-xs text-white/70">
            <span>{learned}/{total} mots appris</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: theme.couleur }}
            />
          </div>
        </div>
      </div>
    </button>
  )
}
