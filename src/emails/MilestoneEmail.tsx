import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  turquoise: '#00C9B1',
  text: '#1c1917',
  textMuted: '#78716c',
}

export type MilestoneType =
  | '5_letters'
  | '10_letters'
  | '20_letters'
  | '28_letters'
  | 'first_sourate'
  | 'streak_7'
  | 'level_up'

const MILESTONE_CONFIG: Record<
  MilestoneType,
  { emoji: string; title: string; description: string }
> = {
  '5_letters': {
    emoji: '⭐',
    title: 'a appris 5 lettres !',
    description: 'Le voyage commence ! Les 5 premières lettres arabes sont maîtrisées.',
  },
  '10_letters': {
    emoji: '🌟',
    title: 'connaît 10 lettres !',
    description: 'À mi-chemin de l\'alphabet ! Une belle progression.',
  },
  '20_letters': {
    emoji: '🏆',
    title: 'maîtrise 20 lettres !',
    description: 'Presque tout l\'alphabet ! Encore 8 lettres et c\'est terminé.',
  },
  '28_letters': {
    emoji: '🎓',
    title: 'connaît tout l\'alphabet arabe !',
    description: 'L\'alphabet complet est maîtrisé. Une étape immense franchie !',
  },
  first_sourate: {
    emoji: '📖',
    title: 'a lu sa première sourate !',
    description: 'Al-Fatiha récitée ! Un moment béni pour toute la famille.',
  },
  streak_7: {
    emoji: '🔥',
    title: 'apprend depuis 7 jours de suite !',
    description: '7 jours consécutifs d\'apprentissage. La régularité fait la maîtrise.',
  },
  level_up: {
    emoji: '🚀',
    title: 'a changé de niveau !',
    description: 'Un nouveau niveau atteint. Les défis s\'adaptent à sa progression.',
  },
}

interface MilestoneEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
  milestone: MilestoneType
}

export function MilestoneEmail({ parentPrenom, child, milestone }: MilestoneEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nouralapp.fr'
  const config = MILESTONE_CONFIG[milestone]

  return (
    <EmailLayout
      previewText={`${child.prenom} ${config.title} Félicitez-le !`}
    >
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <Text style={{ fontSize: '64px', margin: '0 0 8px' }}>{config.emoji}</Text>
        <Heading
          style={{
            color: colors.text,
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 8px',
          }}
        >
          🎓 Félicitations !
        </Heading>
        <Text
          style={{
            color: colors.turquoise,
            fontSize: '20px',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          {child.prenom} {config.title}
        </Text>
      </div>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Bonjour {parentPrenom},
      </Text>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        {config.description}
      </Text>

      <div
        style={{
          backgroundColor: '#fffbeb',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '0 0 24px',
          textAlign: 'center' as const,
          border: `2px solid ${colors.accent}`,
        }}
      >
        <Text
          style={{
            color: colors.accent,
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          N&apos;oubliez pas de féliciter {child.prenom} ! 🤗
        </Text>
      </div>

      <Button
        href={`${appUrl}/dashboard`}
        style={{
          backgroundColor: colors.turquoise,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Voir les progrès →
      </Button>
    </EmailLayout>
  )
}

export default MilestoneEmail
