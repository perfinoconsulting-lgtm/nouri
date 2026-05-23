import Stripe from 'stripe'

// Initialisation de Stripe (côté serveur uniquement)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
  appInfo: {
    name: 'NourAl App',
    version: '0.1.0'
  }
})
