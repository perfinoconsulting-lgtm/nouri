import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface SubscriptionCancelledEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
  endDate: Date
}

export function SubscriptionCancelledEmail({
  parentPrenom,
  child,
  endDate,
}: SubscriptionCancelledEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lisani.tech'
  const formattedDate = endDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <EmailLayout
      previewText={`L'abonnement de ${child.prenom} se termine le ${formattedDate}. Vous pouvez le réactiver.`}
    >
      <Heading
        style={{
          color: colors.text,
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px',
        }}
      >
        Au revoir... 😢
      </Heading>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
        Bonjour {parentPrenom},
      </Text>

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        L&apos;abonnement de <strong>{child.prenom}</strong> a bien été résilié. Il conserve
        l&apos;accès jusqu&apos;au <strong>{formattedDate}</strong>.
      </Text>

      <div
        style={{
          backgroundColor: '#fafaf9',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '0 0 24px',
          border: '1px solid #e5e7eb',
        }}
      >
        <Text style={{ color: colors.text, fontSize: '15px', margin: '0 0 8px', fontWeight: 'bold' }}>
          📚 La progression de {child.prenom} est sauvegardée
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          Toutes les lettres apprises et les étoiles gagnées restent enregistrées.
          Si vous réactivez l&apos;abonnement, {child.prenom} reprend exactement là où
          il s&apos;était arrêté.
        </Text>
      </div>

      <Button
        href={`${appUrl}/dashboard/abonnement`}
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
        Réactiver l&apos;abonnement →
      </Button>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          margin: '24px 0 0',
          lineHeight: '1.5',
        }}
      >
        Nous espérons vous revoir bientôt. N&apos;hésitez pas à nous contacter si vous avez
        des questions ou des retours à nous faire.
      </Text>
    </EmailLayout>
  )
}

export default SubscriptionCancelledEmail
