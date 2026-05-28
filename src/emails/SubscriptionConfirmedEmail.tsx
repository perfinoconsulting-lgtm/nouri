import { Button, Heading, Hr, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const colors = {
  accent: '#F5A623',
  vert: '#27AE60',
  turquoise: '#00C9B1',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface SubscriptionConfirmedEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
  /** Montant en centimes (ex : 200 pour 2€) */
  amount: number
  renewalDate: Date
}

const FEATURES_DEBLOQUEES = [
  'Alphabet complet avec tracé animé',
  'Syllabes et mots du vocabulaire coranique',
  "Sourates illustrées avec aide à la récitation",
  'Répétition espacée intelligente (mémorisation durable)',
  'Statistiques détaillées et suivi par niveau',
]

const SUGGESTIONS_DEMARRAGE = [
  { emoji: '🔤', titre: "L'alphabet arabe", detail: 'Commencez par les lettres isolées.' },
  { emoji: '📖', titre: 'Al-Fatiha', detail: 'La sourate la plus mémorisée, étape par étape.' },
  { emoji: '🎮', titre: 'Mini-jeux', detail: 'Mémoriser en jouant — sans écran passif.' },
]

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
    /* Objet : "Abonnement activé ! [Prénom] a accès à tout NourAl 🎉" */
    <EmailLayout
      previewText={`Tout est débloqué pour ${child.prenom}. Découvrez par où commencer !`}
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

      <Text style={{ color: colors.text, fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
        Bonjour {parentPrenom}, l&apos;abonnement de <strong>{child.prenom}</strong> est
        maintenant actif. Tout NourAl lui est ouvert ! ✨
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
            fontSize: '13px',
            fontWeight: 'bold',
            margin: '0 0 10px',
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

      {/* Features débloquées */}
      <Text
        style={{
          color: colors.text,
          fontSize: '15px',
          fontWeight: 'bold',
          margin: '0 0 12px',
        }}
      >
        ✨ Ce qui est débloqué pour {child.prenom} :
      </Text>

      {FEATURES_DEBLOQUEES.map((feature, i) => (
        <Text
          key={i}
          style={{
            color: colors.text,
            fontSize: '14px',
            margin: '0 0 8px',
            lineHeight: '1.5',
          }}
        >
          ✨ {feature}
        </Text>
      ))}

      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

      {/* Par où commencer ? */}
      <Text
        style={{
          color: colors.text,
          fontSize: '15px',
          fontWeight: 'bold',
          margin: '0 0 12px',
        }}
      >
        Par où commencer ?
      </Text>

      {SUGGESTIONS_DEMARRAGE.map((s, i) => (
        <div
          key={i}
          style={{
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            margin: '0 0 8px',
            borderLeft: `3px solid ${colors.turquoise}`,
          }}
        >
          <Text style={{ color: colors.text, fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px' }}>
            {s.emoji} {s.titre}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>{s.detail}</Text>
        </div>
      ))}

      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

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

      {/* Note résiliation */}
      <Text
        style={{
          color: colors.textMuted,
          fontSize: '12px',
          margin: '20px 0 0',
          lineHeight: '1.5',
          textAlign: 'center' as const,
        }}
      >
        Résiliable en 1 clic depuis votre espace parent — sans engagement, sans pénalité.
      </Text>
    </EmailLayout>
  )
}

export default SubscriptionConfirmedEmail
