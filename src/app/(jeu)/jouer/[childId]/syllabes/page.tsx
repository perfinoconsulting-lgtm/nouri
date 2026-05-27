'use client'

/**
 * app/(jeu)/jouer/[childId]/syllabes/page.tsx — Jeu des syllabes arabes
 *
 * 4 vues : sélection lettre → découverte animée → quiz → assemblage de mots.
 * Sauvegarde la progression via /api/progress/syllabes toutes les 30s.
 */

import { useState, useEffect, useRef, useCallback, JSX } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LETTERS } from '@/lib/data/letters'
import { getSyllabesForSession } from '@/lib/data/syllabes'
import type { Syllabe } from '@/lib/data/syllabes'
import { SyllableQuiz } from '@/components/game/SyllableQuiz'
import WordAssembler from '@/components/game/WordAssembler'
import { RewardSystem } from '@/components/game/RewardSystem'
import { speakArabic } from '@/lib/arabic-tts'

type CurrentView = 'select' | 'decouverte' | 'lecture' | 'assemblage'

interface SessionStats {
  correct: number
  wrong: number
  startTime: Date
}

interface WordData {
  ar: string
  fr: string
  emoji: string
  syllabes: string[]
}

interface PendingAnswer {
  childId: string
  syllabeId: string
  wasCorrect: boolean
  responseTimeMs: number
}

// Surligne la lettre de base dans un mot arabe (approche caractère par caractère)
function highlightLetterInWord(word: string, targetLetter: string): JSX.Element {
  return (
    <span dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.8rem' }}>
      {word.split('').map((char, i) => (
        <span key={i} style={{ color: char === targetLetter ? '#F5A623' : 'white' }}>
          {char}
        </span>
      ))}
    </span>
  )
}

// Un mot par lettre (index 0-27) pour la vue assemblage
const MOTS_PAR_LETTRE: Record<number, WordData> = {
  0:  { ar: 'أَسَد',    fr: 'lion',      emoji: '🦁',  syllabes: ['a', 'sa', 'd_sukun'] },
  1:  { ar: 'وَلَد',    fr: 'garçon',    emoji: '👦',  syllabes: ['wa', 'la', 'd_sukun'] },
  2:  { ar: 'رَمَل',    fr: 'sable',     emoji: '🏖️',  syllabes: ['ra', 'ma', 'l_sukun'] },
  3:  { ar: 'زَيْت',    fr: 'huile',     emoji: '🫒',  syllabes: ['za', 'y_sukun', 't_sukun'] },
  4:  { ar: 'بَيْت',    fr: 'maison',    emoji: '🏠',  syllabes: ['ba', 'y_sukun', 't_sukun'] },
  5:  { ar: 'تَمْر',    fr: 'datte',     emoji: '🌴',  syllabes: ['ta', 'm_sukun', 'r_sukun'] },
  6:  { ar: 'ثَعْلَب',  fr: 'renard',    emoji: '🦊',  syllabes: ['tha', 'ay_sukun', 'la', 'b_sukun'] },
  7:  { ar: 'جَمَل',    fr: 'chameau',   emoji: '🐪',  syllabes: ['dja', 'ma', 'l_sukun'] },
  8:  { ar: 'حَلِيب',   fr: 'lait',      emoji: '🥛',  syllabes: ['hha', 'li', 'b_sukun'] },
  9:  { ar: 'خَرُوف',   fr: 'mouton',    emoji: '🐑',  syllabes: ['kha', 'rou', 'f_sukun'] },
  10: { ar: 'سَمَك',    fr: 'poisson',   emoji: '🐟',  syllabes: ['sa', 'ma', 'k_sukun'] },
  11: { ar: 'شَمْس',    fr: 'soleil',    emoji: '☀️',  syllabes: ['cha', 'm_sukun', 's_sukun'] },
  12: { ar: 'صَابُون',  fr: 'savon',     emoji: '🧼',  syllabes: ['ssa', 'bou', 'n_sukun'] },
  13: { ar: 'ضَوْء',    fr: 'lumière',   emoji: '💡',  syllabes: ['dda', 'w_sukun'] },
  14: { ar: 'طَفْل',    fr: 'enfant',    emoji: '👶',  syllabes: ['tta', 'f_sukun', 'l_sukun'] },
  15: { ar: 'ظَبْي',    fr: 'gazelle',   emoji: '🦌',  syllabes: ['zza', 'b_sukun', 'y_sukun'] },
  16: { ar: 'عَسَل',    fr: 'miel',      emoji: '🍯',  syllabes: ['aya', 'sa', 'l_sukun'] },
  17: { ar: 'غُرَاب',   fr: 'corbeau',   emoji: '🐦',  syllabes: ['ghou', 'ra', 'b_sukun'] },
  18: { ar: 'فِيل',     fr: 'éléphant',  emoji: '🐘',  syllabes: ['fi', 'y_sukun', 'l_sukun'] },
  19: { ar: 'قَمَر',    fr: 'lune',      emoji: '🌙',  syllabes: ['qa', 'ma', 'r_sukun'] },
  20: { ar: 'كَلْب',    fr: 'chien',     emoji: '🐶',  syllabes: ['ka', 'l_sukun', 'b_sukun'] },
  21: { ar: 'لَيْل',    fr: 'nuit',      emoji: '🌙',  syllabes: ['la', 'y_sukun', 'l_sukun'] },
  22: { ar: 'مَاء',     fr: 'eau',       emoji: '💧',  syllabes: ['ma', 'a_sukun'] },
  23: { ar: 'نَهْر',    fr: 'rivière',   emoji: '🏞️',  syllabes: ['na', 'h_sukun', 'r_sukun'] },
  24: { ar: 'هِلال',    fr: 'croissant', emoji: '🌙',  syllabes: ['hi', 'la', 'l_sukun'] },
  25: { ar: 'يَد',      fr: 'main',      emoji: '🤚',  syllabes: ['ya', 'd_sukun'] },
  26: { ar: 'دُبّ',     fr: 'ours',      emoji: '🐻',  syllabes: ['dou', 'b_sukun'] },
  27: { ar: 'ذَهَب',    fr: 'or',        emoji: '🪙',  syllabes: ['dha', 'ha', 'b_sukun'] },
}

// ─── Composant interne (nécessite RewardSystem en parent) ─────────────────────

function SyllabesGameInner() {
  const params = useParams()
  const router = useRouter()
  const childId = params?.childId as string

  // États principaux
  const [currentView, setCurrentView] = useState<CurrentView>('select')
  const [selectedLettre, setSelectedLettre] = useState<number | null>(null)
  const [currentSyllabeIndex, setCurrentSyllabeIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    wrong: 0,
    startTime: new Date(),
  })
  // Map syllabe.id → score (0-100) chargé depuis la base
  const [progress, setProgress] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // Phase d'animation : 'base' = lettre grise / 'syllabe' = syllabe dorée animée
  const [animPhase, setAnimPhase] = useState<'base' | 'syllabe'>('base')

  // Références stables pour le cleanup sans stale closure
  const pendingRef = useRef<PendingAnswer[]>([])
  const sessionStatsRef = useRef({ correct: 0, wrong: 0 })

  useEffect(() => {
    sessionStatsRef.current = { correct: sessionStats.correct, wrong: sessionStats.wrong }
  }, [sessionStats])

  // ── Synchronisation des réponses en attente ──────────────────────────────────

  const syncAnswers = useCallback(async () => {
    const pending = [...pendingRef.current]
    if (pending.length === 0) return
    pendingRef.current = []

    const failed: PendingAnswer[] = []
    for (const item of pending) {
      try {
        const res = await fetch('/api/progress/syllabes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
        if (!res.ok) failed.push(item)
      } catch {
        // Mode hors-ligne : on remet dans la file
        failed.push(item)
      }
    }

    if (failed.length > 0) {
      pendingRef.current = [...failed, ...pendingRef.current]
      localStorage.setItem(
        `nouri_offline_syllabes_${childId}`,
        JSON.stringify(pendingRef.current),
      )
    } else {
      localStorage.removeItem(`nouri_offline_syllabes_${childId}`)
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
        .filter((p) => p.type === 'syllabe')
        .forEach((p) => map.set(p.contenu_ar, p.score))
      setProgress(map)
    } catch {
      // Silencieux : on joue sans progression
    } finally {
      setLoading(false)
    }
  }, [childId])

  // ── Init + sauvegarde automatique ────────────────────────────────────────────

  useEffect(() => {
    if (!childId) return

    // Récupérer les réponses hors-ligne stockées
    const stored = localStorage.getItem(`nouri_offline_syllabes_${childId}`)
    if (stored) {
      try {
        pendingRef.current = JSON.parse(stored) as PendingAnswer[]
      } catch { /* ignore */ }
    }

    fetchProgress()

    // Sauvegarde automatique toutes les 30s
    const interval = setInterval(syncAnswers, 30_000)
    return () => {
      clearInterval(interval)
      syncAnswers()
    }
  }, [childId, fetchProgress, syncAnswers])

  // ── Animation de la voyelle ───────────────────────────────────────────────────

  useEffect(() => {
    if (currentView !== 'decouverte') return
    setAnimPhase('base')
    const timer = setTimeout(() => setAnimPhase('syllabe'), 600)
    return () => clearTimeout(timer)
  }, [currentSyllabeIndex, currentView])

  // Lecture audio automatique quand la syllabe s'affiche
  useEffect(() => {
    if (currentView !== 'decouverte' || animPhase !== 'syllabe' || selectedLettre === null) return
    const syllabes = getSyllabesForSession(selectedLettre)
    const syllabe = syllabes[currentSyllabeIndex]
    if (!syllabe) return
    const timer = setTimeout(() => speakArabic(syllabe.ar, 0.75), 200)
    return () => clearTimeout(timer)
  }, [animPhase, currentView, currentSyllabeIndex, selectedLettre])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSelectLettre = (index: number) => {
    setSelectedLettre(index)
    setCurrentSyllabeIndex(0)
    setQuizScore(null)
    setCurrentView('decouverte')
  }

  const handleQuizComplete = useCallback(
    async (score: number) => {
      setQuizScore(score)
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + score,
        wrong: prev.wrong + (8 - score),
      }))

      // Enregistrer le résultat pour chaque syllabe de la lettre
      if (selectedLettre !== null) {
        const syllabes = getSyllabesForSession(selectedLettre)
        const wasCorrect = score >= 6
        for (const s of syllabes) {
          pendingRef.current.push({
            childId,
            syllabeId: `syllabe_${s.id}`,
            wasCorrect,
            responseTimeMs: 4_000,
          })
        }
        localStorage.setItem(
          `nouri_offline_syllabes_${childId}`,
          JSON.stringify(pendingRef.current),
        )
        await syncAnswers()
      }

      if (score >= 6) {
        setCurrentView('assemblage')
      } else {
        // Retour en découverte avec message d'encouragement
        setCurrentView('decouverte')
      }
    },
    [selectedLettre, childId, syncAnswers],
  )

  const handleAssemblySuccess = useCallback(() => {
    setCurrentView('select')
    setSelectedLettre(null)
    setQuizScore(null)
  }, [])

  // ── Helpers d'affichage ───────────────────────────────────────────────────────

  const getLettreDots = (lettreIndex: number) => {
    const syllabes = getSyllabesForSession(lettreIndex)
    return syllabes.map((s) => ({
      id: s.id,
      mastered: (progress.get(s.id) ?? 0) >= 80,
    }))
  }

  const currentSyllabes: Syllabe[] =
    selectedLettre !== null ? getSyllabesForSession(selectedLettre) : []
  const currentSyllabe: Syllabe | undefined = currentSyllabes[currentSyllabeIndex]

  // ── Skeleton de chargement ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]" />
          <p className="font-baloo text-lg font-bold text-white/80">
            Chargement des syllabes...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">

      {/* ══════════════════════════════════════════════
          VUE 1 — SÉLECTION DE LA LETTRE
      ══════════════════════════════════════════════ */}
      {currentView === 'select' && (
        <div className="flex flex-col">
          <button
            onClick={() => router.push(`/jouer/${childId}`)}
            className="self-start mb-6 py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 flex items-center gap-2 border border-white/5 font-baloo"
          >
            <span>🏰</span> Retour à la carte
          </button>

          <h1 className="text-3xl font-black text-white text-center mb-1 font-baloo">
            Les Syllabes <span style={{ color: '#F5A623' }}>🔠</span>
          </h1>
          <p className="text-white/60 text-center font-baloo mb-6 text-lg">
            Choisis une lettre !
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {LETTERS.map((letter) => {
              const dots = getLettreDots(letter.index)
              const masteredCount = dots.filter((d) => d.mastered).length

              return (
                <button
                  key={letter.index}
                  onClick={() => handleSelectLettre(letter.index)}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] border transition-all hover:scale-105 active:scale-95"
                  style={{
                    background:
                      masteredCount === 4
                        ? 'rgba(39,174,96,0.2)'
                        : masteredCount > 0
                          ? 'rgba(245,166,35,0.12)'
                          : 'rgba(255,255,255,0.06)',
                    borderColor:
                      masteredCount === 4
                        ? 'rgba(39,174,96,0.4)'
                        : 'rgba(255,255,255,0.1)',
                    minHeight: 80,
                    padding: '10px 6px',
                  }}
                  aria-label={`${letter.nom} — ${letter.ar}`}
                >
                  <span
                    style={{
                      fontFamily: "'Noto Naskh Arabic', serif",
                      fontSize: '2rem',
                      color: 'white',
                      lineHeight: 1,
                      direction: 'rtl',
                    }}
                  >
                    {letter.ar}
                  </span>
                  {/* 4 ronds de progression (fatha/kasra/damma/sukun) */}
                  <div className="flex gap-1">
                    {dots.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-full"
                        style={{
                          width: 7,
                          height: 7,
                          background: d.mastered ? '#27AE60' : 'rgba(255,255,255,0.25)',
                        }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 2 — DÉCOUVERTE ANIMÉE
      ══════════════════════════════════════════════ */}
      {currentView === 'decouverte' && selectedLettre !== null && currentSyllabe && (
        <div className="flex flex-col items-center gap-5">

          <style>{`
            @keyframes voyelleDescend {
              from { transform: translateY(-30px); opacity: 0; }
              to   { transform: translateY(0px);   opacity: 1; }
            }
            @keyframes fadeInUp {
              from { transform: translateY(12px); opacity: 0; }
              to   { transform: translateY(0px);  opacity: 1; }
            }
          `}</style>

          {/* Barre du haut */}
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setCurrentView('select')}
              className="py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
            >
              ← Retour
            </button>
            <p className="font-baloo text-white/50 text-sm">
              {LETTERS[selectedLettre]?.nom ?? ''}
            </p>
          </div>

          {/* Compteur de syllabes cliquable (1/4 · 2/4 · 3/4 · 4/4) */}
          <div className="flex gap-2 items-center">
            {currentSyllabes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSyllabeIndex(idx)}
                className="rounded-full font-baloo font-bold transition-all active:scale-90 flex items-center justify-center"
                style={{
                  width:  idx === currentSyllabeIndex ? 38 : 30,
                  height: idx === currentSyllabeIndex ? 38 : 30,
                  background:
                    idx < currentSyllabeIndex
                      ? 'rgba(0,201,177,0.7)'
                      : idx === currentSyllabeIndex
                        ? '#F5A623'
                        : 'rgba(255,255,255,0.15)',
                  color:
                    idx <= currentSyllabeIndex ? '#1A3A5C' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.75rem',
                  border:
                    idx === currentSyllabeIndex
                      ? '2px solid #F5A623'
                      : '2px solid transparent',
                  boxShadow:
                    idx === currentSyllabeIndex
                      ? '0 0 12px rgba(245,166,35,0.5)'
                      : 'none',
                }}
                aria-label={`Syllabe ${idx + 1} sur ${currentSyllabes.length}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* ── ÉTAPE A : Grande syllabe avec animation voyelle ─ */}
          <div
            className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#0F253D]/95 shadow-2xl w-full max-w-sm"
            style={{ padding: '2rem 1.5rem', minHeight: 180 }}
          >
            <div className="flex flex-col items-center" style={{ minHeight: 110 }}>
              {animPhase === 'base' ? (
                <span
                  style={{
                    fontFamily: "'Noto Naskh Arabic', serif",
                    fontSize: '5rem',
                    color: '#6B7C8D',
                    lineHeight: 1,
                    direction: 'rtl',
                  }}
                >
                  {currentSyllabe.lettre_ar}
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: "'Noto Naskh Arabic', serif",
                    fontSize: '5rem',
                    color: '#F5A623',
                    lineHeight: 1,
                    direction: 'rtl',
                    animation: 'voyelleDescend 800ms cubic-bezier(0.34,1.56,0.64,1) forwards',
                    textShadow: '0 0 32px rgba(245,166,35,0.45)',
                  }}
                >
                  {currentSyllabe.ar}
                </span>
              )}
            </div>

            {animPhase === 'syllabe' && (
              <div
                className="flex flex-col items-center gap-1 mt-3"
                style={{ animation: 'fadeInUp 400ms 600ms ease backwards' }}
              >
                <p className="font-baloo text-2xl font-black text-white">
                  {currentSyllabe.transliteration}
                </p>
                <p className="font-baloo text-sm text-center px-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {currentSyllabe.son_description}
                </p>
              </div>
            )}
          </div>

          {/* ── ÉTAPE B : Exemple de mot ─ */}
          <div
            className="flex flex-col items-center gap-3 rounded-[24px] border border-white/10 bg-[#152442]/80 w-full max-w-sm"
            style={{ padding: '1.25rem 1.5rem', animation: 'fadeInUp 350ms 200ms ease backwards' }}
          >
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {currentSyllabe.exemple_mot_emoji}
              </span>
              <div className="flex flex-col gap-0.5">
                {highlightLetterInWord(currentSyllabe.exemple_mot_ar, currentSyllabe.lettre_ar)}
                <span
                  className="font-baloo capitalize"
                  style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}
                >
                  {currentSyllabe.exemple_mot_fr}
                </span>
              </div>
            </div>

            <button
              onClick={() => speakArabic(currentSyllabe.exemple_mot_ar, 0.75)}
              className="flex items-center gap-2 font-baloo font-bold text-white rounded-full transition-all active:scale-95 hover:bg-white/20"
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 18px',
                minHeight: 40,
                fontSize: '0.9rem',
              }}
            >
              🔊 Écouter
            </button>
          </div>

          {/* ── Navigation gauche / droite ─ */}
          <div className="flex gap-3 items-center w-full max-w-sm justify-between">
            <button
              onClick={() => setCurrentSyllabeIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSyllabeIndex === 0}
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

            {currentSyllabeIndex < currentSyllabes.length - 1 ? (
              <button
                onClick={() => setCurrentSyllabeIndex((prev) => prev + 1)}
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
                onClick={() => setCurrentView('lecture')}
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
                Je suis prêt pour le quiz ! →
              </button>
            )}
          </div>

          {/* Résultat du quiz précédent (si raté) */}
          {quizScore !== null && quizScore < 6 && (
            <div
              className="rounded-2xl border w-full max-w-sm p-4 text-center"
              style={{
                background: 'rgba(255,107,157,0.1)',
                borderColor: 'rgba(255,107,157,0.3)',
              }}
            >
              <p className="font-baloo font-bold text-white">
                Score précédent : {quizScore}/8 — Continue de réviser ! 💪
              </p>
              <button
                onClick={() => setCurrentView('lecture')}
                className="mt-2 font-bold rounded-2xl text-sm active:scale-95 font-baloo"
                style={{
                  background: '#F5A623',
                  color: '#1A3A5C',
                  padding: '8px 20px',
                  minHeight: 40,
                }}
              >
                Réessayer le quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 3 — QUIZ DE LECTURE
      ══════════════════════════════════════════════ */}
      {currentView === 'lecture' && selectedLettre !== null && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setCurrentView('decouverte')}
            className="self-start py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
          >
            ← Retour à la découverte
          </button>
          <SyllableQuiz
            syllabes={getSyllabesForSession(selectedLettre)}
            onComplete={handleQuizComplete}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════
          VUE 4 — ASSEMBLAGE DE MOT (débloquée si ≥ 6/8)
      ══════════════════════════════════════════════ */}
      {currentView === 'assemblage' && selectedLettre !== null && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setCurrentView('decouverte')}
            className="self-start py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-sm transition-transform active:scale-95 border border-white/5 font-baloo"
          >
            ← Retour
          </button>

          {quizScore !== null && (
            <p
              className="text-center font-baloo font-black text-xl"
              style={{ color: '#00C9B1' }}
            >
              Bravo ! {quizScore}/8 — Défi débloqué ! 🎉
            </p>
          )}

          {MOTS_PAR_LETTRE[selectedLettre] != null ? (
            <WordAssembler
              word={MOTS_PAR_LETTRE[selectedLettre]}
              onSuccess={handleAssemblySuccess}
            />
          ) : (
            <p className="text-center font-baloo py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Exercice d&apos;assemblage non disponible pour cette lettre.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Composant exporté (enveloppe RewardSystem) ───────────────────────────────

export default function SyllabesGame() {
  return (
    <RewardSystem>
      <SyllabesGameInner />
    </RewardSystem>
  )
}
