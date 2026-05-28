'use client'

import { useState, useCallback } from 'react'
import { ArabicText } from '@/components/arabic/ArabicText'
import type { ReviewItem } from '@/lib/spaced-repetition'

interface Props {
  item: ReviewItem
  onAnswer: (wasCorrect: boolean) => void
}

// Sons Web Audio API — récompense auditive
function playSound(freq: number, duration: number, type: OscillatorType = 'sine'): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
    osc.start()
    osc.stop(ctx.currentTime + duration / 1000)
  } catch {
    // Contexte audio non disponible (SSR ou navigateur restreint)
  }
}

// Extrait les 3 premiers mots d'un verset (séparés par espaces) sans couper les harakat
function premiersMotsVerset(ar: string, n: number): string {
  return ar.split(' ').slice(0, n).join(' ')
}

function RectoContent({ item }: { item: ReviewItem }) {
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Baloo 2', cursive",
    color: 'rgba(255,255,255,0.70)',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: '12px',
  }

  switch (item.itemType) {
    case 'lettre':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
          <ArabicText text={item.ar} size="xl" color="#F5A623" />
          <p style={labelStyle}>Sais-tu ce que c&apos;est ?</p>
        </div>
      )
    case 'syllabe':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
          <ArabicText text={item.ar} size="lg" color="#F5A623" />
          <p style={labelStyle}>Comment ça se prononce ?</p>
        </div>
      )
    case 'mot':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
          {item.emoji ? (
            <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{item.emoji}</span>
          ) : (
            <ArabicText text={item.ar} size="lg" color="#F5A623" />
          )}
          <p style={labelStyle}>Quel est ce mot ?</p>
        </div>
      )
    case 'verset':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
          <div
            dir="rtl"
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: '1.8rem',
              color: '#F5A623',
              direction: 'rtl',
              textAlign: 'center',
              lineHeight: 2,
            }}
          >
            {premiersMotsVerset(item.ar, 3)} …
          </div>
          <p style={labelStyle}>Comment continue ce verset ?</p>
        </div>
      )
  }
}

function VersoContent({ item }: { item: ReviewItem }) {
  const frStyle: React.CSSProperties = {
    fontFamily: "'Baloo 2', cursive",
    color: '#1A3A5C',
    fontSize: '1rem',
    textAlign: 'center',
    lineHeight: 1.5,
  }
  const subStyle: React.CSSProperties = {
    fontFamily: "'Baloo 2', cursive",
    color: '#555',
    fontSize: '0.85rem',
    textAlign: 'center',
    lineHeight: 1.4,
  }

  switch (item.itemType) {
    case 'lettre':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
          <ArabicText text={item.ar} size="xl" color="#F5A623" />
          <p style={{ ...frStyle, fontWeight: 600, fontSize: '1.1rem' }}>{item.fr}</p>
          {item.emoji && <span style={{ fontSize: '2rem' }}>{item.emoji}</span>}
        </div>
      )
    case 'syllabe':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
          <ArabicText text={item.ar} size="lg" color="#F5A623" />
          <p style={{ ...frStyle, fontWeight: 600 }}>{item.fr}</p>
        </div>
      )
    case 'mot':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
          <ArabicText text={item.ar} size="lg" color="#F5A623" />
          <p style={{ ...frStyle, fontWeight: 600, fontSize: '1.1rem' }}>{item.fr}</p>
          {item.emoji && <span style={{ fontSize: '2rem' }}>{item.emoji}</span>}
          <p style={subStyle}>{item.fr}</p>
        </div>
      )
    case 'verset':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-4 py-2 overflow-y-auto">
          <div
            dir="rtl"
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: '1.6rem',
              color: '#1A3A5C',
              direction: 'rtl',
              textAlign: 'center',
              lineHeight: 2.2,
            }}
          >
            {item.ar}
          </div>
          <p style={{ ...frStyle, color: '#27AE60', fontSize: '0.9rem' }}>{item.fr}</p>
        </div>
      )
  }
}

export function FlashCard({ item, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)

  const handleFlip = useCallback(() => {
    if (!answered) setFlipped(true)
  }, [answered])

  const handleAnswer = useCallback((wasCorrect: boolean) => {
    if (answered) return
    setAnswered(true)
    if (wasCorrect) {
      playSound(523, 200, 'sine')
    } else {
      playSound(220, 300, 'sawtooth')
    }
    // Légère pause pour que le son joue avant de passer à la carte suivante
    setTimeout(() => onAnswer(wasCorrect), 300)
  }, [answered, onAnswer])

  return (
    <div style={{ perspective: '1000px', width: '100%', height: '280px' }}>
      {/* Conteneur 3D */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 600ms ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {/* RECTO */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at top, #0d2137 0%, #1A3A5C 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(245,166,35,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RectoContent item={item} />
          </div>
          <div style={{ padding: '12px 16px' }}>
            <button
              type="button"
              onClick={handleFlip}
              style={{
                width: '100%',
                minHeight: '48px',
                background: 'rgba(245,166,35,0.15)',
                border: '1px solid rgba(245,166,35,0.5)',
                borderRadius: '12px',
                color: '#F5A623',
                fontFamily: "'Baloo 2', cursive",
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 200ms',
              }}
            >
              Voir la réponse 👁️
            </button>
          </div>
        </div>

        {/* VERSO */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
            background: '#FDFAF4',
            borderRadius: '20px',
            border: '2px solid rgba(245,166,35,0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            <VersoContent item={item} />
          </div>

          {/* Boutons auto-évaluation */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              padding: '12px 16px',
            }}
          >
            <button
              type="button"
              disabled={answered}
              onClick={() => handleAnswer(true)}
              style={{
                minHeight: '56px',
                background: answered ? '#ccc' : '#27AE60',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontFamily: "'Baloo 2', cursive",
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: answered ? 'default' : 'pointer',
                transition: 'opacity 200ms',
                opacity: answered ? 0.6 : 1,
              }}
            >
              😊 Je savais !
            </button>
            <button
              type="button"
              disabled={answered}
              onClick={() => handleAnswer(false)}
              style={{
                minHeight: '56px',
                background: answered ? '#ccc' : '#E74C3C',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontFamily: "'Baloo 2', cursive",
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: answered ? 'default' : 'pointer',
                transition: 'opacity 200ms',
                opacity: answered ? 0.6 : 1,
              }}
            >
              😕 Je ne savais pas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
