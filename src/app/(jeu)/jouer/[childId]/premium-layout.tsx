import { redirect } from 'next/navigation'
import { getPremiumChildAccess } from '@/lib/premium-access'

interface PremiumModuleLayoutProps {
  children: React.ReactNode
  params: Promise<{ childId: string }>
}

export default async function PremiumModuleLayout({
  children,
  params,
}: PremiumModuleLayoutProps) {
  const { childId } = await params
  const access = await getPremiumChildAccess(childId)

  if (!access.allowed) {
    if (access.reason === 'unauthenticated') {
      redirect('/connexion')
    }

    if (access.reason === 'forbidden') {
      redirect('/dashboard')
    }

    redirect(`/jouer/${childId}?premium=required`)
  }

  return <>{children}</>
}
