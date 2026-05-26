/**
 * components/dashboard/StatsCard.tsx — Carte métrique épurée pour le dashboard
 */

interface Trend {
  value: number
  direction: 'up' | 'down'
}

interface StatsCardProps {
  icon: string
  label: string
  value: string | number
  unit?: string
  color?: string
  trend?: Trend
}

export default function StatsCard({
  icon,
  label,
  value,
  unit,
  color = '#1A3A5C',
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col gap-3">
      {/* Icône avec fond teinté */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        {icon}
      </div>

      {/* Valeur principale + unité + trend */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className="font-semibold leading-none text-[#1A3A5C]"
          style={{ fontSize: '2rem' }}
        >
          {value}
        </span>

        {unit && (
          <span className="text-sm text-gray-400 font-medium">{unit}</span>
        )}

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
              trend.direction === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>

      {/* Label descriptif */}
      <p className="text-sm text-gray-500 leading-snug">{label}</p>
    </div>
  )
}
