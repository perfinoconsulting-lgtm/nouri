"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const schema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  rgpd: z.boolean().refine(val => val === true, 'Vous devez accepter la politique de confidentialité'),
  newsletter: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema)
  })

  // Calcul de la force du mot de passe
  const passwordValue = watch('password', '')
  const calculateStrength = (pass: string) => {
    let score = 0
    if (pass.length > 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return score
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)
    
    // Inscription Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          prenom: data.prenom,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    // Le profil parent est inséré manuellement s'il n'y a pas de trigger BD
    if (authData.user) {
      await supabase.from('parents').insert({
        id: authData.user.id,
        email: data.email,
        prenom: data.prenom
      })
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a192f] p-4 relative overflow-hidden">
      {/* Étoiles décoratives de fond */}
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-[#0a192f] to-[#0a192f]"></div>
      
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl max-w-lg w-full relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">NourAl<span className="text-accent">.</span></h1>
          <p className="text-gray-500">Créez votre compte parent gratuit</p>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-primary">Prénom</label>
            <input {...register('prenom')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="Votre prénom" />
            {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-primary">Email</label>
            <input type="email" {...register('email')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="votre@email.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-primary">Mot de passe</label>
            <input type="password" {...register('password')} onChange={(e) => {
              register('password').onChange(e)
              setPasswordStrength(calculateStrength(e.target.value))
            }} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="••••••••" />
            {/* Indicateur de force */}
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${passwordStrength >= i ? 'bg-success' : 'bg-gray-200'}`}></div>
              ))}
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-primary">Confirmer le mot de passe</label>
            <input type="password" {...register('confirmPassword')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="••••••••" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3">
              <input type="checkbox" {...register('rgpd')} className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent" />
              <span className="text-sm text-gray-600">J'accepte la <Link href="/politique" className="text-accent hover:underline">politique de confidentialité</Link> concernant mes données et celles de mes enfants.*</span>
            </label>
            {errors.rgpd && <p className="text-red-500 text-xs ml-8">{errors.rgpd.message}</p>}

            <label className="flex items-start gap-3">
              <input type="checkbox" {...register('newsletter')} className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent" />
              <span className="text-sm text-gray-600">Je souhaite recevoir des astuces d'apprentissage et les nouveautés NourAl.</span>
            </label>
          </div>

          <button disabled={isLoading} className="w-full py-4 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent/90 transition shadow-md disabled:opacity-50 mt-4">
            {isLoading ? 'Création en cours...' : 'Créer mon compte gratuit'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Déjà un compte ? <Link href="/connexion" className="text-primary font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
