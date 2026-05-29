import { LETTERS } from '@/lib/data/letters'

/** Grille de l'alphabet arabe en lecture seule — Server Component pour SEO */
export function AlphabetDisplay() {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0F2640 100%)' }}
    >
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
        {LETTERS.map((letter) => (
          <div
            key={letter.index}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              minHeight: '88px',
              padding: '10px 4px',
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Naskh Arabic', serif",
                fontSize: '2.2rem',
                direction: 'rtl',
                lineHeight: 1,
                color: 'white',
              }}
            >
              {letter.ar}
            </span>
            <span
              className="text-white/70 text-center"
              style={{ fontSize: '0.7rem', lineHeight: 1.2 }}
            >
              {letter.nom}
            </span>
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }} aria-hidden="true">
              {letter.emoji}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
