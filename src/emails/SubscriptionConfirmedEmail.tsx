import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  vert: '#27AE60',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface SubscriptionConfirmedEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
  amount: number
  renewalDate: Date
}

export function SubscriptionConfirmedEmail({
  parentPrenom,
  child,
  amount,
  renewalDate,
}: SubscriptionConfirmedEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nouralapp.fr'
  const formattedDate = renewalDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedAmount = (amount / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  })

  return (
    <EmailLayout
      previewText={`Abonnement activé pour ${child.prenom}. Prochain renouvellement : ${formattedDate}.`}
    >
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px',
        }}
      >
        🎉 Abonnement activé !
      </Heading>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Bonjour {parentPrenom},
      </Text>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        L&apos;abonnement de <strong>{child.prenom}</strong> est maintenant actif. Tout est
        prêt pour commencer l&apos;apprentissage ! ✨
      </Text>

      {/* Récapitulatif abonnement */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '0 0 24px',
          border: `1px solid ${colors.vert}`,
        }}
      >
        <Text
          style={{
            color: colors.vert,
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 8px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
          }}
        >
          ✅ Abonnement actif
        </Text>
        <Text style={{ color: colors.text, fontSize: '15px', margin: '0 0 4px' }}>
          Enfant : <strong>{child.prenom}</strong>
        </Text>
        <Text style={{ color: colors.text, fontSize: '15px', margin: '0 0 4px' }}>
          Montant : <strong>{formattedAmount}/mois</strong>
        </Text>
        <Text style={{ color: colors.text, fontSize: '15px', margin: 0 }}>
          Prochain renouvellement : <strong>{formattedDate}</strong>
        </Text>
      </div>

      <Button
        href={`${appUrl}/dashboard`}
        style={{
          backgroundColor: colors.vert,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Commencer à apprendre →
      </Button>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          margin: '24px 0 0',
          lineHeight: '1.5',
        }}
      >
        Vous pouvez gérer votre abonnement à tout moment depuis votre espace personnel.
      </Text>
    </EmailLayout>
  )
}

export default SubscriptionConfirmedEmail
