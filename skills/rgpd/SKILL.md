# Skill : RGPD Mineurs (CNIL France)

## Quand lire ce skill
Avant toute page légale, gestion des données, ou feature collectant des données.

## Données collectées et bases légales
| Donnée | Qui | Pourquoi | Base légale |
|--------|-----|----------|-------------|
| Email | Parent | Compte + facturation | Contrat |
| Prénom parent | Parent | Personnalisation | Contrat |
| Prénom enfant | Enfant | Interface jeu | Intérêt légitime |
| Âge enfant | Enfant | Adaptation contenu | Intérêt légitime |
| Avatar | Enfant | Interface jeu | Intérêt légitime |
| Progression | Enfant | Service pédagogique | Contrat |
| Durée sessions | Enfant | Dashboard parent | Intérêt légitime |

## Ce qu'on NE collecte PAS (données enfants)
- ❌ Pas d'email enfant
- ❌ Pas de localisation
- ❌ Pas de photo
- ❌ Pas de données biométriques
- ❌ Pas de comportement de navigation externe

## Durées de conservation
| Donnée | Durée |
|--------|-------|
| Compte actif | Pendant l'activité |
| Après suppression compte | Supprimé immédiatement |
| Logs de suppression (audit) | 3 ans |
| Données facturation | 10 ans (obligation légale) |

## Droits des utilisateurs à implémenter
```typescript
// Export RGPD — GET /api/gdpr/export
// Retourne JSON avec toutes les données du parent + enfants

// Suppression RGPD — DELETE /api/gdpr/delete
// 1. Annuler subscriptions Stripe actives
// 2. Supprimer Storage Supabase (tracés dessin)
// 3. Supprimer toutes les tables (cascade)
// 4. Insérer log dans deletion_log (audit)
// 5. Envoyer email de confirmation
```

## Cookie banner
- Cookies nécessaires uniquement (auth Supabase)
- Pas de tracking tiers pour le MVP → pas de consent manager complexe
- Simple bannière : "Cookies nécessaires au fonctionnement"
- Bouton "J'ai compris" → localStorage cookie_accepted

## Sous-traitants à mentionner
| Sous-traitant | Rôle | Localisation |
|---------------|------|--------------|
| Supabase | BDD + Auth | EU (Frankfurt) |
| Stripe | Paiement | EU (Irlande) |
| Vercel | Hébergement | EU (Paris cdg1) |
| Resend | Emails | EU |
| Cloudflare | Workers AI | EU possible |

## Checklist CNIL mineurs
- ✅ Consentement parental requis (compte parent = consentement)
- ✅ Pas de profilage commercial des enfants
- ✅ Pas de partage données enfants avec tiers
- ✅ Données minimales (principe minimisation)
- ✅ Droit à l'effacement respecté
- ✅ Politique confidentialité claire et lisible
