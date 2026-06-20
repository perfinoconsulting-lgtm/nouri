# RAS.md - Reste à faire / Audit projet Lisani

## 1. Résumé exécutif

Le projet est déjà bien avancé côté surface produit : landing, inscription, connexion, dashboard parent, profils enfants, espace jeu, modules alphabet/syllabes/mots/sourates, Stripe, emails, PWA et routes RGPD existent dans le code. En revanche, il n'est pas lançable en l'état : `npx tsc --noEmit` échoue, `npm run lint` échoue, les tests Vitest ne démarrent pas et plusieurs routes/pages promises sont absentes. Le risque principal est double : build instable et promesses commerciales/RGPD non alignées avec l'implémentation réelle. La protection auth est fragilisée par deux middlewares concurrents, dont celui à la racine est un placeholder. La PWA est incomplète car le manifest référence des icônes absentes. DONE : les anciennes références `maghribdelice.com` / `maghrebdelice.com` ont été remplacées par `lisani.tech` dans le code audité. Plusieurs pages affichent des caractères mojibake visibles, notamment dans l'espace enfant. Le MVP est proche en quantité de fonctionnalités, mais trop fragile pour vendre à des familles. Priorité : stabiliser build/auth/legal/Stripe/PWA avant toute acquisition.

## 2. État actuel du projet

- Stack réelle : Next.js `^15.5.18`, React `^18.3.1`, TypeScript `^5`, Node `>=20.0.0` dans `package.json`.
- App Router présent dans `src/app`, avec groupes `(public)`, `(dashboard)` et `(jeu)`.
- Pages publiques présentes : `/`, `/apprendre`, `/tarifs`, `/a-propos`, `/inscription`, `/connexion`, `/reset-password` via `src/app/(public)/*`.
- Espace parent présent : `/dashboard`, `/enfants`, `/enfants/[id]`, `/abonnement`, `/parametres`, `/parrainage`, `/bienvenue` via `src/app/(dashboard)/*`.
- Espace enfant présent : `/jouer/[childId]`, `/alphabet`, `/syllabes`, `/mots`, `/sourates`, `/sourates/[slug]`, `/reviser` via `src/app/(jeu)/jouer/[childId]/*`.
- Composants dashboard présents : `src/components/dashboard/*` avec cartes enfant, stats, modales création/édition/suppression.
- Composants jeu présents : `src/components/game/*`, `src/components/jeu/*`, `src/components/arabic/ArabicText.tsx`.
- Données pédagogiques locales présentes : `src/lib/data/letters.ts`, `src/lib/data/syllabes.ts`, `src/lib/data/mots.ts`, `src/lib/data/sourates.ts`.
- Supabase présent : clients `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, schéma/RLS dans `supabase/schema.sql`, seed dans `supabase/seed.sql`.
- Stripe présent : `src/lib/stripe.ts`, checkout `src/app/api/stripe/checkout/route.ts`, portal `src/app/api/stripe/portal/route.ts`, webhook `src/app/api/stripe/webhook/route.ts`.
- Emails transactionnels présents : `src/emails/*`, service `src/lib/email-service.ts`, cron weekly/milestone dans `src/app/api/cron/*`.
- RGPD technique partiel : export et suppression dans `src/app/api/gdpr/export/route.ts` et `src/app/api/gdpr/delete/route.ts`, interface dans `src/app/(dashboard)/parametres/page.tsx`.
- PWA partielle : `public/manifest.json`, `public/sw.js`, `public/offline.html`, enregistrement SW dans `src/app/layout.tsx`.
- SEO partiel : metadata dans layouts/pages, `src/app/sitemap.ts`, `src/app/robots.ts`, OG dynamique `src/app/og/route.tsx`, schema via `src/components/seo/SchemaOrg.tsx`.
- Tests très limités : un test identifié `src/lib/spaced-repetition.test.ts`, config `vitest.config.ts`.
- Déploiement Vercel esquissé : `vercel.json` existe mais contient `{}`. Aucune configuration Hostinger détectée.

## 3. Points bloquants avant lancement

| Priorité | Problème | Impact | Fichier(s) concerné(s) | Solution recommandée |
|---|---|---|---|---|
| P0 | TypeScript ne compile pas (`TS2352`) | Build Next probablement bloqué, déploiement impossible | `src/app/api/cron/milestone-check/route.ts` | Corriger le typage du parent retourné par Supabase sans cast invalide, relancer `npx tsc --noEmit`. |
| P0 | ESLint échoue | CI/build Vercel peut échouer selon config | `src/lib/email-service.ts` | Corriger `React.createElement(..., { children })` ou la règle `react/no-children-prop` proprement. |
| P0 | Middleware doublonné et contradictoire | Auth/protection routes incertaine ; risque accès non protégé ou header `x-pathname` absent | `middleware.ts`, `src/middleware.ts`, `src/app/(jeu)/layout.tsx` | Garder un seul middleware effectif à la racine ou déplacer correctement la logique Supabase, puis tester `/dashboard` et `/jouer/[childId]`. |
| P0 | Pages légales absentes alors que référencées | Non conformité RGPD/vente en ligne ; liens footer/inscription cassés | `src/app/(public)/layout.tsx`, `src/app/(public)/inscription/page.tsx`, `src/app/sitemap.ts`, `src/components/ui/CookieBanner.tsx` | Créer `/mentions-legales`, `/cgv`, `/politique-confidentialite` et aligner tous les liens. |
| P0 | DONE - Domaine incohérent corrigé côté code | Les URLs publiques, SEO, partage et emails pointent maintenant vers `lisani.tech`. Reste à vérifier le domaine Resend/DNS en production. | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/(public)/*`, `src/emails/*`, `src/lib/email-service.ts`, `AGENTS.md`, `src/components/game/ShareProgress.tsx` | Configurer DNS/Resend/Hostinger pour `lisani.tech` et vérifier en production. |
| P0 | Encodage cassé visible (`Ã©`, `ðŸ...`) | UI non professionnelle, enfants/parents voient du texte illisible | Plusieurs fichiers dont `src/app/(jeu)/jouer/[childId]/page.tsx`, `src/app/(dashboard)/enfants/page.tsx`, `src/app/api/*`, `supabase/schema.sql` | Réencoder les fichiers en UTF-8 et vérifier visuellement les pages critiques. |
| P0 | PWA manifest référence des icônes absentes | Installation PWA cassée, erreurs Lighthouse | `public/manifest.json`, `src/app/layout.tsx`, `public/` | Ajouter `public/icons/*` et `badge-72.png` ou corriger le manifest/SW. |
| P0 | Premium seulement verrouillé côté UI sur certains modules | Un utilisateur peut accéder directement aux URL premium si authentifié et propriétaire | `src/app/(jeu)/jouer/[childId]/page.tsx`, `src/app/(jeu)/jouer/[childId]/syllabes/page.tsx`, `mots/page.tsx`, `sourates/page.tsx`, API progress | Ajouter un guard serveur par module premium dans layout/page/API, basé sur `subscriptions.status`. |
| P1 | Tests Vitest ne démarrent pas (`spawn EPERM`) | Aucune garantie sur le moteur SRS et les APIs critiques | `vitest.config.ts`, `src/lib/spaced-repetition.test.ts` | Corriger config Vitest sous Windows/CI, ajouter tests unitaires et API. |
| P1 | Promesses marketing non prouvées | Risque légal/confiance : faux témoignages, "+500 familles", rating 4.8/150 | `src/app/(public)/LandingPageClient.tsx`, `src/app/(public)/page.tsx` | Retirer ou qualifier les preuves sociales tant qu'elles ne sont pas réelles. |
| P1 | Stripe incomplet côté données métier | Abonnement par enfant présent, mais pas de vérification complète du plan/prix ni état gratuit/premium contractuel | `src/lib/stripe.ts`, `src/app/(dashboard)/abonnement/page.tsx`, `src/app/api/stripe/*` | Ajouter matrice d'accès gratuit/premium, tests webhook, gestion doublons, annulation par enfant. |
| P1 | Cron Vercel non configuré | Emails weekly/milestone jamais appelés en production | `vercel.json`, `src/app/api/cron/*` | Déclarer les crons Vercel et sécuriser par secret. |
| P1 | Supabase schema incomplet vs code | Risque runtime : code utilise `deletion_log`, `drawings`, colonnes potentiellement absentes | `supabase/schema.sql`, `src/app/api/gdpr/delete/route.ts`, `src/app/api/drawings/route.ts` | Mettre à jour migrations/schema pour toutes tables, buckets et policies réellement utilisés. |
| P1 | Pas de monitoring erreurs/analytics | Impossible de piloter lancement et bugs paiements | Aucun fichier Sentry/PostHog/Vercel Analytics détecté | Ajouter Sentry ou équivalent, Vercel Analytics, événements funnel inscription/paiement/activation. |

## 4. Incohérences détectées

- DONE - Nom projet : `AGENTS.md` a été aligné sur `Lisani`, et `package.json` / `package-lock.json` utilisent maintenant `lisani-app` en minuscules.
- DONE - Domaine : SEO, layout public, emails et partages utilisent maintenant `https://lisani.tech`, `noreply@lisani.tech`, `support@lisani.tech` et `contact@lisani.tech`.
- DONE - Contact pricing : `src/app/(public)/tarifs/page.tsx` affiche maintenant `contact@lisani.tech`.
- Sitemap référence `/mentions-legales`, `/cgv`, `/politique-confidentialite`, mais aucune page correspondante n'existe.
- Footer public référence `/politique`, alors que sitemap et cookie banner utilisent `/politique-confidentialite`.
- Emails footer référence `/legal/confidentialite` et `/legal/cgv`, routes absentes.
- Manifest shortcuts pointent vers `/jouer` et `/reviser`, routes inexistantes sans `childId`.
- PWA manifest et SW référencent `/icons/icon-*.png` et `/icons/badge-72.png`, absents de `public/`.
- `vercel.json` est vide alors que des cron jobs existent dans `src/app/api/cron/*`.
- Le descriptif initial annonce Next.js 14, mais le code utilise Next.js 15.5.18.
- `next lint` est déprécié avec Next 15 et sera retiré en Next 16.
- Le projet promet "Essai gratuit 7 jours" et "sans carte bancaire" ; Stripe Checkout avec trial peut nécessiter carte selon configuration Stripe.
- Landing promet "Déjà +500 familles françaises inscrites" et schema `ratingCount: 150`, non vérifiés dans le code.
- Landing affiche "éducateurs" et témoignages nominatifs ; aucune source/preuve n'est visible.
- Plan gratuit incohérent : landing dit "5 premières lettres", tarifs dit "28 lettres de l'alphabet illustrées".
- Premium promet "profils enfants illimités", mais API limite à 5 enfants dans `src/app/api/children/route.ts`.
- Cible AGENTS : enfants 4-12 ans ; API création enfant accepte 4-14 ans, schéma DB accepte 3-15 ans.
- Middleware racine est un placeholder, middleware `src/middleware.ts` contient la vraie auth et l'injection `x-pathname`.
- `src/app/(jeu)/layout.tsx` dépend de `x-pathname`; si le middleware effectif est celui de la racine, `childId` est vide et redirection `/dashboard`.
- `console.log`/`console.warn`/`console.error` sont nombreux dans `src` et `public`, alors que la convention demande pas de `console.log` en production.
- `dangerouslySetInnerHTML` est utilisé pour le service worker et le schema.org ; acceptable si maîtrisé, mais à auditer.
- PWA cache des API progression/review et queue des POST sans preuve de déduplication métier robuste.
- RGPD delete écrit dans `deletion_log`, table absente du `supabase/schema.sql`.
- Storage bucket `drawings` utilisé mais non défini dans `supabase/schema.sql`.
- Pages admin annoncées dans les routes, aucune route `/admin/*` détectée.
- Plusieurs textes/commentaires affichés dans les sorties sont mojibake, notamment dans les pages enfant et API.

## 5. Pages manquantes

| Page | URL recommandée | Objectif | Priorité | Contenu attendu |
|---|---|---|---|---|
| Mentions légales | `/mentions-legales` | Obligation légale éditeur | P0 | Éditeur, hébergeur, contact, responsable publication, propriété intellectuelle. |
| Politique de confidentialité | `/politique-confidentialite` | RGPD parents/enfants | P0 | Données collectées, base légale, durée, droits, sous-traitants Supabase/Stripe/Resend/Vercel. |
| CGV | `/cgv` | Vente abonnement 2€/mois/enfant | P0 | Prix, essai, reconduction, résiliation, remboursement, droit de rétractation, Stripe. |
| Politique cookies | `/cookies` | Consentement et transparence | P1 | Cookies nécessaires, analytics, refus/acceptation, durée. |
| Contact/support | `/contact` | Rassurance et support paiement | P1 | Email officiel Lisani, formulaire ou mailto, délais de réponse. |
| Aide parent | `/aide` | Réduire friction onboarding | P2 | FAQ compte, enfant, abonnement, suppression, progression. |
| Admin interne | `/admin` | Gestion support/contenu | P2 | Accès whitelist, liste parents/enfants/abonnements, logs simples. |
| Statut paiement réussi | `/abonnement/succes` ou garder `/abonnement?success=true` | Clarifier retour Stripe | P2 | Confirmation, enfant concerné, prochaine étape. |
| Réviser enfant shortcut | `/jouer/[childId]/reviser` existe, mais pas `/reviser` | Corriger PWA shortcut | P1 | Redirection vers enfant actif ou suppression du shortcut. |
| Jouer sans childId | `/jouer` | Corriger PWA shortcut | P1 | Redirection vers dernier enfant ou dashboard. |

## 6. Fonctionnalités manquantes MVP

| Fonctionnalité | Description | Priorité | Complexité estimée | Dépendances techniques |
|---|---|---|---|---|
| Build fiable | `tsc`, lint, tests et build doivent passer | P0 | M | TypeScript, ESLint, Vitest, Next |
| Auth middleware unique | Protection effective de `/dashboard`, `/jouer`, `/admin` | P0 | M | Supabase SSR, middleware Next |
| Guards premium serveur | Bloquer syllabes/mots/sourates/revision premium côté serveur/API | P0 | M | Supabase subscriptions, layouts/pages jeu |
| Pages légales | Mentions, CGV, confidentialité alignées mineurs/RGPD | P0 | M | RGPD, Stripe, footer/sitemap |
| Encodage UTF-8 propre | Supprimer mojibake de l'UI et commentaires utiles | P0 | S à M | Éditeur, validation visuelle |
| PWA installable | Icônes, manifest, shortcuts valides, SW testé | P0 | S | Assets public, Lighthouse |
| Onboarding parent complet | Après inscription : email confirmé, profil parent, création premier enfant | P1 | M | Supabase Auth, DB trigger/API |
| Mode gratuit/premium cohérent | Définir précisément contenu gratuit et premium dans code + marketing | P1 | M | Feature flags, Stripe status |
| Paiement Stripe testé | Checkout, webhook, portail, annulation, renouvellement, past_due | P1 | M à L | Stripe CLI, env vars, Supabase service role |
| Emails transactionnels fiables | Bienvenue, reset, abonnement, échec paiement, progression weekly | P1 | M | Resend domaine validé, cron |
| Progression robuste | SRS, sessions, niveaux, stats parent cohérents | P1 | M | Tables content/progress/sessions, tests |
| Audio arabe fiable | TTS ou fichiers audio contrôlés, fallback navigateur | P1 | M | `src/lib/arabic-tts.ts`, composants jeu |
| Analytics produit | Funnel inscription -> enfant -> première leçon -> paiement | P1 | S à M | Vercel Analytics/PostHog |
| Monitoring erreurs | Capturer erreurs client/API/webhooks | P1 | M | Sentry ou équivalent |
| Contenu pédagogique validé | Lettres, syllabes, mots, sourates vérifiés avec harakat | P1 | M | Données locales, revue arabe |
| Admin minimal | Support abonnement et suppression données | P2 | L | Auth whitelist, UI admin, service role |

## 7. Plan de correction technique

Phase 1 : stabilisation technique

- [ ] Supprimer le conflit `middleware.ts` / `src/middleware.ts` et valider les redirections auth.
- [ ] Corriger l'erreur TypeScript dans `src/app/api/cron/milestone-check/route.ts`.
- [ ] Corriger l'erreur ESLint dans `src/lib/email-service.ts`.
- [ ] Remplacer ou encadrer les `console.log` production par un logger contrôlé.
- [ ] Réencoder les fichiers mojibake en UTF-8 et vérifier les pages enfant/dashboard.
- [ ] Corriger `vitest.config.ts` pour que `npm test -- --run` démarre.
- [ ] Exécuter et documenter `npx tsc --noEmit`, `npm run lint`, `npm test -- --run`, `npm run build`.

Phase 2 : MVP produit

- [ ] Définir la matrice gratuit/premium : lettres gratuites, modules premium, limites enfants.
- [ ] Ajouter guards premium serveur sur pages/modules et API associées.
- [ ] Corriger l'incohérence âge : 4-12 ou autre, dans DB, API, textes.
- [ ] Vérifier le parcours inscription -> dashboard -> création enfant -> première leçon.
- [ ] Valider modules alphabet, syllabes, mots, sourates sur mobile.
- [ ] Ajouter états d'erreur visibles au lieu de `return null` sur pages enfant/dashboard.
- [ ] Ajouter tests unitaires sur SRS/progression et tests API ownership.

Phase 3 : monétisation

- [ ] Aligner Stripe avec l'offre réelle : 2€/mois/enfant, trial, carte requise ou non.
- [ ] Tester checkout et webhook avec Stripe CLI.
- [ ] Tester Customer Portal et résiliation par enfant.
- [ ] Ajouter colonnes/tables/buckets manquants dans schema Supabase.
- [ ] DONE côté code : expéditeur Resend passé sur `noreply@lisani.tech`. À faire hors code : vérifier le domaine dans Resend et DNS Hostinger.
- [ ] Configurer cron weekly/milestone dans `vercel.json` avec secret.

Phase 4 : SEO / acquisition

- [x] DONE - Domaine canonique appliqué côté code : `https://lisani.tech`.
- [ ] Créer `/mentions-legales`, `/cgv`, `/politique-confidentialite`, `/cookies`.
- [ ] Retirer témoignages et chiffres non prouvés ou les rendre vérifiables.
- [ ] Corriger sitemap/robots/metadata/OG pour les routes réelles.
- [ ] Ajouter analytics produit et événements de conversion.
- [ ] Optimiser Lighthouse mobile, accessibilité, PWA, SEO.

Phase 5 : scalabilité

- [ ] Ajouter monitoring erreurs client/API/webhooks.
- [ ] Ajouter dashboard admin support minimal.
- [ ] Migrer logique dupliquée de stats/streak vers helpers testés.
- [ ] Mettre en place migrations Supabase versionnées.
- [ ] Ajouter tests E2E Playwright sur parcours parent/enfant/paiement mocké.
- [ ] Préparer rate limiting API sensibles et protection anti-abus.

## 8. Plan de modification recommandé

1. Corriger la base technique bloquante : middleware unique, erreur TypeScript, erreur ESLint, encodage cassé.
2. Relancer `npx tsc --noEmit`, `npm run lint`, `npm test -- --run`, puis `npm run build`.
3. Créer les pages légales et aligner tous les liens : footer, inscription, cookie banner, emails, sitemap.
4. DONE - Domaine officiel appliqué côté code : `lisani.tech`. Reste à décider si la marque publique reste `Lisani` ou devient `Lisani`.
5. Ajouter les assets PWA manquants et corriger shortcuts `/jouer` / `/reviser`.
6. Formaliser l'offre : gratuit vs premium, limite enfants, âge cible, essai Stripe.
7. Ajouter les guards premium serveur sur modules enfant et endpoints de progression premium.
8. Mettre à jour `supabase/schema.sql` avec tables/buckets utilisés : `deletion_log`, storage drawings, éventuelles policies manquantes.
9. Tester Stripe de bout en bout avec webhook local, puis configurer Vercel env vars et crons.
10. Ajouter monitoring/analytics et tests critiques avant acquisition.

## 9. Checklist de lancement MVP

- [ ] `npx tsc --noEmit` passe sans erreur.
- [ ] `npm run lint` passe sans erreur.
- [ ] `npm test -- --run` passe en local/CI.
- [ ] `npm run build` passe sur machine propre.
- [ ] Un seul middleware protège effectivement `/dashboard`, `/jouer`, `/admin`.
- [ ] Aucun texte mojibake visible dans les pages publiques, dashboard et jeu.
- [ ] Pages légales publiées et accessibles.
- [x] DONE côté code - Domaine, canonical, sitemap, robots, emails et liens de partage alignés sur `lisani.tech`.
- [ ] Manifest PWA valide, icônes présentes, install mobile testée.
- [ ] Inscription parent testée avec email réel.
- [ ] Création profil enfant testée.
- [ ] Module alphabet jouable gratuitement.
- [ ] Modules premium bloqués sans abonnement côté serveur.
- [ ] Checkout Stripe fonctionne avec enfant donné.
- [ ] Webhook crée/met à jour l'abonnement.
- [ ] Customer Portal permet la résiliation.
- [ ] Emails transactionnels envoyés depuis domaine vérifié.
- [ ] Export RGPD fonctionne.
- [ ] Suppression RGPD fonctionne sans erreur schema.
- [ ] Analytics funnel minimum actif.
- [ ] Monitoring erreurs actif.
- [ ] Aucune promesse marketing non prouvée en production.

## 10. Prompts Codex suivants

1. "Corrige les blocages build du projet Lisani : middleware unique, erreur TypeScript milestone-check, erreur ESLint email-service, sans modifier le produit."
2. "Crée les pages légales Lisani `/mentions-legales`, `/cgv`, `/politique-confidentialite` et aligne tous les liens existants."
3. "Corrige la PWA Lisani : icônes manquantes, shortcuts invalides, manifest et service worker testables."
4. "Implémente les guards premium serveur pour syllabes, mots et sourates, avec vérification abonnement par enfant."
5. "Aligne l'identité Lisani : domaine canonique, emails, sitemap, robots, metadata et textes marketing non prouvés."

## Décision recommandée

Le projet est encore trop incomplet pour un lancement payant. Il contient une bonne base fonctionnelle et produit, mais les blocages TypeScript/ESLint/tests, les pages légales absentes, le middleware incohérent, la PWA cassée et les promesses marketing non alignées empêchent un lancement sérieux. Après une phase courte de stabilisation P0/P1, il peut devenir un MVP vendable.
