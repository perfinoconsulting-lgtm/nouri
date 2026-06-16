/**
 * lib/drawing-validator.ts — Validateur de dessin pour Lisani
 *
 * Ce module contient les fonctions de validation du tracé sur le canvas de dessin :
 * 1. measureInkCoverage : calcul de la couverture d'encre (pixels dessinés)
 * 2. measureDistribution : calcul de l'étalement du tracé sur une grille 3x3
 * 3. hasMinimumStroke : vérification de la présence d'un tracé continu (BFS 4-connexité)
 * 4. validateDrawing : validation complète avec score et points
 * 5. getCanvasCoords : conversion des coordonnées tactiles/souris adaptées à la taille du canvas
 */

export interface ValidationResult {
  passed: boolean
  score: number
  coverage: number
  distribution: number
  hasStroke: boolean
  feedback: string
  emoji: string
  points: number
}

/**
 * Fonction 1 — Mesure la couverture d'encre du canvas
 * Compte le nombre de pixels avec un canal alpha supérieur à 100.
 */
export function measureInkCoverage(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0

  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  let drawnPixels = 0
  const totalPixels = width * height

  for (let i = 0; i < totalPixels; i++) {
    // data[i * 4 + 3] correspond au canal alpha du pixel
    if (data[i * 4 + 3] > 100) {
      drawnPixels++
    }
  }

  return drawnPixels / totalPixels
}

/**
 * Fonction 2 — Mesure la distribution spatiale du tracé sur une grille 3x3 (9 zones)
 * Retourne le ratio des zones dans lesquelles le tracé est significatif.
 */
export function measureDistribution(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0

  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  const zoneWidth = Math.floor(width / 3)
  const zoneHeight = Math.floor(height / 3)

  let zonesWithDrawing = 0

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let pixels = 0
      const xStart = col * zoneWidth
      const yStart = row * zoneHeight
      const xEnd = col === 2 ? width : (col + 1) * zoneWidth
      const yEnd = row === 2 ? height : (row + 1) * zoneHeight
      
      const zoneArea = (xEnd - xStart) * (yEnd - yStart)

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = (y * width + x) * 4 + 3
          if (data[idx] > 100) {
            pixels++
          }
        }
      }

      // Si la zone contient un tracé > 0.5% de sa surface
      if (pixels > zoneArea * 0.005) {
        zonesWithDrawing++
      }
    }
  }

  return zonesWithDrawing / 9
}

/**
 * Fonction 3 — Vérifie si le canvas contient un tracé continu d'au moins 30 pixels
 * Utilise un parcours en largeur (BFS) avec une connexité de 4.
 */
export function hasMinimumStroke(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  const visited = new Uint8Array(width * height)

  const getAlpha = (x: number, y: number): number => {
    return data[(y * width + x) * 4 + 3]
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      // Si le pixel a de l'encre et n'est pas encore visité
      if (visited[idx] === 0 && getAlpha(x, y) > 100) {
        // Lancer un BFS pour mesurer la taille de cette composante connexe
        let count = 0
        const queue: number[] = [idx]
        visited[idx] = 1

        let head = 0
        while (head < queue.length) {
          const currIdx = queue[head++]
          count++

          // Dès qu'on trouve un trait continu de 30 pixels ou plus, c'est bon
          if (count >= 30) {
            return true
          }

          const cx = currIdx % width
          const cy = Math.floor(currIdx / width)

          // 4-connexité (haut, bas, gauche, droite)
          const neighbors = [
            { nx: cx, ny: cy - 1 },
            { nx: cx, ny: cy + 1 },
            { nx: cx - 1, ny: cy },
            { nx: cx + 1, ny: cy }
          ]

          for (const { nx, ny } of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx
              if (visited[nIdx] === 0 && getAlpha(nx, ny) > 100) {
                visited[nIdx] = 1
                queue.push(nIdx)
              }
            }
          }
        }
      }
    }
  }

  return false
}

/**
 * Fonction 4 — Valide le tracé final sur le canvas de dessin
 * Retourne le score, la couverture, la distribution et les encouragements adaptés.
 */
export function validateDrawing(canvas: HTMLCanvasElement): ValidationResult {
  const coverage = measureInkCoverage(canvas)
  const distribution = measureDistribution(canvas)
  const hasStroke = hasMinimumStroke(canvas)

  if (!hasStroke) {
    return {
      passed: false,
      score: 0,
      coverage,
      distribution,
      hasStroke,
      feedback: "Glisse ton doigt pour tracer la lettre ✏️",
      emoji: "😅",
      points: 0
    }
  }

  if (coverage < 0.04) {
    return {
      passed: false,
      score: 0,
      coverage,
      distribution,
      hasStroke,
      feedback: "Continue ! Tu n'as pas assez tracé 📝",
      emoji: "✏️",
      points: 0
    }
  }

  if (distribution < 0.2) {
    return {
      passed: false,
      score: 0,
      coverage,
      distribution,
      hasStroke,
      feedback: "Trace toute la lettre, pas juste un coin !",
      emoji: "🤔",
      points: 0
    }
  }

  // Calcul du score (plafonné à 100)
  const score = Math.min(
    100,
    Math.round(
      Math.min(coverage / 0.15, 1) * 40 +
      distribution * 40 +
      20
    )
  )

  const feedback =
    score >= 80
      ? "Magnifique tracé ! 🌟"
      : score >= 60
      ? "Très bien ! Continue ! ⭐"
      : "Bien essayé ! 💪"

  const points = score >= 80 ? 10 : score >= 60 ? 7 : 5

  return {
    passed: true,
    score,
    coverage,
    distribution,
    hasStroke,
    feedback,
    emoji: "✅",
    points
  }
}

/**
 * Fonction 5 — Convertit les coordonnées tactiles ou de souris locales au canvas
 * Gère le scaling pour le responsive et le touch vs mouse.
 */
export function getCanvasCoords(
  e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  // Déterminer s'il s'agit d'un événement tactile ou souris
  const src = 'touches' in e 
    ? (e.touches.length > 0 ? e.touches[0] : e.changedTouches[0]) 
    : e

  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top) * scaleY
  }
}
