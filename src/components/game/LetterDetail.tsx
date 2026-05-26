'use client'

import { getLetterByIndex } from '@/lib/data/letters'
import { ArabicText } from '@/components/arabic/ArabicText'
import { speakArabic } from '@/lib/arabic-tts'

interface Props {
  letterIndex: number
  onGoToQuiz: () => void
  onGoToWriting: () => void
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

/**
 * Affiche un mot arabe en surlignant toutes les occurrences de la lettre isolée.
 * La forme isolée (sans harakat) est utilisée comme clé de recherche ; les harakat
 * qui suivent immédiatement la lettre sont inclus dans la portion surlignée.
 *
 * Limite connue : les variantes d'alif (أ إ آ) ont des codepoints différents de ا
 * et ne seront pas toujours détectées — comportement acceptable pour une v1.
 */
function MotSurligne({ mot, lettreIsol }: { mot: string; lettreIsol: string }) {
  const parties: { texte: string; surligne: boolean }[] = []
  let reste = mot

  while (reste.length > 0) {
    const idx = reste.indexOf(lettreIsol)
    if (idx === -1) {
      parties.push({ texte: reste, surligne: false })
      break
    }
    if (idx > 0) parties.push({ texte: reste.slice(0, idx), surligne: false })

    // Inclure les harakat (U+064B–U+065F) qui suivent la lettre
    let fin = idx + lettreIsol.length
    while (fin < reste.length && /[ً-ٟ]/.test(reste[fin])) fin++

    parties.push({ texte: reste.slice(idx, fin), surligne: true })
    reste = reste.slice(fin)
  }

  return (
    <span
      dir="rtl"
      style={{
        fontFamily: "'Noto Naskh Arabic', serif",
        fontSize: '1.4rem',
        lineHeight: 1.3,
      }}
    >
      {parties.map((p, i) =>
        p.surligne ? (
          <span key={i} style={{ color: '#F5A623' }}>
            {p.texte}
          </span>
        ) : (
          <span key={i} className="text-white">
            {p.texte}
          </span>
        )
      )}
    </span>
  )
}

/** Carte de position (début / milieu / fin) dans les mots exemples */
function CartePosition({
  label,
  couleur,
  fond,
  bordure,
  mot,
  lettreIsol,
  traduction,
  onEcouter,
}: {
  label: string
  couleur: string
  fond: string
  bordure: string
  mot: string
  lettreIsol: string
  traduction: string
  onEcouter: () => void
}) {
  return (
    <button
      onClick={onEcouter}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
      style={{ background: fond, border: `1px solid ${bordure}`, minHeight: '48px' }}
    >
      <span
        className="text-xs"
        style={{ fontFamily: "'Baloo 2', cursive", color: couleur }}
      >
        {label}
      </span>
      <MotSurligne mot={mot} lettreIsol={lettreIsol} />
      <span
        className="text-white/50 text-xs text-center leading-tight"
        style={{ fontFamily: "'Baloo 2', cursive" }}
      >
        {traduction}
      </span>
    </button>
  )
}

export function LetterDetail({
  letterIndex,
  onGoToQuiz,
  onGoToWriting,
  onClose,
  onNext,
  onPrev,
}: Props) {
  const lettre = getLetterByIndex(letterIndex)

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto w-full">

      {/* ── Barre de navigation ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl transition-all hover:bg-white/10 active:scale-90"
          aria-label="Lettre précédente"
        >
          ←
        </button>

        <button
          onClick={onClose}
          className="text-white/50 hover:text-white text-sm transition-colors"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          ← Toutes les lettres
        </button>

        <button
          onClick={onNext}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl transition-all hover:bg-white/10 active:scale-90"
          aria-label="Lettre suivante"
        >
          →
        </button>
      </div>

      {/* ── Grande lettre + informations ── */}
      <div className="flex flex-col items-center gap-3">

        {/* Lettre cliquable → TTS */}
        <button
          onClick={() => speakArabic(lettre.ar)}
          className="relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group"
          aria-label={`Écouter la prononciation de ${lettre.nom}`}
        >
          <span
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: '6rem',
              direction: 'rtl',
              color: '#F5A623',
              textShadow: '0 0 40px rgba(245,166,35,0.35)',
              lineHeight: 1.1,
            }}
          >
            {lettre.ar}
          </span>
          {/* Badge écouter */}
          <span className="absolute -bottom-3 right-0 text-xs bg-white/10 rounded-full px-2 py-0.5 text-white/80 group-hover:bg-white/20 transition-colors">
            🔊
          </span>
        </button>

        {/* Nom */}
        <h2
          className="text-white font-bold text-center"
          style={{ fontSize: '2rem' }}
        >
          {lettre.nom}
        </h2>

        {/* Description du son */}
        <p className="text-center text-sm" style={{ color: '#00C9B1' }}>
          🔊 Son : {lettre.son}
        </p>

        {/* Translittération */}
        <p className="text-white/50 text-center text-sm font-mono">
          [{lettre.transliteration}]
        </p>
      </div>

      {/* ── Illustration + mot exemple ── */}
      <div
        className="flex flex-col items-center gap-3 rounded-2xl p-4 mx-auto"
        style={{ background: 'rgba(255,255,255,0.07)', width: '100%', maxWidth: '220px' }}
      >
        {/* Zone SVG — emoji en attendant les assets illustrations (svgKey: {lettre.svgKey}) */}
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: '120px',
            height: '100px',
            background: 'rgba(255,255,255,0.07)',
            fontSize: '3.5rem',
          }}
          aria-hidden="true"
        >
          {lettre.emoji}
        </div>

        <div className="flex flex-col items-center gap-1">
          <ArabicText text={lettre.exAr} size="md" color="#F5A623" />
          <span
            className="text-white/60 text-sm text-center"
            style={{ fontFamily: "'Baloo 2', cursive" }}
          >
            {lettre.exFr}
          </span>
        </div>
      </div>

      {/* ── Section "Dans les mots" ── */}
      <div>
        <h3
          className="text-white/50 text-xs uppercase tracking-widest mb-3 text-center"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          Dans les mots
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <CartePosition
            label="Au début"
            couleur="#00C9B1"
            fond="rgba(0,201,177,0.08)"
            bordure="rgba(0,201,177,0.3)"
            mot={lettre.posEx.debut.ar}
            lettreIsol={lettre.formes.isol}
            traduction={lettre.posEx.debut.fr}
            onEcouter={() => speakArabic(lettre.posEx.debut.ar, 0.75)}
          />
          <CartePosition
            label="Au milieu"
            couleur="#9B59B6"
            fond="rgba(155,89,182,0.08)"
            bordure="rgba(155,89,182,0.3)"
            mot={lettre.posEx.milieu.ar}
            lettreIsol={lettre.formes.isol}
            traduction={lettre.posEx.milieu.fr}
            onEcouter={() => speakArabic(lettre.posEx.milieu.ar, 0.75)}
          />
          <CartePosition
            label="À la fin"
            couleur="#FF6B9D"
            fond="rgba(255,107,157,0.08)"
            bordure="rgba(255,107,157,0.3)"
            mot={lettre.posEx.fin.ar}
            lettreIsol={lettre.formes.isol}
            traduction={lettre.posEx.fin.fr}
            onEcouter={() => speakArabic(lettre.posEx.fin.ar, 0.75)}
          />
        </div>
      </div>

      {/* ── Boutons d'action ── */}
      <div className="flex flex-col gap-3 pb-4">
        <button
          onClick={onGoToQuiz}
          className="w-full font-bold text-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: '#F5A623',
            color: '#1A3A5C',
            minHeight: '52px',
            borderRadius: '50px',
            fontSize: '1.1rem',
            fontFamily: "'Baloo 2', cursive",
          }}
        >
          🎯 Faire le quiz !
        </button>

        <button
          onClick={onGoToWriting}
          className="w-full text-white text-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            minHeight: '52px',
            borderRadius: '50px',
            fontFamily: "'Baloo 2', cursive",
          }}
        >
          ✏️ Écrire la lettre
        </button>
      </div>
    </div>
  )
}
