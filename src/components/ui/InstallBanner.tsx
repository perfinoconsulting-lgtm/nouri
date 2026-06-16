'use client'

import { useState, useEffect } from 'react'

// Durée du refus en millisecondes : 7 jours
const DECLINE_DURATION_MS = 7 * 24 * 60 * 60 * 1000

// Seuil de sessions avant l'affichage du banner
const SESSION_THRESHOLD = 3

// Détection d'iOS Safari (pas de beforeinstallprompt)
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
}

// Détection du mode standalone (déjà installé)
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Ne pas afficher si déjà en mode standalone (app installée)
    if (isStandalone()) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    // Vérifier si le refus est encore actif
    const declinedAt = localStorage.getItem('install_declined')
    if (declinedAt && Date.now() < parseInt(declinedAt, 10)) return

    // Incrémenter et lire le compteur de sessions
    const rawCount = localStorage.getItem('lisani_session_count')
    const sessionCount = rawCount ? parseInt(rawCount, 10) : 0
    const newCount = sessionCount + 1
    localStorage.setItem('lisani_session_count', String(newCount))

    if (ios) {
      // iOS : pas d'événement beforeinstallprompt, afficher les instructions manuelles
      if (newCount >= SESSION_THRESHOLD) {
        setVisible(true)
      }
      return
    }

    // Android / Chrome : attendre l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      if (newCount >= SESSION_THRESHOLD) {
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDecline = () => {
    localStorage.setItem('install_declined', String(Date.now() + DECLINE_DURATION_MS))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      aria-label="Installer l'application Lisani"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3"
      style={{
        backgroundColor: '#1A3A5C',
        borderTop: '2px solid #F5A623',
      }}
    >
      {/* Texte principal */}
      <div className="flex flex-col min-w-0">
        <span className="text-white font-bold text-sm leading-tight truncate">
          📱 Installe Lisani sur ton téléphone !
        </span>
        {isIOSDevice ? (
          <span className="text-white/70 text-xs mt-0.5 leading-tight">
            Appuie sur <strong className="text-[#F5A623]">partage</strong> puis &ldquo;Sur l&apos;écran d&apos;accueil&rdquo;
          </span>
        ) : (
          <span className="text-white/70 text-xs mt-0.5 leading-tight">
            Accès rapide + fonctionne sans internet
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isIOSDevice && (
          <button
            onClick={handleInstall}
            className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-xl font-bold text-sm text-[#1A3A5C] transition-transform active:scale-95"
            style={{ backgroundColor: '#F5A623' }}
            aria-label="Installer l'application"
          >
            Installer
          </button>
        )}
        <button
          onClick={handleDecline}
          className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl font-bold text-sm text-white/60 hover:text-white transition-colors"
          aria-label="Ignorer le banner d'installation"
        >
          {isIOSDevice ? 'Fermer' : 'Plus tard'}
        </button>
      </div>
    </div>
  )
}
