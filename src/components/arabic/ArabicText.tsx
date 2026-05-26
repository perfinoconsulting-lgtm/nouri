'use client'

interface Props {
  text: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  weight?: 'normal' | 'bold'
  color?: string
  onClick?: () => void
  className?: string
}

const SIZES = {
  sm:   'text-xl',
  md:   'text-3xl',
  lg:   'text-5xl',
  xl:   'text-7xl',
  '2xl': 'text-9xl',
} as const

export function ArabicText({
  text,
  size = 'md',
  weight = 'normal',
  color,
  onClick,
  className,
}: Props) {
  return (
    <span
      dir="rtl"
      className={[
        SIZES[size],
        weight === 'bold' ? 'font-bold' : 'font-normal',
        onClick ? 'cursor-pointer hover:scale-110 transition-transform' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        fontFamily: "'Noto Naskh Arabic', serif",
        direction: 'rtl',
        textAlign: 'center',
        ...(color ? { color } : {}),
      }}
      onClick={onClick}
    >
      {text}
    </span>
  )
}
