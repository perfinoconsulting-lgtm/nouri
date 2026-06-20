/**
 * components/dashboard/ProgressGrid.tsx -- Grille des 28 lettres arabes.
 *
 * La progression est stockee en base avec un UUID `progress.item_id`.
 * Pour l'affichage alphabet, on matche donc sur `content_items.contenu_ar`.
 */

'use client'

import { useState } from 'react'
import { LETTERS } from '@/lib/data/letters'

interface ProgressItem {
  item_id: string
  contenu_ar: string
  score: number
  last_seen?: string
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
  const [tooltip, setTooltip] = useState<string | null>(null)

  const progressMap = new Map(progressData.map((p) => [p.contenu_ar, p]))
  const learned = progressData.filter((p) => p.score >= 80).length
  const inProgress = progressData.filter((p) => p.score > 0 && p.score < 80).length

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0a192f]">Progres de l&apos;alphabet</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
            <span className="text-gray-500">Non vue</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            <span className="text-gray-500">En cours ({inProgress})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            <span className="text-gray-500">Maitrisee ({learned})</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 relative">
        {LETTERS.map((letter) => {
          const letterKey = letter.formes.isol
          const tooltipId = String(letter.index)
          const prog = progressMap.get(letterKey)
          const score = prog?.score

          return (
            <div
              key={letter.index}
              className={`relative rounded-2xl p-3 text-center cursor-pointer transition-all hover:scale-105 hover:shadow-md ${getLetterStyle(score)}`}
              onMouseEnter={() => setTooltip(tooltipId)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div
                dir="rtl"
                className="font-arabic text-2xl leading-none mb-1"
                style={{ fontFamily: "'Noto Naskh Arabic', serif" }}
              >
                {letterKey}
              </div>
              <div className="text-[10px] font-semibold leading-tight">{letter.nom}</div>

              {tooltip === tooltipId && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 bg-[#0a192f] text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl pointer-events-none">
                  <p className="font-bold">{letter.nom}</p>
                  <p>{getScoreLabel(score)}</p>
                  {score !== undefined && score > 0 && <p>Score : {score}%</p>}
                  {prog?.last_seen && (
                    <p className="opacity-70">
                      Revise le {new Date(prog.last_seen).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

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
