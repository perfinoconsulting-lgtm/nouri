'use client'

import { Fragment } from 'react'

interface Props {
  totalVersets: number
  memorizedVersets: number[]
}

// Couleurs des états d'avancement
const COULEURS = {
  mémorisé: { fond: '#27AE60', bordure: '#27AE60', texte: '#FFFFFF' },
  enCours: { fond: '#F5A623', bordure: '#F5A623', texte: '#1A3A5C' },
  nonCommencé: {
    fond: 'rgba(255,255,255,0.06)',
    bordure: 'rgba(255,255,255,0.2)',
    texte: 'rgba(255,255,255,0.35)',
  },
}

// Couleur de la ligne de connexion basée sur l'état du verset suivant
function couleurLigne(
  versetSuivant: number,
  memorizedVersets: number[],
  prochainVerset: number | null
): string {
  if (memorizedVersets.includes(versetSuivant)) return '#27AE60'
  if (prochainVerset === versetSuivant) return 'rgba(245,166,35,0.5)'
  return 'rgba(255,255,255,0.12)'
}

export function SourateProgress({ totalVersets, memorizedVersets }: Props) {
  const memorizedCount = memorizedVersets.length
  const pourcentage =
    totalVersets > 0 ? Math.round((memorizedCount / totalVersets) * 100) : 0

  // Premier verset non mémorisé = verset en cours d'apprentissage
  let prochainVerset: number | null = null
  for (let i = 1; i <= totalVersets; i++) {
    if (!memorizedVersets.includes(i)) {
      prochainVerset = i
      break
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Rangée de cercles connectés par des lignes */}
      <div className="flex items-center w-full px-1" role="list" aria-label="Progression des versets">
        {Array.from({ length: totalVersets }, (_, idx) => {
          const verseNum = idx + 1
          const estMemorise = memorizedVersets.includes(verseNum)
          const estEnCours = !estMemorise && verseNum === prochainVerset
          const état = estMemorise ? 'mémorisé' : estEnCours ? 'enCours' : 'nonCommencé'
          const couleurs = COULEURS[état]

          return (
            <Fragment key={verseNum}>
              {/* Cercle représentant un verset */}
              <div
                role="listitem"
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: couleurs.fond,
                  border: `2px solid ${couleurs.bordure}`,
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                }}
                aria-label={
                  estMemorise
                    ? `Verset ${verseNum} mémorisé`
                    : estEnCours
                    ? `Verset ${verseNum} en cours`
                    : `Verset ${verseNum} non commencé`
                }
              >
                {estMemorise ? (
                  <span style={{ color: couleurs.texte, fontSize: '1rem', lineHeight: '1' }}>
                    ✓
                  </span>
                ) : (
                  <span
                    style={{
                      color: couleurs.texte,
                      fontSize: '0.8rem',
                      fontFamily: "'Baloo 2', cursive",
                      fontWeight: 600,
                      lineHeight: '1',
                    }}
                  >
                    {verseNum}
                  </span>
                )}
              </div>

              {/* Ligne de connexion (absente après le dernier cercle) */}
              {verseNum < totalVersets && (
                <div
                  aria-hidden="true"
                  className="flex-1"
                  style={{
                    height: 2,
                    minWidth: 6,
                    backgroundColor: couleurLigne(verseNum + 1, memorizedVersets, prochainVerset),
                    transition: 'background-color 0.3s ease',
                  }}
                />
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Statistiques textuelles */}
      <p
        className="text-center text-sm"
        style={{ fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.65)' }}
      >
        <span style={{ color: '#27AE60', fontWeight: 700 }}>{memorizedCount}</span>
        {' '}
        {memorizedCount === 1 ? 'verset mémorisé' : 'versets mémorisés'}
        {' '}sur{' '}
        <span style={{ color: '#F5A623', fontWeight: 600 }}>{totalVersets}</span>
        {' '}—{' '}
        <span
          style={{
            color: pourcentage === 100 ? '#27AE60' : '#F5A623',
            fontWeight: 700,
          }}
        >
          {pourcentage}%
        </span>
      </p>
    </div>
  )
}
