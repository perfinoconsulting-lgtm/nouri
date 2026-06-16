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
  /** Déterminé par sessionsCount > 0 sur la semaine */
  isActive: boolean
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

/** Barre de progression lettres maîtrisées / 28 */
function ProgressBar({ mastered }: { mastered: number }) {
  const pct = Math.min(100, Math.round((mastered / 28) * 100))
  return (
    <div style={{ margin: '8px 0' }}>
      <Text style={{ color: colors.textMuted, fontSize: '12px', margin: '0 0 4px' }}>
        Alphabet maîtrisé : {mastered}/28 lettres ({pct}%)
      </Text>
      <div
        style={{
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          height: '8px',
          width: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: colors.turquoise,
            height: '8px',
            borderRadius: '4px',
            width: `${pct}%`,
          }}
        />
      </div>
    </div>
  )
}

/** Carte stats pour un enfant actif cette semaine */
function ActiveChildCard({ child }: { child: ChildWeeklyStats }) {
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
          fontSize: '17px',
          fontWeight: 'bold',
          margin: '0 0 4px',
        }}
      >
        {child.prenom} ⭐
      </Text>

      <Text style={{ color: colors.turquoise, fontSize: '13px', margin: '0 0 16px', fontWeight: 'bold' }}>
        {child.lettersSeenThisWeek} lettre{child.lettersSeenThisWeek > 1 ? 's' : ''} pratiquée
        {child.lettersSeenThisWeek > 1 ? 's' : ''} cette semaine
      </Text>

      {/* Stats de la semaine */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, margin: '0 0 12px' }}>
        <StatBadge label="Sessions" value={child.sessionsCount} emoji="🎮" />
        <StatBadge label="Minutes" value={child.totalMinutes} emoji="⏱️" />
        <StatBadge label="Maîtrisées" value={child.lettersMasteredTotal} emoji="✅" />
      </div>

      <ProgressBar mastered={child.lettersMasteredTotal} />

      {child.bestStreak >= 3 && (
        <Text
          style={{
            color: colors.accent,
            fontSize: '13px',
            margin: '10px 0 0',
            fontWeight: 'bold',
          }}
        >
          🔥 {child.bestStreak} jours de suite — excellente régularité !
        </Text>
      )}

      {child.topLetter && (
        <Text style={{ color: colors.textMuted, fontSize: '13px', margin: '6px 0 0' }}>
          Lettre du moment :{' '}
          <span style={{ fontFamily: 'serif', fontSize: '20px', color: colors.text }}>
            {child.topLetter}
          </span>
        </Text>
      )}
    </div>
  )
}

/** Carte rappel doux pour un enfant inactif cette semaine */
function InactiveChildCard({ child }: { child: ChildWeeklyStats }) {
  return (
    <div
      style={{
        backgroundColor: '#fefce8',
        borderRadius: '12px',
        padding: '20px 24px',
        margin: '0 0 16px',
        border: '1px dashed #fbbf24',
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: '17px',
          fontWeight: 'bold',
          margin: '0 0 4px',
        }}
      >
        {child.prenom} 💤
      </Text>

      <Text style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 12px', lineHeight: '1.5' }}>
        {child.prenom} n&apos;a pas pratiqué cette semaine. 5 minutes par jour suffisent
        pour progresser régulièrement !
      </Text>

      {child.lettersMasteredTotal > 0 && (
        <>
          <ProgressBar mastered={child.lettersMasteredTotal} />
          <Text style={{ color: colors.textMuted, fontSize: '12px', margin: '6px 0 0' }}>
            {child.lettersMasteredTotal} lettre{child.lettersMasteredTotal > 1 ? 's' : ''} déjà
            acquises — la progression est conservée 📖
          </Text>
        </>
      )}
    </div>
  )
}

function StatBadge({ label, value, emoji }: { label: string; value: number; emoji: string }) {
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lisani.tech'

  const activeChildren = children.filter((c) => c.isActive)
  const totalLetters = activeChildren.reduce((sum, c) => sum + c.lettersSeenThisWeek, 0)
  const hasActive = activeChildren.length > 0

  /* Preview text différent du sujet dynamique */
  const previewText = hasActive
    ? `${totalLetters} lettre${totalLetters > 1 ? 's' : ''} pratiquées au total — félicitations !`
    : `5 minutes par jour suffisent — reprenez dès maintenant !`

  return (
    <EmailLayout previewText={previewText}>
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 8px',
        }}
      >
        {hasActive ? '⭐ Résumé de la semaine' : '🌙 Des nouvelles de Lisani'}
      </Heading>

      <Text style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
        Bonjour {parentPrenom},{' '}
        {hasActive
          ? 'voici les progrès de vos enfants cette semaine.'
          : 'quelques nouvelles de vos enfants.'}
      </Text>

      {/* Carte par enfant selon son activité */}
      {children.map((child, i) =>
        child.isActive ? (
          <ActiveChildCard key={i} child={child} />
        ) : (
          <InactiveChildCard key={i} child={child} />
        )
      )}

      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

      {hasActive && (
        <Text
          style={{
            color: colors.text,
            fontSize: '15px',
            fontWeight: 'bold',
            margin: '0 0 16px',
            textAlign: 'center' as const,
          }}
        >
          Continuez comme ça — la régularité fait la maîtrise ! 🌟
        </Text>
      )}

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
        Voir la progression complète →
      </Button>
    </EmailLayout>
  )
}

export default WeeklyProgressEmail
