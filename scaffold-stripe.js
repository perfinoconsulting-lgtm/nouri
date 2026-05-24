const fs = require('fs')
const path = require('path')

const files = {
  'src/lib/stripe.ts': `import Stripe from 'stripe'
import { createServerSupabaseClient } from './supabase/server'

// VARIABLES D'ENVIRONNEMENT REQUISES :
// - STRIPE_SECRET_KEY
// - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// - STRIPE_WEBHOOK_SECRET
// - STRIPE_PRICE_ID (ID du produit 2€/mois)
// - NEXT_PUBLIC_APP_URL (ex: http://localhost:3000)

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10' as any, // Utiliser 'as any' pour éviter l'erreur de version typée
  appInfo: {
    name: 'NourAl App',
    version: '0.1.0'
  }
})

/**
 * Crée ou récupère un client Stripe pour le parent
 */
export async function createOrGetCustomer(parentId: string, email: string, prenom: string | null) {
  const supabase = createServerSupabaseClient()
  
  // 1. Récupérer le parent en base
  const { data: parent, error: fetchError } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', parentId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error('Erreur lors de la récupération du parent')
  }

  // 2. Si déjà un customer ID, on le retourne
  if (parent?.stripe_customer_id) {
    return parent.stripe_customer_id
  }

  // 3. Sinon, on le crée dans Stripe
  const customer = await stripe.customers.create({
    email,
    name: prenom || 'Parent NourAl',
    metadata: {
      parentId
    }
  })

  // 4. On sauvegarde dans Supabase
  const { error: updateError } = await supabase
    .from('parents')
    .update({ stripe_customer_id: customer.id })
    .eq('id', parentId)

  if (updateError) {
    throw new Error('Erreur lors de la sauvegarde du Customer ID')
  }

  return customer.id
}

/**
 * Crée une session de paiement Stripe (Checkout)
 */
export async function createCheckoutSession(
  customerId: string, 
  childId: string, 
  parentId: string, 
  priceId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        parentId,
        childId
      }
    },
    metadata: {
      parentId,
      childId
    },
    success_url: \`\${appUrl}/abonnement?success=true\`,
    cancel_url: \`\${appUrl}/tarifs\`,
  })

  return session.url
}

/**
 * Crée une session de gestion d'abonnement (Customer Portal)
 */
export async function createPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: \`\${appUrl}/abonnement\`,
  })

  return portalSession.url
}

/**
 * Vérifie le statut d'abonnement d'un enfant
 */
export async function getSubscriptionStatus(childId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('child_id', childId)
    .single()

  if (error || !data) {
    return 'inactive'
  }

  return data.status
}
`,

  'src/app/api/stripe/checkout/route.ts': `import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession } from '@/lib/stripe'

// VARIABLES D'ENVIRONNEMENT REQUISES :
// - STRIPE_SECRET_KEY
// - STRIPE_PRICE_ID
// - NEXT_PUBLIC_APP_URL

export async function POST(req: Request) {
  try {
    const { childId } = await req.json()
    
    if (!childId) {
      return NextResponse.json({ error: "L'identifiant de l'enfant est requis." }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    // Récupérer les informations du parent
    const { data: parent } = await supabase
      .from('parents')
      .select('email, prenom')
      .eq('id', session.user.id)
      .single()

    if (!parent) {
      return NextResponse.json({ error: 'Profil parent introuvable.' }, { status: 404 })
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: 'Configuration Stripe manquante (STRIPE_PRICE_ID).' }, { status: 500 })
    }

    // 1. Créer ou récupérer le customer Stripe
    const customerId = await createOrGetCustomer(session.user.id, parent.email, parent.prenom)

    // 2. Créer la session Checkout
    const checkoutUrl = await createCheckoutSession(customerId, childId, session.user.id, priceId)

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement.' }, { status: 500 })
    }

    // 3. Retourner l'URL pour la redirection côté client
    return NextResponse.json({ url: checkoutUrl })

  } catch (err: any) {
    console.error('Checkout API Error:', err)
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 })
  }
}
`,

  'src/app/api/stripe/portal/route.ts': `import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'

// VARIABLES D'ENVIRONNEMENT REQUISES :
// - STRIPE_SECRET_KEY
// - NEXT_PUBLIC_APP_URL

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    // Récupérer le stripe_customer_id du parent
    const { data: parent } = await supabase
      .from('parents')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (!parent || !parent.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun identifiant client Stripe trouvé pour ce compte.' }, { status: 404 })
    }

    // Créer la session Customer Portal
    const portalUrl = await createPortalSession(parent.stripe_customer_id)

    if (!portalUrl) {
      return NextResponse.json({ error: "Erreur lors de l'accès au portail de gestion." }, { status: 500 })
    }

    // Retourner l'URL pour redirection côté client
    return NextResponse.json({ url: portalUrl })

  } catch (err: any) {
    console.error('Portal API Error:', err)
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 })
  }
}
`,

  'src/app/api/stripe/webhook/route.ts': `import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// VARIABLES D'ENVIRONNEMENT REQUISES :
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (Nécessaire pour bypasser la RLS lors du webhook)

// Client Supabase admin pour le webhook (bypasse les RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Signature Stripe manquante ou secret non configuré.' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: \`Erreur de signature: \${err.message}\` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const parentId = subscription.metadata.parentId
        const childId = subscription.metadata.childId

        if (parentId && childId) {
          await supabaseAdmin.from('subscriptions').upsert({
            parent_id: parentId,
            child_id: childId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status, 
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          }, { onConflict: 'stripe_subscription_id' })
          
          console.log(\`✅ Abonnement créé pour l'enfant \${childId} par le parent \${parentId}\`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin.from('subscriptions')
          .update({
            status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
          
        console.log(\`🔄 Abonnement mis à jour : \${subscription.id} (\${subscription.status})\`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin.from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)
          
        console.log(\`❌ Abonnement annulé : \${subscription.id}\`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await supabaseAdmin.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string)
            
          console.error(\`⚠️ Paiement échoué pour l'abonnement \${invoice.subscription}\`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          console.log(\`💰 Paiement réussi pour l'abonnement \${invoice.subscription}\`)
        }
        break
      }

      default:
        console.log(\`Événement Stripe non géré : \${event.type}\`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Erreur lors du traitement du Webhook:', error)
    return NextResponse.json({ error: 'Erreur interne Webhook' }, { status: 500 })
  }
}
`,

  'src/components/ui/SubscribeButton.tsx': `"use client"

import { useState } from 'react'
import { CreditCard, Settings, Loader2 } from 'lucide-react'

interface SubscribeButtonProps {
  childId: string
  childPrenom: string
  isSubscribed: boolean
  disabled?: boolean
}

export default function SubscribeButton({ childId, childPrenom, isSubscribed, disabled }: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = isSubscribed ? '/api/stripe/portal' : '/api/stripe/checkout'
      const body = isSubscribed ? {} : { childId }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.')
      }

      // Redirection vers Stripe
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de redirection manquante.')
      }

    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
      alert(err.message)
    }
  }

  return (
    <button
      onClick={handleAction}
      disabled={disabled || isLoading}
      className={\`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition shadow-sm w-full \${
        isSubscribed
          ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          : 'bg-[#F5A623] text-white hover:bg-[#F5A623]/90 hover:shadow-md'
      } disabled:opacity-50\`}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isSubscribed ? (
        <>
          <Settings size={18} /> Gérer l'abonnement
        </>
      ) : (
        <>
          <CreditCard size={18} /> Abonner {childPrenom}
        </>
      )}
    </button>
  )
}
`,

  'src/app/(dashboard)/abonnement/page.tsx': `import { createServerSupabaseClient } from '@/lib/supabase/server'
import SubscribeButton from '@/components/ui/SubscribeButton'
import { CheckCircle2 } from 'lucide-react'

// VARIABLES D'ENVIRONNEMENT REQUISES : 
// - Toutes celles liées à Stripe + URL Supabase.

export default async function AbonnementPage({ searchParams }: { searchParams: { success?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  // Récupérer les enfants du parent
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', session.user.id)
    .order('created_at', { ascending: true })

  // Récupérer les abonnements
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('parent_id', session.user.id)

  const isSuccess = searchParams.success === 'true'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Gestion des Abonnements</h1>
        <p className="text-gray-500">Gérez l'accès Premium pour vos enfants (2€/mois par enfant).</p>
      </div>

      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="text-green-500 shrink-0" />
          <p className="font-medium">Paiement réussi ! L'abonnement est actif. Bienvenue dans l'aventure NourAl.</p>
        </div>
      )}

      {/* Liste des enfants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(!children || children.length === 0) ? (
          <div className="col-span-full bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-500">
            Vous n'avez pas encore ajouté d'enfant. Allez dans "Mes Enfants" pour commencer.
          </div>
        ) : (
          children.map((child) => {
            const childSub = subscriptions?.find(s => s.child_id === child.id)
            const status = childSub?.status || 'inactive'
            
            let statusConfig = {
              label: 'Inactif',
              color: 'bg-gray-100 text-gray-600',
              dot: 'bg-gray-400'
            }

            if (status === 'active') {
              statusConfig = { label: 'Actif', color: 'bg-green-50 text-green-700 border border-green-100', dot: 'bg-green-500' }
            } else if (status === 'trialing') {
              statusConfig = { label: 'Essai (7j)', color: 'bg-orange-50 text-orange-700 border border-orange-100', dot: 'bg-orange-500' }
            } else if (status === 'past_due') {
              statusConfig = { label: 'En retard', color: 'bg-red-50 text-red-700 border border-red-100', dot: 'bg-red-500' }
            } else if (status === 'canceled') {
              statusConfig = { label: 'Annulé', color: 'bg-gray-100 text-gray-700 border border-gray-200', dot: 'bg-gray-500' }
            }

            const isSubscribed = ['active', 'trialing', 'past_due'].includes(status)

            return (
              <div key={child.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                      {child.avatar || child.prenom[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-primary">{child.prenom}</h3>
                      <p className="text-sm text-gray-500">{child.age} ans</p>
                    </div>
                  </div>
                  
                  <div className={\`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 \${statusConfig.color}\`}>
                    <span className={\`w-1.5 h-1.5 rounded-full \${statusConfig.dot}\`}></span>
                    {statusConfig.label}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50">
                  <SubscribeButton 
                    childId={child.id} 
                    childPrenom={child.prenom}
                    isSubscribed={isSubscribed}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Section Pourquoi S'abonner */}
      <div className="bg-[#0a192f] p-8 rounded-[2rem] mt-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-accent">✨</span> Pourquoi s'abonner au Premium ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-accent shrink-0 mt-0.5" size={20} />
              <p className="text-blue-100 text-sm"><strong>Accès illimité</strong> à toutes les lettres de l'alphabet, aux mots et aux petites sourates.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-accent shrink-0 mt-0.5" size={20} />
              <p className="text-blue-100 text-sm"><strong>Répétition espacée (SM-2)</strong> pour une mémorisation durable sans oublier.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-accent shrink-0 mt-0.5" size={20} />
              <p className="text-blue-100 text-sm"><strong>Suivi parental avancé</strong> : voyez exactement le temps passé et les progrès.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-accent shrink-0 mt-0.5" size={20} />
              <p className="text-blue-100 text-sm"><strong>Paiement sécurisé et flexible</strong>. Résiliable à tout moment en 1 clic.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
`
}

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(fullPath, content)
  console.log('Created:', filePath)
})
