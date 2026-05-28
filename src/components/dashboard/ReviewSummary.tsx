'use client'

import { useEffect, useState } from 'react'
import type { ReviewStats } from '@/lib/review-scheduler'

interface Props {
  childId: string
  childPrenom: string
}

interface StatsEtendues extends ReviewStats {
  totalItems: number
  retentionPct: number | null
}

export function ReviewSummary({ childId, childPrenom }: Props) {
  const [stats, setStats] = useState<StatsEtendues | null>(null)
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/review?childId=${encodeURIComponent(childId)}&stats=true`).then((r) => r.json()),
      fetch(`/api/children/${encodeURIComponent(childId)}/stats`).then((r) => r.json()),
    ])
      .then(([reviewData, sessionData]: [ReviewStats, { sessions: Array<{ correct_answers: number; items_reviewed: number; date: string }> }]) => {
        // Calcul du taux de rétention sur 7 jours depuis les sessions
        const sept = new Date()
        sept.setDate(sept.getDate() - 7)
        const sessionsRecentes = (sessionData.sessions ?? []).filter(
          (s) => new Date(s.date) >= sept
        )
        let totalBonnes = 0
        let totalTentatives = 0
        for (const s of sessionsRecentes) {
          totalBonnes += s.correct_answers ?? 0
          totalTentatives += s.items_reviewed ?? 0
        }
        const retentionPct =
          totalTentatives > 0 ? Math.round((totalBonnes / totalTentatives) * 100) : null

        const totalItems =
          (reviewData.masteredTotal ?? 0) +
          (reviewData.inProgress ?? 0) +
          (reviewData.neverSeen ?? 0)

        setStats({ ...reviewData, totalItems, retentionPct })
      })
      .catch(() => setErreur(true))
  }, [childId])

  // Skeleton loader
  if (!stats && !erreur) {
    return (
      <div
        style={{
          borderRadius: '16px',
          padding: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          minHeight: '120px',
        }}
      >
        <div
          style={{
            height: '16px',
            width: '60%',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            marginBottom: '12px',
            animation: 'pulse 2s infinite',
          }}
        />
        <div
          style={{
            height: '12px',
            width: '80%',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '8px',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>
    )
  }

  if (erreur || !stats) return null

  const pctMaitrises = stats.totalItems > 0
    ? Math.round((stats.masteredTotal / stats.totalItems) * 100)
    : 0

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '20px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {/* Titre */}
      <p
        style={{
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 700,
          fontSize: '1rem',
          color: '#F5A623',
          margin: '0 0 14px',
        }}
      >
        📊 Révision de {childPrenom}
      </p>

      {/* Barre de maîtrise */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Maîtrisés
          </span>
          <span
            style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: '0.82rem',
              color: '#00C9B1',
              fontWeight: 600,
            }}
          >
            {stats.masteredTotal} / {stats.totalItems}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.10)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pctMaitrises}%`,
              background: 'linear-gradient(90deg, #00C9B1, #27AE60)',
              borderRadius: '99px',
              transition: 'width 600ms ease',
            }}
          />
        </div>
      </div>

      {/* Taux de rétention 7 jours */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px',
          padding: '10px 14px',
        }}
      >
        <span
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.60)',
          }}
        >
          Rétention 7 jours
        </span>
        {stats.retentionPct !== null ? (
          <span
            style={{
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 700,
              fontSize: '1rem',
              color: stats.retentionPct >= 70 ? '#27AE60' : stats.retentionPct >= 40 ? '#F5A623' : '#E74C3C',
            }}
          >
            {stats.retentionPct}%
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Pas encore de données
          </span>
        )}
      </div>
    </div>
  )
}
