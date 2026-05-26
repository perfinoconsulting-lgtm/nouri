'use client'

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { RewardContext, RewardContextValue, RewardIntensity } from '../../lib/reward-context'

interface ToastItem {
  id: number
  message: string
  stars: number
}

interface MilestoneState {
  title: string
  subtitle: string
}

interface RewardSystemProps {
  children: ReactNode
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  color: string
}

const CONFETTI_COLORS = ['#F5A623', '#FF6B9D', '#00C9B1', '#9B59B6', '#27AE60']

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
    // silence en cas d'échec Web Audio
  }
}

export function RewardSystem({ children }: RewardSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const [toastItems, setToastItems] = useState<ToastItem[]>([])
  const [milestone, setMilestone] = useState<MilestoneState | null>(null)
  const toastId = useRef(0)
  const isAnimatingRef = useRef(false)

  const ensureCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof window === 'undefined') return

    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [])

  useEffect(() => {
    ensureCanvasSize()
    window.addEventListener('resize', ensureCanvasSize)
    return () => {
      window.removeEventListener('resize', ensureCanvasSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [ensureCanvasSize])

  const renderConfettiFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles = particlesRef.current
    const width = canvas.width / (window.devicePixelRatio || 1)
    const height = canvas.height / (window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, width, height)
    particles.forEach((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.3
      particle.rotation += particle.rotationSpeed

      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate((particle.rotation * Math.PI) / 180)
      ctx.fillStyle = particle.color
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
      ctx.restore()
    })

    particlesRef.current = particles.filter(
      (particle) => particle.y < height + particle.size * 2
    )

    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(renderConfettiFrame)
    } else {
      const canvasElement = canvasRef.current
      if (canvasElement) {
        canvasElement.style.display = 'none'
      }
      isAnimatingRef.current = false
    }
  }, [])

  const triggerConfetti = useCallback(
    (intensity: RewardIntensity = 'light') => {
      const canvas = canvasRef.current
      if (!canvas || typeof window === 'undefined') return

      const count = intensity === 'full' ? 60 : 15
      const width = window.innerWidth
      const colors = CONFETTI_COLORS

      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 6,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))

      canvas.style.display = 'block'
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true
        renderConfettiFrame()
      }
    },
    [renderConfettiFrame]
  )

  const removeToast = useCallback((id: number) => {
    setToastItems((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, stars: number) => {
    const id = toastId.current + 1
    toastId.current = id
    setToastItems((current) => [...current, { id, message, stars }])

    window.setTimeout(() => removeToast(id), 2000)
  }, [removeToast])

  const showMilestone = useCallback((title: string, subtitle: string) => {
    setMilestone({ title, subtitle })
    triggerConfetti('full')
  }, [triggerConfetti])

  const playCorrect = useCallback(() => {
    playSound(523, 200, 'sine')
  }, [])

  const playWrong = useCallback(() => {
    playSound(220, 300, 'sawtooth')
  }, [])

  const playMilestone = useCallback(() => {
    [523, 659, 784].forEach((freq, index) => {
      window.setTimeout(() => playSound(freq, 150, 'sine'), index * 150)
    })
  }, [])

  const contextValue: RewardContextValue = useMemo(
    () => ({
      triggerConfetti,
      showToast,
      showMilestone,
      playCorrect,
      playWrong,
      playMilestone,
    }),
    [playCorrect, playMilestone, showToast, playWrong, showMilestone, triggerConfetti]
  )

  return (
    <RewardContext.Provider value={contextValue}>
      <div className="relative">
        {children}

        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[999] hidden"
          style={{ pointerEvents: 'none', display: 'none' }}
        />

        <div className="fixed top-4 right-4 z-[998] flex flex-col gap-3">
          {toastItems.map((toast) => (
            <div
              key={toast.id}
              className="min-w-[220px] rounded-[12px] bg-[#F5A623] px-4 py-3 text-[#1A3A5C] shadow-lg"
              style={{ animation: 'slideInRight 300ms ease-out' }}
            >
              <span className="block text-base">{'⭐'.repeat(Math.max(0, toast.stars))} {toast.message}</span>
            </div>
          ))}
        </div>

        {milestone ? (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-[24px] bg-[#1A3A5C] p-6 text-white shadow-2xl" style={{ animation: 'popIn 320ms ease-out' }}>
              <div className="mb-4 flex items-center justify-center text-5xl">🎉</div>
              <h2 className="mb-3 text-center text-3xl font-bold">{milestone.title}</h2>
              <p className="mb-6 text-center text-base text-[#E0E6F0]">{milestone.subtitle}</p>
              <button
                type="button"
                className="mx-auto block rounded-full bg-[#F5A623] px-6 py-3 text-[#1A3A5C] font-semibold"
                onClick={() => setMilestone(null)}
              >
                Continuer
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0 }
          to { transform: translateX(0); opacity: 1 }
        }
        @keyframes popIn {
          0% { transform: scale(0.75); opacity: 0 }
          80% { transform: scale(1.05); opacity: 1 }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </RewardContext.Provider>
  )
}
