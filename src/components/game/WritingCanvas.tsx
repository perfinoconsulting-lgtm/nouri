'use client'

/**
 * components/game/WritingCanvas.tsx — Composant de tracé de lettres arabes
 *
 * Ce composant Client interactif fournit un canvas de dessin responsive
 * à 3 couches superposées pour guider l'enfant dans l'écriture des lettres arabes.
 *
 * États : 'guide' | 'drawing' | 'validating' | 'selfeval' | 'done'
 */

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getLetterByIndex } from '@/lib/data/letters'
import {
  validateDrawing,
  getCanvasCoords,
  measureInkCoverage,
  ValidationResult
} from '@/lib/drawing-validator'

interface Props {
  letterIndex: number
  onValidated: (score: number, points: number) => void
  onSkip: () => void
}

// Couleurs de la palette de dessin
const PALETTE_COLORS = ['#FFD97D', '#FF6B9D', '#00C9B1', '#FFFFFF', '#9B59B6']

export default function WritingCanvas({ letterIndex, onValidated, onSkip }: Props) {
  const params = useParams()
  const childId = (params?.childId as string) || 'default-child'

  // Récupérer les données de la lettre
  const letter = getLetterByIndex(letterIndex)
  // Utiliser la forme isolée si possible, sinon la lettre avec harakat
  const letterChar = letter.formes?.isol || letter.ar

  // États du jeu
  const [state, setState] = useState<'guide' | 'drawing' | 'validating' | 'selfeval' | 'done'>('guide')
  const [selectedColor, setSelectedColor] = useState('#FFD97D')
  const [coverage, setCoverage] = useState(0)
  const [valResult, setValResult] = useState<ValidationResult | null>(null)
  
  // États d'animation et retours
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [encouragement, setEncouragement] = useState<string | null>(null)

  // Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const guideRef = useRef<HTMLCanvasElement>(null)
  const pathRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef<HTMLCanvasElement>(null)

  // Taille responsive du canvas
  const [canvasSize, setCanvasSize] = useState({ width: 360, height: 240 })

  // Suivi du tracé
  const isDrawing = useRef(false)
  const lastCoords = useRef<{ x: number; y: number } | null>(null)

  // --- Synthétiseur de sons (Web Audio API) ---
  const playSound = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (typeof window === 'undefined') return
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
      osc.start()
      osc.stop(ctx.currentTime + duration / 1000)
    } catch (err) {
      console.error('Audio synthesis failed:', err)
    }
  }

  // --- Gestion de la taille responsive (ResizeObserver) ---
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // Limiter aux dimensions maximales tout en restant proportionnel (3:2)
        setCanvasSize({ width: width || 360, height: height || 240 })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // --- Dessin de la lettre pointillée dorée (avec animation de défilement) ---
  const drawGoldenPath = (
    ctx: CanvasRenderingContext2D,
    char: string,
    width: number,
    height: number,
    dashOffset = 0
  ) => {
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.strokeStyle = 'rgba(245, 166, 35, 0.35)'
    ctx.lineWidth = 4
    ctx.setLineDash([8, 6])
    ctx.lineDashOffset = dashOffset
    ctx.font = `${Math.floor(height * 0.65)}px 'Noto Naskh Arabic'`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Légèrement décalé vers le bas pour compenser l'alignement arabe
    ctx.strokeText(char, width / 2, height / 2 + height * 0.04)
    ctx.restore()
  }

  // --- Dessin des guides statiques et animés ---
  useEffect(() => {
    const guideCanvas = guideRef.current
    const pathCanvas = pathRef.current
    if (!guideCanvas || !pathCanvas) return

    const guideCtx = guideCanvas.getContext('2d')
    const pathCtx = pathCanvas.getContext('2d')
    if (!guideCtx || !pathCtx) return

    let animationId: number
    let offset = 0

    // S'assurer que les polices sont chargées pour éviter un rendu vide
    document.fonts.ready.then(() => {
      // 1. Dessiner la lettre fantôme d'arrière-plan sur le canvas guide
      guideCtx.clearRect(0, 0, canvasSize.width, canvasSize.height)
      guideCtx.save()
      guideCtx.globalAlpha = 0.12
      guideCtx.fillStyle = '#F5A623'
      guideCtx.font = `${Math.floor(canvasSize.height * 0.65)}px 'Noto Naskh Arabic'`
      guideCtx.textAlign = 'center'
      guideCtx.textBaseline = 'middle'
      guideCtx.fillText(letterChar, canvasSize.width / 2, canvasSize.height / 2 + canvasSize.height * 0.04)
      guideCtx.restore()

      // 2. Animer la ligne pointillée si on est en mode 'guide'
      if (state === 'guide') {
        const animate = () => {
          offset -= 0.4
          if (offset < -14) offset = 0
          drawGoldenPath(pathCtx, letterChar, canvasSize.width, canvasSize.height, offset)
          animationId = requestAnimationFrame(animate)
        }
        animate()
      } else {
        // Sinon, tracer une ligne pointillée statique
        drawGoldenPath(pathCtx, letterChar, canvasSize.width, canvasSize.height, 0)
      }
    })

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [canvasSize, letterChar, state])

  // --- Dessiner/Tracer avec la souris ou le touch ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (state !== 'drawing') return
    const canvas = drawRef.current
    if (!canvas) return

    isDrawing.current = true
    const coords = getCanvasCoords(e.nativeEvent, canvas)
    lastCoords.current = coords

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = selectedColor
      ctx.fill()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || state !== 'drawing' || !lastCoords.current) return
    const canvas = drawRef.current
    if (!canvas) return

    const coords = getCanvasCoords(e.nativeEvent, canvas)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(lastCoords.current.x, lastCoords.current.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    lastCoords.current = coords
  }

  const stopDrawing = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    lastCoords.current = null

    // Mettre à jour la couverture en temps réel
    const canvas = drawRef.current
    if (canvas) {
      const currentCoverage = measureInkCoverage(canvas)
      setCoverage(currentCoverage)
    }
  }

  // --- Recommencer le tracé ---
  const handleReset = () => {
    const canvas = drawRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
    }
    setCoverage(0)
    setIsError(false)
    setIsSuccess(false)
    setState('drawing')
    playSound(440, 100, 'sine') // Son neutre de reset
  }

  // --- Étape de validation ---
  const handleValidate = async () => {
    const canvas = drawRef.current
    if (!canvas) return

    setState('validating')
    const result = validateDrawing(canvas)
    setValResult(result)

    if (!result.passed) {
      // Échec de validation
      playSound(180, 250, 'triangle') // Bip grave d'erreur
      setIsError(true)

      // Revenir à l'état de dessin après 600ms (effet de tremblement)
      setTimeout(() => {
        setIsError(false)
        setState('drawing')
      }, 600)
    } else {
      // Succès
      setIsSuccess(true)
      // Fanfare de succès
      ;[523, 659, 784].forEach((f, i) => {
        setTimeout(() => playSound(f, 150, 'sine'), i * 150)
      })

      // Convertir en Blob et POST
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const form = new FormData()
        form.append('image', blob, `${Date.now()}.png`)
        form.append('childId', childId)
        form.append('lettreIndex', String(letterIndex))
        try {
          await fetch('/api/drawings', { method: 'POST', body: form })
        } catch (err) {
          console.error("Erreur d'enregistrement du tracé :", err)
        }
      }, 'image/png')

      // Passer à l'auto-évaluation
      setState('selfeval')
    }
  }

  // --- Auto-évaluation ---
  const handleSelfEval = (choice: 'yes' | 'retry' | 'hard') => {
    if (!valResult) return

    if (choice === 'yes') {
      // Enfant très content : +2 points bonus !
      playSound(880, 200, 'sine')
      setState('done')
      setTimeout(() => {
        onValidated(valResult.score, valResult.points + 2)
      }, 500)
    } else if (choice === 'retry') {
      // L'enfant veut recommencer
      handleReset()
    } else if (choice === 'hard') {
      // C'est difficile : message encourageant puis validation normale
      playSound(587, 300, 'sine')
      setEncouragement("C'est normal d'apprendre ! Chaque essai te rend plus fort 💪")
      
      setTimeout(() => {
        setEncouragement(null)
        setState('done')
        onValidated(valResult.score, valResult.points)
      }, 2200)
    }
  }

  // Barre de progression
  const progressWidth = Math.min(100, Math.round(coverage * 100 * 8))
  const progressColor = progressWidth < 20 ? 'bg-[#00C9B1]' : 'bg-[#27AE60]'
  
  // Label sous la barre de progression
  const progressLabel =
    coverage < 0.05
      ? 'Continue à tracer… ✏️'
      : coverage < 0.15
      ? 'Bien ! Continue !'
      : 'Super ! Tu peux valider 👍'

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Styles des animations */}
      <style>{`
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes correctBounce {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.15); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          80% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-shake {
          animation: wrongShake 0.4s ease-in-out;
        }
        .animate-bounce-once {
          animation: correctBounce 0.5s ease-out;
        }
        .animate-pop-in {
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      {/* Titre et Instructions */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1 font-baloo">
          Trace la lettre {letter.nom} {letter.emoji}
        </h2>
        
        {state === 'guide' && (
          <p className="text-white/80 text-sm">Regarde bien comment on trace ! 👁️</p>
        )}
        {state === 'drawing' && (
          <p className="text-white/80 text-sm">À toi de jouer ! Glisse ton doigt pour tracer la lettre 📝</p>
        )}
        {state === 'validating' && (
          <p className="text-white/80 text-sm animate-pulse">Vérification de ton écriture... 🧐</p>
        )}
        {state === 'selfeval' && (
          <p className="text-[#F5A623] text-base font-bold animate-bounce-once">
            {valResult?.feedback} ({valResult?.score}%)
          </p>
        )}
      </div>

      {/* Zone Canvas Triple Couche */}
      <div
        ref={containerRef}
        className={`relative w-full max-w-[360px] aspect-[3/2] border-4 rounded-3xl overflow-hidden bg-[#0d2137]/80 shadow-2xl transition-all duration-300 ${
          isError
            ? 'border-[#E74C3C] animate-shake'
            : isSuccess
            ? 'border-[#27AE60]'
            : 'border-white/20'
        }`}
        style={{
          background: 'radial-gradient(ellipse at top, #0d2137 0%, #1A3A5C 70%)',
          maxWidth: '360px',
        }}
      >
        {/* Couche 1 : Canvas Guide (Lettre Fantôme) */}
        <canvas
          ref={guideRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 pointer-events-none select-none z-[1]"
        />

        {/* Couche 2 : Canvas Path (Pointillés dorés) */}
        <canvas
          ref={pathRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 pointer-events-none select-none z-[2]"
        />

        {/* Couche 3 : Canvas Draw (Tracé Enfant - Seul avec touch-action none) */}
        <canvas
          ref={drawRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 z-[3] cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Overlay d'encouragement */}
        {encouragement && (
          <div className="absolute inset-0 bg-[#0d2137]/90 z-[4] flex items-center justify-center p-4 animate-pop-in">
            <p className="text-white text-lg font-bold text-center leading-relaxed">
              {encouragement}
            </p>
          </div>
        )}
      </div>

      {/* Contrôles et boutons selon l'état */}
      <div className="w-full max-w-[360px] mt-4 flex flex-col items-center gap-4">
        {/* ÉTAT : GUIDE */}
        {state === 'guide' && (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => playSound(659, 150)}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/10 text-sm select-none transition-all active:scale-95"
            >
              Revoir 🔄
            </button>
            <button
              onClick={() => {
                setState('drawing')
                playSound(523, 100)
              }}
              className="flex-1 py-3 px-4 bg-[#F5A623] hover:bg-[#F5A623]/95 text-white font-bold rounded-2xl text-sm select-none transition-all active:scale-95 shadow-lg shadow-[#F5A623]/20"
            >
              Je suis prêt ! →
            </button>
          </div>
        )}

        {/* ÉTAT : DRAWING */}
        {state === 'drawing' && (
          <div className="w-full flex flex-col gap-4 animate-pop-in">
            {/* Palette de couleurs */}
            <div className="flex justify-center gap-3">
              {PALETTE_COLORS.map((color) => {
                const isSelected = selectedColor === color
                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color)
                      playSound(880, 50)
                    }}
                    className={`w-9 h-9 rounded-full transition-all duration-250 cursor-pointer ${
                      isSelected
                        ? 'scale-[1.3] border-2 border-white shadow-lg shadow-black/30'
                        : 'border border-white/20 hover:scale-115'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Couleur ${color}`}
                  />
                )
              })}
            </div>

            {/* Barre de couverture en temps réel */}
            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${progressWidth}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white select-none">
                {progressLabel}
              </span>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl border border-white/10 text-sm select-none transition-all active:scale-95"
              >
                🗑️ Recommencer
              </button>
              <button
                onClick={handleValidate}
                className="flex-1 py-3 px-4 bg-[#00C9B1] hover:bg-[#00C9B1]/95 text-white font-bold rounded-2xl text-sm select-none transition-all active:scale-95 shadow-lg shadow-[#00C9B1]/20"
              >
                ✅ Valider
              </button>
            </div>
          </div>
        )}

        {/* ÉTAT : SELF-EVALUATION */}
        {state === 'selfeval' && (
          <div className="w-full flex flex-col items-center gap-3 animate-pop-in">
            <p className="text-white font-bold text-sm">Es-tu content de ton tracé ?</p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => handleSelfEval('yes')}
                className="flex-1 py-3 px-1 bg-[#27AE60] hover:bg-[#27AE60]/95 text-white font-bold rounded-2xl text-xs select-none transition-all active:scale-95 flex flex-col items-center gap-1 shadow-md shadow-[#27AE60]/20"
              >
                <span className="text-lg">😊</span>
                <span>Oui !</span>
              </button>
              <button
                onClick={() => handleSelfEval('retry')}
                className="flex-1 py-3 px-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs select-none transition-all active:scale-95 flex flex-col items-center gap-1 border border-white/10"
              >
                <span className="text-lg">😐</span>
                <span>Je réessaie</span>
              </button>
              <button
                onClick={() => handleSelfEval('hard')}
                className="flex-1 py-3 px-1 bg-[#F5A623] hover:bg-[#F5A623]/95 text-white font-bold rounded-2xl text-xs select-none transition-all active:scale-95 flex flex-col items-center gap-1 shadow-md shadow-[#F5A623]/20"
              >
                <span className="text-lg">😕</span>
                <span>C'est difficile</span>
              </button>
            </div>
          </div>
        )}

        {/* Bouton de secours (Skip) */}
        {state !== 'selfeval' && state !== 'done' && (
          <button
            onClick={() => {
              playSound(330, 100)
              onSkip()
            }}
            className="text-white/40 hover:text-white/60 text-xs font-semibold py-1 select-none transition-colors mt-2"
          >
            Sauter cette lettre ⏭️
          </button>
        )}
      </div>
    </div>
  )
}
