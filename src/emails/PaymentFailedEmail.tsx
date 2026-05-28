import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  rouge: '#E74C3C',
  accent: '#F5A623',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface PaymentFailedEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
}

export function PaymentFailedEmail({ parentPrenom, child }: PaymentFailedEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nouralapp.fr'

  return (
    <EmailLayout
      previewText={`Action requise : problème de paiement pour ${child.prenom}. Mettez à jour votre moyen de paiement.`}
    >
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px',
        }}
      >
        ⚠️ Problème de paiement
      </Heading>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Bonjour {parentPrenom},
      </Text>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        Le paiement de l&apos;abonnement de <strong>{child.prenom}</strong> n&apos;a pas pu
        aboutir. Pour ne pas interrompre son apprentissage, veuillez mettre à jour votre
        moyen de paiement.
      </Text>

      <div
        style={{
          backgroundColor: '#fff5f5',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '0 0 24px',
          borderLeft: `4px solid ${colors.rouge}`,
        }}
      >
        <Text style={{ color: colors.rouge, fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px' }}>
          Que se passe-t-il si je ne fais rien ?
        </Text>
        <Text style={{ color: colors.text, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          Nous effectuerons 3 nouvelles tentatives automatiques. Si le paiement reste en
          échec, l&apos;accès de {child.prenom} sera suspendu. Toute progression est conservée.
        </Text>
      </div>

      <Button
        href={`${appUrl}/dashboard/abonnement`}
        style={{
          backgroundColor: colors.rouge,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Mettre à jour mon paiement →
      </Button>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          margin: '24px 0 0',
          lineHeight: '1.5',
        }}
      >
        Si vous avez des questions, répondez directement à cet email. Notre équipe vous
        aidera dans les meilleurs délais.
      </Text>
    </EmailLayout>
  )
}

export default PaymentFailedEmail
