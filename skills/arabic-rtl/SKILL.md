# Skill : Arabic RTL

## Quand lire ce skill
Avant tout composant ou page affichant du texte arabe.

## Font obligatoire
```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');

.arabic {
  font-family: 'Noto Naskh Arabic', serif;
  direction: rtl;
  text-align: center;
  font-display: swap;
}
```

## tailwind.config.ts
```typescript
fontFamily: {
  arabic: ["'Noto Naskh Arabic'", 'serif'],
  baloo: ["'Baloo 2'", 'cursive'],
},
```

## Tailles de texte par contexte
| Contexte            | Taille   | Poids |
|---------------------|----------|-------|
| Grande lettre (jeu) | 4–7rem   | 400   |
| Mot exemple         | 1.8–2rem | 400   |
| Phrase              | 1.4rem   | 400   |
| Syllabe             | 2.5rem   | 700   |
| Verset coranique    | 1.8rem   | 400   |
| Label carte         | 1rem     | 400   |

## Composant ArabicText — À créer UNE SEULE FOIS
```tsx
// components/arabic/ArabicText.tsx
'use client'

interface Props {
  text: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  weight?: 'normal' | 'bold'
  color?: string
  onClick?: () => void
  className?: string
}

const sizes = {
  sm:  'text-xl',
  md:  'text-3xl',
  lg:  'text-5xl',
  xl:  'text-7xl',
  '2xl': 'text-9xl',
}

export function ArabicText({
  text, size = 'md', weight = 'normal', color, onClick, className
}: Props) {
  return (
    <span
      dir="rtl"
      className={`
        font-arabic
        ${sizes[size]}
        ${weight === 'bold' ? 'font-bold' : 'font-normal'}
        ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        ${className ?? ''}
      `}
      style={{
        fontFamily: "'Noto Naskh Arabic', serif",
        direction: 'rtl',
        ...(color ? { color } : {}),
      }}
      onClick={onClick}
    >
      {text}
    </span>
  )
}
```

## Fonction TTS — À créer UNE SEULE FOIS
```typescript
// lib/arabic-tts.ts
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

// Taux recommandés par contexte :
// Lettre isolée        : rate = 0.8
// Syllabe              : rate = 0.75
// Mot                  : rate = 0.75
// Phrase               : rate = 0.7
// Verset coranique     : rate = 0.65
```

## Harakat — Table de référence
| Harakat  | Symbole Unicode | Son            | Exemple |
|----------|-----------------|----------------|---------|
| Fatha    | َ  (U+064E)     | "a"            | بَ = ba |
| Kasra    | ِ  (U+0650)     | "i"            | بِ = bi |
| Damma    | ُ  (U+064F)     | "ou"           | بُ = bou |
| Sukun    | ْ  (U+0652)     | (rien)         | بْ = b  |
| Shadda   | ّ  (U+0651)     | (doublement)   | بّ = bb |
| Tanwin F | ً  (U+064B)     | "an"           | كِتَابًا |
| Tanwin K | ٍ  (U+064D)     | "in"           | |
| Tanwin D | ٌ  (U+064C)     | "oun"          | |

## Règles RTL — OBLIGATOIRES
```tsx
// ✅ CORRECT
<div dir="rtl" style={{ direction: 'rtl' }}>
  <span style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
    بِسْمِ اللَّهِ
  </span>
</div>

// ❌ INTERDIT — ne jamais faire
<p className="text-left">بِسْمِ اللَّهِ</p>  // text-left sur texte arabe
<span>{ar.substring(0, 3)}</span>              // couper une string arabe avec substr
<p>{ar.split('').reverse().join('')}</p>       // inverser manuellement
```

## Affichage mixte arabe + français
```tsx
// Quand on mélange arabe et français sur la même ligne
// Toujours des wrappers SÉPARÉS pour chaque langue

// ✅ CORRECT
<div className="flex flex-col items-center gap-2">
  <ArabicText text="بَيْت" size="lg" color="#F5A623" />
  <span className="font-baloo text-white text-sm">maison</span>
</div>

// ❌ INTERDIT — ne jamais mélanger dans le même conteneur RTL
<p dir="rtl">بَيْت - maison</p>
```

## Lettre surlignée dans un mot
```tsx
// Surligner la lettre cible dans un mot arabe
// Exemple : surligner le ب dans بَيْت

function highlightLetterInWord(word: string, targetLetter: string): JSX.Element {
  const parts = word.split('')
  return (
    <span dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
      {parts.map((char, i) => (
        char === targetLetter
          ? <span key={i} style={{ color: '#F5A623', fontSize: '1.2em' }}>{char}</span>
          : <span key={i}>{char}</span>
      ))}
    </span>
  )
}
```

## Formes des lettres — Rappel
| Position | Exemple (ب) | Règle |
|----------|-------------|-------|
| Isolée   | ب           | Lettre seule |
| Début    | بـ          | Connectée à la suivante |
| Milieu   | ـبـ         | Connectée des deux côtés |
| Fin      | ـب          | Connectée à la précédente |

La font Noto Naskh Arabic gère ces formes **automatiquement**.
Ne jamais essayer de les recréer manuellement.

## Canvas — Texte arabe dans un canvas HTML
```typescript
// Pour afficher la lettre guide dans WritingCanvas
function drawArabicGuide(
  ctx: CanvasRenderingContext2D,
  letter: string,
  canvas: HTMLCanvasElement,
  opacity = 0.12
): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = '#F5A623'
  // IMPORTANT : la font doit être chargée avant d'être utilisée dans canvas
  ctx.font = `150px 'Noto Naskh Arabic'`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, canvas.width / 2, canvas.height / 2 + 10)
  ctx.restore()
}

// Vérifier que la font est chargée avant de dessiner
document.fonts.ready.then(() => {
  drawArabicGuide(ctx, 'ب', canvas)
})
```

## Verset coranique — Règles spéciales
```tsx
// Les textes coraniques ont des règles supplémentaires :
// 1. Ne JAMAIS modifier un seul caractère (harakat incluses)
// 2. Ne JAMAIS tronquer avec substring/slice
// 3. Taille minimale : 1.4rem pour que les harakat soient lisibles
// 4. Toujours afficher le texte complet d'un verset
// 5. Numéro de verset en style arabe : ﴿١﴾ ﴿٢﴾ etc.

// ✅ CORRECT — affichage d'un verset
<div className="flex flex-col items-center gap-3 p-6">
  <span
    dir="rtl"
    className="font-arabic text-3xl text-center leading-loose"
    style={{ fontFamily: "'Noto Naskh Arabic', serif" }}
  >
    قُلْ هُوَ اللَّهُ أَحَدٌ
  </span>
  <span className="text-[#F5A623] text-sm font-baloo">
    ﴿١﴾
  </span>
</div>
```

## Preload font dans layout.tsx
```tsx
// app/layout.tsx — OBLIGATOIRE pour éviter le flash de font
<head>
  <link
    rel="preload"
    href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap"
    as="style"
  />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Baloo+2:wght@400;600;800&display=swap"
  />
</head>
```

## Pièges fréquents à éviter
| Piège | Problème | Solution |
|-------|----------|----------|
| `text-left` sur texte arabe | Alignement cassé | Toujours `text-center` ou `text-right` |
| `substring()` sur une string arabe | Coupe les harakat | Utiliser le texte complet depuis les données |
| Font non préchargée | Flash de font générique | `<link rel="preload">` dans layout.tsx |
| `touch-action: none` sur tout le body | Bloque le scroll | Seulement sur le canvas de dessin |
| Mélanger RTL et LTR dans un flex | Layout cassé sur Safari | Wrappers séparés |
| Canvas sans `document.fonts.ready` | Lettre guide manquante | Attendre le chargement de la font |
| Taille < 1.4rem pour les sourates | Harakat illisibles | Respecter les tailles minimales du tableau |