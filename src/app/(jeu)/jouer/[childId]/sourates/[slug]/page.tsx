'use client'

import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSourateBySlug, SOURATES } from '@/lib/data/sourates'
import type { Sourate, Verset } from '@/lib/data/sourates'
import { VerseDisplay } from '@/components/game/VerseDisplay'
import { SourateProgress } from '@/components/game/SourateProgress'
import { RewardSystem } from '@/components/game/RewardSystem'
import { useRewards } from '@/lib/reward-context'
import { speakArabic } from '@/lib/arabic-tts'

// ─── Constantes ───────────────────────────────────────────────────────────────

// Texte arabe exact de la Bismillah (transmis Hafs 'an 'Asim)
const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'

const MESSAGES_CORRECT = [
  'Excellent ! Tu le sais ! 🌟',
  'Bravo ! Continue ! ⭐',
  'MachAllah ! Fantastique ! 🎉',
  'Super ! Tu es fort(e) ! 💪',
]
const MESSAGES_WRONG = [
  'Pas grave ! Regarde bien... 👀',
  'Presque ! On révise ensemble 🔄',
  "Continue d'essayer ! 💪",
]

// ─── Types ────────────────────────────────────────────────────────────────────

type CurrentMode = 'lecture' | 'apprentissage' | 'qcm' | 'recitation'

// Phases de la vue apprentissage
type AppPhase = 'presentation' | 'rep1' | 'rep2' | 'repAll'

interface HiddenSteps {
  rep1: number[]   // indices des mots à cacher en étape 1
  rep2: number[]   // indices des mots à cacher en étape 2
  repAll: number[] // tous les indices
}

interface QcmQuestion {
  type: 'A' | 'B' | 'C'
  versetIdx: number
  // Type A : montrer traduction → choisir texte arabe
  // Type B : montrer premiers mots → choisir suite
  // Type C : montrer mot arabe isolé → choisir signification
  enonce: string
  choices: string[]
  correctIdx: number
  label?: string // libellé de la question
}

interface PendingAnswer {
  childId: string
  sourateSlug: string
  versetNumero: number
  wasCorrect: boolean
  mode: 'apprentissage' | 'qcm' | 'recitation'
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

// Précalcule quels mots cacher à chaque étape de répétition
function computeHiddenSteps(wordCount: number): HiddenSteps {
  const allIndices = Array.from({ length: wordCount }, (_, i) => i)
  const shuffled = shuffleArray([...allIndices])
  const rep1 = [shuffled[0]!]
  // rep2 n'a du sens que si le verset a >= 3 mots ; sinon on saute directement à repAll
  const rep2 = wordCount >= 3 ? shuffled.slice(0, 2) : allIndices
  return { rep1, rep2, repAll: allIndices }
}

// Construit 3 choix pour un mot caché : mot correct + 2 distracteurs tirés de toutes les sourates
function buildWordChoices(correctWord: string, allVersets: Verset[]): string[] {
  const pool = allVersets.flatMap((v) => v.ar.split(' ')).filter((w) => w !== correctWord)
  const unique = [...new Set(pool)]
  const distractors = shuffleArray(unique).slice(0, 2)
  return shuffleArray([correctWord, ...distractors])
}

// Construit 5 questions QCM pour une sourate (types A→B→C→A→B)
function buildQcmQuestions(sourate: Sourate): QcmQuestion[] {
  const CYCLE: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C', 'A', 'B']
  const allVersets = SOURATES.flatMap((s) => s.versets)
  const questions: QcmQuestion[] = []

  for (let i = 0; i < 5; i++) {
    const vIdx = i % sourate.versets.length
    const verset = sourate.versets[vIdx]!
    const type = CYCLE[i]!

    if (type === 'A') {
      // Traduction → choisir le bon texte arabe parmi 4 versets
      const distractors = shuffleArray(
        allVersets.filter((v) => v.ar !== verset.ar)
      ).slice(0, 3)
      const choices = shuffleArray([verset, ...distractors])
      questions.push({
        type: 'A',
        versetIdx: vIdx,
        label: 'Quel verset correspond à cette traduction ?',
        enonce: verset.fr,
        choices: choices.map((v) => v.ar),
        correctIdx: choices.findIndex((v) => v.ar === verset.ar),
      })
    } else if (type === 'B') {
      // Premiers mots → choisir la bonne suite
      const mots = verset.ar.split(' ')
      const promptWords = mots.slice(0, Math.min(2, mots.length - 1))
      const continuation = mots.slice(promptWords.length).join(' ')
      if (!continuation) {
        // Verset trop court : fallback vers type A
        const distractors = shuffleArray(allVersets.filter((v) => v.ar !== verset.ar)).slice(0, 3)
        const choices = shuffleArray([verset, ...distractors])
        questions.push({
          type: 'A',
          versetIdx: vIdx,
          label: 'Quel verset correspond à cette traduction ?',
          enonce: verset.fr,
          choices: choices.map((v) => v.ar),
          correctIdx: choices.findIndex((v) => v.ar === verset.ar),
        })
        continue
      }
      const distractorVersets = shuffleArray(allVersets.filter((v) => v.ar !== verset.ar)).slice(0, 3)
      const distractorContinuations = distractorVersets.map((v) => {
        const ms = v.ar.split(' ')
        return ms.slice(Math.min(2, ms.length - 1)).join(' ') || v.ar
      })
      const allChoices = shuffleArray([continuation, ...distractorContinuations])
      questions.push({
        type: 'B',
        versetIdx: vIdx,
        label: 'Complète le verset :',
        enonce: promptWords.join(' ') + ' ...',
        choices: allChoices,
        correctIdx: allChoices.indexOf(continuation),
      })
    } else {
      // Mot clé arabe → choisir la bonne signification française
      const mk = verset.mots_cles[0]
      if (!mk) {
        // Fallback type A
        const distractors = shuffleArray(allVersets.filter((v) => v.ar !== verset.ar)).slice(0, 3)
        const choices = shuffleArray([verset, ...distractors])
        questions.push({
          type: 'A',
          versetIdx: vIdx,
          label: 'Quel verset correspond à cette traduction ?',
          enonce: verset.fr,
          choices: choices.map((v) => v.ar),
          correctIdx: choices.findIndex((v) => v.ar === verset.ar),
        })
        continue
      }
      const allMksPool = allVersets
        .flatMap((v) => v.mots_cles)
        .filter((m) => m.fr !== mk.fr)
      const distractorMks = shuffleArray(allMksPool).slice(0, 3).map((m) => m.fr)
      const allChoices = shuffleArray([mk.fr, ...distractorMks])
      questions.push({
        type: 'C',
        versetIdx: vIdx,
        label: 'Que signifie ce mot ?',
        enonce: mk.ar,
        choices: allChoices,
        correctIdx: allChoices.indexOf(mk.fr),
      })
    }
  }

  return questions
}

// ─── Composant interne (nécessite RewardSystem en parent) ─────────────────────

function SourateDetailInner() {
  const params = useParams<{ childId: string; slug: string }>()
  const router = useRouter()
  const { triggerConfetti, playCorrect, playWrong, showToast } = useRewards()

  const childId = params.childId
  const slug = params.slug
  const sourate = getSourateBySlug(slug)

  // ── État global ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<CurrentMode>('lecture')
  const [showTranslit, setShowTranslit] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [memorizedVersets, setMemorizedVersets] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  // ── État apprentissage ──────────────────────────────────────────────────────
  const [appVersetIdx, setAppVersetIdx] = useState(0)
  const [appPhase, setAppPhase] = useState<AppPhase>('presentation')
  const [hiddenSteps, setHiddenSteps] = useState<HiddenSteps | null>(null)
  const [currentRepStep, setCurrentRepStep] = useState<1 | 2 | 'all'>(1)
  const [appChoices, setAppChoices] = useState<string[]>([])
  const [appTargetIdx, setAppTargetIdx] = useState(0)
  const [appSelectedAnswer, setAppSelectedAnswer] = useState<number | null>(null)

  // ── État QCM ─────────────────────────────────────────────────────────────────
  const [qcmQuestions, setQcmQuestions] = useState<QcmQuestion[]>([])
  const [qcmIdx, setQcmIdx] = useState(0)
  const [qcmAnswer, setQcmAnswer] = useState<number | null>(null)
  const [qcmScore, setQcmScore] = useState(0)
  const [qcmDone, setQcmDone] = useState(false)

  // ── État récitation ─────────────────────────────────────────────────────────
  const [recitPos, setRecitPos] = useState<{ vi: number; wi: number }>({ vi: 0, wi: -1 })
  const [recitTestMode, setRecitTestMode] = useState(false)
  const [recitRevealed, setRecitRevealed] = useState(new Set<number>())

  // File d'attente pour les réponses hors-ligne
  const pendingRef = useRef<PendingAnswer[]>([])

  // ── Chargement progression ──────────────────────────────────────────────────

  const syncAnswers = useCallback(async () => {
    const pending = [...pendingRef.current]
    if (pending.length === 0) return
    pendingRef.current = []

    const failed: PendingAnswer[] = []
    for (const item of pending) {
      try {
        const res = await fetch('/api/progress/sourates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
        if (!res.ok) {
          failed.push(item)
        } else {
          const data = (await res.json()) as { mastered?: boolean; newScore?: number }
          // Mettre à jour localement si mémorisé
          if (data.mastered && !memorizedVersets.includes(item.versetNumero)) {
            setMemorizedVersets((prev) => [...prev, item.versetNumero])
          }
        }
      } catch {
        failed.push(item)
      }
    }

    if (failed.length > 0) {
      pendingRef.current = [...failed, ...pendingRef.current]
    }
  }, [memorizedVersets])

  useEffect(() => {
    if (!childId || !sourate) return

    async function charger() {
      try {
        const res = await fetch(`/api/children/${childId}/progress`)
        if (!res.ok) return
        const data = (await res.json()) as {
          progress: { type: string; contenu_ar: string; score: number }[]
        }
        const prefix = `sourate_${slug}_v`
        const memorises = data.progress
          .filter((p) => p.type === 'sourate' && p.contenu_ar.startsWith(prefix) && p.score >= 85)
          .map((p) => parseInt(p.contenu_ar.slice(prefix.length), 10))
          .filter((n) => !isNaN(n) && n > 0)
        setMemorizedVersets(memorises)
      } catch {
        // Silencieux — on joue sans progression
      } finally {
        setLoading(false)
      }
    }

    charger()
    const interval = setInterval(syncAnswers, 30_000)
    return () => {
      clearInterval(interval)
      syncAnswers()
    }
  }, [childId, slug, sourate, syncAnswers])

  // Sourate inconnue
  if (!sourate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-white/70 font-baloo text-center">Sourate introuvable.</p>
        <button
          onClick={() => router.push(`/jouer/${childId}/sourates`)}
          className="px-6 py-3 rounded-2xl font-bold text-white"
          style={{ background: '#F5A623', color: '#1A3A5C', minHeight: 48 }}
        >
          ← Retour
        </button>
      </div>
    )
  }

  if (loading) return <Squelette />

  // ── Helpers apprentissage ────────────────────────────────────────────────────

  const allVersets = SOURATES.flatMap((s) => s.versets)

  function demarrerRep1(versetIdx: number) {
    const verset = sourate!.versets[versetIdx]!
    const mots = verset.ar.split(' ')
    const steps = computeHiddenSteps(mots.length)
    setHiddenSteps(steps)
    const targetWordIdx = steps.rep1[0]!
    setAppTargetIdx(targetWordIdx)
    setAppChoices(buildWordChoices(mots[targetWordIdx]!, allVersets))
    setAppSelectedAnswer(null)
    setCurrentRepStep(1)
    setAppPhase('rep1')
  }

  function avancerDepuisRep1() {
    const verset = sourate!.versets[appVersetIdx]!
    const mots = verset.ar.split(' ')
    if (mots.length >= 3 && hiddenSteps && hiddenSteps.rep2.length >= 2) {
      // Le 2e mot caché à quiz est hiddenSteps.rep2[1]
      const targetWordIdx = hiddenSteps.rep2[1]!
      setAppTargetIdx(targetWordIdx)
      setAppChoices(buildWordChoices(mots[targetWordIdx]!, allVersets))
      setAppSelectedAnswer(null)
      setCurrentRepStep(2)
      setAppPhase('rep2')
    } else {
      setAppSelectedAnswer(null)
      setCurrentRepStep('all')
      setAppPhase('repAll')
    }
  }

  function avancerDepuisRep2() {
    setAppSelectedAnswer(null)
    setCurrentRepStep('all')
    setAppPhase('repAll')
  }

  function handleAppChoice(choiceIdx: number) {
    if (appSelectedAnswer !== null) return
    const verset = sourate!.versets[appVersetIdx]!
    const mots = verset.ar.split(' ')
    const correctWord = mots[appTargetIdx]!
    const isCorrect = appChoices[choiceIdx] === correctWord

    setAppSelectedAnswer(choiceIdx)
    if (isCorrect) playCorrect()
    else playWrong()

    setTimeout(() => {
      if (appPhase === 'rep1') avancerDepuisRep1()
      else avancerDepuisRep2()
    }, 900)
  }

  function handleAutoEvaluation(wasCorrect: boolean) {
    const verset = sourate!.versets[appVersetIdx]!
    pendingRef.current.push({
      childId,
      sourateSlug: sourate!.slug,
      versetNumero: verset.numero,
      wasCorrect,
      mode: 'apprentissage',
    })

    if (wasCorrect) {
      playCorrect()
      showToast('MachAllah ! ✨', 1)

      const suivantIdx = appVersetIdx + 1
      if (suivantIdx < sourate!.versets.length) {
        setAppVersetIdx(suivantIdx)
        setAppPhase('presentation')
        setHiddenSteps(null)
        setAppSelectedAnswer(null)
      } else {
        // Toute la sourate apprise
        triggerConfetti('full')
        showToast('Sourate complète ! 🎉', 3)
        syncAnswers()
        setMode('lecture')
      }
    } else {
      // Révise encore — repart de la présentation
      setAppPhase('presentation')
      setHiddenSteps(null)
      setAppSelectedAnswer(null)
    }
  }

  // ── Helpers QCM ──────────────────────────────────────────────────────────────

  function demarrerQcm() {
    setQcmQuestions(buildQcmQuestions(sourate!))
    setQcmIdx(0)
    setQcmAnswer(null)
    setQcmScore(0)
    setQcmDone(false)
    setMode('qcm')
  }

  function handleQcmAnswer(choiceIdx: number) {
    if (qcmAnswer !== null) return
    const question = qcmQuestions[qcmIdx]!
    const isCorrect = choiceIdx === question.correctIdx

    setQcmAnswer(choiceIdx)
    if (isCorrect) {
      playCorrect()
      setQcmScore((prev) => prev + 1)
    } else {
      playWrong()
    }

    const verset = sourate!.versets[question.versetIdx]!
    pendingRef.current.push({
      childId,
      sourateSlug: sourate!.slug,
      versetNumero: verset.numero,
      wasCorrect: isCorrect,
      mode: 'qcm',
    })

    setTimeout(() => {
      const next = qcmIdx + 1
      if (next >= qcmQuestions.length) {
        setQcmDone(true)
        const finalScore = qcmScore + (isCorrect ? 1 : 0)
        if (finalScore >= 4) triggerConfetti('full')
        syncAnswers()
      } else {
        setQcmIdx(next)
        setQcmAnswer(null)
      }
    }, 900)
  }

  // ── Helpers récitation ────────────────────────────────────────────────────────

  function motSuivantRecit() {
    if (!sourate) return
    const currentVerset = sourate.versets[recitPos.vi]!
    const mots = currentVerset.ar.split(' ')
    const nextWi = recitPos.wi + 1

    if (nextWi < mots.length) {
      setRecitPos({ vi: recitPos.vi, wi: nextWi })
    } else {
      // Passer au verset suivant
      const nextVi = recitPos.vi + 1
      if (nextVi < sourate.versets.length) {
        setRecitPos({ vi: nextVi, wi: 0 })
      } else {
        // Fin de la sourate
        setRecitPos({ vi: 0, wi: -1 })
        showToast('Bravo ! Sourate récitée ! 🌟', 3)
        syncAnswers()
      }
    }
  }

  function toggleRecitTestMode() {
    setRecitTestMode((prev) => !prev)
    setRecitRevealed(new Set())
    setRecitPos({ vi: 0, wi: -1 })
  }

  function revelerVerset(vi: number) {
    const verset = sourate!.versets[vi]!
    pendingRef.current.push({
      childId,
      sourateSlug: sourate!.slug,
      versetNumero: verset.numero,
      wasCorrect: true,
      mode: 'recitation',
    })
    setRecitRevealed((prev) => new Set([...prev, vi]))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const currentVerset = sourate.versets[appVersetIdx]
  const motsClesHighlight = currentVerset?.mots_cles.map((mk) => mk.ar) ?? []

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 pb-28">

      {/* En-tête : retour + nom sourate + progression */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push(`/jouer/${childId}/sourates`)}
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', color: 'white' }}
          aria-label="Retour à la liste des sourates"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div
            dir="rtl"
            className="text-right truncate"
            style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.6rem', color: '#F5A623', direction: 'rtl', lineHeight: '1.8' }}
          >
            {sourate.nom_ar}
          </div>
          <p className="text-white/60 text-sm" style={{ fontFamily: "'Baloo 2', cursive" }}>
            {sourate.nom_fr} · {sourate.versets.length} versets
          </p>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="mb-5">
        <SourateProgress totalVersets={sourate.versets.length} memorizedVersets={memorizedVersets} />
      </div>

      {/* Pill tabs — sélecteur de mode */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { id: 'lecture', label: '📖 Lecture' },
            { id: 'apprentissage', label: '📚 Apprendre' },
            { id: 'qcm', label: '🎯 Quiz' },
            { id: 'recitation', label: '🎤 Récitation' },
          ] as { id: CurrentMode; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'qcm' && mode !== 'qcm') demarrerQcm()
              else setMode(id)
              if (id === 'apprentissage') { setAppVersetIdx(0); setAppPhase('presentation') }
              if (id === 'recitation') { setRecitPos({ vi: 0, wi: -1 }); setRecitTestMode(false) }
            }}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95"
            style={{
              fontFamily: "'Baloo 2', cursive",
              background: mode === id ? '#F5A623' : 'rgba(255,255,255,0.1)',
              color: mode === id ? '#1A3A5C' : 'rgba(255,255,255,0.7)',
              minHeight: 40,
              border: mode === id ? 'none' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          MODE LECTURE
      ════════════════════════════════════════ */}
      {mode === 'lecture' && (
        <div className="flex flex-col gap-4">
          {/* Bismillah (sauf Al-Fatiha où c'est le verset 1) */}
          {sourate.numero !== 1 && (
            <div className="text-center py-3">
              <span
                dir="rtl"
                style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.8rem', color: '#F5A623', direction: 'rtl', lineHeight: '2' }}
              >
                {BISMILLAH}
              </span>
            </div>
          )}

          {/* Toggles translittération / traduction */}
          <div className="flex gap-3 justify-center mb-2">
            {[
              { label: 'Translittération', value: showTranslit, set: setShowTranslit },
              { label: 'Traduction', value: showTranslation, set: setShowTranslation },
            ].map(({ label, value, set }) => (
              <button
                key={label}
                onClick={() => set(!value)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  fontFamily: "'Baloo 2', cursive",
                  background: value ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.08)',
                  color: value ? '#F5A623' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${value ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  minHeight: 36,
                }}
              >
                {value ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>

          {/* Tous les versets */}
          {sourate.versets.map((verset) => (
            <VerseDisplay
              key={verset.numero}
              verset={verset}
              showTranslit={showTranslit}
              showTranslation={showTranslation}
              onListen={() => speakArabic(verset.ar, 0.65)}
              size="md"
            />
          ))}

          {/* Description de la sourate */}
          <div
            className="rounded-2xl p-4 mt-2"
            style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}
          >
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Baloo 2', cursive", lineHeight: 1.6 }}>
              {sourate.description_enfant}
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODE APPRENTISSAGE
      ════════════════════════════════════════ */}
      {mode === 'apprentissage' && currentVerset && (
        <div className="flex flex-col gap-5">

          {/* Indicateur de verset */}
          <div className="flex justify-center gap-2">
            {sourate.versets.map((_, vi) => (
              <div
                key={vi}
                className="rounded-full transition-all"
                style={{
                  width: vi === appVersetIdx ? 32 : 10,
                  height: 10,
                  background: vi < appVersetIdx
                    ? '#27AE60'
                    : vi === appVersetIdx
                    ? '#F5A623'
                    : 'rgba(255,255,255,0.2)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* ── Phase présentation ── */}
          {appPhase === 'presentation' && (
            <div className="flex flex-col gap-4">
              <VerseDisplay
                verset={currentVerset}
                showTranslit
                showTranslation
                highlightWords={motsClesHighlight}
                onListen={() => speakArabic(currentVerset.ar, 0.65)}
                size="lg"
              />

              {/* Mots clés expliqués */}
              {currentVerset.mots_cles.length > 0 && (
                <div className="flex flex-col gap-2">
                  {currentVerset.mots_cles.map((mk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <span
                        dir="rtl"
                        style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.4rem', color: '#F5A623', direction: 'rtl', flexShrink: 0 }}
                      >
                        {mk.ar}
                      </span>
                      <div>
                        <p className="text-white font-bold text-sm" style={{ fontFamily: "'Baloo 2', cursive" }}>
                          {mk.fr}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Baloo 2', cursive" }}>
                          {mk.explication_enfant}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => demarrerRep1(appVersetIdx)}
                className="w-full font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: '#F5A623', color: '#1A3A5C', minHeight: 56, fontFamily: "'Baloo 2', cursive", fontSize: '1.1rem' }}
              >
                J'ai vu ! Allons pratiquer →
              </button>
            </div>
          )}

          {/* ── Phase répétition (rep1 ou rep2) ── */}
          {(appPhase === 'rep1' || appPhase === 'rep2') && hiddenSteps && (
            <div className="flex flex-col gap-4">
              <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Baloo 2', cursive" }}>
                {appPhase === 'rep1' ? 'Retrouve le mot manquant 👇' : 'Encore un ! Tu y es presque 💪'}
              </p>

              {/* Verset avec blancs */}
              <VerseAvecBlancs
                mots={currentVerset.ar.split(' ')}
                indicesCaches={appPhase === 'rep1' ? hiddenSteps.rep1 : hiddenSteps.rep2}
                indiceCible={appTargetIdx}
              />

              {/* 3 boutons de choix */}
              <div className="flex flex-col gap-3">
                {appChoices.map((choix, ci) => {
                  const verset = sourate!.versets[appVersetIdx]!
                  const mots = verset.ar.split(' ')
                  const correctWord = mots[appTargetIdx]!
                  const isCorrect = choix === correctWord
                  let bg = 'rgba(255,255,255,0.08)'
                  let border = 'rgba(255,255,255,0.15)'
                  if (appSelectedAnswer !== null) {
                    if (isCorrect) { bg = 'rgba(39,174,96,0.3)'; border = '#27AE60' }
                    else if (ci === appSelectedAnswer) { bg = 'rgba(231,76,60,0.3)'; border = '#E74C3C' }
                  }
                  return (
                    <button
                      key={ci}
                      onClick={() => handleAppChoice(ci)}
                      disabled={appSelectedAnswer !== null}
                      className="w-full rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:cursor-default"
                      style={{ background: bg, border: `2px solid ${border}`, minHeight: 80, padding: '12px' }}
                    >
                      <span
                        dir="rtl"
                        style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.8rem', color: '#FFFFFF', direction: 'rtl', textAlign: 'center' }}
                      >
                        {choix}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Feedback */}
              {appSelectedAnswer !== null && (
                <p className="text-center font-bold text-lg" style={{
                  color: appChoices[appSelectedAnswer] === currentVerset.ar.split(' ')[appTargetIdx] ? '#27AE60' : '#E74C3C',
                  fontFamily: "'Baloo 2', cursive",
                }}>
                  {appChoices[appSelectedAnswer] === currentVerset.ar.split(' ')[appTargetIdx]
                    ? MESSAGES_CORRECT[appVersetIdx % MESSAGES_CORRECT.length]
                    : MESSAGES_WRONG[appVersetIdx % MESSAGES_WRONG.length]}
                </p>
              )}
            </div>
          )}

          {/* ── Phase repAll : auto-évaluation ── */}
          {appPhase === 'repAll' && (
            <div className="flex flex-col gap-5">
              <p className="text-center font-bold text-lg text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>
                Tu le sais de mémoire ? 🤔
              </p>

              {/* Verset entièrement caché */}
              <VerseAvecBlancs
                mots={currentVerset.ar.split(' ')}
                indicesCaches={Array.from({ length: currentVerset.ar.split(' ').length }, (_, i) => i)}
                indiceCible={null}
              />

              {/* Révéler pour vérifier */}
              <button
                onClick={() => speakArabic(currentVerset.ar, 0.65)}
                className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}
              >
                🔊 Écouter pour vérifier
              </button>

              {/* Boutons d'auto-évaluation */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAutoEvaluation(false)}
                  className="flex-1 rounded-2xl font-bold transition-all active:scale-95"
                  style={{ background: 'rgba(231,76,60,0.2)', border: '2px solid rgba(231,76,60,0.4)', color: '#E74C3C', minHeight: 64, fontFamily: "'Baloo 2', cursive" }}
                >
                  😕 Je révise encore
                </button>
                <button
                  onClick={() => handleAutoEvaluation(true)}
                  className="flex-1 rounded-2xl font-bold transition-all active:scale-95"
                  style={{ background: 'rgba(39,174,96,0.2)', border: '2px solid rgba(39,174,96,0.4)', color: '#27AE60', minHeight: 64, fontFamily: "'Baloo 2', cursive" }}
                >
                  😊 Je savais !
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          MODE QCM
      ════════════════════════════════════════ */}
      {mode === 'qcm' && !qcmDone && qcmQuestions.length > 0 && (() => {
        const question = qcmQuestions[qcmIdx]!
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-sm" style={{ fontFamily: "'Baloo 2', cursive" }}>
                Question {qcmIdx + 1}/{qcmQuestions.length}
              </p>
              <div className="flex gap-1">
                {qcmQuestions.map((_, qi) => (
                  <div
                    key={qi}
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: qi < qcmIdx ? '#27AE60' : qi === qcmIdx ? '#F5A623' : 'rgba(255,255,255,0.2)' }}
                  />
                ))}
              </div>
            </div>

            {/* Énoncé */}
            <div
              className="rounded-2xl p-5 flex flex-col items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <p className="text-white/60 text-sm text-center" style={{ fontFamily: "'Baloo 2', cursive" }}>
                {question.label}
              </p>
              {question.type === 'C' ? (
                <span
                  dir="rtl"
                  style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '2rem', color: '#F5A623', direction: 'rtl', lineHeight: '2' }}
                >
                  {question.enonce}
                </span>
              ) : question.type === 'B' ? (
                <span
                  dir="rtl"
                  style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.8rem', color: 'white', direction: 'rtl', lineHeight: '2', textAlign: 'center' }}
                >
                  {question.enonce}
                </span>
              ) : (
                <p className="text-center text-white font-bold text-base" style={{ fontFamily: "'Baloo 2', cursive", lineHeight: 1.5 }}>
                  {question.enonce}
                </p>
              )}
            </div>

            {/* Choix (grille 1 col pour les versets arabes, 2 col pour les mots courts) */}
            <div className={`grid gap-3 ${question.type === 'C' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {question.choices.map((choix, ci) => {
                const estCorrect = ci === question.correctIdx
                let bg = 'rgba(255,255,255,0.08)'
                let border = 'rgba(255,255,255,0.15)'
                if (qcmAnswer !== null) {
                  if (estCorrect) { bg = 'rgba(39,174,96,0.3)'; border = '#27AE60' }
                  else if (ci === qcmAnswer) { bg = 'rgba(231,76,60,0.3)'; border = '#E74C3C' }
                }
                return (
                  <button
                    key={ci}
                    onClick={() => handleQcmAnswer(ci)}
                    disabled={qcmAnswer !== null}
                    className="w-full rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:cursor-default"
                    style={{ background: bg, border: `2px solid ${border}`, minHeight: 80, padding: '12px' }}
                  >
                    {question.type === 'C' ? (
                      <span className="font-bold text-white text-sm text-center" style={{ fontFamily: "'Baloo 2', cursive" }}>
                        {choix}
                      </span>
                    ) : (
                      <span
                        dir="rtl"
                        style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.4rem', color: '#FFFFFF', direction: 'rtl', textAlign: 'center', lineHeight: '2' }}
                      >
                        {choix}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {qcmAnswer !== null && (
              <p className="text-center font-bold text-base" style={{
                color: qcmAnswer === question.correctIdx ? '#27AE60' : '#E74C3C',
                fontFamily: "'Baloo 2', cursive",
              }}>
                {qcmAnswer === question.correctIdx
                  ? MESSAGES_CORRECT[qcmIdx % MESSAGES_CORRECT.length]
                  : MESSAGES_WRONG[qcmIdx % MESSAGES_WRONG.length]}
              </p>
            )}
          </div>
        )
      })()}

      {/* Résultat QCM */}
      {mode === 'qcm' && qcmDone && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-3xl font-black text-white text-center" style={{ fontFamily: "'Baloo 2', cursive" }}>
            Quiz terminé ! 🎉
          </h2>
          <div
            className="w-full rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="text-6xl font-black" style={{ color: qcmScore >= 4 ? '#27AE60' : '#F5A623', fontFamily: "'Baloo 2', cursive" }}>
              {qcmScore}/5
            </span>
            <p className="text-center text-white/70 text-base" style={{ fontFamily: "'Baloo 2', cursive" }}>
              {qcmScore >= 4 ? 'Excellent ! Tu maîtrises bien cette sourate !' : 'Continue de pratiquer, tu vas y arriver !'}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={demarrerQcm}
              className="w-full font-bold rounded-2xl transition-all active:scale-95"
              style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', minHeight: 52, fontFamily: "'Baloo 2', cursive" }}
            >
              Refaire le quiz
            </button>
            <button
              onClick={() => setMode('apprentissage')}
              className="w-full font-bold rounded-2xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', minHeight: 52, fontFamily: "'Baloo 2', cursive" }}
            >
              ← Revoir les versets
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODE RÉCITATION
      ════════════════════════════════════════ */}
      {mode === 'recitation' && (
        <div className="flex flex-col gap-4">
          {/* Contrôles */}
          <div className="flex gap-3 items-center">
            <button
              onClick={motSuivantRecit}
              className="flex-1 font-bold rounded-2xl transition-all active:scale-95"
              style={{ background: '#F5A623', color: '#1A3A5C', minHeight: 48, fontFamily: "'Baloo 2', cursive" }}
            >
              Mot suivant →
            </button>
            <button
              onClick={toggleRecitTestMode}
              className="px-4 rounded-2xl font-bold transition-all active:scale-95"
              style={{
                background: recitTestMode ? 'rgba(0,201,177,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${recitTestMode ? '#00C9B1' : 'rgba(255,255,255,0.2)'}`,
                color: recitTestMode ? '#00C9B1' : 'rgba(255,255,255,0.6)',
                minHeight: 48,
                fontFamily: "'Baloo 2', cursive",
                fontSize: '0.85rem',
              }}
            >
              {recitTestMode ? '🔒 Test ON' : '📝 Mode test'}
            </button>
          </div>

          {/* Versets en mode récitation */}
          {sourate.versets.map((verset, vi) => {
            const mots = verset.ar.split(' ')
            const estRevele = recitRevealed.has(vi)
            const estCourant = recitPos.vi === vi

            if (recitTestMode && !estRevele) {
              return (
                <div
                  key={verset.numero}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'Noto Naskh Arabic', serif", color: '#F5A623', fontSize: '1rem' }}>
                      ﴿{toArabicNumeral(verset.numero)}﴾
                    </span>
                    <button
                      onClick={() => revelerVerset(vi)}
                      className="px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95"
                      style={{ background: 'rgba(0,201,177,0.2)', color: '#00C9B1', border: '1px solid rgba(0,201,177,0.3)', minHeight: 40 }}
                    >
                      Vérifier ✓
                    </button>
                  </div>
                  <div className="text-center" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1.8rem', letterSpacing: '6px' }}>
                    • • • • •
                  </div>
                </div>
              )
            }

            return (
              <div
                key={verset.numero}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: estRevele ? 'rgba(0,201,177,0.08)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${estRevele ? 'rgba(0,201,177,0.3)' : estCourant ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.15)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'Noto Naskh Arabic', serif", color: '#F5A623', fontSize: '1rem' }}>
                    ﴿{toArabicNumeral(verset.numero)}﴾
                  </span>
                  <button
                    onClick={() => speakArabic(verset.ar, 0.65)}
                    className="flex items-center justify-center rounded-full opacity-60 hover:opacity-100"
                    style={{ width: 36, height: 36, background: 'rgba(245,166,35,0.15)', fontSize: '1rem' }}
                    aria-label={`Écouter verset ${verset.numero}`}
                  >
                    🔊
                  </button>
                </div>

                {/* Verset avec mot surligné */}
                <div
                  dir="rtl"
                  className="text-center"
                  style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: '1.8rem', direction: 'rtl', textAlign: 'center', lineHeight: '2.2', color: 'white' }}
                >
                  {mots.map((mot, wi) => {
                    const estMotCourant = estCourant && wi === recitPos.wi
                    return (
                      <Fragment key={wi}>
                        <span
                          style={{
                            borderBottom: estMotCourant ? '2px solid #F5A623' : 'none',
                            color: estMotCourant ? '#F5A623' : 'white',
                          }}
                        >
                          {mot}
                        </span>
                        {wi < mots.length - 1 ? ' ' : ''}
                      </Fragment>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bouton flottant bas — mode lecture uniquement */}
      {mode === 'lecture' && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4"
          style={{ background: 'linear-gradient(to top, rgba(26,58,92,0.95) 60%, transparent)', zIndex: 30 }}
        >
          <button
            onClick={() => { setMode('apprentissage'); setAppVersetIdx(0); setAppPhase('presentation') }}
            className="w-full max-w-lg mx-auto block font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: '#F5A623', color: '#1A3A5C', minHeight: 56, fontFamily: "'Baloo 2', cursive", fontSize: '1.1rem', boxShadow: '0 4px 24px rgba(245,166,35,0.4)' }}
          >
            Apprendre verset par verset →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Composant verset avec blancs (apprentissage) ─────────────────────────────
// Ne modifie jamais les données — affichage uniquement

function VerseAvecBlancs({
  mots,
  indicesCaches,
  indiceCible,
}: {
  mots: string[]
  indicesCaches: number[]
  indiceCible: number | null
}) {
  return (
    <div
      dir="rtl"
      className="w-full text-center rounded-2xl py-4 px-3"
      style={{
        fontFamily: "'Noto Naskh Arabic', serif",
        fontSize: '1.8rem',
        direction: 'rtl',
        textAlign: 'center',
        lineHeight: '2.4',
        color: 'white',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {mots.map((mot, i) => {
        if (!indicesCaches.includes(i)) {
          return <Fragment key={i}><span>{mot}</span>{i < mots.length - 1 ? ' ' : ''}</Fragment>
        }
        if (i === indiceCible) {
          return (
            <Fragment key={i}>
              <span style={{ color: '#F5A623', borderBottom: '2px solid #F5A623', padding: '0 6px', letterSpacing: '4px' }}>
                ___
              </span>
              {i < mots.length - 1 ? ' ' : ''}
            </Fragment>
          )
        }
        return (
          <Fragment key={i}>
            <span style={{ color: 'rgba(255,255,255,0.25)', padding: '0 2px' }}>___</span>
            {i < mots.length - 1 ? ' ' : ''}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Conversion chiffres arabes-indiens ──────────────────────────────────────

const CHIFFRES_AR = '٠١٢٣٤٥٦٧٨٩'
function toArabicNumeral(n: number): string {
  return n.toString().split('').map((d) => CHIFFRES_AR[parseInt(d, 10)] ?? d).join('')
}

// ─── Squelette chargement ─────────────────────────────────────────────────────

function Squelette() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 animate-pulse">
      <div className="h-12 bg-white/10 rounded-2xl mb-4" />
      <div className="h-6 bg-white/10 rounded-xl w-48 mx-auto mb-5" />
      <div className="flex gap-2 mb-6">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/10 rounded-full flex-1" />)}
      </div>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white/08 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
      </div>
    </div>
  )
}

// ─── Export enveloppé dans RewardSystem ───────────────────────────────────────

export default function SourateDetailPage() {
  return (
    <RewardSystem>
      <SourateDetailInner />
    </RewardSystem>
  )
}
