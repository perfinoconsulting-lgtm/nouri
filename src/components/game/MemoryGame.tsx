'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mot } from '@/lib/data/mots'
import { useRewards } from '@/lib/reward-context'

// ─── Types internes ───────────────────────────────────────────────────────────

interface MemoryCard {
  id: number
  motId: string
  type: 'ar' | 'emoji'
  mot: Mot
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryGameProps {
  mots: Mot[]
  onComplete: (moves: number, time: number) => void
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function shuffleFisherYates<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildCards(mots: Mot[]): MemoryCard[] {
  const selectedMots = mots.slice(0, 4)
  const pairs: MemoryCard[] = []

  selectedMots.forEach((mot, idx) => {
    pairs.push(
      { id: idx * 2,     motId: mot.id, type: 'ar',    mot, isFlipped: false, isMatched: false },
      { id: idx * 2 + 1, motId: mot.id, type: 'emoji', mot, isFlipped: false, isMatched: false },
    )
  })

  return shuffleFisherYates(pairs)
}

// ─── Motif géométrique islamique (SVG inline) ─────────────────────────────────

function GeometricPattern() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="56"
      height="56"
      aria-hidden="true"
      style={{ opacity: 0.35, position: 'absolute' }}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="1.2" />
      {/* Deux carrés à 0° et 45° → étoile à 8 branches */}
      <rect x="22" y="22" width="56" height="56" rx="2" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(0 50 50)" />
      <rect x="22" y="22" width="56" height="56" rx="2" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(45 50 50)" />
      {/* Cercle intérieur décoratif */}
      <circle cx="50" cy="50" r="18" fill="none" stroke="white" strokeWidth="1" />
    </svg>
  )
}

// ─── Composant carte individuelle ─────────────────────────────────────────────

interface CardProps {
  card: MemoryCard
  isSelected: boolean
  isChecking: boolean
  onClick: (id: number) => void
}

function Card({ card, isSelected, isChecking, onClick }: CardProps) {
  const isVisible = card.isFlipped || card.isMatched
  const isDisabled = card.isMatched || isChecking

  return (
    <button
      type="button"
      disabled={isDisabled && !card.isMatched}
      onClick={() => !isDisabled && onClick(card.id)}
      className="relative focus:outline-none"
      style={{ perspective: '1000px', width: '80px', height: '80px', minWidth: '80px' }}
      aria-label={
        isVisible
          ? card.type === 'ar'
            ? `Carte arabe : ${card.mot.ar}`
            : `Carte emoji : ${card.mot.emoji} ${card.mot.fr}`
          : 'Carte retournée'
      }
    >
      {/* Conteneur de retournement 3D */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 400ms ease-in-out',
          transform: isVisible ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Dos de la carte — fond doré + motif géométrique */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: isSelected
              ? 'linear-gradient(135deg, #F5A623 0%, #e09410 100%)'
              : 'linear-gradient(135deg, #F5A623 0%, #d4880e 100%)',
            boxShadow: isSelected
              ? '0 0 0 3px white, 0 4px 12px rgba(0,0,0,0.4)'
              : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'box-shadow 150ms',
          }}
        >
          <GeometricPattern />
          {/* Point central pulsant */}
          <div
            className="animate-pulse"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
              position: 'absolute',
              zIndex: 1,
            }}
          />
        </div>

        {/* Face de la carte — mot arabe ou emoji */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: card.isMatched
              ? 'rgba(0, 201, 177, 0.25)'
              : 'rgba(26, 58, 92, 0.95)',
            border: card.isMatched
              ? '2px solid #00C9B1'
              : '2px solid rgba(255,255,255,0.15)',
            boxShadow: card.isMatched
              ? '0 0 16px rgba(0,201,177,0.5)'
              : '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {card.type === 'ar' ? (
            <span
              dir="rtl"
              style={{
                fontFamily: "'Noto Naskh Arabic', serif",
                fontSize: '1.8rem',
                color: card.isMatched ? '#00C9B1' : '#F5A623',
                direction: 'rtl',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              {card.mot.ar}
            </span>
          ) : (
            <span
              style={{ fontSize: '2.2rem', lineHeight: 1, userSelect: 'none' }}
              aria-hidden="true"
            >
              {card.mot.emoji}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function MemoryGame({ mots, onComplete }: MemoryGameProps) {
  const { triggerConfetti, playCorrect } = useRewards()

  const [cards, setCards] = useState<MemoryCard[]>(() => buildCards(mots))
  const [firstSelected, setFirstSelected] = useState<number | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)

  const startTimeRef    = useRef<number | null>(null)
  const gameCompletedRef = useRef(false)
  const checkTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Nettoyage du timeout au démontage
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current !== null) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [])

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (isChecking) return

      const card = cards.find((c) => c.id === cardId)
      if (!card || card.isFlipped || card.isMatched) return

      // Démarrer le chrono au premier clic
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
      }

      // Retourner la carte cliquée
      const updatedCards = cards.map((c) =>
        c.id === cardId ? { ...c, isFlipped: true } : c,
      )
      setCards(updatedCards)

      if (firstSelected === null) {
        setFirstSelected(cardId)
        return
      }

      // Deuxième carte — comparer avec la première
      const newMoves = moves + 1
      setMoves(newMoves)
      setFirstSelected(null)
      setIsChecking(true)

      const first = cards.find((c) => c.id === firstSelected)!
      const isPair = first.motId === card.motId && first.type !== card.type

      if (isPair) {
        playCorrect()
        const newScore = score + 1
        setScore(newScore)

        const matchedCards = updatedCards.map((c) =>
          c.id === firstSelected || c.id === cardId
            ? { ...c, isFlipped: true, isMatched: true }
            : c,
        )
        setCards(matchedCards)
        setIsChecking(false)

        // Fin de partie si toutes les paires sont trouvées
        const allMatched = matchedCards.every((c) => c.isMatched)
        if (allMatched && !gameCompletedRef.current) {
          gameCompletedRef.current = true
          triggerConfetti('full')
          const elapsed =
            startTimeRef.current !== null
              ? Math.round((Date.now() - startTimeRef.current) / 1000)
              : 0
          checkTimeoutRef.current = setTimeout(() => onComplete(newMoves, elapsed), 500)
        }
      } else {
        // Paire incorrecte — retourner les deux cartes après 1200ms
        checkTimeoutRef.current = setTimeout(() => {
          setCards((current) =>
            current.map((c) =>
              c.id === firstSelected || c.id === cardId
                ? { ...c, isFlipped: false }
                : c,
            ),
          )
          setIsChecking(false)
        }, 1200)
      }
    },
    [isChecking, firstSelected, cards, moves, score, onComplete, playCorrect, triggerConfetti],
  )

  const matchedCount = cards.filter((c) => c.isMatched).length / 2

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Compteurs */}
      <div className="flex items-center gap-6 text-white">
        <div className="flex flex-col items-center">
          <span
            className="text-2xl font-bold text-[#F5A623]"
            style={{ fontFamily: "'Baloo 2', cursive" }}
          >
            {moves}
          </span>
          <span className="text-xs text-white/60">coups</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="text-2xl font-bold text-[#00C9B1]"
            style={{ fontFamily: "'Baloo 2', cursive" }}
          >
            {score}
          </span>
          <span className="text-xs text-white/60">paires</span>
        </div>
      </div>

      {/* Grille 4×2 */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isSelected={card.id === firstSelected}
            isChecking={isChecking}
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* Légende progression */}
      <p
        className="text-sm text-white/50"
        style={{ fontFamily: "'Baloo 2', cursive" }}
      >
        {matchedCount}/4 paires trouvées
      </p>
    </div>
  )
}
