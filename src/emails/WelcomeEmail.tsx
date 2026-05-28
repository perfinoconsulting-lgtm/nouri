import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  turquoise: '#00C9B1',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface WelcomeEmailProps {
  prenom: string
}

export function WelcomeEmail({ prenom }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nouralapp.fr'

  return (
    <EmailLayout previewText={`${prenom}, votre compte NourAl est prêt ! Commencez dès maintenant.`}>
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px',
        }}
      >
        Bienvenue sur NourAl, {prenom} ! 🌙
      </Heading>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Votre compte est créé. Vous pouvez maintenant ajouter vos enfants et commencer
        leur apprentissage de l&apos;arabe.
      </Text>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        NourAl propose un parcours progressif adapté aux enfants de 4 à 12 ans :
        alphabet, lecture, vocabulaire coranique. Chaque enfant avance à son rythme. 📖
      </Text>

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
        Accéder à mon espace →
      </Button>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '14px',
          margin: '24px 0 0',
          borderLeft: '3px solid #F5A623',
          paddingLeft: '12px',
          fontStyle: 'italic',
        }}
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </Text>
    </EmailLayout>
  )
}

export default WelcomeEmail
