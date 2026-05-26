'use client'

import { useEffect, useState } from 'react'

interface Etoile {
  x: number
  y: number
  taille: number
  duree: number
  delai: number
}

// 80 étoiles générées côté client pour éviter les problèmes de SSR avec Math.random
export default function EtoilesAnimees() {
  const [etoiles, setEtoiles] = useState<Etoile[]>([])

  useEffect(() => {
    const nouvelles: Etoile[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      taille: Math.random() * 2 + 1,
      duree: Math.random() * 2.5 + 1.5, // 1.5s à 4s
      delai: Math.random() * 3,
    }))
    setEtoiles(nouvelles)
  }, [])

  if (etoiles.length === 0) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      {etoiles.map((e, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            width: e.taille,
            height: e.taille,
            animation: `twinkle ${e.duree}s ease-in-out ${e.delai}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          from { opacity: 0.2; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
