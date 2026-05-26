# Skill : Stripe Subscriptions

## Quand lire ce skill
Avant tout code lié au paiement, abonnements, ou webhooks.

## Variables d'environnement requises
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://...
```

## Produit NourAl
- Nom : "NourAl Premium"
- Prix : 2,00€ / mois / récurrent
- Trial : 7 jours
- Mode : subscription

## Initialisation Stripe
```typescript
// lib/stripe.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})
```

## Créer une Checkout Session
```typescript
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
  subscription_data: { trial_period_days: 7 },
  allow_promotion_codes: true,
  metadata: { parentId, childId },
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/abonnement?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tarifs`,
})
return { url: session.url }
```

## Webhook — règle CRITIQUE
```typescript
// NE JAMAIS utiliser request.json() dans le webhook
// Toujours utiliser request.text() pour la vérification de signature
const body = await request.text()
const signature = request.headers.get('stripe-signature')!
const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
```

## Événements à gérer
| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Créer subscription en base |
| `customer.subscription.updated` | Mettre à jour status |
| `customer.subscription.deleted` | Status = 'canceled' |
| `invoice.payment_failed` | Status = 'past_due' |
| `invoice.payment_succeeded` | Status = 'active' |

## Statuts subscription
| Status | Signification | Accès premium |
|--------|---------------|---------------|
| `active` | Payant actif | ✅ |
| `trialing` | Essai 7 jours | ✅ |
| `past_due` | Paiement raté | ⚠️ grace period |
| `canceled` | Résilié | ❌ |
| `inactive` | Jamais abonné | ❌ |

## Test en local
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Carte de test : 4242 4242 4242 4242
# Date : n'importe quelle date future
# CVC : n'importe quel 3 chiffres
```

## Règles importantes
- Ne jamais retourner une erreur 4xx/5xx sur un événement webhook → Stripe retentera
- Toujours retourner 200 avec { received: true } même si traitement échoue
- Vérifier idempotence : un événement peut arriver plusieurs fois
- Stocker stripe_subscription_id pour les mises à jour futures
