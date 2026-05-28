import { Resend } from 'resend'
import * as React from 'react'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { ChildCreatedEmail } from '@/emails/ChildCreatedEmail'
import { WeeklyProgressEmail } from '@/emails/WeeklyProgressEmail'
import { SubscriptionConfirmedEmail } from '@/emails/SubscriptionConfirmedEmail'
import { PaymentFailedEmail } from '@/emails/PaymentFailedEmail'
import { SubscriptionCancelledEmail } from '@/emails/SubscriptionCancelledEmail'
import { MilestoneEmail, getMilestoneSubject } from '@/emails/MilestoneEmail'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'
import type { ChildWeeklyStats } from '@/emails/WeeklyProgressEmail'
import type { MilestoneType } from '@/emails/MilestoneEmail'

export type { ChildWeeklyStats, MilestoneType }

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailPayload {
  to: string
  subject: string
  react: React.ReactElement
  type: string
}

async function sendEmailSafe(payload: EmailPayload): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: 'NourAl <noreply@nouralapp.fr>',
      to: payload.to,
      subject: payload.subject,
      react: payload.react,
    })
    // Logger uniquement le type et succès — jamais l'email en clair (RGPD)
    console.log('email_sent', { type: payload.type, success: !!result.data })
  } catch {
    console.error('email_failed_silently', { type: payload.type })
    // Ne jamais throw — ne pas bloquer l'action utilisateur
  }
}

export function sendWelcomeEmail(parent: { email: string; prenom: string }): void {
  void sendEmailSafe({
    to: parent.email,
    subject: 'Bienvenue sur NourAl 🌙',
    react: React.createElement(WelcomeEmail, { prenom: parent.prenom }),
    type: 'welcome',
  })
}

export function sendChildCreatedEmail(
  parent: { email: string; prenom: string },
  child: { prenom: string; avatar: string },
): void {
  void sendEmailSafe({
    to: parent.email,
    subject: `${child.prenom} est prêt à apprendre !`,
    react: React.createElement(ChildCreatedEmail, { parentPrenom: parent.prenom, child }),
    type: 'child_created',
  })
}

export function sendWeeklyProgressEmail(
  parent: { email: string; prenom: string },
  children: ChildWeeklyStats[],
): void {
  const activeChildren = children.filter((c) => c.isActive)
  const totalLetters = activeChildren.reduce((sum, c) => sum + c.lettersSeenThisWeek, 0)
  const firstChild = children[0]
  const hasActive = activeChildren.length > 0

  /* Sujet dynamique actif / inactif */
  const subject = (() => {
    if (!hasActive) {
      return firstChild
        ? `${firstChild.prenom} n'a pas pratiqué — 5 min suffisent ! 🌙`
        : "Vos enfants n'ont pas pratiqué cette semaine 🌙"
    }
    if (children.length === 1 && firstChild) {
      return `${firstChild.prenom} a appris ${totalLetters} lettres cette semaine ! ⭐`
    }
    return `Vos enfants ont appris ${totalLetters} lettres cette semaine ! ⭐`
  })()

  void sendEmailSafe({
    to: parent.email,
    subject,
    react: React.createElement(WeeklyProgressEmail, {
      parentPrenom: parent.prenom,
      children,
    }),
    type: 'weekly_progress',
  })
}

export function sendSubscriptionConfirmedEmail(
  parent: { email: string; prenom: string },
  child: { prenom: string; avatar: string },
  amount: number,
  renewalDate: Date,
): void {
  void sendEmailSafe({
    to: parent.email,
    subject: 'Abonnement activé ! 🎉',
    react: React.createElement(SubscriptionConfirmedEmail, {
      parentPrenom: parent.prenom,
      child,
      amount,
      renewalDate,
    }),
    type: 'subscription_confirmed',
  })
}

export function sendPaymentFailedEmail(
  parent: { email: string; prenom: string },
  child: { prenom: string; avatar: string },
  daysRemaining: number,
): void {
  void sendEmailSafe({
    to: parent.email,
    subject: '⚠️ Problème de paiement — Action requise',
    react: React.createElement(PaymentFailedEmail, {
      parentPrenom: parent.prenom,
      child,
      daysRemaining,
    }),
    type: 'payment_failed',
  })
}

export function sendSubscriptionCancelledEmail(
  parent: { email: string; prenom: string },
  child: { prenom: string; avatar: string },
  endDate: Date,
): void {
  void sendEmailSafe({
    to: parent.email,
    subject: 'Au revoir... 😢',
    react: React.createElement(SubscriptionCancelledEmail, {
      parentPrenom: parent.prenom,
      child,
      endDate,
    }),
    type: 'subscription_cancelled',
  })
}

export function sendMilestoneEmail(
  parent: { email: string; prenom: string },
  child: { prenom: string; avatar: string },
  milestone: MilestoneType,
): void {
  void sendEmailSafe({
    to: parent.email,
    subject: getMilestoneSubject(child.prenom, milestone),
    react: React.createElement(MilestoneEmail, {
      parentPrenom: parent.prenom,
      child,
      milestone,
    }),
    type: `milestone_${milestone}`,
  })
}

export function sendPasswordResetEmail(email: string, resetUrl: string): void {
  void sendEmailSafe({
    to: email,
    subject: 'Réinitialisation mot de passe — NourAl',
    react: React.createElement(PasswordResetEmail, { resetUrl }),
    type: 'password_reset',
  })
}
