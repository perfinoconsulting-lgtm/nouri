# NourAl — Contexte Claude Code

## Application
Apprentissage arabe enfants 4-12 ans, familles musulmanes de France.
Tarif : 2€/mois/enfant. Langue interface : français uniquement.

## Stack
- Next.js 14 App Router, TypeScript strict
- Tailwind CSS (mobile-first)
- Supabase (PostgreSQL + Auth + Storage)
- Stripe (abonnements récurrents)
- Vercel (hébergement + cron jobs)
- Resend (emails transactionnels)
- React Email (templates)

## Conventions OBLIGATOIRES
- TypeScript strict — zéro `any`
- Commentaires en français uniquement
- Server Components par défaut
- Client Components uniquement si interactif (useState, useEffect, event listeners)
- Mobile-first — breakpoints sm/md/lg Tailwind
- Zones tactiles minimum 48×48px (enfants)
- Gestion d'erreur complète — jamais de page blanche
- Skeleton loaders sur toutes les données async
- Pas de console.log en production

## Palette couleurs
- Bleu nuit : #1A3A5C (fond principal)
- Or : #F5A623 (accent primaire)
- Turquoise : #00C9B1 (succès)
- Rose : #FF6B9D (enfants)
- Vert : #27AE60 (validation)
- Rouge : #E74C3C (erreur)

## Base de données Supabase (tables existantes)
- parents (id, email, prenom, stripe_customer_id, onboarding_completed)
- children (id, parent_id, prenom, age, avatar, niveau, last_active)
- subscriptions (id, parent_id, child_id, status, stripe_subscription_id, current_period_end)
- progress (id, child_id, item_id, score, step, next_review, mastered)
- sessions (id, child_id, started_at, ended_at, duration_seconds, module_slug)

## RLS Supabase — règle absolue
Un parent ne voit QUE ses propres données.
Toujours vérifier ownership avant toute opération sur un enfant.

## Structure routes
- / → landing page (public)
- /inscription → formulaire parent (public)
- /connexion → login parent (public)
- /dashboard/* → espace parent (auth requise)
- /jouer/[childId]/* → espace jeu enfant (auth requise + ownership)
- /admin/* → admin interne (email whitelist)
- /api/* → routes API

## Ce qui est déjà fait
- ✅ Structure Next.js App Router
- ✅ Base de données Supabase + RLS
- ✅ Auth parent (inscription + connexion)
- 🔄 Landing page (liens à corriger)