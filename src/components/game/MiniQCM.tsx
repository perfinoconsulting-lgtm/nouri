'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type Letter } from '../../lib/data/letters'
import { ArabicText } from '../arabic/ArabicText'
import { useRewards } from '../../lib/reward-context'

type TabKey = 'image' | 'nom' | 'son' | 'lettre'

interface MiniQCMProps {
  letterIndex: number
  allLetters: Letter[]
  onAnswer: (correct: boolean) => void
  onFinish: (score: number) => void
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'image', label: '🖼️ Image' },
  { key: 'nom', label: '📝 Nom' },
  { key: 'son', label: '🔊 Son' },
  { key: 'lettre', label: '🔍 Lettre' },
]

function shuffleArray<T>(input: T[]): T[] {
  const array = [...input]
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function buildQuestions(letterIndex: number, allLetters: Letter[]): Letter[] {
  const safeIndex = Math.max(0, Math.min(letterIndex, allLetters.length - 1))
  const firstLetter = allLetters[safeIndex]
  const others = allLetters.filter((letter) => letter.index !== firstLetter.index)
  const randomOthers = shuffleArray(others).slice(0, 7)
  return [firstLetter, ...randomOthers]
}

function playSound(freq: number, duration: number, type: OscillatorType = 'sine'): void {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.value = freq
    gain.gain.setValueAtTime(0.3, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration / 1000)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration / 1000)

    setTimeout(() => {
      context.close().catch(() => null)
    }, duration + 50)
  } catch {
    // silence Web Audio si indisponible
  }
}

export function MiniQCM({ letterIndex, allLetters, onAnswer, onFinish }: MiniQCMProps) {
  const rewards = useRewards()
  const [activeTab, setActiveTab] = useState<TabKey>('image')
  const [questions, setQuestions] = useState<Letter[]>(() => buildQuestions(letterIndex, allLetters))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const finishedRef = useRef(false)

  const currentLetter = questions[currentQuestionIndex]
  const questionNumber = Math.min(currentQuestionIndex + 1, 8)
  const isComplete = currentQuestionIndex >= questions.length

  const options = useMemo(() => {
    if (!currentLetter) return []
    const distractors = shuffleArray(
      allLetters.filter((letter) => letter.index !== currentLetter.index)
    ).slice(0, 3)
    return shuffleArray([currentLetter, ...distractors])
  }, [allLetters, currentLetter])

  useEffect(() => {
    if (isComplete && !finishedRef.current) {
      finishedRef.current = true
      onFinish(score)
      if (score >= 6) {
        rewards.triggerConfetti('full')
      }
    }
  }, [isComplete, onFinish, rewards, score])

  const handleAnswer = (optionIndex: number) => {
    if (hasAnswered || isComplete || currentLetter == null) return

    setSelectedIndex(optionIndex)
    setHasAnswered(true)
    setShowNext(false)

    const chosen = options[optionIndex]
    const correct = chosen?.index === currentLetter.index

    if (correct) {
      setScore((current) => current + 1)
      rewards.playCorrect()
      rewards.triggerConfetti('light')
      onAnswer(true)
      setTimeout(() => {
        if (!isComplete) {
          goToNextQuestion()
        }
      }, 800)
    } else {
      rewards.playWrong()
      onAnswer(false)
      setShowNext(true)
    }
  }

  const goToNextQuestion = () => {
    setSelectedIndex(null)
    setHasAnswered(false)
    setShowNext(false)
    setCurrentQuestionIndex((current) => current + 1)
  }

  const restartQuiz = () => {
    finishedRef.current = false
    setQuestions(buildQuestions(letterIndex, allLetters))
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedIndex(null)
    setHasAnswered(false)
    setShowNext(false)
  }

  const summaryMessage = useMemo(() => {
    if (score >= 6) return 'Excellent !'
    if (score >= 4) return 'Bien !'
    return 'Continue de pratiquer !'
  }, [score])

  const renderStimulus = () => {
    if (!currentLetter) return null
    if (activeTab === 'lettre') {
      return (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-white/10 bg-[#152442]/80 p-6 text-center">
          <span className="font-baloo text-2xl text-white">{currentLetter.emoji}</span>
          <span className="font-baloo text-[2rem] text-white">{currentLetter.nom}</span>
        </div>
      )
    }

    return (
      <ArabicText
        text={currentLetter.ar}
        size="xl"
        weight="normal"
        className="text-[#F5A623]"
      />
    )
  }

  const renderOptionLabel = (letter: Letter, tab: TabKey) => {
    if (tab === 'image') {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <svg viewBox="0 0 120 90" className="h-full w-full rounded-[18px] bg-[#12283e]/70 p-2">
            <rect x="4" y="4" width="112" height="82" rx="18" fill="#F5A623" opacity="0.12" />
            <text
              x="60"
              y="48"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="36"
              fill="#F5A623"
            >
              {letter.emoji}
            </text>
          </svg>
          <span className="text-sm font-semibold text-white">{letter.nom}</span>
        </div>
      )
    }

    if (tab === 'nom') {
      return <span className="text-lg font-semibold text-white">{letter.nom}</span>
    }

    if (tab === 'son') {
      return <span className="text-lg font-semibold text-white">{letter.son}</span>
    }

    return (
      <ArabicText
        text={letter.ar}
        size="lg"
        weight="normal"
        className="text-white"
      />
    )
  }

  if (isComplete) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[28px] border border-white/10 bg-[#0F253D]/95 p-6 text-white shadow-2xl">
        <div className="text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.24em] text-[#A5B5D0]">Quiz terminé</p>
          <p className="text-6xl font-bold">{score}/8 ⭐</p>
        </div>
        <div className="rounded-[24px] bg-[#112a46]/90 p-6 text-center">
          <p className="mb-2 text-2xl font-semibold">{summaryMessage}</p>
          <p className="text-sm text-[#c8d4ec]">Tu as répondu correctement à {score} questions sur 8.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="rounded-full bg-[#F5A623] px-6 py-3 font-semibold text-[#1A3A5C] transition hover:bg-[#e8a92f]"
            onClick={restartQuiz}
          >
            Encore !
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 bg-transparent px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            onClick={() => typeof window !== 'undefined' && window.history.back()}
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-[28px] border border-white/10 bg-[#0F253D]/95 p-6 text-white shadow-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#A5B5D0]">Question {questionNumber}/8</p>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#F5A623] transition-all duration-500"
              style={{ width: `${(questionNumber / 8) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-[#F5A623] text-[#1A3A5C]'
                  : 'bg-white/10 text-white'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#152442]/80 p-6 text-center shadow-inner shadow-black/20">
        {renderStimulus()}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option, index) => {
          const correctIndex = options.findIndex((item) => item.index === currentLetter.index)
          const isCorrect = index === correctIndex
          const isSelected = selectedIndex === index
          const buttonClass = hasAnswered
            ? isCorrect
              ? 'correct'
              : isSelected
              ? 'wrong'
              : 'disabled'
            : ''

          return (
            <button
              key={option.index}
              type="button"
              className={`option-btn group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#152442]/80 px-4 py-4 text-left transition duration-200 hover:border-[#F5A623]/70 ${buttonClass}`}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
            >
              {renderOptionLabel(option, activeTab)}
            </button>
          )
        })}
      </div>

      {showNext ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-full bg-[#F5A623] px-6 py-3 font-semibold text-[#1A3A5C] transition hover:bg-[#e8a92f]"
            onClick={goToNextQuestion}
          >
            Question suivante →
          </button>
        </div>
      ) : null}

      <style jsx>{`
        .option-btn {
          min-height: 80px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
        }
        .option-btn.disabled {
          opacity: 0.7;
        }
        .correct {
          animation: correctBounce 0.8s ease both;
          background: #22c55e !important;
          color: white;
        }
        .wrong {
          animation: wrongShake 0.8s ease both;
          background: #ef4444 !important;
          color: white;
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
    </div>
  )
}
