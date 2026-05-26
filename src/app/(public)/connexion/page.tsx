"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe'),
  remember: z.boolean().optional()
})

type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      if (authError.message === 'Invalid login credentials') {
        setError('Email ou mot de passe incorrect.')
      } else if (authError.message === 'Email not confirmed') {
        setError('Email non confirmé — vérifiez votre boîte mail.')
      } else {
        setError(authError.message)
      }
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1A3A5C] mb-2">Bon retour</h1>
          <p className="text-gray-500">Connectez-vous à votre espace parent</p>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#1A3A5C]">Email</label>
            <input type="email" {...register('email')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#F5A623] outline-none transition" placeholder="votre@email.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-[#1A3A5C]">Mot de passe</label>
              <Link href="/reset-password" name="reset-password-link" className="text-sm text-[#F5A623] hover:underline font-medium">Oublié ?</Link>
            </div>
            <input type="password" {...register('password')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#F5A623] outline-none transition" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('remember')} className="w-5 h-5 rounded border-gray-300 text-[#1A3A5C] focus:ring-[#1A3A5C]" />
            <span className="text-sm text-gray-600 font-medium">Rester connecté</span>
          </label>

          <button disabled={isLoading} className="w-full py-4 bg-[#1A3A5C] text-white rounded-2xl font-bold text-lg hover:bg-[#1A3A5C]/90 transition shadow-md disabled:opacity-50">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-500 text-sm">
          Pas encore de compte ? <Link href="/inscription" className="text-[#F5A623] font-bold hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
