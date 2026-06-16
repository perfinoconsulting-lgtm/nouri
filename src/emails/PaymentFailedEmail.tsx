import { Button, Heading, Link, Text } from '@react-email/components'
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
  /** Nombre de jours d'accès restants avant suspension (grâce Stripe) */
  daysRemaining: number
}

export function PaymentFailedEmail({ parentPrenom, child, daysRemaining }: PaymentFailedEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lisani.tech'

  /* Libellé durée restante */
  const accessLabel =
    daysRemaining <= 0
      ? "L'accès a été suspendu."
      : daysRemaining === 1
        ? "Il reste 1 jour d'accès à " + child.prenom + '.'
        : `Il reste ${daysRemaining} jours d'accès à ${child.prenom}.`

  return (
    /* Objet : "⚠️ Problème de paiement — Action requise" */
    <EmailLayout
      previewText={`${accessLabel} Mettez à jour votre moyen de paiement pour continuer.`}
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

      {/* Durée d'accès restant */}
      <div
        style={{
          backgroundColor: daysRemaining <= 3 ? '#fff5f5' : '#fffbeb',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '0 0 20px',
          borderLeft: `4px solid ${daysRemaining <= 3 ? colors.rouge : colors.accent}`,
        }}
      >
        <Text
          style={{
            color: daysRemaining <= 3 ? colors.rouge : colors.accent,
            fontSize: '15px',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          ⏳ {accessLabel}
        </Text>
      </div>

      {/* Ce qui se passe sans action */}
      <div
        style={{
          backgroundColor: '#fff5f5',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '0 0 24px',
          borderLeft: `4px solid ${colors.rouge}`,
        }}
      >
        <Text
          style={{
            color: colors.rouge,
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 8px',
          }}
        >
          Que se passe-t-il si je ne fais rien ?
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: '14px',
            lineHeight: '1.6',
            margin: 0,
          }}
        >
          Stripe effectuera 3 nouvelles tentatives automatiques. Si le paiement reste en
          échec, l&apos;accès de {child.prenom} sera suspendu.{' '}
          <strong>Toute progression est conservée</strong> et reprend dès la régularisation.
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

      {/* Coordonnées support */}
      <Text
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          margin: '24px 0 0',
          lineHeight: '1.6',
        }}
      >
        Des questions ? Contactez notre support :{' '}
        <Link
          href="mailto:support@lisani.tech"
          style={{ color: colors.accent, textDecoration: 'underline' }}
        >
          support@lisani.tech
        </Link>
        {' '}— nous répondons sous 24h.
      </Text>
    </EmailLayout>
  )
}

export default PaymentFailedEmail
