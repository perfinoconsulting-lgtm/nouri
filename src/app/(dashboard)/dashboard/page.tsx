export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-2">Tableau de bord</h1>
      <p className="text-lg text-gray-500 mb-10">Suivez la progression de vos enfants.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-primary mb-4">Progression</h2>
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Aucune donnée pour le moment</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Prêt à apprendre ?</h2>
          <button className="px-8 py-4 bg-kids text-white font-bold text-lg rounded-2xl hover:bg-kids/90 transition shadow-md w-full">
            Lancer le jeu
          </button>
        </div>
      </div>
    </div>
  )
}
