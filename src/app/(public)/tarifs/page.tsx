export default function PricingPage() {
  return (
    <div className="min-h-screen p-12 text-center">
      <h1 className="text-5xl font-bold text-primary mb-12">Un tarif simple</h1>
      <div className="p-10 border-2 border-primary/10 rounded-3xl max-w-md mx-auto shadow-xl bg-white relative">
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full font-bold text-sm">Populaire</div>
        <h2 className="text-3xl font-bold mb-4">Mensuel</h2>
        <p className="text-7xl font-bold text-accent my-6">2€ <span className="text-xl text-gray-400 font-medium">/enfant</span></p>
        <ul className="text-left space-y-4 mb-8 text-gray-600">
          <li className="flex items-center gap-3">✅ <span>Accès à tous les mini-jeux</span></li>
          <li className="flex items-center gap-3">✅ <span>Suivi de progression parent</span></li>
          <li className="flex items-center gap-3">✅ <span>Sans engagement</span></li>
        </ul>
        <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition">Choisir cette offre</button>
      </div>
    </div>
  )
}
