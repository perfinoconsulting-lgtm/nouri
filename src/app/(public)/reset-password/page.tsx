"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErreur(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/nouveau-mot-de-passe`,
    })

    if (error) {
      setErreur("Une erreur est survenue. Vérifiez l'adresse email et réessayez.")
      setIsLoading(false)
      return
    }

    setEnvoye(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100">

        {envoye ? (
          /* Message de confirmation */
          <div className="text-center">
            <div className="w-16 h-16 bg-[#00C9B1]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📬</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1A3A5C] mb-3">Email envoyé !</h1>
            <p className="text-gray-500 leading-relaxed mb-2">
              Un lien de réinitialisation a été envoyé à :
            </p>
            <p className="font-semibold text-[#1A3A5C] mb-6">{email}</p>
            <p className="text-gray-400 text-sm mb-8">
              Vérifiez votre boîte mail (et votre dossier spam). Le lien est valable 1 heure.
            </p>
            <Link
              href="/connexion"
              className="inline-block px-8 py-4 bg-[#1A3A5C] text-white font-bold rounded-2xl hover:bg-[#1A3A5C]/90 transition min-h-[48px]"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          /* Formulaire */
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#1A3A5C] mb-2">Mot de passe oublié</h1>
              <p className="text-gray-500 text-sm">
                Entrez votre email et nous vous enverrons un lien pour le réinitialiser.
              </p>
            </div>

            {erreur && (
              <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#1A3A5C]">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#F5A623] outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-4 bg-[#F5A623] text-white rounded-2xl font-bold text-lg hover:bg-[#F5A623]/90 transition shadow-md disabled:opacity-50 min-h-[48px]"
              >
                {isLoading ? 'Envoi en cours…' : 'Recevoir le lien'}
              </button>
            </form>

            <p className="text-center mt-8 text-gray-500 text-sm">
              <Link href="/connexion" className="text-[#1A3A5C] font-medium hover:underline">
                ← Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
