'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParentInfo {
  email: string
  prenom: string
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ParametresPage() {
  const router = useRouter()
  const supabase = createClient()

  const [parent, setParent] = useState<ParentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Formulaire prénom ──────────────────────────────────────────────────────
  const [prenom, setPrenom] = useState('')
  const [prenomSaving, setPrenomSaving] = useState(false)
  const [prenomMsg, setPrenomMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Formulaire mot de passe ────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Export données ─────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)

  // ── Suppression compte ─────────────────────────────────────────────────────
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'error'; text: string } | null>(null)

  // Charger les données du parent au montage
  useEffect(() => {
    async function chargerParent() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/connexion')
        return
      }

      const { data } = await supabase
        .from('parents')
        .select('prenom')
        .eq('id', session.user.id)
        .single()

      setParent({
        email: session.user.email ?? '',
        prenom: data?.prenom ?? '',
      })
      setPrenom(data?.prenom ?? '')
      setLoading(false)
    }

    chargerParent()
  }, [])

  // ── Modifier le prénom ─────────────────────────────────────────────────────
  async function handlePrenomSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPrenomSaving(true)
    setPrenomMsg(null)

    try {
      const res = await fetch('/api/parents/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom }),
      })

      if (!res.ok) {
        const { error } = await res.json() as { error: string }
        setPrenomMsg({ type: 'error', text: error ?? 'Erreur lors de la mise à jour.' })
      } else {
        setParent((p) => p ? { ...p, prenom } : p)
        setPrenomMsg({ type: 'success', text: 'Prénom mis à jour avec succès.' })
      }
    } catch {
      setPrenomMsg({ type: 'error', text: 'Erreur réseau. Réessayez.' })
    } finally {
      setPrenomSaving(false)
    }
  }

  // ── Changer le mot de passe ────────────────────────────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' })
      return
    }

    setPasswordSaving(true)

    // Vérifier l'ancien mot de passe via une reconnexion silencieuse
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/connexion')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordMsg({ type: 'error', text: 'Mot de passe actuel incorrect.' })
      setPasswordSaving(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setPasswordSaving(false)
  }

  // ── Exporter les données ───────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/gdpr/export')
      if (!res.ok) throw new Error('Erreur lors de l\'export.')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Lisani-mes-donnees.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silencieux — l'utilisateur remarquera que rien n'a été téléchargé
    } finally {
      setExporting(false)
    }
  }

  // ── Supprimer le compte ────────────────────────────────────────────────────
  async function handleDelete() {
    if (deleteInput !== 'SUPPRIMER') {
      setDeleteMsg({ type: 'error', text: 'Tapez exactement "SUPPRIMER" pour confirmer.' })
      return
    }

    setDeleting(true)
    setDeleteMsg(null)

    try {
      const res = await fetch('/api/gdpr/delete', { method: 'DELETE' })
      if (!res.ok) {
        const { error } = await res.json() as { error: string }
        setDeleteMsg({ type: 'error', text: error ?? 'Erreur lors de la suppression.' })
        setDeleting(false)
        return
      }

      await supabase.auth.signOut()
      router.push('/connexion')
    } catch {
      setDeleteMsg({ type: 'error', text: 'Erreur réseau. Réessayez.' })
      setDeleting(false)
    }
  }

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl space-y-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded-lg w-64" />
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold text-white">Paramètres du compte</h1>

      {/* ── Informations du compte ──────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-xl font-bold text-[#1A3A5C]">Informations du compte</h2>

        {/* Email — lecture seule */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">
            Adresse email
          </label>
          <input
            type="email"
            value={parent?.email ?? ''}
            disabled
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">L&apos;adresse email ne peut pas être modifiée.</p>
        </div>

        {/* Modifier le prénom */}
        <form onSubmit={handlePrenomSubmit} className="space-y-3">
          <div>
            <label htmlFor="prenom" className="block text-sm font-semibold text-gray-600 mb-1.5">
              Prénom
            </label>
            <input
              id="prenom"
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]"
            />
          </div>
          {prenomMsg && (
            <p className={`text-sm ${prenomMsg.type === 'success' ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
              {prenomMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={prenomSaving}
            className="px-5 py-2.5 bg-[#1A3A5C] text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50 transition-opacity"
          >
            {prenomSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>

        {/* Changer le mot de passe */}
        <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="text-base font-bold text-[#1A3A5C]">Changer le mot de passe</h3>
          <div>
            <label htmlFor="current-password" className="block text-sm font-semibold text-gray-600 mb-1.5">
              Mot de passe actuel
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-semibold text-gray-600 mb-1.5">
              Nouveau mot de passe
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-600 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]"
            />
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
              {passwordMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="px-5 py-2.5 bg-[#1A3A5C] text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50 transition-opacity"
          >
            {passwordSaving ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </section>

      {/* ── Mes données (RGPD) ──────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-xl font-bold text-[#1A3A5C]">Mes données (RGPD)</h2>
        <p className="text-sm text-gray-600">
          Conformément au RGPD, vous pouvez télécharger l&apos;ensemble de vos données Lisani
          (profil, enfants, progressions, sessions).
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-3 bg-[#1A3A5C] text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50 transition-opacity"
        >
          <span>📥</span>
          <span>{exporting ? 'Préparation…' : 'Exporter mes données'}</span>
        </button>
        <p className="text-xs text-gray-400">
          Reçois un fichier JSON avec toutes tes données Lisani.
        </p>
      </section>

      {/* ── Zone danger ─────────────────────────────────────────────────────── */}
      <section className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-[#E74C3C]">Zone danger</h2>
        <div className="bg-white border border-red-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-gray-900">Supprimer mon compte définitivement</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            ⚠️ <strong>Cette action est irréversible.</strong> Tous vos enfants et leurs
            progressions seront supprimés définitivement. Aucune récupération n&apos;est possible.
          </p>
          <div className="space-y-2">
            <label htmlFor="delete-confirm" className="block text-sm font-semibold text-gray-700">
              Pour confirmer, tapez <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-[#E74C3C]">SUPPRIMER</span>
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 font-mono"
            />
          </div>
          {deleteMsg && (
            <p className="text-sm text-[#E74C3C]">{deleteMsg.text}</p>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting || deleteInput !== 'SUPPRIMER'}
            className="w-full px-5 py-3 bg-[#E74C3C] text-white font-bold rounded-xl text-sm min-h-[48px] disabled:opacity-40 transition-opacity"
          >
            {deleting ? 'Suppression en cours…' : 'Supprimer définitivement'}
          </button>
        </div>
      </section>
    </div>
  )
}
