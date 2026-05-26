'use client'

import { useRouter } from 'next/navigation'

// Bouton discret "← Parents" — affiche une confirmation si une session de jeu est en cours
export default function BoutonParents() {
  const router = useRouter()

  function handleClick() {
    const sessionActive =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('jeu-session-active') !== null

    if (sessionActive) {
      const confirmer = window.confirm('Tu veux vraiment arrêter ?')
      if (!confirmer) return
      sessionStorage.removeItem('jeu-session-active')
    }

    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleClick}
      className="text-gray-300/70 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors min-w-[80px] text-left"
      style={{ touchAction: 'manipulation' }}
    >
      ← Parents
    </button>
  )
}
