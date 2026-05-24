export default function PricingPage() {
  return (
    <div className="min-h-screen pt-32 pb-12 max-w-4xl mx-auto px-6">
      <h1 className="text-5xl font-bold text-primary mb-8 text-center">Nos Tarifs</h1>
      <p className="text-xl text-gray-600 leading-relaxed text-center mb-12">
        Un abonnement unique, simple et sans engagement pour débloquer tout le potentiel de NourAl.
      </p>
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md mx-auto text-center">
        <h3 className="text-2xl font-bold text-primary mb-2">Premium</h3>
        <div className="text-5xl font-bold text-primary mb-8">2€ <span className="text-lg text-gray-400 font-medium">/ mois / enfant</span></div>
        <ul className="space-y-4 mb-10 text-left">
          <li className="flex gap-3 text-gray-600">✅ Alphabet complet et syllabes</li>
          <li className="flex gap-3 text-gray-600">✅ Apprentissage des mots et petites sourates</li>
          <li className="flex gap-3 text-gray-600">✅ Tableau de bord de suivi parental</li>
          <li className="flex gap-3 text-gray-600">✅ Répétition espacée intégrée</li>
        </ul>
        <a href="/inscription" className="block w-full py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition shadow-lg">
          Commencer l'essai gratuit
        </a>
      </div>
    </div>
  )
}
