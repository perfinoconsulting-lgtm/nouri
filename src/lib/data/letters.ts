/**
 * lib/data/letters.ts — Données des 28 lettres arabes pour Lisani
 *
 * Ordre pédagogique par similarité de forme (8 groupes).
 * Tous les textes arabes incluent les harakat (voyelles courtes) pour l'apprentissage.
 */

export interface Letter {
  index: number
  ar: string              // lettre arabe avec harakat
  nom: string             // nom français : Alif, Bâ, Tâ…
  son: string             // description du son en français
  transliteration: string // a/â, b, t, th, dj…
  emoji: string           // emoji représentatif
  exAr: string            // mot exemple en arabe avec harakat
  exFr: string            // traduction française
  formes: {
    isol: string          // forme isolée
    debut: string         // forme début de mot
    milieu: string        // forme milieu de mot
    fin: string           // forme fin de mot
  }
  posEx: {
    debut:  { ar: string; fr: string }
    milieu: { ar: string; fr: string }
    fin:    { ar: string; fr: string }
  }
  svgKey: number          // index pour l'illustration (0-27, 99=pas de SVG)
  group: number           // groupe pédagogique 1-8
}

// ─── GROUPE 1 — Traits simples (ا و ر ز) ───────────────────────────────────

const alif: Letter = {
  index: 0,
  ar: 'أَ',
  nom: 'Alif',
  son: 'A comme dans "ami"',
  transliteration: 'a / â',
  emoji: '🦁',
  exAr: 'أَسَد',
  exFr: 'Lion',
  formes: {
    isol: 'ا',
    debut: 'ا',
    milieu: 'ـا',
    fin: 'ـا',
  },
  posEx: {
    debut:  { ar: 'أَب',    fr: 'Père' },
    milieu: { ar: 'بَاب',   fr: 'Porte' },
    fin:    { ar: 'سَمَا',  fr: 'Ciel' },
  },
  svgKey: 0,
  group: 1,
}

const waw: Letter = {
  index: 1,
  ar: 'وَ',
  nom: 'Wâw',
  son: 'W comme dans "wagon" ou ou long',
  transliteration: 'w / û',
  emoji: '🌹',
  exAr: 'وَرْدَة',
  exFr: 'Rose',
  formes: {
    isol: 'و',
    debut: 'و',
    milieu: 'ـو',
    fin: 'ـو',
  },
  posEx: {
    debut:  { ar: 'وَلَد',  fr: 'Garçon' },
    milieu: { ar: 'نَوْم',  fr: 'Sommeil' },
    fin:    { ar: 'دَعَو',  fr: 'Ils ont appelé' },
  },
  svgKey: 1,
  group: 1,
}

const ra: Letter = {
  index: 2,
  ar: 'رَ',
  nom: 'Râ',
  son: 'R roulé léger',
  transliteration: 'r',
  emoji: '🍞',
  exAr: 'رَغِيف',
  exFr: 'Pain',
  formes: {
    isol: 'ر',
    debut: 'ر',
    milieu: 'ـر',
    fin: 'ـر',
  },
  posEx: {
    debut:  { ar: 'رَأْس',  fr: 'Tête' },
    milieu: { ar: 'بَرْد',  fr: 'Froid' },
    fin:    { ar: 'بَحْر',  fr: 'Mer' },
  },
  svgKey: 2,
  group: 1,
}

const zay: Letter = {
  index: 3,
  ar: 'زَ',
  nom: 'Zây',
  son: 'Z comme dans "zèbre"',
  transliteration: 'z',
  emoji: '🌸',
  exAr: 'زَهْرَة',
  exFr: 'Fleur',
  formes: {
    isol: 'ز',
    debut: 'ز',
    milieu: 'ـز',
    fin: 'ـز',
  },
  posEx: {
    debut:  { ar: 'زَيْت',  fr: 'Huile' },
    milieu: { ar: 'مِيزَان', fr: 'Balance' },
    fin:    { ar: 'خُبْز',  fr: 'Pain' },
  },
  svgKey: 3,
  group: 1,
}

// ─── GROUPE 2 — Même forme, points différents (ب ت ث) ──────────────────────

const ba: Letter = {
  index: 4,
  ar: 'بَ',
  nom: 'Bâ',
  son: 'B comme dans "bateau"',
  transliteration: 'b',
  emoji: '🚪',
  exAr: 'بَاب',
  exFr: 'Porte',
  formes: {
    isol: 'ب',
    debut: 'بـ',
    milieu: 'ـبـ',
    fin: 'ـب',
  },
  posEx: {
    debut:  { ar: 'بَيْت',  fr: 'Maison' },
    milieu: { ar: 'كِتَاب', fr: 'Livre' },
    fin:    { ar: 'كَلْب',  fr: 'Chien' },
  },
  svgKey: 4,
  group: 2,
}

const ta: Letter = {
  index: 5,
  ar: 'تَ',
  nom: 'Tâ',
  son: 'T comme dans "table"',
  transliteration: 't',
  emoji: '🍎',
  exAr: 'تُفَّاحَة',
  exFr: 'Pomme',
  formes: {
    isol: 'ت',
    debut: 'تـ',
    milieu: 'ـتـ',
    fin: 'ـت',
  },
  posEx: {
    debut:  { ar: 'تَمْر',  fr: 'Dattes' },
    milieu: { ar: 'كِتَاب', fr: 'Livre' },
    fin:    { ar: 'بَيْت',  fr: 'Maison' },
  },
  svgKey: 5,
  group: 2,
}

const tha: Letter = {
  index: 6,
  ar: 'ثَ',
  nom: 'Thâ',
  son: 'TH anglais comme dans "think"',
  transliteration: 'th',
  emoji: '🐍',
  exAr: 'ثُعْبَان',
  exFr: 'Serpent',
  formes: {
    isol: 'ث',
    debut: 'ثـ',
    milieu: 'ـثـ',
    fin: 'ـث',
  },
  posEx: {
    debut:  { ar: 'ثَلْج',  fr: 'Neige' },
    milieu: { ar: 'مَثَل',  fr: 'Proverbe' },
    fin:    { ar: 'حَدِيث', fr: 'Hadith / Parole' },
  },
  svgKey: 6,
  group: 2,
}

// ─── GROUPE 3 — Corps rond (ج ح خ) ─────────────────────────────────────────

const jim: Letter = {
  index: 7,
  ar: 'جَ',
  nom: 'Djîm',
  son: 'DJ comme dans "djinn"',
  transliteration: 'dj',
  emoji: '🐪',
  exAr: 'جَمَل',
  exFr: 'Chameau',
  formes: {
    isol: 'ج',
    debut: 'جـ',
    milieu: 'ـجـ',
    fin: 'ـج',
  },
  posEx: {
    debut:  { ar: 'جَبَل',  fr: 'Montagne' },
    milieu: { ar: 'شَجَرَة', fr: 'Arbre' },
    fin:    { ar: 'تَاج',   fr: 'Couronne' },
  },
  svgKey: 7,
  group: 3,
}

const ha: Letter = {
  index: 8,
  ar: 'حَ',
  nom: 'Hâ',
  son: 'H expiré du fond de la gorge',
  transliteration: 'h (ḥ)',
  emoji: '🐴',
  exAr: 'حِصَان',
  exFr: 'Cheval',
  formes: {
    isol: 'ح',
    debut: 'حـ',
    milieu: 'ـحـ',
    fin: 'ـح',
  },
  posEx: {
    debut:  { ar: 'حَلِيب', fr: 'Lait' },
    milieu: { ar: 'مَحَطَّة', fr: 'Gare / Station' },
    fin:    { ar: 'صُبْح',  fr: 'Matin' },
  },
  svgKey: 8,
  group: 3,
}

const kha: Letter = {
  index: 9,
  ar: 'خَ',
  nom: 'Khâ',
  son: 'KH comme "j" espagnol, son râpeux',
  transliteration: 'kh',
  emoji: '🍞',
  exAr: 'خُبْز',
  exFr: 'Pain',
  formes: {
    isol: 'خ',
    debut: 'خـ',
    milieu: 'ـخـ',
    fin: 'ـخ',
  },
  posEx: {
    debut:  { ar: 'خَرُوف', fr: 'Mouton' },
    milieu: { ar: 'مَخْبَز', fr: 'Boulangerie' },
    fin:    { ar: 'شَيْخ',  fr: 'Cheikh' },
  },
  svgKey: 9,
  group: 3,
}

// ─── GROUPE 4 — Dents de scie (س ش) ─────────────────────────────────────────

const sin: Letter = {
  index: 10,
  ar: 'سَ',
  nom: 'Sîn',
  son: 'S comme dans "soleil"',
  transliteration: 's',
  emoji: '🌟',
  exAr: 'سَمَاء',
  exFr: 'Ciel',
  formes: {
    isol: 'س',
    debut: 'سـ',
    milieu: 'ـسـ',
    fin: 'ـس',
  },
  posEx: {
    debut:  { ar: 'سَمَكَة', fr: 'Poisson' },
    milieu: { ar: 'مَسْجِد', fr: 'Mosquée' },
    fin:    { ar: 'شَمْس',  fr: 'Soleil' },
  },
  svgKey: 10,
  group: 4,
}

const shin: Letter = {
  index: 11,
  ar: 'شَ',
  nom: 'Chîn',
  son: 'CH comme dans "chat"',
  transliteration: 'ch (sh)',
  emoji: '🌳',
  exAr: 'شَجَرَة',
  exFr: 'Arbre',
  formes: {
    isol: 'ش',
    debut: 'شـ',
    milieu: 'ـشـ',
    fin: 'ـش',
  },
  posEx: {
    debut:  { ar: 'شَمْس',  fr: 'Soleil' },
    milieu: { ar: 'عَشِيرَة', fr: 'Tribu' },
    fin:    { ar: 'جَيْش',  fr: 'Armée' },
  },
  svgKey: 11,
  group: 4,
}

// ─── GROUPE 5 — Forme similaire (ص ض) ────────────────────────────────────────

const sad: Letter = {
  index: 12,
  ar: 'صَ',
  nom: 'Sâd',
  son: 'S emphatique prononcé avec la bouche arrondie',
  transliteration: 'ṣ',
  emoji: '🧸',
  exAr: 'صَابُون',
  exFr: 'Savon',
  formes: {
    isol: 'ص',
    debut: 'صـ',
    milieu: 'ـصـ',
    fin: 'ـص',
  },
  posEx: {
    debut:  { ar: 'صَغِير', fr: 'Petit' },
    milieu: { ar: 'مَصْر',  fr: 'Égypte' },
    fin:    { ar: 'قَفَص',  fr: 'Cage' },
  },
  svgKey: 12,
  group: 5,
}

const dad: Letter = {
  index: 13,
  ar: 'ضَ',
  nom: 'Dâd',
  son: 'D emphatique, lettre unique à l\'arabe',
  transliteration: 'ḍ',
  emoji: '💡',
  exAr: 'ضَوْء',
  exFr: 'Lumière',
  formes: {
    isol: 'ض',
    debut: 'ضـ',
    milieu: 'ـضـ',
    fin: 'ـض',
  },
  posEx: {
    debut:  { ar: 'ضَرْب',  fr: 'Frappe' },
    milieu: { ar: 'أَرْض',  fr: 'Terre (dans un mot)' },
    fin:    { ar: 'أَرْض',  fr: 'Terre' },
  },
  svgKey: 13,
  group: 5,
}

// ─── GROUPE 6 — Lettres longues (ط ظ) ────────────────────────────────────────

const ta2: Letter = {
  index: 14,
  ar: 'طَ',
  nom: 'Tâ emphatique',
  son: 'T emphatique, langue contre palais',
  transliteration: 'ṭ',
  emoji: '🐢',
  exAr: 'طَفْل',
  exFr: 'Enfant',
  formes: {
    isol: 'ط',
    debut: 'طـ',
    milieu: 'ـطـ',
    fin: 'ـط',
  },
  posEx: {
    debut:  { ar: 'طَائِر', fr: 'Oiseau' },
    milieu: { ar: 'مَطَار', fr: 'Aéroport' },
    fin:    { ar: 'خَطّ',   fr: 'Ligne / Écriture' },
  },
  svgKey: 14,
  group: 6,
}

const dha: Letter = {
  index: 15,
  ar: 'ظَ',
  nom: 'Dhâ emphatique',
  son: 'TH emphatique comme "the" anglais mais fort',
  transliteration: 'ẓ',
  emoji: '🦌',
  exAr: 'ظَبْي',
  exFr: 'Gazelle',
  formes: {
    isol: 'ظ',
    debut: 'ظـ',
    milieu: 'ـظـ',
    fin: 'ـظ',
  },
  posEx: {
    debut:  { ar: 'ظَلّ',   fr: 'Ombre' },
    milieu: { ar: 'حَظّ',   fr: 'Chance (dans un mot)' },
    fin:    { ar: 'حَظّ',   fr: 'Chance' },
  },
  svgKey: 15,
  group: 6,
}

// ─── GROUPE 7 — Lettres complexes (ع غ) ──────────────────────────────────────

const ayn: Letter = {
  index: 16,
  ar: 'عَ',
  nom: 'Aïn',
  son: 'Son guttural produit dans la gorge, unique à l\'arabe',
  transliteration: 'ʿ',
  emoji: '👁️',
  exAr: 'عَيْن',
  exFr: 'Œil / Source',
  formes: {
    isol: 'ع',
    debut: 'عـ',
    milieu: 'ـعـ',
    fin: 'ـع',
  },
  posEx: {
    debut:  { ar: 'عَسَل',  fr: 'Miel' },
    milieu: { ar: 'مَعَ',   fr: 'Avec' },
    fin:    { ar: 'سَمَع',  fr: 'Il a entendu' },
  },
  svgKey: 16,
  group: 7,
}

const ghayn: Letter = {
  index: 17,
  ar: 'غَ',
  nom: 'Ghaïn',
  son: 'GH comme le "r" parisien grasseyé',
  transliteration: 'gh',
  emoji: '🦅',
  exAr: 'غُرَاب',
  exFr: 'Corbeau',
  formes: {
    isol: 'غ',
    debut: 'غـ',
    milieu: 'ـغـ',
    fin: 'ـغ',
  },
  posEx: {
    debut:  { ar: 'غَنَم',  fr: 'Moutons' },
    milieu: { ar: 'مَغْرِب', fr: 'Maghreb / Coucher du soleil' },
    fin:    { ar: 'دِمَاغ', fr: 'Cerveau' },
  },
  svgKey: 17,
  group: 7,
}

// ─── GROUPE 8 — Lettres restantes (ف ق ك ل م ن ه ي د ذ) ─────────────────────

const fa: Letter = {
  index: 18,
  ar: 'فَ',
  nom: 'Fâ',
  son: 'F comme dans "fleur"',
  transliteration: 'f',
  emoji: '🦋',
  exAr: 'فَرَاشَة',
  exFr: 'Papillon',
  formes: {
    isol: 'ف',
    debut: 'فـ',
    milieu: 'ـفـ',
    fin: 'ـف',
  },
  posEx: {
    debut:  { ar: 'فِيل',   fr: 'Éléphant' },
    milieu: { ar: 'كَنَف',  fr: 'Abri (dans un mot)' },
    fin:    { ar: 'صَيْف',  fr: 'Été' },
  },
  svgKey: 18,
  group: 8,
}

const qaf: Letter = {
  index: 19,
  ar: 'قَ',
  nom: 'Qâf',
  son: 'Q du fond de la gorge, plus profond que le K',
  transliteration: 'q',
  emoji: '🌙',
  exAr: 'قَمَر',
  exFr: 'Lune',
  formes: {
    isol: 'ق',
    debut: 'قـ',
    milieu: 'ـقـ',
    fin: 'ـق',
  },
  posEx: {
    debut:  { ar: 'قَلَم',  fr: 'Crayon' },
    milieu: { ar: 'مَقَام', fr: 'Station spirituelle' },
    fin:    { ar: 'سُوق',   fr: 'Marché' },
  },
  svgKey: 19,
  group: 8,
}

const kaf: Letter = {
  index: 20,
  ar: 'كَ',
  nom: 'Kâf',
  son: 'K comme dans "koala"',
  transliteration: 'k',
  emoji: '📖',
  exAr: 'كِتَاب',
  exFr: 'Livre',
  formes: {
    isol: 'ك',
    debut: 'كـ',
    milieu: 'ـكـ',
    fin: 'ـك',
  },
  posEx: {
    debut:  { ar: 'كَلْب',  fr: 'Chien' },
    milieu: { ar: 'شُكْر',  fr: 'Remerciement' },
    fin:    { ar: 'مَلَك',  fr: 'Ange / Roi' },
  },
  svgKey: 20,
  group: 8,
}

const lam: Letter = {
  index: 21,
  ar: 'لَ',
  nom: 'Lâm',
  son: 'L comme dans "lune"',
  transliteration: 'l',
  emoji: '🔶',
  exAr: 'لَوْن',
  exFr: 'Couleur',
  formes: {
    isol: 'ل',
    debut: 'لـ',
    milieu: 'ـلـ',
    fin: 'ـل',
  },
  posEx: {
    debut:  { ar: 'لَيْل',  fr: 'Nuit' },
    milieu: { ar: 'قَلَم',  fr: 'Crayon' },
    fin:    { ar: 'جَمَل',  fr: 'Chameau' },
  },
  svgKey: 21,
  group: 8,
}

const mim: Letter = {
  index: 22,
  ar: 'مَ',
  nom: 'Mîm',
  son: 'M comme dans "maison"',
  transliteration: 'm',
  emoji: '💧',
  exAr: 'مَاء',
  exFr: 'Eau',
  formes: {
    isol: 'م',
    debut: 'مـ',
    milieu: 'ـمـ',
    fin: 'ـم',
  },
  posEx: {
    debut:  { ar: 'مَدْرَسَة', fr: 'École' },
    milieu: { ar: 'شَمْس',   fr: 'Soleil' },
    fin:    { ar: 'قَلَم',   fr: 'Crayon' },
  },
  svgKey: 22,
  group: 8,
}

const nun: Letter = {
  index: 23,
  ar: 'نَ',
  nom: 'Nûn',
  son: 'N comme dans "nuage"',
  transliteration: 'n',
  emoji: '🌟',
  exAr: 'نَجْمَة',
  exFr: 'Étoile',
  formes: {
    isol: 'ن',
    debut: 'نـ',
    milieu: 'ـنـ',
    fin: 'ـن',
  },
  posEx: {
    debut:  { ar: 'نَهْر',  fr: 'Rivière' },
    milieu: { ar: 'مِنْ',   fr: 'De / Depuis' },
    fin:    { ar: 'ثَمَن',  fr: 'Prix' },
  },
  svgKey: 23,
  group: 8,
}

const ha2: Letter = {
  index: 24,
  ar: 'هَ',
  nom: 'Hâ',
  son: 'H doux comme dans "hello" anglais',
  transliteration: 'h',
  emoji: '🌙',
  exAr: 'هِلَال',
  exFr: 'Croissant de lune',
  formes: {
    isol: 'ه',
    debut: 'هـ',
    milieu: 'ـهـ',
    fin: 'ـه',
  },
  posEx: {
    debut:  { ar: 'هَوَاء', fr: 'Air' },
    milieu: { ar: 'شَهْر',  fr: 'Mois' },
    fin:    { ar: 'وَجْه',  fr: 'Visage' },
  },
  svgKey: 24,
  group: 8,
}

const ya: Letter = {
  index: 25,
  ar: 'يَ',
  nom: 'Yâ',
  son: 'Y comme dans "yaourt" ou î long',
  transliteration: 'y / î',
  emoji: '🤚',
  exAr: 'يَد',
  exFr: 'Main',
  formes: {
    isol: 'ي',
    debut: 'يـ',
    milieu: 'ـيـ',
    fin: 'ـي',
  },
  posEx: {
    debut:  { ar: 'يَوْم',  fr: 'Jour' },
    milieu: { ar: 'بَيْت',  fr: 'Maison' },
    fin:    { ar: 'عَلِي',  fr: 'Ali (prénom)' },
  },
  svgKey: 25,
  group: 8,
}

const dal: Letter = {
  index: 26,
  ar: 'دَ',
  nom: 'Dâl',
  son: 'D comme dans "dune"',
  transliteration: 'd',
  emoji: '🐻',
  exAr: 'دُبّ',
  exFr: 'Ours',
  formes: {
    isol: 'د',
    debut: 'د',
    milieu: 'ـد',
    fin: 'ـد',
  },
  posEx: {
    debut:  { ar: 'دَرْس',  fr: 'Leçon' },
    milieu: { ar: 'وَلَد',  fr: 'Garçon' },
    fin:    { ar: 'مَسْجِد', fr: 'Mosquée' },
  },
  svgKey: 26,
  group: 8,
}

const dhal: Letter = {
  index: 27,
  ar: 'ذَ',
  nom: 'Dhâl',
  son: 'TH sonore comme dans "the" anglais',
  transliteration: 'dh',
  emoji: '🐒',
  exAr: 'ذَكَاء',
  exFr: 'Intelligence',
  formes: {
    isol: 'ذ',
    debut: 'ذ',
    milieu: 'ـذ',
    fin: 'ـذ',
  },
  posEx: {
    debut:  { ar: 'ذَهَب',  fr: 'Or / Il est parti' },
    milieu: { ar: 'هَذَا',  fr: 'Celui-ci' },
    fin:    { ar: 'مَنَاذِج', fr: 'Exemples' },
  },
  svgKey: 27,
  group: 8,
}

// ─── Export principal ────────────────────────────────────────────────────────

/**
 * Les 28 lettres dans l'ordre pédagogique par groupe de formes similaires.
 * Groupe 1 → 2 → 3 → … → 8
 */
export const LETTERS: Letter[] = [
  // Groupe 1 — traits simples
  alif, waw, ra, zay,
  // Groupe 2 — même forme, points différents
  ba, ta, tha,
  // Groupe 3 — corps rond
  jim, ha, kha,
  // Groupe 4 — dents de scie
  sin, shin,
  // Groupe 5 — forme similaire
  sad, dad,
  // Groupe 6 — lettres longues
  ta2, dha,
  // Groupe 7 — lettres complexes
  ayn, ghayn,
  // Groupe 8 — lettres restantes
  fa, qaf, kaf, lam, mim, nun, ha2, ya, dal, dhal,
]

/**
 * Indices dans l'ordre pédagogique recommandé (correspond à LETTERS).
 * Peut être utilisé pour les curricula progressifs.
 */
export const LEARNING_ORDER: number[] = LETTERS.map((l) => l.index)

// ─── Fonctions utilitaires ───────────────────────────────────────────────────

export function getLetterByIndex(i: number): Letter {
  const letter = LETTERS.find((l) => l.index === i)
  if (!letter) throw new Error(`Lettre introuvable pour l'index ${i}`)
  return letter
}

export function getLettersByGroup(group: number): Letter[] {
  return LETTERS.filter((l) => l.group === group)
}

export function getLearningOrderedLetters(): Letter[] {
  return [...LETTERS]
}
