export default function ChildDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-10">Profil de l'enfant</h1>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <p className="text-lg text-gray-600">ID de l'enfant : <span className="font-mono font-bold text-primary">{params.id}</span></p>
      </div>
    </div>
  )
}
