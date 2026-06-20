# progression-enfant.md - Statut progression alphabet enfant

Date de verification : 16 juin 2026

## Verdict

La correction code a ete appliquee pour `/enfants/[id]`.

La page ne compare plus les UUID Supabase a des ids texte comme `alif` ou `ba`. Elle lit maintenant la progression avec `content_items`, filtre uniquement les items de type `lettre`, puis transmet `contenu_ar` a la grille alphabet.

Le fonctionnement reste a valider avec une vraie ligne en base, car il depend du seed Supabase `content_items`.

## Fonctionnement apres correction

1. L'enfant joue dans `/jouer/[childId]/alphabet`.
2. La page alphabet envoie un POST vers `/api/progress` avec un item symbolique, par exemple `lettre_0`.
3. `/api/progress` convertit cet item symbolique en UUID `content_items.id`.
4. La table `progress` stocke la progression avec cet UUID.
5. `/enfants/[id]` relit `progress` avec un join vers `content_items`.
6. La page garde seulement les lignes dont `content_items.type === 'lettre'`.
7. `ProgressGrid` matche chaque lettre avec `content_items.contenu_ar`.

## Corrections faites

| Statut | Correction | Fichier |
|---|---|---|
| Fait | Remplacement de `updated_at` par `last_seen`, colonne reelle de la table `progress`. | `src/app/(dashboard)/enfants/[id]/page.tsx` |
| Fait | Join Supabase vers `content_items(id, type, contenu_ar)`. | `src/app/(dashboard)/enfants/[id]/page.tsx` |
| Fait | Filtrage des statistiques alphabet sur `type = lettre`. | `src/app/(dashboard)/enfants/[id]/page.tsx` |
| Fait | Transmission de `contenu_ar` a la grille. | `src/app/(dashboard)/enfants/[id]/page.tsx` |
| Fait | Mapping de la grille par `contenu_ar` au lieu de `item_id`. | `src/components/dashboard/ProgressGrid.tsx` |
| Fait | Suppression de la liste de lettres dupliquee dans `ProgressGrid`; la grille utilise maintenant `LETTERS`. | `src/components/dashboard/ProgressGrid.tsx` |

## Ce qui reste a verifier

| Priorite | Point | Pourquoi |
|---|---|---|
| P0 | Verifier que `content_items` contient les 28 lettres avec `type = 'lettre'`. | Sans ces lignes, `/api/progress` ne peut pas convertir `lettre_0` en UUID. |
| P0 | Verifier que `content_items.contenu_ar` correspond a `LETTERS.formes.isol`. | La grille matche sur ce champ. Si les textes arabes divergent, la carte restera `Non vue`. |
| P1 | Nettoyer l'encodage mojibake des donnees arabes. | Plusieurs fichiers affichent encore des caracteres mal encodes, ce qui peut casser les correspondances. |
| P1 | Ajouter un message d'erreur visible si la requete progression echoue. | Aujourd'hui, une erreur peut encore produire une page avec zero progression. |

## Test manuel recommande

1. Ouvrir `/jouer/[childId]/alphabet`.
2. Faire une bonne reponse sur une lettre.
3. Verifier dans Supabase qu'une ligne apparait dans `progress`.
4. Verifier que cette ligne pointe vers un `content_items.type = 'lettre'`.
5. Revenir sur `/enfants/[id]`.
6. Confirmer que la lettre passe de `Non vue` a `En cours`.
7. Rejouer jusqu'a score >= 80.
8. Confirmer que la lettre passe a `Maitrisee`.

## Verifications techniques

| Commande | Resultat |
|---|---|
| `npx eslint 'src/app/(dashboard)/enfants/[id]/page.tsx' 'src/components/dashboard/ProgressGrid.tsx'` | OK |
| `npx tsc --noEmit` | Echec sur une erreur existante non liee : `src/app/api/cron/milestone-check/route.ts:83` |

## Statut final

Le bug de mapping principal est corrige cote code. La progression devrait maintenant s'afficher si les donnees Supabase `content_items` sont correctement seedées et si l'encodage arabe correspond entre le seed et `src/lib/data/letters.ts`.
