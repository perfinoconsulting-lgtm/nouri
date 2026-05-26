'use client'

import type { CSSProperties } from 'react'
import { LETTERS } from '@/lib/data/letters'

interface Props {
  /** Map : index de lettre → score 0-100 */
  progress: Map<number, number>
  onSelectLetter: (index: number) => void
}

/** Retourne le style de fond d'une carte selon le score de progression */
function getCardStyle(score: number | undefined): CSSProperties {
  if (score === undefined) {
    return {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
    }
  }
  if (score >= 80) {
    return {
      background: 'rgba(39,174,96,0.2)',
      border: '1px solid rgba(39,174,96,0.4)',
    }
  }
  // En cours d'apprentissage (score 1–79)
  return {
    background: 'rgba(245,166,35,0.2)',
    border: '1px solid rgba(245,166,35,0.4)',
  }
}

export function AlphabetGrid({ progress, onSelectLetter }: Props) {
  return (
    <>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 p-4">
        {LETTERS.map((letter, i) => {
          const score = progress.get(letter.index)
          const maitrisee = score !== undefined && score >= 80

          return (
            <button
              key={letter.index}
              onClick={() => onSelectLetter(letter.index)}
              className="relative flex flex-col items-center justify-center gap-1 transition-transform duration-150 hover:scale-[1.06] active:scale-95"
              style={{
                ...getCardStyle(score),
                minHeight: '80px',
                minWidth: '0',
                borderRadius: '16px',
                padding: '8px 4px',
                /* Animation d'entrée en cascade (stagger 30ms par carte) */
                animationDelay: `${i * 30}ms`,
                animation: 'alphabetPopIn 0.4s ease-out both',
              }}
              aria-label={`${letter.nom} — ${letter.ar}`}
            >
              {/* Indicateur de maîtrise */}
              {maitrisee && (
                <span
                  className="absolute top-1 right-1.5 text-xs font-bold"
                  style={{ color: '#27AE60' }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}

              {/* Lettre arabe */}
              <span
                style={{
                  fontFamily: "'Noto Naskh Arabic', serif",
                  fontSize: '2.5rem',
                  direction: 'rtl',
                  lineHeight: 1,
                  color: 'white',
                }}
              >
                {letter.ar}
              </span>

              {/* Nom de la lettre */}
              <span
                className="text-white/70 text-center"
                style={{
                  fontFamily: "'Baloo 2', cursive",
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                }}
              >
                {letter.nom}
              </span>

              {/* Emoji représentatif */}
              <span style={{ fontSize: '1rem', lineHeight: 1 }} aria-hidden="true">
                {letter.emoji}
              </span>
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes alphabetPopIn {
          0%   { transform: scale(0.5); opacity: 0; }
          80%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  )
}
