import Link from 'next/link'

export default function ChildrenPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Mes Enfants</h1>
          <p className="text-gray-500">Gérez les profils de vos enfants.</p>
        </div>
        <button className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition shadow-sm">
          + Ajouter un enfant
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/enfants/1" className="block bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-accent hover:shadow-md transition text-center cursor-pointer group">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-6 group-hover:scale-105 transition"></div>
          <h2 className="text-2xl font-bold text-primary mb-1">Yanis</h2>
          <p className="text-gray-500 font-medium">6 ans</p>
        </Link>
      </div>
    </div>
  )
}
