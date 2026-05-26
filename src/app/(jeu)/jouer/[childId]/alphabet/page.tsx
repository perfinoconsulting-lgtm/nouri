'use client'

/**
 * app/(jeu)/jouer/[childId]/alphabet/page.tsx — Page de jeu de l'alphabet (Client Component)
 *
 * Assemble la grille de l'alphabet, le détail de la lettre, le QCM et le canvas de tracé.
 * Gère le cycle de vie de la session (POST start, PATCH end) et la sauvegarde de la progression.
 * Comprend un mécanisme d'updates optimistes, de sauvegarde automatique debouncée (30s),
 * et un mode hors-ligne avec stockage local.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlphabetGrid } from '@/components/game/AlphabetGrid'
import { LetterDetail } from '@/components/game/LetterDetail'
import { MiniQCM } from '@/components/game/MiniQCM'
import WritingCanvas from '@/components/game/WritingCanvas'
import { RewardSystem } from '@/components/game/RewardSystem'
import { LETTERS } from '@/lib/data/letters'

interface QueuedResponse {
  childId: string
  itemId: string
  wasCorrect: boolean
  responseTimeMs: number
}

export default function AlphabetGame() {
  const params = useParams()
  const router = useRouter()
  const childId = params?.childId as string

  // --- États principaux ---
  const [currentView, setCurrentView] = useState<'grid' | 'detail' | 'quiz' | 'writing'>('grid')
  const [selectedLetter, setSelectedLetter] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Statistiques de la session en cours
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    wrong: 0,
    startTime: new Date(),
  })

  // Progression de l'enfant : lettreIndex -> score (0-100)
  const [progress, setProgress] = useState<Map<number, number>>(new Map())

  // --- Références pour éviter les closures périmées (unmount/cleanup) ---
  const sessionIdRef = useRef<string | null>(null)
  const sessionStatsRef = useRef({ correct: 0, wrong: 0 })
  const pendingRef = useRef<QueuedResponse[]>([])

  // Temps de référence pour calculer les réponses
  const lastQuestionTimeRef = useRef<number>(Date.now())
  const writingStartTimeRef = useRef<number>(Date.now())

  // Synchronisation des états locaux vers les refs
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    sessionStatsRef.current = { correct: sessionStats.correct, wrong: sessionStats.wrong }
  }, [sessionStats])

  // --- Fonctions de synchronisation et APIs ---

  // Synchronise les réponses en attente (file d'attente / mode hors-ligne)
  const syncAnswers = useCallback(async () => {
    const pending = [...pendingRef.current]
    if (pending.length === 0) return

    // Vider temporairement pour éviter la double soumission
    pendingRef.current = []

    const failed: QueuedResponse[] = []
    
    for (const res of pending) {
      try {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(res),
        })

        if (!response.ok) {
          failed.push(res)
        }
      } catch (err) {
        failed.push(res)
        // Log silencieux pour l'enfant
        console.warn('[Progress Sync API Error]: Échec d\'envoi silencieux (hors-ligne)', err)
      }
    }

    // Si des envois ont échoué, on les replace dans la file d'attente et dans localStorage
    if (failed.length > 0) {
      pendingRef.current = [...failed, ...pendingRef.current]
      localStorage.setItem(`nouri_offline_progress_${childId}`, JSON.stringify(pendingRef.current))
    } else {
      localStorage.removeItem(`nouri_offline_progress_${childId}`)
    }
  }, [childId])

  // Démarre la session de jeu
  const startSession = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, moduleSlug: 'alphabet' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.sessionId)
      }
    } catch (err) {
      console.warn('[Sessions Start API Error]: Échec du démarrage de session silencieux', err)
    }
  }, [childId])

  // Charge la progression de l'enfant depuis la base de données
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/children/${childId}/progress`)
      if (res.ok) {
        const data = await res.json()
        const newMap = new Map<number, number>()
        
        interface DbProgressItem {
          contenu_ar: string
          score: number
        }

        data.progress.forEach((p: DbProgressItem) => {
          // Trouver l'index pédagogique basé sur contenu_ar
          const letter = LETTERS.find((l) => l.formes?.isol === p.contenu_ar || l.ar === p.contenu_ar)
          if (letter) {
            newMap.set(letter.index, p.score)
          }
        })
        setProgress(newMap)
      }
    } catch (err) {
      console.warn('[Progress Load API Error]: Échec du chargement de la progression silencieux', err)
    } finally {
      setLoading(false)
    }
  }, [childId])

  // --- Gestion de la progression et des réponses ---

  const recordAnswer = (wasCorrect: boolean, responseTimeMs: number) => {
    if (selectedLetter === null) return

    // 1. Mise à jour des stats de session locales
    setSessionStats((prev) => ({
      ...prev,
      correct: prev.correct + (wasCorrect ? 1 : 0),
      wrong: prev.wrong + (wasCorrect ? 0 : 1),
    }))

    // 2. Mise à jour optimiste du score local (sans attendre la réponse API)
    const currentScore = progress.get(selectedLetter) ?? 0
    let bonus = 0

    if (wasCorrect) {
      if (responseTimeMs < 3000) bonus = 20
      else if (responseTimeMs < 10000) bonus = 10
      else bonus = 5
    } else {
      bonus = -15
    }

    const newScore = Math.max(0, Math.min(100, currentScore + bonus))

    setProgress((prev) => {
      const nextMap = new Map(prev)
      nextMap.set(selectedLetter, newScore)
      return nextMap
    })

    // 3. Ajout à la file d'attente
    const responseItem: QueuedResponse = {
      childId,
      itemId: `lettre_${selectedLetter}`,
      wasCorrect,
      responseTimeMs,
    }

    pendingRef.current.push(responseItem)
    localStorage.setItem(`nouri_offline_progress_${childId}`, JSON.stringify(pendingRef.current))
  }

  // --- Cycles de vie ---

  useEffect(() => {
    if (!childId) return

    const init = async () => {
      // 1. Charger et synchroniser les réponses hors-ligne stockées au préalable
      const stored = localStorage.getItem(`nouri_offline_progress_${childId}`)
      if (stored) {
        try {
          pendingRef.current = JSON.parse(stored)
          await syncAnswers()
        } catch (e) {
          console.error('[Offline Recovery] Format localStorage invalide :', e)
        }
      }

      // 2. Démarrer la session
      await startSession()

      // 3. Charger le progrès initial
      await fetchProgress()
    }

    init()

    // 4. Lancer une sauvegarde automatique debouncée (toutes les 30s)
    const interval = setInterval(() => {
      syncAnswers()
    }, 30000)

    // Cleanup au démontage de la page
    return () => {
      clearInterval(interval)
      
      // Synchroniser immédiatement les réponses restantes
      syncAnswers()

      // Envoyer la fin de session
      if (sessionIdRef.current) {
        const stats = sessionStatsRef.current
        const body = JSON.stringify({
          sessionId: sessionIdRef.current,
          itemsReviewed: stats.correct + stats.wrong,
          correctAnswers: stats.correct,
        })

        // Utilisation de fetch normal (suffisant pour le routage interne NextJS)
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).catch((err) => {
          console.warn('[Sessions End API Error]: Échec de clôture silencieuse', err)
        })
      }
    }
  }, [childId, fetchProgress, startSession, syncAnswers])

  // --- Chargement skeleton ---
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]"></div>
          <p className="font-baloo text-lg font-bold text-white/80">Chargement de l&apos;alphabet...</p>
        </div>
      </div>
    )
  }

  return (
    <RewardSystem>
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        
        {/* VUE 1 : GRILLE DES LETTRES */}
        {currentView === 'grid' && (
          <div className="flex flex-col">
            <button
              onClick={() => router.push(`/jouer/${childId}`)}
              className="self-start mb-6 py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 flex items-center gap-2 border border-white/5 font-baloo"
            >
              <span>🏰</span> Retour à la carte
            </button>
            <h1 className="text-3xl font-black text-white text-center mb-6 font-baloo leading-tight">
              L&apos;alphabet arabe <span className="text-[#F5A623]">الحروف</span>
            </h1>
            <AlphabetGrid
              progress={progress}
              onSelectLetter={(index) => {
                setSelectedLetter(index)
                setCurrentView('detail')
              }}
            />
          </div>
        )}

        {/* VUE 2 : DÉTAIL DE LA LETTRE */}
        {currentView === 'detail' && selectedLetter !== null && (
          <div className="w-full">
            <LetterDetail
              letterIndex={selectedLetter}
              onGoToQuiz={() => {
                setCurrentView('quiz')
                lastQuestionTimeRef.current = Date.now()
              }}
              onGoToWriting={() => {
                setCurrentView('writing')
                writingStartTimeRef.current = Date.now()
              }}
              onClose={() => {
                setCurrentView('grid')
                setSelectedLetter(null)
              }}
              onNext={() => {
                setSelectedLetter((prev) => (prev !== null ? Math.min(27, prev + 1) : 0))
              }}
              onPrev={() => {
                setSelectedLetter((prev) => (prev !== null ? Math.max(0, prev - 1) : 0))
              }}
            />
          </div>
        )}

        {/* VUE 3 : MINI QCM */}
        {currentView === 'quiz' && selectedLetter !== null && (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => setCurrentView('detail')}
              className="self-start py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
            >
              ← Retour au détail
            </button>
            <MiniQCM
              letterIndex={selectedLetter}
              allLetters={LETTERS}
              onAnswer={(correct) => {
                const now = Date.now()
                const elapsed = now - lastQuestionTimeRef.current
                lastQuestionTimeRef.current = now
                recordAnswer(correct, elapsed)
              }}
              onFinish={() => {
                // Retourne au détail après que l'enfant ait terminé le quiz
                setTimeout(() => {
                  setCurrentView('detail')
                }, 2000)
              }}
            />
          </div>
        )}

        {/* VUE 4 : TRACÉ D&apos;ÉCRITURE */}
        {currentView === 'writing' && selectedLetter !== null && (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => setCurrentView('detail')}
              className="self-start py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
            >
              ← Retour au détail
            </button>
            <WritingCanvas
              letterIndex={selectedLetter}
              onValidated={(score, points) => {
                // Le tracé a été validé et auto-évalué avec succès par l'enfant
                const now = Date.now()
                const elapsed = now - writingStartTimeRef.current
                recordAnswer(true, elapsed)
                
                // Rediriger vers l'écran de détail
                setCurrentView('detail')
              }}
              onSkip={() => {
                setCurrentView('detail')
              }}
            />
          </div>
        )}

      </div>
    </RewardSystem>
  )
}
