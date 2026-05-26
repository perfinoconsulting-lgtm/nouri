'use client'

/**
 * components/dashboard/ChildDetailActions.tsx — Modale édition + suppression avec confirmation
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import EditChildModal from './EditChildModal'
import type { ChildWithStats } from '@/types/dashboard'

interface Props {
  child: ChildWithStats
}

export default function ChildDetailActions({ child }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (deleteInput !== child.prenom) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/children/${child.id}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la suppression.')
      router.push('/enfants')
      router.refresh()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#1A3A5C] font-bold rounded-xl hover:bg-gray-50 transition shadow-sm min-h-[48px]"
        >
          <Pencil size={16} />
          Modifier le profil
        </button>
        <button
          onClick={() => { setDeleteOpen(true); setDeleteInput(''); setDeleteError(null) }}
          className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-100 transition min-h-[48px]"
        >
          <Trash2 size={16} />
          Supprimer ce profil
        </button>
      </div>

      {editOpen && (
        <EditChildModal
          child={child}
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && !isDeleting && setDeleteOpen(false)}
        >
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <button
                onClick={() => !isDeleting && setDeleteOpen(false)}
                aria-label="Fermer"
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-[#1A3A5C] mb-2">
              Supprimer le profil de {child.prenom} ?
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Cette action est irréversible. Toute la progression, les sessions et l&apos;abonnement
              associés seront définitivement supprimés.
            </p>

            <p className="text-sm font-semibold text-[#1A3A5C] mb-2">
              Tapez <span className="text-red-500">{child.prenom}</span> pour confirmer
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={child.prenom}
              disabled={isDeleting}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-[#1A3A5C] font-medium mb-4 disabled:opacity-50"
            />

            {deleteError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 min-h-[48px]"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteInput !== child.prenom}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Suppression…
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
