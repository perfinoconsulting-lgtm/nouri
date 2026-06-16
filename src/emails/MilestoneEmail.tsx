import { Button, Heading, Link, Text } from '@react-email/components'
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
  { emoji: string; title: string; description: string; whatsappMessage: string }
> = {
  '5_letters': {
    emoji: '⭐',
    title: 'a appris 5 lettres arabes !',
    description: 'Le voyage commence ! Les 5 premières lettres arabes sont maîtrisées.',
    whatsappMessage: 'Ma fille/mon fils vient d\'apprendre ses 5 premières lettres arabes grâce à Lisani ! 🌙⭐',
  },
  '10_letters': {
    emoji: '🌟',
    title: 'connaît 10 lettres arabes !',
    description: "À mi-chemin de l'alphabet ! Une belle progression semaine après semaine.",
    whatsappMessage: 'Ma fille/mon fils connaît maintenant 10 lettres arabes ! 🌙🌟 #Lisani',
  },
  '20_letters': {
    emoji: '🏆',
    title: 'maîtrise 20 lettres arabes !',
    description: "Presque tout l'alphabet ! Encore 8 lettres et c'est terminé. Quelle progression !",
    whatsappMessage: 'Ma fille/mon fils maîtrise 20 lettres arabes sur 28 ! 🏆 #Lisani',
  },
  '28_letters': {
    emoji: '🎓',
    title: 'connaît tout l\'alphabet arabe !',
    description:
      "L'alphabet complet est maîtrisé — toutes les 28 lettres ! Une étape immense franchie.",
    whatsappMessage:
      'Ma fille/mon fils connaît TOUT l\'alphabet arabe ! 🎓🌙 بِسْمِ اللَّهِ — grâce à Lisani !',
  },
  first_sourate: {
    emoji: '📖',
    title: 'a lu sa première sourate !',
    description: 'Al-Fatiha récitée ! Un moment béni pour toute la famille. ما شاء الله',
    whatsappMessage:
      'Ma fille/mon fils a lu Al-Fatiha pour la première fois ! 📖🌙 ما شاء الله #Lisani',
  },
  streak_7: {
    emoji: '🔥',
    title: 'apprend depuis 7 jours de suite !',
    description: '7 jours consécutifs d\'apprentissage. La régularité fait la maîtrise — bravo !',
    whatsappMessage:
      'Ma fille/mon fils apprend l\'arabe chaque jour depuis 7 jours de suite ! 🔥🌙 #Lisani',
  },
  level_up: {
    emoji: '🚀',
    title: 'est passé au niveau supérieur !',
    description:
      'Un nouveau niveau atteint. Les exercices s\'adaptent maintenant à sa progression.',
    whatsappMessage:
      'Ma fille/mon fils vient de changer de niveau sur Lisani ! 🚀🌙 Fier(e) de lui/elle !',
  },
}

/** Génère l'objet de l'email selon le milestone — à utiliser côté service d'envoi */
export function getMilestoneSubject(childPrenom: string, milestone: MilestoneType): string {
  const config = MILESTONE_CONFIG[milestone]
  return `${config.emoji} ${childPrenom} ${config.title}`
}

interface MilestoneEmailProps {
  parentPrenom: string
  child: { prenom: string; avatar: string }
  milestone: MilestoneType
}

export function MilestoneEmail({ parentPrenom, child, milestone }: MilestoneEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lisani.tech'
  const config = MILESTONE_CONFIG[milestone]

  /* Message WhatsApp encodé URL */
  const waMessage = encodeURIComponent(
    config.whatsappMessage.replace("Ma fille/mon fils", child.prenom)
  )
  const waUrl = `https://wa.me/?text=${waMessage}`

  return (
    /* Objet dynamique via getMilestoneSubject() */
    <EmailLayout previewText={`Félicitez ${child.prenom} — il/elle vient de franchir une belle étape !`}>
      {/* Célébration centrale */}
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <Text style={{ fontSize: '64px', margin: '0 0 8px', lineHeight: '1' }}>
          {config.emoji}
        </Text>
        <Heading
          style={{
            color: colors.text,
            fontSize: '22px',
            fontWeight: 'bold',
            margin: '0 0 8px',
          }}
        >
          🎓 Félicitations, {parentPrenom} !
        </Heading>
        <Text
          style={{
            color: colors.turquoise,
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            lineHeight: '1.4',
          }}
        >
          {child.prenom} {config.title}
        </Text>
      </div>

      <Text
        style={{
          color: colors.text,
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 24px',
          textAlign: 'center' as const,
        }}
      >
        {config.description}
      </Text>

      {/* Encart félicitation */}
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
            fontSize: '15px',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          N&apos;oubliez pas de féliciter {child.prenom} en personne ! 🤗
        </Text>
      </div>

      {/* Bouton principal */}
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
          marginBottom: '12px',
        }}
      >
        Voir la progression →
      </Button>

      {/* Bouton partage WhatsApp */}
      <div style={{ margin: '12px 0 0' }}>
        <Link
          href={waUrl}
          style={{
            backgroundColor: '#25D366',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          📱 Partager sur WhatsApp
        </Link>
      </div>
    </EmailLayout>
  )
}

export default MilestoneEmail
