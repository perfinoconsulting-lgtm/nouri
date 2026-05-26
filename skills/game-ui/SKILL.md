# Skill : Game UI (Interface Jeu Enfant)

## Quand lire ce skill
Avant tout composant de l'espace jeu (/jouer/*).

## Principes fondamentaux
- JAMAIS de navigation adulte dans l'espace jeu
- Zones tactiles MINIMUM 48×48px — idéalement 80px+
- Textes courts, simples, en français
- Animations de récompense fréquentes
- Couleurs vives sur fond nuit étoilé
- L'enfant ne doit JAMAIS se retrouver bloqué

## Fond nuit étoilé obligatoire
```css
/* Fond pour tout l'espace jeu */
background: radial-gradient(ellipse at top, #0d2137 0%, #1A3A5C 70%);
```

## Sons Web Audio API (pas de fichiers externes)
```typescript
function playSound(freq: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
  osc.start()
  osc.stop(ctx.currentTime + duration / 1000)
}

// Utilisation :
// Correct : playSound(523, 200, 'sine')    → Do5, doux
// Mauvais : playSound(220, 300, 'sawtooth') → La3, désagréable
// Milestone : [523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 150), i * 150))
```

## Confettis (canvas plein écran)
```typescript
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  canvas.style.display = 'block'
  const colors = ['#F5A623', '#FF6B9D', '#00C9B1', '#9B59B6', '#27AE60', '#FFD97D']
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
  }))
  // Animation loop...
}
```

## Animations CSS récompense
```css
@keyframes correctBounce {
  0%, 100% { transform: scale(1); }
  40% { transform: scale(1.15); }
}
@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  80% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
```

## QCM — règles de design
- Boutons options : min-height 80px, border-radius 16px
- Bonne réponse : bg-green-500 + correctBounce + son correct
- Mauvaise réponse : bg-red-500 + wrongShake + son mauvais
- Après réponse : désactiver TOUS les boutons
- Afficher bonne réponse en vert même si mauvaise choisie
- Pause 800ms → question suivante automatique

## Canvas dessin — 3 couches obligatoires
```
canvas-guide  : lettre fantôme, opacity 0.12, JAMAIS mesuré
canvas-path   : pointillés dorés du tracé à suivre
canvas-draw   : tracé enfant, seul mesuré pour la validation
```

## Validation dessin — 3 critères
1. Couverture pixels > 4% (sur canvas-draw uniquement)
2. Distribution spatiale : >= 2 zones sur grille 3×3
3. Trait continu >= 30px

## Coordonnées tactiles mobiles
```typescript
function getCanvasCoords(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const src = 'touches' in e ? e.touches[0] : e
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top) * scaleY,
  }
}
// IMPORTANT : touch-action: none sur le canvas-draw UNIQUEMENT
// Ne pas bloquer le scroll de la page entière
```

## Système d'étoiles
- Correct rapide (< 3s) + série >= 5 : +3 ⭐
- Correct rapide : +2 ⭐
- Correct normal : +1 ⭐
- Incorrect : +0 ⭐

## Messages d'encouragement (enfants 4-8 ans)
```typescript
const MESSAGES_CORRECT = [
  "Excellent ! Tu le sais par cœur ! 🌟",
  "Bravo ! Continue comme ça ! ⭐",
  "Super ! Tu es fort(e) ! 💪",
  "MachAllah ! Fantastique ! 🎉",
]
const MESSAGES_WRONG = [
  "Pas grave ! On va réviser ensemble 🔄",
  "Presque ! Regarde bien... 👀",
  "Continue d'essayer ! 💪",
]
```
