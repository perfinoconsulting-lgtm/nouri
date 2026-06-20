# RAF.md - Reste a faire Lisani

Derniere mise a jour : 15 juin 2026

## Synthese

Le projet a une bonne base produit : pages publiques, auth parent, dashboard, profils enfants, espace jeu, modules alphabet/syllabes/mots/sourates, Stripe, emails, RGPD technique partiel, PWA et SEO existent deja.

Avant un lancement payant, il faut surtout stabiliser le socle technique : build TypeScript, lint, middleware auth unique, encodage UTF-8, pages legales, PWA installable, Stripe teste de bout en bout, schema Supabase complet et monitoring.

## Taches deja faites

| Statut | Priorite | Tache | Fichiers / zone | Remarque |
|---|---:|---|---|---|
| Fait | P0 | Structure App Router en place | `src/app` | Routes publiques, dashboard et jeu presentes. |
| Fait | P0 | Auth parent presente | `src/lib/supabase/*`, routes dashboard/jeu | A consolider avec un middleware unique. |
| Fait | P0 | Dashboard parent present | `src/app/(dashboard)/*` | Enfants, abonnement, parametres, parrainage. |
| Fait | P0 | Espace jeu enfant present | `src/app/(jeu)/jouer/[childId]/*` | Alphabet, syllabes, mots, sourates, revision. |
| Fait | P0 | Donnees pedagogiques locales presentes | `src/lib/data/*` | Lettres, syllabes, mots, sourates. |
| Fait | P0 | Stripe integre techniquement | `src/lib/stripe.ts`, `src/app/api/stripe/*` | Checkout, portal et webhook existent. |
| Fait | P0 | Emails transactionnels presents | `src/emails/*`, `src/lib/email-service.ts` | Domaine Resend/DNS a verifier hors code. |
| Fait | P0 | Domaine code aligne sur `lisani.tech` | SEO, emails, partages | Reste a verifier en production. |
| Fait | P0 | Guards premium serveur ajoutes | `src/lib/premium-access.ts`, layouts premium | Bloque `syllabes`, `mots`, `sourates` avant rendu serveur. |
| Fait | P0 | APIs premium protegees | `src/app/api/progress/syllabes`, `mots`, `sourates` | Refuse les ecritures sans abonnement enfant actif/trialing. |
| Fait | P1 | RGPD technique partiel | `src/app/api/gdpr/*` | Export/suppression presents, schema a completer. |
| Fait | P1 | PWA partielle | `public/manifest.json`, `public/sw.js` | Assets et shortcuts encore a corriger. |
| Fait | P1 | SEO partiel | `sitemap`, `robots`, metadata, OG | Pages legales referencees mais absentes. |

## Taches restantes prioritaires

| Priorite | Tache | Pourquoi | Prochaine action | Validation attendue |
|---:|---|---|---|---|
| P0 | Corriger TypeScript | `npx tsc --noEmit` echoue encore | Corriger `src/app/api/cron/milestone-check/route.ts:83` | `npx tsc --noEmit` passe. |
| P0 | Corriger ESLint global | Le build/CI peut echouer | Corriger les erreurs restantes, notamment `src/lib/email-service.ts` si encore present | `npm run lint` ou ESLint equivalent passe. |
| P0 | Unifier le middleware auth | Deux middlewares concurrents fragilisent `/dashboard` et `/jouer` | Garder un seul middleware effectif qui gere auth + `x-pathname` | Test manuel auth sur `/dashboard` et `/jouer/[childId]`. |
| P0 | Corriger l'encodage mojibake | Textes illisibles visibles dans l'UI | Reencoder les fichiers touches en UTF-8 propre | Pages publiques, dashboard et jeu sans caracteres mojibake visibles. |
| P0 | Creer les pages legales | Obligatoire pour vente/RGPD mineurs | Ajouter `/mentions-legales`, `/cgv`, `/politique-confidentialite` | Liens footer, inscription, sitemap et emails valides. |
| P0 | Corriger PWA | Manifest reference des icones absentes et shortcuts invalides | Ajouter icones ou corriger manifest/SW, retirer `/jouer` sans `childId` | Lighthouse PWA sans erreur bloquante. |
| P0 | Verifier build Next | Le deploiement depend du build | Lancer `npm run build` apres correction TS/lint | Build local et Vercel OK. |
| P1 | Tester Stripe de bout en bout | Le premium depend des webhooks | Tester Checkout, webhook, portal, annulation, `past_due` | Abonnement enfant cree/mis a jour dans Supabase. |
| P1 | Formaliser gratuit vs premium | Marketing et code doivent dire la meme chose | Definir matrice d'acces : alphabet gratuit, modules premium, limites enfants | UI, textes et guards alignes. |
| P1 | Completer schema Supabase | Code utilise des objets absents du schema | Ajouter tables/buckets/policies manquants (`deletion_log`, `drawings`, etc.) | Reset/migration Supabase sans erreur. |
| P1 | Configurer crons Vercel | Emails weekly/milestone ne partiront pas seuls | Remplir `vercel.json` et proteger par secret | Cron appele en prod et refuse sans secret. |
| P1 | Retirer promesses marketing non prouvees | Risque confiance/legal | Supprimer ou qualifier `+500 familles`, ratings, temoignages non verifies | Landing sans affirmation invendable/non prouvee. |
| P1 | Ajouter monitoring erreurs | Paiement/API doivent etre surveilles | Ajouter Sentry ou equivalent + Vercel Analytics/PostHog | Erreurs client/API visibles en prod. |
| P1 | Ajouter tests critiques | Eviter regressions auth/premium/progression | Tests unitaires SRS + tests API ownership/premium | Tests automatises passent en CI. |
| P2 | Ajouter admin minimal | Support client et abonnement | Creer `/admin` avec whitelist email | Acces refuse hors whitelist. |
| P2 | Ajouter E2E Playwright | Verifier parcours reels | Scenarios inscription, enfant, jeu, paiement mocke | E2E stables sur CI. |

## Ordre recommande maintenant

1. Corriger `npx tsc --noEmit`, en commencant par `src/app/api/cron/milestone-check/route.ts:83`.
2. Corriger le lint global, puis lancer `npm run build`.
3. Unifier le middleware auth pour securiser toutes les routes privees.
4. Nettoyer l'encodage visible dans les pages enfant, dashboard et API.
5. Creer les pages legales et aligner tous les liens.
6. Corriger la PWA : icones, manifest, shortcuts.
7. Tester Stripe complet avec Stripe CLI et verifier les lignes `subscriptions`.
8. Completer le schema Supabase et les policies manquantes.
9. Ajouter monitoring, analytics et tests critiques.
10. Faire une verification mobile complete avant acquisition.

## Checklist lancement MVP

| Statut | Verification |
|---|---|
| A faire | `npx tsc --noEmit` passe. |
| A faire | Lint global passe. |
| A faire | `npm test -- --run` passe. |
| A faire | `npm run build` passe. |
| A faire | Un seul middleware protege `/dashboard`, `/jouer` et `/admin`. |
| A faire | Aucun texte mojibake visible. |
| A faire | Pages legales publiees. |
| Fait cote code | Domaine code aligne sur `lisani.tech`. |
| A faire | Domaine Resend/DNS verifie en production. |
| A faire | Manifest PWA valide avec icones presentes. |
| Fait | Modules premium bloques cote serveur. |
| Fait | APIs progression premium bloquees sans abonnement. |
| A faire | Checkout Stripe fonctionne pour un enfant donne. |
| A faire | Webhook Stripe cree/met a jour l'abonnement. |
| A faire | Customer Portal permet la resiliation. |
| A faire | Export RGPD fonctionne. |
| A faire | Suppression RGPD fonctionne sans erreur schema. |
| A faire | Monitoring erreurs actif. |
| A faire | Aucune promesse marketing non prouvee en production. |
