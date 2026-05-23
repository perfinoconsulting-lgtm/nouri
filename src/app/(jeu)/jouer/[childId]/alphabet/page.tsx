import Link from 'next/link'

export default function AlphabetGame({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <Link href={`/jouer/${params.childId}`} className="absolute top-8 left-8 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
        Retour
      </Link>
      <div className="bg-accent/10 w-64 h-64 rounded-full flex flex-col items-center justify-center mb-12 shadow-inner">
        <div className="text-[12rem] font-arabic text-accent leading-none">ب</div>
      </div>
      <p className="text-5xl font-bold text-primary mb-12">Baa</p>
      <div className="flex gap-4">
        <button className="px-10 py-5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-xl hover:bg-gray-200">Précédent</button>
        <button className="px-10 py-5 bg-accent text-white font-bold rounded-2xl text-xl hover:bg-accent/90 shadow-md">Suivant</button>
      </div>
    </main>
  )
}
