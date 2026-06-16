# Lisani — Contexte Codex

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
- Cloudflare Workers AI (analyse images future)

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

---

## SKILLS INSTALLÉS

### 1. Frontend Design
Source : https://skills.sh/anthropics/skills/frontend-design
Usage : Design raffiné, composants UI, animations, cohérence visuelle.
Lire /skills/frontend-design/SKILL.md avant tout travail de design.

### 2. Next.js
Source : https://skills.sh/vercel-labs/vercel-plugin/nextjs
Usage : App Router, Server Components, API routes, optimisations.
Lire /skills/nextjs/SKILL.md avant toute page ou route.

### 3. Arabic RTL
Fichier : /skills/arabic-rtl/SKILL.md
Usage : Rendu texte arabe, direction RTL, font Noto Naskh Arabic, harakat.
OBLIGATOIRE pour tout composant affichant du texte arabe.

### 4. Supabase Auth
Fichier : /skills/supabase-auth/SKILL.md
Usage : Auth parent, RLS, Server Components avec cookies, middleware.

### 5. Stripe Subscriptions
Fichier : /skills/stripe-subscriptions/SKILL.md
Usage : Checkout, webhooks, Customer Portal, abonnements récurrents.

### 6. Game UI (Enfants)
Fichier : /skills/game-ui/SKILL.md
Usage : Interface jeu enfant, animations récompenses, canvas dessin, QCM.

### 7. PWA
Fichier : /skills/pwa/SKILL.md
Usage : Service Worker, manifest, cache, mode offline, install prompt.

### 8. Email Templates
Fichier : /skills/email-templates/SKILL.md
Usage : React Email + Resend, templates transactionnels.

### 9. RGPD Mineurs
Fichier : /skills/rgpd/SKILL.md
Usage : Conformité CNIL données enfants, CGV, politique confidentialité.

### 10. SEO Next.js
Fichier : /skills/seo/SKILL.md
Usage : Metadata, Schema.org, sitemap, OG image, robots.txt.

