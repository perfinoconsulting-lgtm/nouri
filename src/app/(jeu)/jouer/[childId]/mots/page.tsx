'use client'

/**
 * app/(jeu)/jouer/[childId]/mots/page.tsx — Jeu des mots arabes thématiques
 *
 * 4 vues : sélection thème → découverte mot par mot → QCM (8 questions) → jeu de mémoire.
 * Sauvegarde la progression via /api/progress/mots après chaque réponse.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { THEMES, MOTS, getMotsByTheme } from '@/lib/data/mots'
import type { Mot, Theme } from '@/lib/data/mots'
import { ThemeCard } from '@/components/game/ThemeCard'
import { WordCard } from '@/components/game/WordCard'
import { MemoryGame } from '@/components/game/MemoryGame'
import { RewardSystem } from '@/components/game/RewardSystem'
import { useRewards } from '@/lib/reward-context'

// ─── Types ────────────────────────────────────────────────────────────────────

type CurrentView = 'themes' | 'decouverte' | 'qcm' | 'memoire'
type QcmType = 'A' | 'B' | 'C'

interface QcmQuestion {
  type: QcmType
  mot: Mot
  choices: Mot[]
  correctIndex: number
}

interface PendingAnswer {
  childId: string
  motId: string
  wasCorrect: boolean
  responseTimeMs: number
  gameType: 'qcm' | 'memoire' | 'decouverte'
}

// ─── Messages d'encouragement ─────────────────────────────────────────────────

const MESSAGES_CORRECT = [
  'Excellent ! 🌟',
  'Bravo ! ⭐',
  'Super ! 💪',
  'MachAllah ! 🎉',
]
const MESSAGES_WRONG = [
  'Pas grave ! 🔄',
  'Presque ! 👀',
  'Continue ! 💪',
]

// ─── Utilitaires QCM ──────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Construit 8 questions QCM en rotation de types A → B → C pour les mots d'un thème
function buildQuestions(mots: Mot[]): QcmQuestion[] {
  const CYCLE: QcmType[] = ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B']
  const questions: QcmQuestion[] = []

  for (let i = 0; i < 8; i++) {
    const mot = mots[i % mots.length]
    const type = CYCLE[i]

    // 3 distracteurs tirés des autres mots du catalogue global
    const distractors = shuffleArray(MOTS.filter((m) => m.id !== mot.id)).slice(0, 3)
    const choices = shuffleArray([mot, ...distractors])
    const correctIndex = choices.findIndex((c) => c.id === mot.id)

    questions.push({ type, mot, choices, correctIndex })
  }

  return questions
}

// ─── Composant interne (nécessite RewardSystem en parent) ─────────────────────

function MotsGameInner() {
  const params = useParams()
  const router = useRouter()
  const childId = params?.childId as string
  const { triggerConfetti, playCorrect, playWrong } = useRewards()

  // État des vues
  const [currentView, setCurrentView] = useState<CurrentView>('themes')
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [currentMotIndex, setCurrentMotIndex] = useState(0)

  // Map contenu_ar → score pour l'affichage de la progression
  const [progress, setProgress] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  // État QCM
  const [questions, setQuestions] = useState<QcmQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [qcmScore, setQcmScore] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [qcmFinished, setQcmFinished] = useState(false)

  // File d'attente des réponses à synchroniser
  const pendingRef = useRef<PendingAnswer[]>([])

  // ── Synchronisation des réponses en attente ──────────────────────────────────

  const syncAnswers = useCallback(async () => {
    const pending = [...pendingRef.current]
    if (pending.length === 0) return
    pendingRef.current = []

    const failed: PendingAnswer[] = []
    for (const item of pending) {
      try {
        const res = await fetch('/api/progress/mots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
        if (!res.ok) failed.push(item)
      } catch {
        // Mode hors-ligne : conserver pour la prochaine tentative
        failed.push(item)
      }
    }

    if (failed.length > 0) {
      pendingRef.current = [...failed, ...pendingRef.current]
      localStorage.setItem(
        `lisani_offline_mots_${childId}`,
        JSON.stringify(pendingRef.current),
      )
    } else {
      localStorage.removeItem(`lisani_offline_mots_${childId}`)
    }
  }, [childId])

  // ── Chargement de la progression depuis la base ───────────────────────────────

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/children/${childId}/progress`)
      if (!res.ok) return
      const data = await res.json() as {
        progress: { type: string; contenu_ar: string; score: number }[]
      }
      const map = new Map<string, number>()
      data.progress
        .filter((p) => p.type === 'mot')
        .forEach((p) => map.set(p.contenu_ar, p.score))
      setProgress(map)
    } catch {
      // Silencieux : on joue sans progression
    } finally {
      setLoading(false)
    }
  }, [childId])

  // ── Init + sauvegarde automatique toutes les 30s ──────────────────────────────

  useEffect(() => {
    if (!childId) return

    const stored = localStorage.getItem(`lisani_offline_mots_${childId}`)
    if (stored) {
      try { pendingRef.current = JSON.parse(stored) as PendingAnswer[] } catch { /* ignore */ }
    }

    fetchProgress()

    const interval = setInterval(syncAnswers, 30_000)
    return () => {
      clearInterval(interval)
      syncAnswers()
    }
  }, [childId, fetchProgress, syncAnswers])

  // ── Calcul de la progression par thème (score >= 80 = appris) ────────────────

  const getThemeProgression = useCallback((theme: Theme) => {
    const learned = theme.mots.filter((m) => (progress.get(m.ar) ?? 0) >= 80).length
    return { learned, total: theme.mots.length }
  }, [progress])

  // ── Handlers — vue thèmes ─────────────────────────────────────────────────────

  const handleSelectTheme = (slug: string) => {
    setSelectedTheme(slug)
    setCurrentMotIndex(0)
    setCurrentView('decouverte')
  }

  // ── Handlers — vue découverte ─────────────────────────────────────────────────

  // Déclenché par WordCard quand l'enfant clique "Écouter" — marque le mot comme vu
  const handleListen = useCallback(() => {
    const mots = getMotsByTheme(selectedTheme ?? '')
    const mot = mots[currentMotIndex]
    if (!mot) return
    pendingRef.current.push({
      childId,
      motId: mot.id,
      wasCorrect: true,
      responseTimeMs: 5_000,
      gameType: 'decouverte',
    })
  }, [selectedTheme, currentMotIndex, childId])

  const handleStartQcm = useCallback(() => {
    const mots = getMotsByTheme(selectedTheme ?? '')
    setQuestions(buildQuestions(mots))
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setQcmScore(0)
    setQcmFinished(false)
    setQuestionStartTime(Date.now())
    setCurrentView('qcm')
  }, [selectedTheme])

  // ── Handlers — vue QCM ───────────────────────────────────────────────────────

  const handleAnswer = useCallback((choiceIndex: number) => {
    if (selectedAnswer !== null) return

    const question = questions[currentQuestionIndex]
    if (!question) return

    const responseTimeMs = Date.now() - questionStartTime
    const isCorrect = choiceIndex === question.correctIndex
    const newScore = isCorrect ? qcmScore + 1 : qcmScore

    setSelectedAnswer(choiceIndex)

    if (isCorrect) {
      playCorrect()
      setQcmScore(newScore)
    } else {
      playWrong()
    }

    pendingRef.current.push({
      childId,
      motId: question.mot.id,
      wasCorrect: isCorrect,
      responseTimeMs,
      gameType: 'qcm',
    })
    localStorage.setItem(
      `lisani_offline_mots_${childId}`,
      JSON.stringify(pendingRef.current),
    )

    // Avancer automatiquement après feedback de 800ms
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex >= questions.length) {
        setQcmFinished(true)
        if (newScore >= 6) triggerConfetti('full')
        syncAnswers()
      } else {
        setCurrentQuestionIndex(nextIndex)
        setSelectedAnswer(null)
        setQuestionStartTime(Date.now())
      }
    }, 800)
  }, [
    selectedAnswer, questions, currentQuestionIndex, questionStartTime,
    qcmScore, playCorrect, playWrong, childId, triggerConfetti, syncAnswers,
  ])

  // ── Handler — vue mémoire ─────────────────────────────────────────────────────

  const handleMemoryComplete = useCallback(async (_moves: number, time: number) => {
    const gameMots = getMotsByTheme(selectedTheme ?? '').slice(0, 4)
    const avgResponseMs = gameMots.length > 0
      ? Math.round((time * 1000) / gameMots.length)
      : 5_000

    for (const mot of gameMots) {
      pendingRef.current.push({
        childId,
        motId: mot.id,
        wasCorrect: true,
        responseTimeMs: avgResponseMs,
        gameType: 'memoire',
      })
    }

    await syncAnswers()

    setTimeout(() => {
      setCurrentView('themes')
      setSelectedTheme(null)
    }, 1_500)
  }, [selectedTheme, childId, syncAnswers])

  // ── Squelette de chargement ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]" />
          <p className="font-baloo text-lg font-bold text-white/80">
            Chargement des mots...
          </p>
        </div>
      </div>
    )
  }

  const themeMots = selectedTheme ? getMotsByTheme(selectedTheme) : []
  const currentMot = themeMots[currentMotIndex]
  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">

      {/* ══════════════════════════════════════════════
          VUE 1 — SÉLECTION DU THÈME
      ══════════════════════════════════════════════ */}
      {currentView === 'themes' && (
        <div className="flex flex-col">
          <button
            onClick={() => router.push(`/jouer/${childId}`)}
            className="self-start mb-6 py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 flex items-center gap-2 border border-white/5 font-baloo"
          >
            <span>🏰</span> Retour à la carte
          </button>

          <h1 className="text-3xl font-black text-white text-center mb-1 font-baloo">
            Les Mots <span style={{ color: '#F5A623' }}>💬</span>
          </h1>
          <p className="text-white/60 text-center font-baloo mb-6 text-lg">
            Choisis un thème !
          </p>

          {/* Grille 2 colonnes mobile / 3 colonnes desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {THEMES.map((theme) => (
              <div
                key={theme.slug}
                onClick={() => handleSelectTheme(theme.slug)}
                className="cursor-pointer"
              >
                <ThemeCard
                  theme={theme}
                  progression={getThemeProgression(theme)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 2 — DÉCOUVERTE MOT PAR MOT
      ══════════════════════════════════════════════ */}
      {currentView === 'decouverte' && selectedTheme && currentMot && (
        <div className="flex flex-col items-center gap-5">

          {/* Barre du haut */}
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setCurrentView('themes')}
              className="py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
            >
              ← Retour
            </button>
            <p className="font-baloo text-white/50 text-sm">
              Mot {currentMotIndex + 1} sur {themeMots.length}
            </p>
          </div>

          {/* Indicateurs de progression cliquables */}
          <div className="flex gap-2 items-center flex-wrap justify-center">
            {themeMots.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentMotIndex(idx)}
                className="rounded-full transition-all active:scale-90"
                style={{
                  width: idx === currentMotIndex ? 38 : 30,
                  height: idx === currentMotIndex ? 38 : 30,
                  background:
                    idx < currentMotIndex
                      ? 'rgba(0,201,177,0.7)'
                      : idx === currentMotIndex
                        ? '#F5A623'
                        : 'rgba(255,255,255,0.15)',
                  border: idx === currentMotIndex ? '2px solid #F5A623' : '2px solid transparent',
                  boxShadow: idx === currentMotIndex ? '0 0 12px rgba(245,166,35,0.5)' : 'none',
                }}
                aria-label={`Mot ${idx + 1}`}
              />
            ))}
          </div>

          {/* Carte du mot courant avec exemple */}
          <div className="w-full max-w-sm">
            <WordCard
              mot={currentMot}
              showExample={true}
              onListen={handleListen}
            />
          </div>

          {/* Navigation flèches */}
          <div className="flex gap-3 items-center w-full max-w-sm justify-between">
            <button
              onClick={() => setCurrentMotIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentMotIndex === 0}
              className="font-bold rounded-2xl transition-all active:scale-95 font-baloo text-lg disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                minHeight: 52,
                minWidth: 72,
                padding: '0 16px',
              }}
            >
              ←
            </button>

            {currentMotIndex < themeMots.length - 1 ? (
              <button
                onClick={() => setCurrentMotIndex((prev) => prev + 1)}
                className="font-black rounded-2xl transition-all active:scale-95 font-baloo text-xl flex-1"
                style={{
                  background: '#F5A623',
                  color: '#1A3A5C',
                  minHeight: 52,
                  padding: '0 20px',
                }}
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleStartQcm}
                className="font-black rounded-2xl transition-all active:scale-95 font-baloo flex-1 flex items-center justify-center gap-2"
                style={{
                  background: '#00C9B1',
                  color: 'white',
                  minHeight: 52,
                  padding: '0 16px',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(0,201,177,0.35)',
                }}
              >
                Faire le quiz ! →
              </button>
            )}
          </div>

          {/* Raccourcis directs vers quiz et mémoire */}
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={handleStartQcm}
              className="flex-1 font-bold rounded-2xl text-sm transition-all active:scale-95 font-baloo"
              style={{
                background: 'rgba(245,166,35,0.15)',
                border: '1px solid rgba(245,166,35,0.3)',
                color: '#F5A623',
                minHeight: 44,
              }}
            >
              📝 Quiz
            </button>
            <button
              onClick={() => setCurrentView('memoire')}
              className="flex-1 font-bold rounded-2xl text-sm transition-all active:scale-95 font-baloo"
              style={{
                background: 'rgba(0,201,177,0.15)',
                border: '1px solid rgba(0,201,177,0.3)',
                color: '#00C9B1',
                minHeight: 44,
              }}
            >
              🃏 Mémoire
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 3A — QCM EN COURS
      ══════════════════════════════════════════════ */}
      {currentView === 'qcm' && !qcmFinished && currentQuestion && (
        <div className="flex flex-col items-center gap-5">

          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => { setCurrentView('decouverte'); setCurrentMotIndex(0) }}
              className="py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
            >
              ← Retour
            </button>
            <p className="font-baloo text-white/50 text-sm">
              Question {currentQuestionIndex + 1}/{questions.length}
            </p>
          </div>

          {/* Contenu de la question selon le type */}
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {/* Type A — emoji + fr → mot arabe */}
            {currentQuestion.type === 'A' && (
              <>
                <p className="font-baloo text-white/60 text-sm text-center">
                  Quel est ce mot en arabe ?
                </p>
                <span style={{ fontSize: '4.5rem', lineHeight: 1 }} aria-hidden="true">
                  {currentQuestion.mot.emoji}
                </span>
                <span className="font-baloo text-xl font-bold text-white">
                  {currentQuestion.mot.fr}
                </span>
              </>
            )}

            {/* Type B — mot arabe → emoji */}
            {currentQuestion.type === 'B' && (
              <>
                <p className="font-baloo text-white/60 text-sm text-center">
                  Quelle image correspond ?
                </p>
                <span
                  dir="rtl"
                  style={{
                    fontFamily: "'Noto Naskh Arabic', serif",
                    fontSize: '3rem',
                    color: '#F5A623',
                    direction: 'rtl',
                    lineHeight: 1.2,
                  }}
                >
                  {currentQuestion.mot.ar}
                </span>
                <span className="font-baloo text-sm italic text-white/50">
                  {currentQuestion.mot.transliteration}
                </span>
              </>
            )}

            {/* Type C — français + emoji → mot arabe */}
            {currentQuestion.type === 'C' && (
              <>
                <p className="font-baloo text-white/60 text-sm text-center">
                  Comment dit-on en arabe ?
                </p>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '2.5rem' }} aria-hidden="true">
                    {currentQuestion.mot.emoji}
                  </span>
                  <span className="font-baloo text-3xl font-black text-white">
                    {currentQuestion.mot.fr}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Boutons de choix (grille 2×2) */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {currentQuestion.choices.map((choice, idx) => {
              let bgColor = 'rgba(255,255,255,0.08)'
              let borderColor = 'rgba(255,255,255,0.15)'
              let arColor = '#F5A623'

              if (selectedAnswer !== null) {
                if (idx === currentQuestion.correctIndex) {
                  bgColor = 'rgba(39,174,96,0.35)'
                  borderColor = '#27AE60'
                  arColor = '#27AE60'
                } else if (idx === selectedAnswer) {
                  bgColor = 'rgba(231,76,60,0.35)'
                  borderColor = '#E74C3C'
                  arColor = '#E74C3C'
                }
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className="rounded-[16px] flex items-center justify-center transition-all active:scale-95 disabled:cursor-default"
                  style={{ background: bgColor, border: `2px solid ${borderColor}`, minHeight: 80, padding: '12px' }}
                >
                  {currentQuestion.type === 'B' ? (
                    // Choix par emoji
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden="true">
                      {choice.emoji}
                    </span>
                  ) : (
                    // Choix par mot arabe (Types A et C)
                    <span
                      dir="rtl"
                      style={{
                        fontFamily: "'Noto Naskh Arabic', serif",
                        fontSize: '1.8rem',
                        color: arColor,
                        direction: 'rtl',
                        lineHeight: 1.3,
                        textAlign: 'center',
                      }}
                    >
                      {choice.ar}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Feedback immédiat */}
          {selectedAnswer !== null && (
            <p
              className="font-baloo font-bold text-lg text-center"
              style={{
                color: selectedAnswer === currentQuestion.correctIndex ? '#27AE60' : '#E74C3C',
              }}
            >
              {selectedAnswer === currentQuestion.correctIndex
                ? MESSAGES_CORRECT[currentQuestionIndex % MESSAGES_CORRECT.length]
                : MESSAGES_WRONG[currentQuestionIndex % MESSAGES_WRONG.length]}
            </p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 3B — QCM TERMINÉ
      ══════════════════════════════════════════════ */}
      {currentView === 'qcm' && qcmFinished && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-3xl font-black text-white font-baloo text-center">
            Quiz terminé ! 🎉
          </h2>

          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span
              className="text-6xl font-black font-baloo"
              style={{ color: qcmScore >= 6 ? '#00C9B1' : '#F5A623' }}
            >
              {qcmScore}/{questions.length}
            </span>
            <p className="font-baloo text-white/70 text-center text-base">
              {qcmScore >= 6
                ? 'Excellent ! Tu connais bien ces mots !'
                : 'Continue de pratiquer, tu vas y arriver !'}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={() => setCurrentView('memoire')}
              className="font-black rounded-2xl transition-all active:scale-95 font-baloo flex items-center justify-center gap-2"
              style={{
                background: '#00C9B1',
                color: 'white',
                minHeight: 56,
                fontSize: '1.1rem',
              }}
            >
              🃏 Jeu de mémoire
            </button>
            <button
              onClick={handleStartQcm}
              className="font-bold rounded-2xl transition-all active:scale-95 font-baloo"
              style={{
                background: 'rgba(245,166,35,0.15)',
                border: '1px solid rgba(245,166,35,0.3)',
                color: '#F5A623',
                minHeight: 52,
              }}
            >
              Réessayer le quiz
            </button>
            <button
              onClick={() => { setCurrentView('decouverte'); setCurrentMotIndex(0) }}
              className="font-bold rounded-2xl transition-all active:scale-95 font-baloo"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                minHeight: 52,
              }}
            >
              ← Revoir les mots
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 4 — JEU DE MÉMOIRE
      ══════════════════════════════════════════════ */}
      {currentView === 'memoire' && selectedTheme && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setCurrentView('decouverte')}
            className="self-start py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
          >
            ← Retour
          </button>

          <h2 className="text-2xl font-black text-white font-baloo text-center">
            Jeu de mémoire 🃏
          </h2>

          {themeMots.length >= 4 ? (
            <MemoryGame
              mots={themeMots.slice(0, 4)}
              onComplete={handleMemoryComplete}
            />
          ) : (
            <p className="text-center font-baloo py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Pas assez de mots pour ce jeu.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Composant exporté (enveloppe RewardSystem) ───────────────────────────────

export default function MotsGame() {
  return (
    <RewardSystem>
      <MotsGameInner />
    </RewardSystem>
  )
}
