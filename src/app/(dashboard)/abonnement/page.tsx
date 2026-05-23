export default function SubscriptionPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-2">Abonnement</h1>
      <p className="text-gray-500 mb-10">Gérez votre facturation et vos options.</p>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-primary">Statut</h3>
            <p className="text-success font-semibold mt-1">Actif</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-primary">Prochain prélèvement</h3>
            <p className="text-gray-500 mt-1">12 Juin 2026</p>
          </div>
        </div>
        <button className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition">
          Accéder au portail Stripe
        </button>
      </div>
    </div>
  )
}
