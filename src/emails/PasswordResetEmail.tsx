import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface PasswordResetEmailProps {
  resetUrl: string
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout
      previewText="Réinitialisez votre mot de passe NourAl. Ce lien expire dans 1 heure."
    >
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px',
        }}
      >
        🔑 Réinitialisation de mot de passe
      </Heading>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Vous avez demandé la réinitialisation de votre mot de passe NourAl.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </Text>

      <Button
        href={resetUrl}
        style={{
          backgroundColor: colors.accent,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
          margin: '0 0 24px',
        }}
      >
        Réinitialiser mon mot de passe →
      </Button>

      <div
        style={{
          backgroundColor: '#fafaf9',
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '0 0 16px',
          border: '1px solid #e5e7eb',
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
          ⏱️ Ce lien est valide <strong>1 heure</strong> à compter de la réception de cet email.
        </Text>
      </div>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          lineHeight: '1.5',
          margin: 0,
        }}
      >
        Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet email.
        Votre mot de passe actuel reste inchangé.
      </Text>
    </EmailLayout>
  )
}

export default PasswordResetEmail
