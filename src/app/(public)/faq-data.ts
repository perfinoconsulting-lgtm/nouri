export interface FaqItem {
  q: string
  a: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "À partir de quel âge ?",
    a: "Lisani est conçu pour les enfants de 4 à 12 ans. L'interface est très visuelle, ne nécessitant pas de savoir lire parfaitement le français au début.",
  },
  {
    q: "Faut-il des connaissances préalables en arabe ?",
    a: "Pas du tout ! L'application reprend les bases depuis zéro avec l'alphabet, étape par étape.",
  },
  {
    q: "Comment fonctionne l'abonnement ?",
    a: "Il coûte 2€ par mois et par profil enfant. Vous pouvez annuler d'un simple clic depuis votre espace parent.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui, nous respectons strictement le RGPD. Aucune publicité, aucune revente de données. Les enfants n'ont pas besoin d'adresse email.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui, c'est sans engagement. L'abonnement s'arrêtera à la fin du mois en cours après résiliation.",
  },
]
