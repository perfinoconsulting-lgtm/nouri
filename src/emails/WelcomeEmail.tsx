import { Button, Heading, Hr, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  turquoise: '#00C9B1',
  vert: '#27AE60',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface WelcomeEmailProps {
  prenom: string
}

const ETAPES = [
  {
    emoji: '👶',
    titre: 'Créez le profil de votre enfant',
    detail: 'Renseignez son prénom, son âge et choisissez un avatar.',
  },
  {
    emoji: '📚',
    titre: 'Choisissez son premier module',
    detail: 'Alphabet, syllabes, mots du Coran — chaque enfant avance à son rythme.',
  },
  {
    emoji: '⭐',
    titre: 'Suivez ses progrès chaque semaine',
    detail: 'Recevez un résumé de ses avancées tous les lundis matin.',
  },
]

const FEATURES_GRATUITES = [
  "Accès à l'alphabet arabe complet (28 lettres)",
  'Mode découverte avec prononciation',
  'Suivi de progression personnalisé',
  'Rappels hebdomadaires par email',
]

export function WelcomeEmail({ prenom }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lisani.tech'

  return (
    /* Objet : "Bienvenue sur Lisani 🌙 — Commençons l'aventure !" */
    <EmailLayout previewText="Votre compte est prêt. Créez le profil de votre enfant pour commencer !">
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 8px',
        }}
      >
        Bienvenue sur Lisani, {prenom} ! 🌙
      </Heading>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '15px',
          lineHeight: '1.6',
          margin: '0 0 28px',
        }}
      >
        Votre compte est créé. Suivez ces 3 étapes pour commencer l&apos;aventure avec
        votre enfant.
      </Text>

      {/* 3 étapes illustrées */}
      {ETAPES.map((etape, i) => (
        <div
          key={i}
          style={{
            margin: '0 0 12px',
            padding: '16px 20px',
            backgroundColor: '#fffbeb',
            borderRadius: '12px',
            borderLeft: `4px solid ${colors.accent}`,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: '15px',
              fontWeight: 'bold',
              margin: '0 0 4px',
            }}
          >
            {etape.emoji} {i + 1}. {etape.titre}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: '13px',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            {etape.detail}
          </Text>
        </div>
      ))}

      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

      {/* Features gratuites incluses */}
      <Text
        style={{
          color: colors.text,
          fontSize: '15px',
          fontWeight: 'bold',
          margin: '0 0 12px',
        }}
      >
        Inclus dans votre accès gratuit :
      </Text>

      {FEATURES_GRATUITES.map((feature, i) => (
        <Text
          key={i}
          style={{
            color: colors.text,
            fontSize: '14px',
            margin: '0 0 8px',
            lineHeight: '1.5',
          }}
        >
          ✅ {feature}
        </Text>
      ))}

      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

      <Button
        href={`${appUrl}/dashboard/bienvenue`}
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
        Créer le profil de mon enfant →
      </Button>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          margin: '24px 0 0',
          fontStyle: 'italic',
          borderLeft: '3px solid #F5A623',
          paddingLeft: '12px',
        }}
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </Text>
    </EmailLayout>
  )
}

export default WelcomeEmail
