import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  rose: '#FF6B9D',
  text: '#1c1917',
  textMuted: '#78716c',
}

const AVATAR_EMOJIS: Record<string, string> = {
  lion: '🦁',
  lapin: '🐰',
  hibou: '🦉',
  renard: '🦊',
  chat: '🐱',
  étoile: '⭐',
}

interface ChildCreatedEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
}

export function ChildCreatedEmail({ parentPrenom, child }: ChildCreatedEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nouralapp.fr'
  const avatarEmoji = AVATAR_EMOJIS[child.avatar] ?? '⭐'

  return (
    <EmailLayout
      previewText={`${child.prenom} est prêt à apprendre l'arabe ! Commencez le premier exercice.`}
    >
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px',
        }}
      >
        {avatarEmoji} {child.prenom} est prêt à apprendre !
      </Heading>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Bonjour {parentPrenom},
      </Text>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        Le profil de <strong>{child.prenom}</strong> a bien été créé. Son aventure avec
        l&apos;alphabet arabe commence maintenant ! 🎉
      </Text>

      <div
        style={{
          backgroundColor: '#fff7ed',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '0 0 24px',
          borderLeft: `4px solid ${colors.rose}`,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: '15px',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          💡 <strong>Conseil :</strong> Faites 5 à 10 minutes par jour avec {child.prenom}.
          La régularité est la clé de la mémorisation durable.
        </Text>
      </div>

      <Button
        href={`${appUrl}/dashboard`}
        style={{
          backgroundColor: colors.rose,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Commencer avec {child.prenom} →
      </Button>
    </EmailLayout>
  )
}

export default ChildCreatedEmail
