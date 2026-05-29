import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A3A5C',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Lettres arabes décoratives flottantes */}
        {['ا', 'ب', 'ت', 'ث'].map((letter, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              fontSize: '160px',
              color: 'rgba(245,166,35,0.12)',
              fontFamily: 'serif',
              top: i % 2 === 0 ? '5%' : '55%',
              left: `${10 + i * 22}%`,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {letter}
          </div>
        ))}

        {/* Contenu principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            zIndex: 1,
            padding: '0 60px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: '#F5A623',
              fontSize: '72px',
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            🌙 NourAl
          </div>

          <div
            style={{
              color: 'white',
              fontSize: '36px',
              fontWeight: 600,
              lineHeight: 1.3,
              maxWidth: '900px',
            }}
          >
            Apprendre l&apos;arabe n&apos;a jamais été aussi simple
          </div>

          <div
            style={{
              color: '#B0C4D8',
              fontSize: '24px',
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            À partir de 4 ans · 2€/mois · Essai gratuit
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
