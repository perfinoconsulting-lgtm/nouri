'use client'

import { Mot } from '@/lib/data/mots'
import { speakArabic } from '@/lib/arabic-tts'

interface WordCardProps {
  mot: Mot
  showExample: boolean
  onListen: () => void
}

export function WordCard({ mot, showExample, onListen }: WordCardProps) {
  const handleListenWord = () => {
    speakArabic(mot.ar, 0.75)
    onListen()
  }

  const handleListenExample = () => {
    speakArabic(mot.exemple_phrase_ar, 0.7)
  }

  return (
    <div
      className="w-full rounded-2xl p-6 flex flex-col items-center gap-4"
      style={{
        background: showExample ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Mot arabe */}
      <span
        dir="rtl"
        className="text-center leading-none"
        style={{
          fontFamily: "'Noto Naskh Arabic', serif",
          fontSize: '3.5rem',
          color: '#F5A623',
          direction: 'rtl',
        }}
      >
        {mot.ar}
      </span>

      {/* Translittération */}
      <span className="text-sm italic text-white/60">{mot.transliteration}</span>

      {/* Emoji + traduction française */}
      <div className="flex items-center gap-2 text-white">
        <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>
          {mot.emoji}
        </span>
        <span
          className="text-base font-medium"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          {mot.fr}
        </span>
      </div>

      {/* Bouton écouter le mot */}
      <button
        type="button"
        onClick={handleListenWord}
        className="flex items-center gap-2 rounded-full px-5 font-semibold text-[#1A3A5C] transition-transform active:scale-95"
        style={{ background: '#F5A623', minHeight: '48px' }}
        aria-label={`Écouter la prononciation de ${mot.fr}`}
      >
        <span aria-hidden="true">🔊</span>
        <span style={{ fontFamily: "'Baloo 2', cursive" }}>Écouter</span>
      </button>

      {/* Exemple de phrase — visible uniquement si showExample=true */}
      {showExample && (
        <div
          className="mt-2 w-full flex flex-col gap-3 rounded-xl p-4"
          style={{ background: 'rgba(0,0,0,0.30)' }}
        >
          {/* Phrase arabe en RTL */}
          <p
            dir="rtl"
            className="text-center leading-relaxed"
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: '1.4rem',
              color: '#E0E6F0',
              direction: 'rtl',
            }}
          >
            {mot.exemple_phrase_ar}
          </p>

          {/* Traduction française */}
          <p
            className="text-center text-sm italic text-white/70"
            style={{ fontFamily: "'Baloo 2', cursive" }}
          >
            {mot.exemple_phrase_fr}
          </p>

          {/* Bouton écouter la phrase */}
          <button
            type="button"
            onClick={handleListenExample}
            className="mx-auto flex items-center gap-2 rounded-full px-4 font-semibold text-[#1A3A5C] transition-transform active:scale-95"
            style={{ background: '#00C9B1', minHeight: '48px' }}
            aria-label="Écouter la phrase d'exemple"
          >
            <span aria-hidden="true">🔊</span>
            <span
              className="text-sm"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              Écouter la phrase
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
