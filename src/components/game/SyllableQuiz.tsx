'use client'

/**
 * components/game/SyllableQuiz.tsx — Quiz interactif sur la prononciation des syllabes
 *
 * Ce composant Client propose 8 questions à l'enfant (les 4 voyelles d'une lettre apparaissant 2 fois,
 * mélangées aléatoirement). L'enfant doit associer la syllabe arabe à sa translittération.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import type { Syllabe } from '@/lib/data/syllabes'
import { useRewards } from '@/lib/reward-context'
import { speakArabic } from '@/lib/arabic-tts'

interface Props {
  syllabes: Syllabe[] // Les 4 syllabes fatha, kasra, damma, sukun d'une même lettre
  onComplete: (score: number) => void
}

function shuffleArray<T>(input: T[]): T[] {
  const array = [...input]
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function SyllableQuiz({ syllabes, onComplete }: Props) {
  const rewards = useRewards()

  // Générer 8 questions (chaque syllabe x2, mélangée)
  const [questions] = useState<Syllabe[]>(() => shuffleArray([...syllabes, ...syllabes]))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  
  // États de la question courante
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const finishedRef = useRef(false)

  const currentQuestion = questions[currentIndex]
  const isComplete = currentIndex >= questions.length

  // Options : les 4 translittérations possibles pour la même lettre
  const options = useMemo(() => {
    if (!currentQuestion) return []
    // Les options sont exactement les 4 syllabes passées en props (qui sont de la même lettre)
    return shuffleArray(syllabes)
  }, [currentQuestion, syllabes])

  // Prononcer la syllabe arabe automatiquement à chaque nouvelle question
  useEffect(() => {
    if (currentQuestion && !hasAnswered) {
      // Lecture avec un petit délai pour laisser l'animation de transition
      const timer = setTimeout(() => {
        speakArabic(currentQuestion.ar, 0.75)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentQuestion, hasAnswered])

  // Déclencher onComplete à la fin
  useEffect(() => {
    if (isComplete && !finishedRef.current) {
      finishedRef.current = true
      onComplete(score)
      if (score >= 6) {
        rewards.triggerConfetti('full')
      }
    }
  }, [isComplete, score, onComplete, rewards])

  const handleAnswer = (optionIndex: number) => {
    if (hasAnswered || isComplete || !currentQuestion) return

    setSelectedIndex(optionIndex)
    setHasAnswered(true)

    const chosen = options[optionIndex]
    const correct = chosen.id === currentQuestion.id

    if (correct) {
      setScore((prev) => prev + 1)
      rewards.playCorrect()
      rewards.triggerConfetti('light')
    } else {
      rewards.playWrong()
    }

    // Passer à la question suivante après 1s
    setTimeout(() => {
      setSelectedIndex(null)
      setHasAnswered(false)
      setCurrentIndex((prev) => prev + 1)
    }, 1000)
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623] mb-4"></div>
        <p className="font-baloo text-lg font-bold">Calcul de ton score... 🌟</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-[28px] border border-white/10 bg-[#0F253D]/95 p-6 text-white shadow-2xl animate-pop-in">
      
      {/* Styles des animations */}
      <style>{`
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
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      {/* Entête avec barre de progression */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm font-baloo text-white/70">
          <span>Question {Math.min(currentIndex + 1, 8)} / 8</span>
          <span>Score : {score} ⭐</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#F5A623] transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Syllabe d'affichage au centre */}
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/10 bg-[#152442]/80 p-8 shadow-inner shadow-black/20 relative">
        {/* Bouton audio pour répéter */}
        <button
          onClick={() => speakArabic(currentQuestion.ar, 0.75)}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors active:scale-90 text-lg"
          aria-label="Répéter le son"
        >
          🔊
        </button>

        <span
          className="text-6xl text-[#F5A623]"
          style={{
            fontFamily: "'Noto Naskh Arabic', serif",
            lineHeight: 1.2,
            textShadow: '0 0 30px rgba(245,166,35,0.25)',
          }}
          dir="rtl"
        >
          {currentQuestion.ar}
        </span>
        <p className="mt-3 font-baloo text-[#00C9B1] text-base font-bold">
          Comment on prononce cette syllabe ?
        </p>
      </div>

      {/* Options de translittération en bas */}
      <div className="grid gap-3 grid-cols-2">
        {options.map((option, index) => {
          const isCorrect = option.id === currentQuestion.id
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
              key={option.id}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
              className={`option-btn flex items-center justify-center border border-white/10 hover:border-[#F5A623]/70 font-baloo font-bold text-white text-xl active:scale-95 ${buttonClass}`}
              style={{
                fontFamily: "'Baloo 2', cursive",
                minWidth: '100px',
                minHeight: '80px',
              }}
            >
              {option.transliteration}
            </button>
          )
        })}
      </div>
    </div>
  )
}
