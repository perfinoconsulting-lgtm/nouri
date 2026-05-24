/**
 * components/dashboard/ActivityCalendar.tsx -- Calendrier d'activite style GitHub
 *
 * Affiche 84 jours d'activite avec intensite coloree.
 * Implementation CSS Grid pure -- aucune librairie externe.
 */

'use client'

import { useState } from 'react'

interface DaySession {
  date: string         // 'YYYY-MM-DD'
  duration_seconds: number
}

interface ActivityCalendarProps {
  sessions: DaySession[]
}

// Couleur selon le nombre de minutes d'activite
function getDayColor(minutes: number): string {
  if (minutes === 0) return 'bg-gray-100'
  if (minutes < 5)  return 'bg-[#F5A623]/30'
  if (minutes < 15) return 'bg-[#F5A623]/60'
  return 'bg-[#F5A623]'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// Genere les 84 derniers jours
function getLast84Days(): string[] {
  const days: string[] = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

// Noms des jours en francais (abrege)
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Labels des mois pour afficher au-dessus des colonnes
function getMonthLabels(days: string[]): Array<{ label: string; colStart: number }> {
  const result: Array<{ label: string; colStart: number }> = []
  let lastMonth = ''

  days.forEach((day, i) => {
    const col = Math.floor(i / 7) + 1
    const month = new Date(day).toLocaleDateString('fr-FR', { month: 'short' })
    if (month !== lastMonth) {
      result.push({ label: month, colStart: col })
      lastMonth = month
    }
  })

  return result
}

export default function ActivityCalendar({ sessions }: ActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Construire une map date -> minutes
  const minutesByDay = new Map<string, number>()
  sessions.forEach((s) => {
    const mins = Math.floor(s.duration_seconds / 60)
    minutesByDay.set(s.date, (minutesByDay.get(s.date) ?? 0) + mins)
  })

  const days = getLast84Days()
  const monthLabels = getMonthLabels(days)

  // Regrouper les jours par semaine (colonnes)
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const totalMinutes = Array.from(minutesByDay.values()).reduce((a, b) => a + b, 0)
  const activeDays = minutesByDay.size

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0a192f]">Activite des 12 dernieres semaines</h2>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-[#0a192f]">{activeDays}</span> jours actifs,{' '}
          <span className="font-bold text-[#0a192f]">{Math.round(totalMinutes / 60)}h{totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}min` : ''}</span> au total
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[600px]">
          {/* Labels des mois */}
          <div className="flex mb-1 ml-6">
            {monthLabels.map((m) => (
              <div
                key={`${m.label}-${m.colStart}`}
                className="text-xs text-gray-400 font-medium capitalize"
                style={{ marginLeft: `${(m.colStart - 1) * 28}px`, width: '28px', position: m.colStart === 1 ? 'relative' : undefined }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Labels des jours de la semaine */}
            <div className="flex flex-col gap-1 mr-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-400 font-medium">
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => {
                  const minutes = minutesByDay.get(day) ?? 0
                  const isHovered = hoveredDay === day

                  return (
                    <div
                      key={day}
                      className={`w-5 h-5 rounded-sm cursor-pointer transition-all ${getDayColor(minutes)} ${
                        isHovered ? 'ring-2 ring-[#0a192f] ring-offset-1 scale-125' : 'hover:scale-110'
                      } relative`}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-[#0a192f] text-white text-xs rounded-xl px-3 py-1.5 whitespace-nowrap shadow-xl pointer-events-none">
                          <p className="font-semibold">{formatDate(day)}</p>
                          <p className="opacity-80">
                            {minutes > 0 ? `${minutes} min de pratique` : 'Aucune activite'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="flex items-center gap-3 mt-4 justify-end text-xs text-gray-400">
        <span>Moins</span>
        <div className="w-4 h-4 rounded-sm bg-gray-100"></div>
        <div className="w-4 h-4 rounded-sm bg-[#F5A623]/30"></div>
        <div className="w-4 h-4 rounded-sm bg-[#F5A623]/60"></div>
        <div className="w-4 h-4 rounded-sm bg-[#F5A623]"></div>
        <span>Plus</span>
      </div>
    </div>
  )
}
