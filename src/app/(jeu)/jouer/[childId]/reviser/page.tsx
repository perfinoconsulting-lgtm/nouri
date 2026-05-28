'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FlashCard } from '@/components/game/FlashCard'
import type { ReviewItem } from '@/lib/spaced-repetition'
import type { ReviewStats, ReviewSession } from '@/lib/review-scheduler'

// ─── Types API (dates sérialisées en string JSON) ────────────────────────────

type ReviewItemApi = Omit<ReviewItem, 'nextReview' | 'lastSeen'> & {
  nextReview: string
  lastSeen: string
}

interface StatsApi extends Omit<ReviewStats, 'nextReviewAt'> {
  nextReviewAt: string | null
}

interface SessionApi extends Omit<ReviewSession, 'items'> {
  items: ReviewItemApi[]
}

type Phase = 'loading' | 'intro' | 'session' | 'recap'

interface RecapData {
  correctCount: number
  totalCount: number
  masteredCount: number
  earnedStarsTotal: number
  durationMs: number
}

interface PendingAnswer {
  childId: string
  itemId: string
  itemType: string
  wasCorrect: boolean
  responseTimeMs: number
  streak: number
  timestamp: number
}

// ─── Calculs locaux (copie des fonctions pures de spaced-repetition.ts) ──────
// Évite d'importer le module serveur dans un Client Component

function calcEarnedStars(wasCorrect: boolean, ms: number, streak: number): number {
  if (wasCorrect && ms < 3000 && streak >= 5) return 3
  if (wasCorrect && ms < 3000) return 2
  if (wasCorrect) return 1
  return 0
}

function checkMastered(step: number, wasCorrect: boolean): boolean {
  if (!wasCorrect) return false
  return Math.min(step + 1, 5) >= 5
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = new Date(dateStr).getTime() - Date.now()
  if (diffMs <= 0) return 'bientôt'
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''}`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours} heure${diffHours > 1 ? 's' : ''}`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
}

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000)
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return mins > 0 ? `${mins}min ${rem}s` : `${rem}s`
}

// ─── Confettis plein écran ────────────────────────────────────────────────────

function triggerConfetti(): void {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.display = 'block'

  const colors = ['#F5A623', '#FF6B9D', '#00C9B1', '#9B59B6', '#27AE60', '#FFD97D']
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
  }))

  let frame = 0
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.rotation += 2
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
    frame++
    if (frame < 180) requestAnimationFrame(animate)
    else canvas.style.display = 'none'
  }
  animate()
}

// ─── Gestion localStorage pour synchro offline ───────────────────────────────

async function syncPendingAnswers(childId: string): Promise<void> {
  if (typeof window === 'undefined') return
  const key = `noural_pending_${childId}`
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return
    const pending: PendingAnswer[] = JSON.parse(stored) as PendingAnswer[]
    const remaining: PendingAnswer[] = []
    for (const answer of pending) {
      try {
        const res = await fetch('/api/review/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer),
        })
        if (!res.ok) remaining.push(answer)
      } catch {
        remaining.push(answer)
      }
    }
    if (remaining.length === 0) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(remaining))
  } catch {
    // localStorage indisponible
  }
}

// Envoi fire-and-forget — stockage local si réseau défaillant
function submitAnswer(answer: PendingAnswer): void {
  fetch('/api/review/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answer),
  }).catch(() => {
    try {
      const key = `noural_pending_${answer.childId}`
      const stored = localStorage.getItem(key)
      const pending: PendingAnswer[] = stored ? (JSON.parse(stored) as PendingAnswer[]) : []
      pending.push(answer)
      localStorage.setItem(key, JSON.stringify(pending))
    } catch {
      // localStorage indisponible
    }
  })
}

// ─── Lettres arabes décoratives pour le fond ──────────────────────────────────

const ARABIC_DECO = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر']

// ─── Composant auxiliaire ────────────────────────────────────────────────────

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Baloo 2', cursive" }}>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{value}</span>
    </div>
  )
}

// ─── Styles partagés ─────────────────────────────────────────────────────────

const titleStyle: React.CSSProperties = {
  fontFamily: "'Baloo 2', cursive",
  color: '#fff',
  fontSize: '1.6rem',
  fontWeight: 700,
  textAlign: 'center',
  lineHeight: 1.3,
  margin: 0,
}

const btnPrimaryStyle: React.CSSProperties = {
  minHeight: '64px',
  padding: '0 40px',
  background: '#F5A623',
  color: '#1A3A5C',
  border: 'none',
  borderRadius: '20px',
  fontFamily: "'Baloo 2', cursive",
  fontSize: '1.2rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(245,166,35,0.45)',
}

const btnGhostStyle: React.CSSProperties = {
  minHeight: '52px',
  padding: '0 28px',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '16px',
  fontFamily: "'Baloo 2', cursive",
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const wrapStyle: React.CSSProperties = {
  minHeight: '100dvh',
  padding: '24px 16px 40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
  position: 'relative',
  overflow: 'hidden',
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function ReviserPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = use(params)
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('loading')
  const [stats, setStats] = useState<StatsApi | null>(null)
  const [sessionItems, setSessionItems] = useState<ReviewItemApi[]>([])
  const [estimatedMinutes, setEstimatedMinutes] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [recap, setRecap] = useState<RecapData | null>(null)

  const correctRef = useRef(0)
  const masteredRef = useRef(0)
  const starsRef = useRef(0)
  const streakRef = useRef(0)
  const itemStartRef = useRef(Date.now())
  const sessionStartRef = useRef(Date.now())

  // Synchro des réponses en attente au montage
  useEffect(() => {
    syncPendingAnswers(childId)
  }, [childId])

  // Chargement initial : stats + session en parallèle
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sRes, rRes] = await Promise.all([
          fetch(`/api/review?childId=${encodeURIComponent(childId)}&stats=true`),
          fetch(`/api/review?childId=${encodeURIComponent(childId)}`),
        ])
        const statsData = (await sRes.json()) as StatsApi
        const sessionData = (await rRes.json()) as SessionApi
        if (cancelled) return
        setStats(statsData)
        setSessionItems(sessionData.items ?? [])
        setEstimatedMinutes(sessionData.estimatedMinutes ?? 1)
      } catch {
        // Erreur réseau silencieuse — l'intro sera vide mais la page reste accessible
      }
      if (!cancelled) setPhase('intro')
    }
    load()
    return () => { cancelled = true }
  }, [childId])

  const resetRefs = useCallback(() => {
    correctRef.current = 0
    masteredRef.current = 0
    starsRef.current = 0
    streakRef.current = 0
    sessionStartRef.current = Date.now()
    itemStartRef.current = Date.now()
  }, [])

  const startSession = useCallback(() => {
    resetRefs()
    setCurrentIndex(0)
    setFeedback(null)
    setRecap(null)
    setPhase('session')
  }, [resetRefs])

  const handleAnswer = useCallback((wasCorrect: boolean) => {
    const ms = Date.now() - itemStartRef.current
    const item = sessionItems[currentIndex]
    if (!item) return

    streakRef.current = wasCorrect ? streakRef.current + 1 : 0
    const stars = calcEarnedStars(wasCorrect, ms, streakRef.current)
    const nowMastered = checkMastered(item.step, wasCorrect)

    if (wasCorrect) correctRef.current += 1
    if (nowMastered && !item.mastered) masteredRef.current += 1
    starsRef.current += stars

    // Envoi fire-and-forget — jamais bloquant, jamais d'erreur visible
    submitAnswer({
      childId,
      itemId: item.itemId,
      itemType: item.itemType,
      wasCorrect,
      responseTimeMs: ms,
      streak: streakRef.current,
      timestamp: Date.now(),
    })

    setFeedback(wasCorrect ? 'correct' : 'incorrect')

    // Continuation asynchrone — le return void garde la signature attendue par FlashCard
    ;(async () => {
      await sleep(800)
      const isLast = currentIndex + 1 >= sessionItems.length
      if (isLast) {
        setRecap({
          correctCount: correctRef.current,
          totalCount: sessionItems.length,
          masteredCount: masteredRef.current,
          earnedStarsTotal: starsRef.current,
          durationMs: Date.now() - sessionStartRef.current,
        })
        setPhase('recap')
      } else {
        setCurrentIndex((i) => i + 1)
        setFeedback(null)
        itemStartRef.current = Date.now()
      }
    })()
  }, [childId, currentIndex, sessionItems])

  // Confettis si score >= 80 %
  useEffect(() => {
    if (phase === 'recap' && recap) {
      const pct = recap.totalCount > 0 ? recap.correctCount / recap.totalCount : 0
      if (pct >= 0.8) triggerConfetti()
    }
  }, [phase, recap])

  const handleRetry = useCallback(async () => {
    try {
      const res = await fetch(`/api/review?childId=${encodeURIComponent(childId)}`)
      const data = (await res.json()) as SessionApi
      setSessionItems(data.items ?? [])
      setEstimatedMinutes(data.estimatedMinutes ?? 1)
    } catch {
      // Mélange des items existants si réseau défaillant
      setSessionItems((prev) => {
        const shuffled = [...prev]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      })
    }
    resetRefs()
    setCurrentIndex(0)
    setFeedback(null)
    setRecap(null)
    setPhase('session')
  }, [childId, resetRefs])

  // ─── Phase : chargement ──────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div style={wrapStyle}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,166,35,0.2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <p style={{ ...titleStyle, fontSize: '1rem', opacity: 0.6 }}>Chargement...</p>
      </div>
    )
  }

  // ─── Phase : intro ───────────────────────────────────────────────────────

  if (phase === 'intro') {
    // Rien à réviser
    if (!stats || stats.dueNow === 0) {
      return (
        <div style={wrapStyle}>
          <span style={{ fontSize: '5rem', display: 'block', animation: 'float 2s ease-in-out infinite' }}>⭐</span>
          <p style={{ ...titleStyle, fontSize: '1.5rem' }}>✅ Rien à réviser pour l&apos;instant !</p>
          {stats?.nextReviewAt && (
            <p style={{ fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.65)', fontSize: '1rem', textAlign: 'center', margin: 0 }}>
              Reviens dans {formatRelativeTime(stats.nextReviewAt)}
            </p>
          )}
          <button type="button" style={btnGhostStyle} onClick={() => router.push(`/jouer/${childId}`)}>
            Retour au menu
          </button>
        </div>
      )
    }

    // Items à réviser
    return (
      <div style={{ ...wrapStyle }}>
        {/* Lettres arabes décoratives en fond */}
        {ARABIC_DECO.map((letter, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: `${2 + (i % 3)}rem`,
              color: 'rgba(245,166,35,0.10)',
              animation: `float ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
              top: `${8 + (i * 9) % 78}%`,
              left: `${5 + (i * 13) % 85}%`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {letter}
          </span>
        ))}

        <p style={{ ...titleStyle, fontSize: '2.2rem', position: 'relative' }}>🌙</p>
        <p style={{ ...titleStyle, position: 'relative' }}>
          {sessionItems.length} {sessionItems.length === 1 ? 'lettre' : 'lettres'} t&apos;attendent !
        </p>
        <p style={{ fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.65)', fontSize: '1rem', textAlign: 'center', margin: 0, position: 'relative' }}>
          Ça prend environ {estimatedMinutes} minute{estimatedMinutes > 1 ? 's' : ''}
        </p>
        <button type="button" style={{ ...btnPrimaryStyle, position: 'relative' }} onClick={startSession}>
          C&apos;est parti ! ▶️
        </button>
      </div>
    )
  }

  // ─── Phase : session ─────────────────────────────────────────────────────

  if (phase === 'session') {
    const item = sessionItems[currentIndex]
    const remaining = sessionItems.length - currentIndex
    const progress = sessionItems.length > 0 ? (currentIndex / sessionItems.length) * 100 : 0

    return (
      <div style={{ ...wrapStyle, justifyContent: 'flex-start', paddingTop: '20px' }}>
        {/* Barre de progression */}
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>
              {remaining} restante{remaining > 1 ? 's' : ''}
            </span>
            <span style={{ fontFamily: "'Baloo 2', cursive", color: '#F5A623', fontSize: '0.9rem' }}>
              {currentIndex}/{sessionItems.length}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#F5A623', borderRadius: '4px', transition: 'width 400ms ease' }} />
          </div>
        </div>

        {/* FlashCard + overlay feedback */}
        <div style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
          {item && (
            <FlashCard
              key={`${item.itemType}-${item.itemId}`}
              item={item as unknown as ReviewItem}
              onAnswer={handleAnswer}
            />
          )}
          {feedback && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '20px',
                background: feedback === 'correct' ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'popIn 200ms ease',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: '3.5rem' }}>{feedback === 'correct' ? '✅' : '❌'}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Phase : récapitulatif ────────────────────────────────────────────────

  if (phase === 'recap' && recap) {
    const pct = recap.totalCount > 0 ? recap.correctCount / recap.totalCount : 0
    const message =
      pct >= 0.8 ? 'Excellent !! 🎉'
      : pct >= 0.6 ? 'Très bien ! ⭐'
      : pct >= 0.4 ? 'Bien essayé ! 💪'
      : 'Continue à pratiquer ! 🔄'

    return (
      <div style={wrapStyle}>
        {/* Canvas confettis — affiché uniquement via triggerConfetti() */}
        <canvas
          id="confetti-canvas"
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'none', zIndex: 50 }}
        />

        <p style={{ ...titleStyle, fontSize: '1.8rem' }}>{message}</p>

        {/* Stats */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px',
            padding: '20px 24px',
            width: '100%',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <StatLine label="Bonnes réponses" value={`${recap.correctCount}/${recap.totalCount}`} />
          <StatLine label="Étoiles gagnées" value={`⭐ × ${recap.earnedStarsTotal}`} />
          {recap.masteredCount > 0 && (
            <StatLine label="Items maîtrisés" value={`🏆 ${recap.masteredCount}`} />
          )}
          <StatLine label="Durée" value={formatDuration(recap.durationMs)} />
        </div>

        <button type="button" style={btnPrimaryStyle} onClick={handleRetry}>
          Réviser encore
        </button>
        <button type="button" style={btnGhostStyle} onClick={() => router.push(`/jouer/${childId}`)}>
          Retour au menu
        </button>
      </div>
    )
  }

  return null
}
