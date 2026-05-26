/**
 * Synthèse vocale arabe via l'API Web Speech.
 * lang="ar-SA" pour une prononciation du Coran proche de l'arabe classique.
 */
export function speakArabic(text: string, rate = 0.8): void {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ar-SA'
  utterance.rate = rate
  utterance.pitch = 1

  // Annuler la lecture en cours avant d'en démarrer une nouvelle
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}
