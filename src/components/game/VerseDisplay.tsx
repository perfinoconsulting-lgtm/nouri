'use client'

import { Fragment } from 'react'
import type { Verset } from '@/lib/data/sourates'

interface Props {
  verset: Verset
  showTranslit: boolean
  showTranslation: boolean
  highlightWords?: string[]
  onListen?: () => void
  size?: 'sm' | 'md' | 'lg'
}

// Tailles du texte arabe — minimum 1.4rem pour que les harakat soient lisibles
const TAILLES_ARABES: Record<NonNullable<Props['size']>, string> = {
  sm: '1.4rem',
  md: '1.8rem',
  lg: '2.4rem',
}

const CHIFFRES_ARABES = '٠١٢٣٤٥٦٧٨٩'

function versChiffreArabe(n: number): string {
  return n
    .toString()
    .split('')
    .map((d) => CHIFFRES_ARABES[parseInt(d, 10)] ?? d)
    .join('')
}

// Découpe le texte arabe en segments (surlignés ou non) en gérant les mots-clés multi-mots
// Ne coupe jamais un caractère ou un harakat — on découpe uniquement sur les espaces
function segmenterAvecSurlignage(
  texte: string,
  motsSurligner: string[]
): Array<{ texte: string; surligné: boolean }> {
  const mots = texte.split(' ')
  const segments: Array<{ texte: string; surligné: boolean }> = []
  let i = 0

  while (i < mots.length) {
    let trouvé = false

    for (const motCle of motsSurligner) {
      const morceaux = motCle.split(' ')
      const correspond = morceaux.every((m, j) => mots[i + j] === m)

      if (correspond) {
        segments.push({ texte: motCle, surligné: true })
        i += morceaux.length
        trouvé = true
        break
      }
    }

    if (!trouvé) {
      segments.push({ texte: mots[i] ?? '', surligné: false })
      i++
    }
  }

  return segments
}

export function VerseDisplay({
  verset,
  showTranslit,
  showTranslation,
  highlightWords = [],
  onListen,
  size = 'md',
}: Props) {
  const tailleAr = TAILLES_ARABES[size]
  const avecSurlignage = highlightWords.length > 0
  const segments = avecSurlignage
    ? segmenterAvecSurlignage(verset.ar, highlightWords)
    : null

  return (
    <div
      className="w-full rounded-2xl flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(245,166,35,0.25)',
        padding: '20px',
      }}
    >
      {/* Numéro verset (gauche) + bouton écouter (droite) */}
      <div className="flex items-center justify-between">
        <span
          dir="rtl"
          style={{
            fontFamily: "'Noto Naskh Arabic', serif",
            color: '#F5A623',
            fontSize: '1rem',
            lineHeight: '1',
          }}
        >
          ﴿{versChiffreArabe(verset.numero)}﴾
        </span>

        {onListen ? (
          <button
            type="button"
            onClick={onListen}
            className="flex items-center justify-center rounded-full transition-opacity opacity-70 hover:opacity-100 active:scale-95"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              background: 'rgba(245,166,35,0.15)',
              border: '1px solid rgba(245,166,35,0.3)',
              fontSize: '1.1rem',
            }}
            aria-label={`Écouter le verset ${verset.numero}`}
          >
            🔊
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>

      {/* Texte arabe — toujours affiché intégralement, jamais tronqué */}
      <div
        dir="rtl"
        className="w-full text-center"
        style={{
          fontFamily: "'Noto Naskh Arabic', serif",
          fontSize: tailleAr,
          color: '#FFFFFF',
          direction: 'rtl',
          textAlign: 'center',
          lineHeight: '2.2',
        }}
      >
        {segments !== null
          ? segments.map((seg, i) => (
              <Fragment key={i}>
                {seg.surligné ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(245,166,35,0.28)',
                      color: '#F5A623',
                      borderRadius: '4px',
                      padding: '0 3px',
                    }}
                  >
                    {seg.texte}
                  </span>
                ) : (
                  <span>{seg.texte}</span>
                )}
                {i < segments.length - 1 ? ' ' : ''}
              </Fragment>
            ))
          : verset.ar}
      </div>

      {/* Translittération phonétique */}
      {showTranslit && (
        <p
          className="text-center italic"
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '1.5',
          }}
        >
          {verset.transliteration}
        </p>
      )}

      {/* Traduction française */}
      {showTranslation && (
        <p
          className="text-center"
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: '0.95rem',
            color: '#F5A623',
            lineHeight: '1.5',
          }}
        >
          {verset.fr}
        </p>
      )}
    </div>
  )
}
