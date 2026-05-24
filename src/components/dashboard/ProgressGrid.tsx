/**
 * components/dashboard/ProgressGrid.tsx -- Grille des 28 lettres arabes
 *
 * Affiche chaque lettre avec sa couleur selon le score dans progress.
 * Blanc/gris = jamais vue | Orange = en cours | Vert = maitrisee
 */

'use client'

import { useState } from 'react'

// Les 28 lettres de l'alphabet arabe avec leurs noms
const ARABIC_LETTERS = [
  { id: 'alif',    arabic: 'ا', name: 'Alif'   },
  { id: 'ba',      arabic: 'ب', name: 'Ba'     },
  { id: 'ta',      arabic: 'ت', name: 'Ta'     },
  { id: 'tha',     arabic: 'ث', name: 'Tha'    },
  { id: 'jim',     arabic: 'ج', name: 'Jim'    },
  { id: 'ha',      arabic: 'ح', name: 'Ha'     },
  { id: 'kha',     arabic: 'خ', name: 'Kha'    },
  { id: 'dal',     arabic: 'د', name: 'Dal'    },
  { id: 'dhal',    arabic: 'ذ', name: 'Dhal'   },
  { id: 'ra',      arabic: 'ر', name: 'Ra'     },
  { id: 'zay',     arabic: 'ز', name: 'Zay'    },
  { id: 'sin',     arabic: 'س', name: 'Sin'    },
  { id: 'shin',    arabic: 'ش', name: 'Shin'   },
  { id: 'sad',     arabic: 'ص', name: 'Sad'    },
  { id: 'dad',     arabic: 'ض', name: 'Dad'    },
  { id: 'ta2',     arabic: 'ط', name: 'Ta'     },
  { id: 'dha',     arabic: 'ظ', name: 'Dha'    },
  { id: 'ayn',     arabic: 'ع', name: 'Ayn'    },
  { id: 'ghayn',   arabic: 'غ', name: 'Ghayn'  },
  { id: 'fa',      arabic: 'ف', name: 'Fa'     },
  { id: 'qaf',     arabic: 'ق', name: 'Qaf'    },
  { id: 'kaf',     arabic: 'ك', name: 'Kaf'    },
  { id: 'lam',     arabic: 'ل', name: 'Lam'    },
  { id: 'mim',     arabic: 'م', name: 'Mim'    },
  { id: 'nun',     arabic: 'ن', name: 'Nun'    },
  { id: 'ha2',     arabic: 'ه', name: 'Ha'     },
  { id: 'waw',     arabic: 'و', name: 'Waw'    },
  { id: 'ya',      arabic: 'ي', name: 'Ya'     },
]

interface ProgressItem {
  item_id: string
  score: number
  updated_at?: string
}

interface ProgressGridProps {
  progressData: ProgressItem[]
}

function getLetterStyle(score: number | undefined): string {
  if (score === undefined || score === 0) {
    return 'bg-gray-50 border border-gray-200 text-gray-300'
  }
  if (score >= 80) {
    return 'bg-green-50 border-2 border-green-300 text-green-700 shadow-sm'
  }
  return 'bg-orange-50 border-2 border-orange-300 text-orange-700 shadow-sm'
}

function getScoreLabel(score: number | undefined): string {
  if (score === undefined || score === 0) return 'Non vue'
  if (score >= 80) return 'Maitrisee'
  return 'En cours'
}

export default function ProgressGrid({ progressData }: ProgressGridProps) {
  const [tooltip, setTooltip] = useState<{ id: string; x: number; y: number } | null>(null)

  const progressMap = new Map(progressData.map((p) => [p.item_id, p]))
  const learned = progressData.filter((p) => p.score >= 80).length
  const inProgress = progressData.filter((p) => p.score > 0 && p.score < 80).length

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0a192f]">Progres de l&apos;alphabet</h2>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span>
            <span className="text-gray-500">Non vue</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>
            <span className="text-gray-500">En cours ({inProgress})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
            <span className="text-gray-500">Maitrisee ({learned})</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 relative">
        {ARABIC_LETTERS.map((letter) => {
          const prog = progressMap.get(letter.id)
          const score = prog?.score

          return (
            <div
              key={letter.id}
              className={`relative rounded-2xl p-3 text-center cursor-pointer transition-all hover:scale-105 hover:shadow-md ${getLetterStyle(score)}`}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ id: letter.id, x: rect.left, y: rect.top })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="font-arabic text-2xl leading-none mb-1">{letter.arabic}</div>
              <div className="text-[10px] font-semibold leading-tight">{letter.name}</div>

              {/* Tooltip */}
              {tooltip?.id === letter.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 bg-[#0a192f] text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl pointer-events-none">
                  <p className="font-bold">{letter.name}</p>
                  <p>{getScoreLabel(score)}</p>
                  {score !== undefined && score > 0 && (
                    <p>Score : {score}%</p>
                  )}
                  {prog?.updated_at && (
                    <p className="opacity-70">
                      Revise le {new Date(prog.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Barre de progression globale */}
      <div className="mt-6">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Progres global</span>
          <span className="text-[#0a192f] font-bold">{learned}/28 lettres</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${Math.round((learned / 28) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
