import { Button, Heading, Hr, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  turquoise: '#00C9B1',
  text: '#1c1917',
  textMuted: '#78716c',
}

export interface ChildWeeklyStats {
  prenom: string
  avatar: string
  lettersSeenThisWeek: number
  lettersMasteredTotal: number
  sessionsCount: number
  totalMinutes: number
  bestStreak: number
  topLetter: string
}

interface WeeklyProgressEmailProps {
  parentPrenom: string
  children: ChildWeeklyStats[]
}

function ChildStatsCard({ child }: { child: ChildWeeklyStats }) {
  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '20px 24px',
        margin: '0 0 16px',
        border: '1px solid #e2e8f0',
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 12px',
        }}
      >
        {child.prenom}
      </Text>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
        <StatBadge label="Lettres vues" value={child.lettersSeenThisWeek} emoji="👁️" />
        <StatBadge label="Maîtrisées" value={child.lettersMasteredTotal} emoji="✅" />
        <StatBadge label="Sessions" value={child.sessionsCount} emoji="🎮" />
        <StatBadge label="Minutes" value={child.totalMinutes} emoji="⏱️" />
      </div>

      {child.bestStreak >= 3 && (
        <Text
          style={{
            color: colors.accent,
            fontSize: '14px',
            margin: '12px 0 0',
            fontWeight: 'bold',
          }}
        >
          🔥 Meilleure série : {child.bestStreak} jours consécutifs !
        </Text>
      )}

      {child.topLetter && (
        <Text style={{ color: colors.textMuted, fontSize: '14px', margin: '4px 0 0' }}>
          Lettre préférée cette semaine :{' '}
          <span style={{ fontFamily: 'serif', fontSize: '18px', color: colors.text }}>
            {child.topLetter}
          </span>
        </Text>
      )}
    </div>
  )
}

function StatBadge({
  label,
  value,
  emoji,
}: {
  label: string
  value: number
  emoji: string
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '10px 14px',
        border: '1px solid #e2e8f0',
        textAlign: 'center' as const,
        minWidth: '80px',
      }}
    >
      <Text style={{ margin: 0, fontSize: '20px' }}>{emoji}</Text>
      <Text
        style={{
          margin: '2px 0 0',
          fontSize: '20px',
          fontWeight: 'bold',
          color: colors.turquoise,
        }}
      >
        {value}
      </Text>
      <Text style={{ margin: 0, fontSize: '11px', color: colors.textMuted }}>{label}</Text>
    </div>
  )
}

export function WeeklyProgressEmail({ parentPrenom, children }: WeeklyProgressEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nouralapp.fr'
  const totalLetters = children.reduce((sum, c) => sum + c.lettersSeenThisWeek, 0)

  return (
    <EmailLayout
      previewText={`Résumé de la semaine : ${totalLetters} lettres apprises ! Continuez comme ça.`}
    >
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 8px',
        }}
      >
        ⭐ Résumé de la semaine
      </Heading>

      <Text style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
        Voici les progrès de vos enfants cette semaine, {parentPrenom}.
      </Text>

      {children.map((child, i) => (
        <ChildStatsCard key={i} child={child} />
      ))}

      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

      <Button
        href={`${appUrl}/dashboard`}
        style={{
          backgroundColor: colors.accent,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Voir le tableau de bord →
      </Button>
    </EmailLayout>
  )
}

export default WeeklyProgressEmail
