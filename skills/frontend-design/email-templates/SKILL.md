# Skill : Email Templates (React Email + Resend)

## Quand lire ce skill
Avant tout email transactionnel ou template React Email.

## Installation
```bash
npm install resend @react-email/components
```

## Variables requises
```
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://https://maghribdelice.com
```

## Service d'envoi (fire-and-forget)
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// Toujours fire-and-forget — ne jamais await dans une action utilisateur
async function sendEmailSafe(payload: EmailPayload) {
  try {
    const result = await resend.emails.send({
      from: 'NourAl <noreply@https://maghribdelice.com>',
      to: payload.to,
      subject: payload.subject,
      react: payload.react,
    })
    // Logger seulement le hash de l'email (RGPD)
    console.log('Email envoyé', { type: payload.type, success: !!result.data })
  } catch (error) {
    console.error('Email failed silently', error)
    // Ne jamais throw — ne pas bloquer l'action utilisateur
  }
}
```

## Structure layout email
```tsx
// Palette obligatoire
const colors = {
  bgOuter: '#0d2137',
  bgCard: '#ffffff',
  bgHeader: '#1A3A5C',
  accent: '#F5A623',
  turquoise: '#00C9B1',
  text: '#1c1917',
  textMuted: '#78716c',
}

// Toujours inclure :
// 1. Preview text différent du subject (taux ouverture)
// 2. Unsubscribe link (conformité anti-spam)
// 3. Pas d'images externes (meilleure délivrabilité)
// 4. Emojis uniquement comme visuels
```

## 8 types d'emails à implémenter
| Type | Déclencheur | Objet |
|------|-------------|-------|
| Welcome | Inscription | "Bienvenue sur NourAl 🌙" |
| ChildCreated | Ajout enfant | "[Prénom] est prêt à apprendre !" |
| WeeklyProgress | Cron lundi 9h | "[Prénom] a appris X lettres ! ⭐" |
| SubscriptionConfirmed | Webhook Stripe | "Abonnement activé ! 🎉" |
| PaymentFailed | Webhook Stripe | "⚠️ Problème de paiement" |
| SubscriptionCancelled | Webhook Stripe | "Au revoir... 😢" |
| Milestone | Cron 18h | "🎓 [Prénom] a atteint X lettres !" |
| PasswordReset | Supabase | "Réinitialisation mot de passe" |

## Règles anti-spam
- SPF/DKIM configurés sur le domaine Resend (DNS)
- Pas d'envoi entre 21h et 8h
- Rate limiting : max 100/jour tier gratuit Resend
- Unsubscribe link obligatoire dans chaque email
- Ne jamais logger les emails complets (RGPD)

## Test en local
```bash
npx react-email dev
# Prévisualisation à http://localhost:3000
# Tester : Gmail, Apple Mail, Outlook mobile
```
