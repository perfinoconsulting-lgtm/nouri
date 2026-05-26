'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateChildModal from './CreateChildModal'

export default function AddChildButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 hover:bg-gray-100 hover:border-gray-300 transition text-center min-h-[200px] w-full"
      >
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
          <Plus size={22} className="text-[#1A3A5C]" />
        </div>
        <div>
          <p className="font-bold text-[#1A3A5C]">Ajouter un enfant</p>
          <p className="text-sm text-gray-400 mt-1">Créer un nouveau profil</p>
        </div>
      </button>

      {isOpen && <CreateChildModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
