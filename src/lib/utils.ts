import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fusionner les classes TailwindCSS de manière sécurisée
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
