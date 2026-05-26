'use client'

/**
 * components/game/WordAssembler.tsx — Mini-jeu d'assemblage de mots
 *
 * L'enfant voit les syllabes d'un mot séparées dans des cartes SyllableCard.
 * Lorsqu'il clique sur "Assembler", les cartes glissent horizontalement pour fusionner.
 * Une fois fusionnées, le mot arabe complet s'affiche en grand avec un effet bounce.
 * L'enfant doit alors choisir la bonne traduction parmi 4 options (design MiniQCM).
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import SyllableCard from './SyllableCard'
import { getSyllabeById } from '@/lib/data/syllabes'
import { useRewards } from '@/lib/reward-context'
import { speakArabic } from '@/lib/arabic-tts'

interface WordData {
  ar: string
  fr: string
  emoji: string
  syllabes: string[]
}

interface Props {
  word: WordData
  onSuccess: () => void
}

// Liste de tous les mots pour générer les distracteurs
const ALL_WORDS: WordData[] = [
  { ar: 'كِتَاب', fr: 'livre', emoji: '📚', syllabes: ['ki', 'ta', 'b_sukun'] },
  { ar: 'بَيْت', fr: 'maison', emoji: '🏠', syllabes: ['ba', 'y_sukun', 't_sukun'] },
  { ar: 'سَمَك', fr: 'poisson', emoji: '🐟', syllabes: ['sa', 'ma', 'k_sukun'] },
  { ar: 'قَمَر', fr: 'lune', emoji: '🌙', syllabes: ['qa', 'ma', 'r_sukun'] },
  { ar: 'مَاء', fr: 'eau', emoji: '💧', syllabes: ['ma', 'a_sukun'] },
  { ar: 'أَسَد', fr: 'lion', emoji: '🦁', syllabes: ['a', 'sa', 'd_sukun'] },
]

export default function WordAssembler({ word, onSuccess }: Props) {
  const rewards = useRewards()

  // États d'assemblage et d'animation
  const [isAssembling, setIsAssembling] = useState(false)
  const [isMerged, setIsMerged] = useState(false)
  
  // États du QCM d'association
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Résoudre les objets Syllabe à partir de leurs IDs
  const resolvedSyllabes = useMemo(() => {
    return word.syllabes.map((id) => getSyllabeById(id)).filter(Boolean) as Syllabe[]
  }, [word])

  // Générer les 4 options pour le QCM (la bonne traduction + 3 distracteurs)
  const options = useMemo(() => {
    const correctOption = word
    const distractors = ALL_WORDS.filter((w) => w.ar !== word.ar)
    
    // Mélanger et prendre 3 distracteurs
    const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3)
    
    // Combiner et remélanger les 4 options finales
    return [correctOption, ...shuffledDistractors].sort(() => 0.5 - Math.random())
  }, [word])

  // Synthétiseur de son de glissement / swoosh pour l'assemblage
  const playSwooshSound = () => {
    if (typeof window === 'undefined') return
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      
      // Glissement de fréquence de 200Hz à 800Hz
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.6)
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch (e) {
      console.warn('Swoosh sound failed', e)
    }
  }

  // Lancer l'assemblage
  const handleAssemble = () => {
    if (isAssembling || isMerged) return
    setIsAssembling(true)
    playSwooshSound()

    // Attendre la fin de l'animation de translation (600ms)
    setTimeout(() => {
      setIsMerged(true)
      setIsAssembling(false)
      speakArabic(word.ar, 0.75)
    }, 600)
  }

  // Soumettre une réponse au QCM
  const handleAnswer = (optionIndex: number) => {
    if (hasAnswered || !isMerged) return

    setSelectedIndex(optionIndex)
    setHasAnswered(true)

    const chosen = options[optionIndex]
    const correct = chosen.ar === word.ar

    if (correct) {
      rewards.playCorrect()
      rewards.triggerConfetti('full')
      
      // Valider le succès après 1.2s pour apprécier le confetti
      setTimeout(() => {
        onSuccess()
      }, 1200)
    } else {
      rewards.playWrong()
      
      // Permettre de réesayer après 1s
      setTimeout(() => {
        setSelectedIndex(null)
        setHasAnswered(false)
      }, 1000)
    }
  }

  // Calcul du décalage pour rapprocher les cartes au centre
  const cardWidth = 144 // w-36 = 144px
  const cardGap = 16 // gap-4 = 16px
  const spacing = cardWidth + cardGap
  const centerIndex = (resolvedSyllabes.length - 1) / 2

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 rounded-[28px] border border-white/10 bg-[#0F253D]/95 p-6 text-white shadow-2xl animate-pop-in">
      
      {/* Styles des animations CSS */}
      <style>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.1);
          }
          85% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
        }
        .option-btn {
          min-height: 80px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
        }
        .option-btn.disabled {
          opacity: 0.6;
        }
        .correct {
          animation: correctBounce 0.8s ease both;
          background-color: #22c55e !important;
          border-color: #22c55e !important;
          color: white !important;
        }
        .wrong {
          animation: wrongShake 0.8s ease both;
          background-color: #ef4444 !important;
          border-color: #ef4444 !important;
          color: white !important;
        }
        @keyframes correctBounce {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.08); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>

      {/* Titre ludique */}
      <div className="text-center">
        <h3 className="font-baloo text-xl font-bold text-white mb-1">
          {!isMerged ? 'Assemble les syllabes pour former le mot ! 🧩' : 'Trouve la bonne image ! 🔍'}
        </h3>
        <p className="text-white/60 text-sm">
          {!isMerged ? 'Clique sur le bouton doré pour fusionner !' : 'Quel est ce mot ?'}
        </p>
      </div>

      {/* Zone de fusion des cartes */}
      <div className="relative flex justify-center items-center min-h-[160px] w-full overflow-hidden py-4">
        {!isMerged ? (
          <div className="flex gap-4 items-center justify-center transition-all duration-300">
            {resolvedSyllabes.map((syllabe, idx) => {
              // Calculer la translation nécessaire pour fusionner au centre exact
              const offset = isAssembling ? (centerIndex - idx) * spacing : 0
              return (
                <div
                  key={syllabe.id + '-' + idx}
                  className="transition-transform duration-600"
                  style={{
                    transform: `translateX(${offset}px)`,
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <SyllableCard syllabe={syllabe} size="lg" />
                </div>
              )
            })}
          </div>
        ) : (
          // Mot complet assemblé et animé
          <div className="flex flex-col items-center justify-center gap-3 animate-bounce-in">
            <button
              onClick={() => speakArabic(word.ar, 0.75)}
              className="relative flex items-center justify-center rounded-3xl border border-white/10 bg-[#152442]/80 p-8 shadow-inner shadow-black/30 hover:border-[#F5A623]/50 transition-colors cursor-pointer group"
              style={{ minHeight: '120px', minWidth: '220px' }}
            >
              <span
                className="text-5xl text-[#F5A623]"
                style={{
                  fontFamily: "'Noto Naskh Arabic', serif",
                  lineHeight: 1,
                  textShadow: '0 0 30px rgba(245,166,35,0.25)',
                }}
                dir="rtl"
              >
                {word.ar}
              </span>
              <span className="absolute bottom-2 right-3 text-xs text-white/40 group-hover:text-white/70 transition-colors">
                🔊 Écouter
              </span>
            </button>
          </div>
        )}
      </div>

      {/* BOUTON ASSEMBLER (affiché au départ uniquement) */}
      {!isMerged && !isAssembling && (
        <button
          onClick={handleAssemble}
          className="py-4 px-10 bg-[#F5A623] hover:bg-[#e8a92f] text-[#1A3A5C] font-black rounded-full text-xl select-none transition-all active:scale-95 shadow-lg shadow-[#F5A623]/25 font-baloo cursor-pointer"
          style={{ minWidth: '180px', minHeight: '52px' }}
        >
          🧩 Assembler
        </button>
      )}

      {/* QCM IMAGE/TEXTE EN BAS (affiché après fusion uniquement) */}
      {isMerged && (
        <div className="w-full flex flex-col gap-4 animate-pop-in mt-2">
          <div className="grid gap-3 grid-cols-2">
            {options.map((option, index) => {
              const isCorrect = option.ar === word.ar
              const isSelected = selectedIndex === index
              
              let buttonClass = ''
              if (hasAnswered) {
                if (isCorrect) {
                  buttonClass = 'correct'
                } else if (isSelected) {
                  buttonClass = 'wrong'
                } else {
                  buttonClass = 'disabled'
                }
              }

              return (
                <button
                  key={option.ar}
                  onClick={() => handleAnswer(index)}
                  disabled={hasAnswered}
                  className={`option-btn flex flex-col items-center justify-center gap-1 border border-white/10 hover:border-[#F5A623]/70 font-baloo font-bold text-white text-base active:scale-95 ${buttonClass}`}
                  style={{
                    fontFamily: "'Baloo 2', cursive",
                    minHeight: '90px',
                    padding: '8px',
                  }}
                >
                  <span className="text-3xl leading-none">{option.emoji}</span>
                  <span className="capitalize leading-none">{option.fr}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
