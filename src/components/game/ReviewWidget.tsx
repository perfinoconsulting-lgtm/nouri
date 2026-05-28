'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ReviewStats } from '@/lib/review-scheduler'

interface Props {
  childId: string
}

// Temps relatif lisible en français pour un enfant
function tempsRelatif(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'dans moins d\'une minute'
  if (diffMin < 60) return `dans ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `dans ${diffH} heure${diffH > 1 ? 's' : ''}`
  const diffJ = Math.round(diffH / 24)
  return `dans ${diffJ} jour${diffJ > 1 ? 's' : ''}`
}

export function ReviewWidget({ childId }: Props) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    fetch(`/api/review?childId=${encodeURIComponent(childId)}&stats=true`)
      .then((r) => r.json())
      .then((data: ReviewStats) => setStats(data))
      .catch(() => setErreur(true))
  }, [childId])

  // Skeleton loader
  if (!stats && !erreur) {
    return (
      <div
        style={{
          borderRadius: '16px',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          minHeight: '80px',
          animation: 'pulse 2s infinite',
        }}
      />
    )
  }

  if (erreur || !stats) return null

  // Révisions en attente
  if (stats.dueNow > 0) {
    const estimMin = Math.ceil(stats.dueNow * 40 / 60)
    return (
      <Link
        href={`/jouer/${childId}/reviser`}
        style={{
          display: 'block',
          borderRadius: '16px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(245,166,35,0.18), rgba(245,166,35,0.08))',
          border: '2px solid rgba(245,166,35,0.5)',
          textDecoration: 'none',
          animation: 'pulse 2s infinite',
        }}
      >
        <p
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontWeight: 700,
            fontSize: '1.05rem',
            color: '#F5A623',
            margin: 0,
          }}
        >
          🔄 {stats.dueNow} lettre{stats.dueNow > 1 ? 's' : ''} t&apos;attendent !
        </p>
        <p
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.65)',
            margin: '4px 0 0',
          }}
        >
          Révise en ~{estimMin} minute{estimMin > 1 ? 's' : ''}
        </p>
      </Link>
    )
  }

  // Tout à jour
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '16px 20px',
        background: 'rgba(39,174,96,0.10)',
        border: '1px solid rgba(39,174,96,0.30)',
      }}
    >
      <p
        style={{
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 600,
          fontSize: '1rem',
          color: '#27AE60',
          margin: 0,
        }}
      >
        ✅ Tout est à jour !
      </p>
      {stats.nextReviewAt && (
        <p
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.55)',
            margin: '4px 0 0',
          }}
        >
          Prochaine révision {tempsRelatif(new Date(stats.nextReviewAt))}
        </p>
      )}
    </div>
  )
}
