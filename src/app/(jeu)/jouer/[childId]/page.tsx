import Link from 'next/link'

export default function GameMainMenu({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen bg-blue-50/50 flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold text-primary mb-12">Choisis ton jeu !</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link href={`/jouer/${params.childId}/alphabet`} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center border-b-8 border-accent cursor-pointer group">
          <div className="text-7xl font-arabic mb-6 text-primary group-hover:scale-110 transition-transform duration-300">أ ب ت</div>
          <h2 className="text-3xl font-bold text-primary">Alphabet</h2>
        </Link>
        <Link href={`/jouer/${params.childId}/syllabes`} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center border-b-8 border-kids cursor-pointer group">
          <div className="text-7xl font-arabic mb-6 text-primary group-hover:scale-110 transition-transform duration-300">بَ بِ بُ</div>
          <h2 className="text-3xl font-bold text-primary">Syllabes</h2>
        </Link>
        <Link href={`/jouer/${params.childId}/mots`} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center border-b-8 border-success cursor-pointer group">
          <div className="text-7xl font-arabic mb-6 text-primary group-hover:scale-110 transition-transform duration-300">قِطَّة</div>
          <h2 className="text-3xl font-bold text-primary">Mots</h2>
        </Link>
      </div>
      <Link href="/dashboard" className="mt-16 px-8 py-4 bg-white text-gray-500 font-bold rounded-2xl shadow-sm hover:bg-gray-50 transition">
        Quitter le jeu
      </Link>
    </main>
  )
}
