import Link from 'next/link'

export default function WordsGame({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <Link href={`/jouer/${params.childId}`} className="absolute top-8 left-8 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
        Retour
      </Link>
      <div className="bg-success/10 px-16 py-12 rounded-[3rem] flex flex-col items-center justify-center mb-12 shadow-inner">
        <div className="text-[10rem] font-arabic text-success leading-none">قِطَّة</div>
      </div>
      <p className="text-5xl font-bold text-primary mb-12">Chat</p>
      <div className="flex gap-4">
        <button className="px-10 py-5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-xl hover:bg-gray-200">Précédent</button>
        <button className="px-10 py-5 bg-success text-white font-bold rounded-2xl text-xl hover:bg-success/90 shadow-md">Suivant</button>
      </div>
    </main>
  )
}
