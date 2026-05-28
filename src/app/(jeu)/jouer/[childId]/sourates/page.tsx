'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { SOURATES } from '@/lib/data/sourates'
import type { Sourate } from '@/lib/data/sourates'
import { SourateProgress } from '@/components/game/SourateProgress'
import type { ChildWithStats } from '@/types/dashboard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressItem {
  type: string
  contenu_ar: string
  score: number
}

// Parse les versets mémorisés (score >= 85) depuis les items de progression
function parseMemorizedVersets(items: ProgressItem[], slug: string): number[] {
  const prefix = `sourate_${slug}_v`
  return items
    .filter((p) => p.type === 'sourate' && p.contenu_ar.startsWith(prefix) && p.score >= 85)
    .map((p) => parseInt(p.contenu_ar.slice(prefix.length), 10))
    .filter((n) => !isNaN(n) && n > 0)
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SouratesListPage() {
  const params = useParams<{ childId: string }>()
  const router = useRouter()
  const childId = params.childId

  const [child, setChild] = useState<ChildWithStats | null>(null)
  const [memorisesParSlug, setMemorises] = useState<Map<string, number[]>>(new Map())
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!childId) return

    async function charger() {
      try {
        const [childRes, progressRes] = await Promise.allSettled([
          fetch(`/api/children/${childId}`),
          fetch(`/api/children/${childId}/progress`),
        ])

        const childJson =
          childRes.status === 'fulfilled' && childRes.value.ok
            ? ((await childRes.value.json()) as { child: ChildWithStats }).child
            : null

        let items: ProgressItem[] = []
        if (progressRes.status === 'fulfilled' && progressRes.value.ok) {
          const json = (await progressRes.value.json()) as { progress: ProgressItem[] }
          items = json.progress ?? []
        }

        const map = new Map<string, number[]>()
        for (const s of SOURATES) {
          map.set(s.slug, parseMemorizedVersets(items, s.slug))
        }

        setChild(childJson)
        setMemorises(map)
      } catch {
        // Silencieux — on affiche les cartes sans progression
      } finally {
        setChargement(false)
      }
    }

    charger()
  }, [childId])

  if (chargement) return <Squelette />

  const souratesSorted = [...SOURATES].sort((a, b) => a.ordre_apprentissage - b.ordre_apprentissage)
  const niveau = child?.niveau ?? 0

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">

      {/* Bouton retour */}
      <button
        onClick={() => router.push(`/jouer/${childId}`)}
        className="mb-6 py-2.5 px-5 font-bold rounded-2xl text-sm active:scale-95 flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', minHeight: 48 }}
      >
        🏰 Retour à la carte
      </button>

      {/* En-tête */}
      <div className="text-center mb-6">
        <h1
          className="text-3xl font-black text-white mb-2"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          Les Sourates 🌟
        </h1>
        <span
          dir="rtl"
          className="block text-center"
          style={{
            fontFamily: "'Noto Naskh Arabic', serif",
            fontSize: '1.6rem',
            color: '#F5A623',
            direction: 'rtl',
            lineHeight: '2',
          }}
        >
          سُوَرٌ قُرْآنِيَّة
        </span>
      </div>

      {/* Liste des sourates */}
      <div className="flex flex-col gap-4">
        {souratesSorted.map((sourate) => {
          const memorises = memorisesParSlug.get(sourate.slug) ?? []
          const estVerrouille = sourate.numero === 1 && niveau < 3
          const estRecommande = sourate.ordre_apprentissage === 1

          if (estVerrouille) {
            return (
              <CarteSourateLockee
                key={sourate.slug}
                sourate={sourate}
                memorises={memorises}
                niveauRequis={3}
                niveauActuel={niveau}
              />
            )
          }

          return (
            <Link
              key={sourate.slug}
              href={`/jouer/${childId}/sourates/${sourate.slug}`}
              className="block active:scale-[0.98] transition-transform"
            >
              <CarteSourate
                sourate={sourate}
                memorises={memorises}
                recommande={estRecommande}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── Carte sourate standard ───────────────────────────────────────────────────

interface CarteSourateProps {
  sourate: Sourate
  memorises: number[]
  recommande: boolean
}

function CarteSourate({ sourate, memorises, recommande }: CarteSourateProps) {
  const pourcentage =
    sourate.versets.length > 0
      ? Math.round((memorises.length / sourate.versets.length) * 100)
      : 0

  return (
    <div
      className="w-full rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${pourcentage === 100 ? 'rgba(39,174,96,0.4)' : 'rgba(245,166,35,0.2)'}`,
      }}
    >
      {/* Badge recommandé */}
      {recommande && (
        <span
          className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: '#F5A623', color: '#1A3A5C' }}
        >
          Recommandé ⭐
        </span>
      )}

      {/* Ligne haute : numéro + noms */}
      <div className="flex items-start gap-4">
        {/* Badge numéro */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl font-black"
          style={{
            width: 48,
            height: 48,
            background: 'rgba(245,166,35,0.2)',
            border: '2px solid rgba(245,166,35,0.4)',
            color: '#F5A623',
            fontFamily: "'Baloo 2', cursive",
            fontSize: '1rem',
          }}
        >
          {sourate.numero}
        </div>

        <div className="flex-1 min-w-0">
          {/* Nom arabe */}
          <div
            dir="rtl"
            className="text-right mb-1"
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: '1.8rem',
              color: '#FFFFFF',
              direction: 'rtl',
              lineHeight: '1.8',
            }}
          >
            {sourate.nom_ar}
          </div>

          {/* Nom français et translittération */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-bold text-white text-base"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              {sourate.nom_fr}
            </span>
            <span
              className="text-sm italic"
              style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Baloo 2', cursive" }}
            >
              {sourate.nom_transliteration}
            </span>
          </div>
        </div>
      </div>

      {/* Signification + description */}
      <div>
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: '#F5A623', fontFamily: "'Baloo 2', cursive" }}
        >
          « {sourate.signification} »
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Baloo 2', cursive" }}
        >
          {sourate.description_enfant}
        </p>
      </div>

      {/* Étoiles de difficulté */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Baloo 2', cursive" }}
        >
          Difficulté :
        </span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <span key={n} style={{ fontSize: '1rem', opacity: n <= sourate.difficulte ? 1 : 0.25 }}>
              ⭐
            </span>
          ))}
        </div>
        <span
          className="text-xs ml-auto"
          style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Baloo 2', cursive" }}
        >
          {sourate.versets.length} versets
        </span>
      </div>

      {/* Barre de progression */}
      <SourateProgress
        totalVersets={sourate.versets.length}
        memorizedVersets={memorises}
      />
    </div>
  )
}

// ─── Carte sourate verrouillée ────────────────────────────────────────────────

interface CarteLockeeProps {
  sourate: Sourate
  memorises: number[]
  niveauRequis: number
  niveauActuel: number
}

function CarteSourateLockee({ sourate, memorises, niveauRequis }: CarteLockeeProps) {
  return (
    <div className="relative">
      <CarteSourate sourate={sourate} memorises={memorises} recommande={false} />
      {/* Overlay verrou */}
      <div
        className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2"
        style={{ background: 'rgba(10,18,40,0.82)', backdropFilter: 'blur(2px)' }}
      >
        <span style={{ fontSize: '2.5rem' }}>🔒</span>
        <p
          className="font-bold text-center"
          style={{ color: '#F5A623', fontFamily: "'Baloo 2', cursive", fontSize: '1rem' }}
        >
          Niveau {niveauRequis} requis
        </p>
        <p
          className="text-xs text-center px-6"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Baloo 2', cursive" }}
        >
          Continue d'apprendre les autres sourates pour débloquer Al-Fâtiha !
        </p>
      </div>
    </div>
  )
}

// ─── Squelette chargement ─────────────────────────────────────────────────────

function Squelette() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 animate-pulse">
      <div className="h-10 bg-white/10 rounded-2xl w-40 mb-6" />
      <div className="text-center mb-6">
        <div className="h-8 bg-white/15 rounded-xl w-48 mx-auto mb-3" />
        <div className="h-8 bg-white/10 rounded-xl w-36 mx-auto" />
      </div>
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-52 bg-white/08 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
    </div>
  )
}
