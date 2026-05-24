'use client'

/**
 * app/(dashboard)/enfants/page.tsx -- Liste de tous les enfants
 *
 * Client Component pour gerer l'etat de la modale
 */

import { useState, useEffect } from 'react'
import ChildCard from '@/components/dashboard/ChildCard'
import CreateChildModal from '@/components/dashboard/CreateChildModal'
import { Plus, Users } from 'lucide-react'

interface ChildData {
  id: string
  prenom: string
  age: number
  avatar: string | null
  niveau: number
  last_active: string | null
  stats: {
    lettersLearned: number
    avgScore: number
    totalSessions: number
    currentStreak: number
    lastSessionDate: string | null
  }
  subscription: {
    status: string
    currentPeriodStart: string | null
  }
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children')
      if (res.ok) {
        const data = await res.json()
        setChildren(data.children ?? [])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  const handleModalClose = () => {
    setIsModalOpen(false)
    fetchChildren()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0a192f]">
            Mes enfants
            {children.length > 0 && (
              <span className="ml-3 text-lg font-medium text-gray-400">({children.length})</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Gerez les profils et suivez la progression.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#F5A623] text-white font-bold rounded-xl hover:bg-[#e09520] transition shadow-md"
        >
          <Plus size={18} />
          Ajouter un enfant
        </button>
      </div>

      {/* Contenu */}
      {isLoading ? (
        /* Skeleton loading */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl shadow-sm border-l-4 border-gray-200 p-6 animate-pulse">
              <div className="flex gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-4"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-gray-50 rounded-2xl"></div>
                <div className="h-16 bg-gray-50 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : children.length === 0 ? (
        /* Etat vide */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm">
            <Users size={40} className="text-blue-200" />
          </div>
          <h2 className="text-2xl font-bold text-[#0a192f] mb-3">Aucun profil enfant</h2>
          <p className="text-gray-500 max-w-sm mb-8">
            Creez le premier profil pour commencer l&apos;apprentissage de l&apos;arabe.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-[#F5A623] text-white font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg text-lg"
          >
            + Creer le premier profil
          </button>
        </div>
      ) : (
        /* Grille des enfants */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              subscriptionStatus={child.subscription.status}
              stats={{
                lettersLearned: child.stats.lettersLearned,
                avgScore: child.stats.avgScore,
                lastActive: child.last_active,
                currentStreak: child.stats.currentStreak,
              }}
            />
          ))}

          {/* Carte ajout */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 p-8 hover:bg-gray-100 hover:border-gray-300 transition text-center min-h-[240px]"
          >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">
              +
            </div>
            <div>
              <p className="font-bold text-[#0a192f]">Ajouter un enfant</p>
              <p className="text-sm text-gray-400 mt-1">Creer un nouveau profil</p>
            </div>
          </button>
        </div>
      )}

      {/* Modale */}
      {isModalOpen && <CreateChildModal onClose={handleModalClose} />}
    </div>
  )
}
