'use client'

/**
 * app/(dashboard)/enfants/page.tsx — Liste des enfants avec modale création
 */

import { useState, useEffect, useCallback } from 'react'
import ChildCard from '@/components/dashboard/ChildCard'
import CreateChildModal from '@/components/dashboard/CreateChildModal'
import type { ChildWithStats } from '@/types/dashboard'
import { Plus, Users } from 'lucide-react'

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildWithStats[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchChildren = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/children')
      if (res.ok) {
        const data = (await res.json()) as { children: ChildWithStats[] }
        setChildren(data.children ?? [])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const handleModalClose = () => {
    setIsModalOpen(false)
    fetchChildren()
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A3A5C]">
            Mes enfants
            {children.length > 0 && (
              <span className="ml-3 text-lg font-medium text-gray-400">({children.length})</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Gérez les profils et suivez la progression.</p>
        </div>
        {children.length < 5 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-xl hover:bg-[#e09520] transition shadow-md min-h-[48px]"
          >
            <Plus size={18} />
            Ajouter un enfant
          </button>
        )}
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border-l-4 border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-12" />
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-4" />
              <div className="h-4 bg-gray-50 rounded w-32" />
            </div>
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <Users size={40} className="text-blue-200" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A3A5C] mb-3">Aucun profil enfant</h2>
          <p className="text-gray-500 max-w-sm mb-8">
            Créez le premier profil pour commencer l&apos;apprentissage de l&apos;arabe.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-[#F5A623] text-[#1A3A5C] font-bold rounded-2xl hover:bg-[#e09520] transition shadow-lg text-lg min-h-[56px]"
          >
            + Créer le premier profil
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onAddChild={() => setIsModalOpen(true)}
            />
          ))}

          {/* Carte ajout (masquée si limite 5 atteinte) */}
          {children.length < 5 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 hover:bg-gray-100 hover:border-gray-300 transition text-center min-h-[200px]"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                +
              </div>
              <div>
                <p className="font-bold text-[#1A3A5C]">Ajouter un enfant</p>
                <p className="text-sm text-gray-400 mt-1">Créer un nouveau profil</p>
              </div>
            </button>
          )}
        </div>
      )}

      {isModalOpen && <CreateChildModal onClose={handleModalClose} />}
    </div>
  )
}
