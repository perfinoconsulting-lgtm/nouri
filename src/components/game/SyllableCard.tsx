'use client'

/**
 * components/game/SyllableCard.tsx — Carte interactive d'affichage d'une syllabe arabe
 *
 * Ce composant Client interactif affiche une syllabe avec une distinction de couleur
 * entre la lettre de base et sa voyelle (fatha, kasra, damma, sukun).
 * Optionnellement, il anime l'apparition de la voyelle au montage du composant.
 */

import { useEffect, useState } from 'react'
import type { Syllabe } from '@/lib/data/syllabes'

interface Props {
  syllabe: Syllabe
  showAnimation?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Couleurs par voyelle
const VOWEL_STYLES = {
  fatha: {
    bg: 'rgba(245, 166, 35, 0.15)',
    border: 'rgba(245, 166, 35, 0.4)',
    color: '#F5A623', // Or
    diacritic: 'َ', // ◌َ (U+064E)
  },
  kasra: {
    bg: 'rgba(0, 201, 177, 0.15)',
    border: 'rgba(0, 201, 177, 0.4)',
    color: '#00C9B1', // Turquoise
    diacritic: 'ِ', // ◌ِ (U+0650)
  },
  damma: {
    bg: 'rgba(255, 107, 157, 0.15)',
    border: 'rgba(255, 107, 157, 0.4)',
    color: '#FF6B9D', // Rose
    diacritic: 'ُ', // ◌ُ (U+064F)
  },
  sukun: {
    bg: 'rgba(155, 89, 182, 0.15)',
    border: 'rgba(155, 89, 182, 0.4)',
    color: '#9B59B6', // Violet
    diacritic: 'ْ', // ◌ْ (U+0652)
  },
}

// Tailles responsives et harmonisées
const SIZE_CLASSES = {
  sm: {
    card: 'w-20 h-20 text-3xl pb-2',
    letter: 'text-4xl',
    diacritic: 'text-3xl',
    translit: 'text-xs',
  },
  md: {
    card: 'w-28 h-28 text-4xl pb-3',
    letter: 'text-5xl',
    diacritic: 'text-4xl',
    translit: 'text-sm',
  },
  lg: {
    card: 'w-36 h-36 text-5xl pb-4',
    letter: 'text-6xl',
    diacritic: 'text-5xl',
    translit: 'text-base',
  },
}

export default function SyllableCard({ syllabe, showAnimation = false, size = 'md' }: Props) {
  const style = VOWEL_STYLES[syllabe.voyelle]
  const sizes = SIZE_CLASSES[size]
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Positionner la voyelle selon le type (au-dessus ou en dessous)
  const isBelow = syllabe.voyelle === 'kasra'

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl border select-none transition-transform duration-150 hover:scale-105 active:scale-95 ${sizes.card}`}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        minWidth: '80px',
        minHeight: '80px',
      }}
    >
      {/* Styles d'animation CSS injectés localement */}
      <style>{`
        @keyframes vowelScaleIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-vowel {
          animation: vowelScaleIn 600ms ease-out forwards;
        }
      `}</style>

      {/* Conteneur de la lettre arabe + voyelle superposée */}
      <div className="relative flex items-center justify-center h-2/3 mt-2 w-full">
        {/* Lettre de base en gris clair */}
        <span
          className={`font-arabic text-[#E2E8F0] ${sizes.letter}`}
          style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: 1 }}
          dir="rtl"
        >
          {syllabe.lettre_ar}
        </span>

        {/* Diacritique (voyelle) animée et colorée */}
        <span
          className={`absolute font-arabic pointer-events-none ${sizes.diacritic} ${
            showAnimation && mounted ? 'animate-vowel' : ''
          }`}
          style={{
            fontFamily: "'Noto Naskh Arabic', serif",
            color: style.color,
            lineHeight: 1,
            // Légers ajustements d'alignement pour s'assurer que le harakat se place bien
            top: isBelow ? 'auto' : '15%',
            bottom: isBelow ? '15%' : 'auto',
          }}
          dir="rtl"
        >
          {/* Suppression du cercle pointillé par un Zero-Width Joiner (U+200D) */}
          {`\u200D${style.diacritic}`}
        </span>
      </div>

      {/* Translittération en bas en Baloo 2 */}
      <span
        className={`font-baloo text-white/50 mt-1 font-semibold leading-none ${sizes.translit}`}
        style={{ fontFamily: "'Baloo 2', cursive" }}
      >
        {syllabe.transliteration}
      </span>
    </div>
  )
}
