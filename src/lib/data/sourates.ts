// Textes coraniques selon la transmission Hafs 'an 'Asim — ne jamais modifier un seul caractère

export interface MotCle {
  ar: string
  fr: string
  explication_enfant: string
}

export interface Verset {
  numero: number
  ar: string
  fr: string
  transliteration: string
  mots_cles: MotCle[]
  difficulte: 1 | 2 | 3
}

export interface Sourate {
  numero: number
  slug: string
  nom_ar: string
  nom_fr: string
  nom_transliteration: string
  signification: string
  description_enfant: string
  difficulte: 1 | 2 | 3
  ordre_apprentissage: number
  versets: Verset[]
}

export const SOURATES: Sourate[] = [
  {
    numero: 112,
    slug: "al-ikhlas",
    nom_ar: "الْإِخْلَاص",
    nom_fr: "Al-Ikhlâs",
    nom_transliteration: "Al-Ikhlâs",
    signification: "La sincérité, l'unicité d'Allah",
    description_enfant:
      "Dans cette sourate courte mais très importante, Allah nous explique qu'Il est unique et parfait. Pas de père, pas de fils : Allah est seul et tout le monde a besoin de Lui !",
    difficulte: 1,
    ordre_apprentissage: 1,
    versets: [
      {
        numero: 1,
        ar: "قُلْ هُوَ اللَّهُ أَحَدٌ",
        fr: "Dis : Il est Allah, l'Unique",
        transliteration: "Qoul houwa l-lâhou ahadoun",
        mots_cles: [
          {
            ar: "قُلْ",
            fr: "Dis",
            explication_enfant:
              "Allah demande au Prophète ﷺ d'annoncer la vérité à tout le monde",
          },
          {
            ar: "أَحَدٌ",
            fr: "L'Unique",
            explication_enfant:
              "Allah est seul, il n'y a rien ni personne comme Lui dans l'univers entier",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 2,
        ar: "اللَّهُ الصَّمَدُ",
        fr: "Allah est l'Absolu, Celui dont tout le monde a besoin",
        transliteration: "Al-lâhou s-samad",
        mots_cles: [
          {
            ar: "الصَّمَدُ",
            fr: "L'Absolu",
            explication_enfant:
              "Tout le monde a besoin d'Allah, mais Allah n'a besoin de personne ni de rien",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 3,
        ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        fr: "Il n'a pas engendré et n'a pas été engendré",
        transliteration: "Lam yalid wa lam youlad",
        mots_cles: [
          {
            ar: "يَلِدْ",
            fr: "engendrer",
            explication_enfant: "Allah n'a ni fils ni fille",
          },
          {
            ar: "يُولَدْ",
            fr: "être né",
            explication_enfant:
              "Allah n'est pas né, Il a toujours existé et Il existera toujours",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 4,
        ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        fr: "Et nul n'est comparable à Lui",
        transliteration: "Wa lam yakoune lahou koufouwan ahadoun",
        mots_cles: [
          {
            ar: "كُفُوًا",
            fr: "comparable",
            explication_enfant:
              "Personne et rien ne ressemble à Allah ni ne peut être comme Lui",
          },
        ],
        difficulte: 1,
      },
    ],
  },
  {
    numero: 108,
    slug: "al-kawthar",
    nom_ar: "الْكَوْثَر",
    nom_fr: "Al-Kawthar",
    nom_transliteration: "Al-Kawthar",
    signification: "L'abondance",
    description_enfant:
      "Dans cette sourate, Allah annonce au Prophète Muhammad ﷺ qu'Il lui a donné beaucoup de bien, dont une rivière au Paradis. En échange, le Prophète ﷺ doit prier et remercier Allah.",
    difficulte: 1,
    ordre_apprentissage: 2,
    versets: [
      {
        numero: 1,
        ar: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
        fr: "Nous t'avons accordé l'abondance",
        transliteration: "Innâ a'taynâka l-kawthar",
        mots_cles: [
          {
            ar: "أَعْطَيْنَاكَ",
            fr: "Nous t'avons donné",
            explication_enfant:
              "Allah parle directement au Prophète Muhammad ﷺ et lui annonce un cadeau immense",
          },
          {
            ar: "الْكَوْثَرَ",
            fr: "l'abondance",
            explication_enfant:
              "Al-Kawthar c'est beaucoup de bien, et aussi une magnifique rivière au Paradis",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 2,
        ar: "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
        fr: "Prie donc ton Seigneur et sacrifie",
        transliteration: "Fasalli li rabbika wanhar",
        mots_cles: [
          {
            ar: "فَصَلِّ",
            fr: "prie",
            explication_enfant:
              "Faire la prière (salat) pour remercier Allah de Son cadeau",
          },
          {
            ar: "وَانْحَرْ",
            fr: "sacrifie",
            explication_enfant:
              "Offrir un sacrifice pour montrer sa gratitude à Allah lors des grandes fêtes",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 3,
        ar: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
        fr: "C'est celui qui te hait qui sera sans postérité",
        transliteration: "Inna châni'aka houwa l-abtar",
        mots_cles: [
          {
            ar: "شَانِئَكَ",
            fr: "celui qui te hait",
            explication_enfant:
              "Ceux qui détestaient le Prophète ﷺ et lui voulaient du mal",
          },
          {
            ar: "الْأَبْتَرُ",
            fr: "sans postérité",
            explication_enfant:
              "Sans continuation ni bien durable — c'est eux qui n'auront rien, pas le Prophète ﷺ",
          },
        ],
        difficulte: 1,
      },
    ],
  },
  {
    numero: 114,
    slug: "an-nas",
    nom_ar: "النَّاس",
    nom_fr: "An-Nâs",
    nom_transliteration: "An-Nâs",
    signification: "Les hommes",
    description_enfant:
      "Cette sourate nous apprend à demander la protection d'Allah contre les mauvaises pensées et les mauvais esprits qui essaient de nous éloigner du bien.",
    difficulte: 2,
    ordre_apprentissage: 3,
    versets: [
      {
        numero: 1,
        ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        fr: "Dis : Je cherche refuge auprès du Seigneur des hommes",
        transliteration: "Qoul a'oûdhou bi rabbi n-nâs",
        mots_cles: [
          {
            ar: "أَعُوذُ",
            fr: "Je cherche refuge",
            explication_enfant:
              "Demander à Allah de nous protéger comme on court vers un abri quand il y a du danger",
          },
          {
            ar: "النَّاسِ",
            fr: "les hommes",
            explication_enfant: "Tous les êtres humains du monde entier",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 2,
        ar: "مَلِكِ النَّاسِ",
        fr: "Le Roi des hommes",
        transliteration: "Maliki n-nâs",
        mots_cles: [
          {
            ar: "مَلِكِ",
            fr: "Le Roi",
            explication_enfant:
              "Allah est le vrai Roi de tous les hommes, même des rois et des présidents",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 3,
        ar: "إِلَٰهِ النَّاسِ",
        fr: "Le Dieu des hommes",
        transliteration: "Ilâhi n-nâs",
        mots_cles: [
          {
            ar: "إِلَٰهِ",
            fr: "Le Dieu",
            explication_enfant:
              "Le seul qui mérite qu'on L'adore et qu'on Lui demande de l'aide",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 4,
        ar: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
        fr: "Contre le mal du tentateur qui se cache",
        transliteration: "Min charri l-waswâsi l-khannâs",
        mots_cles: [
          {
            ar: "الْوَسْوَاسِ",
            fr: "le tentateur",
            explication_enfant:
              "Celui qui souffle de mauvaises pensées dans notre tête pour qu'on fasse des bêtises",
          },
          {
            ar: "الْخَنَّاسِ",
            fr: "le caché",
            explication_enfant:
              "Il se cache et s'enfuit quand on dit « Bismillah » ou qu'on se souvient d'Allah",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 5,
        ar: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
        fr: "Qui souffle le mal dans les cœurs des hommes",
        transliteration: "Al-ladhî youwaswisou fî soudoûri n-nâs",
        mots_cles: [
          {
            ar: "يُوَسْوِسُ",
            fr: "souffle des mauvaises pensées",
            explication_enfant:
              "Comme un murmure très doux qui essaie de te faire oublier ce qui est bien",
          },
          {
            ar: "صُدُورِ",
            fr: "cœurs / poitrines",
            explication_enfant:
              "L'endroit dans notre corps où naissent nos pensées et nos sentiments",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 6,
        ar: "مِنَ الْجِنَّةِ وَالنَّاسِ",
        fr: "Qu'il vienne des djinns ou des hommes",
        transliteration: "Mina l-djinnati wa n-nâs",
        mots_cles: [
          {
            ar: "الْجِنَّةِ",
            fr: "les djinns",
            explication_enfant:
              "Des êtres créés par Allah à partir du feu, qu'on ne peut pas voir",
          },
          {
            ar: "وَالنَّاسِ",
            fr: "et les hommes",
            explication_enfant:
              "Le mal peut venir des djinns ou des humains autour de nous — Allah nous protège des deux",
          },
        ],
        difficulte: 2,
      },
    ],
  },
  {
    numero: 113,
    slug: "al-falaq",
    nom_ar: "الْفَلَق",
    nom_fr: "Al-Falaq",
    nom_transliteration: "Al-Falaq",
    signification: "L'aube",
    description_enfant:
      "Dans cette sourate, on demande à Allah de nous protéger contre tous les dangers invisibles : l'obscurité de la nuit, la magie et la jalousie des autres.",
    difficulte: 2,
    ordre_apprentissage: 4,
    versets: [
      {
        numero: 1,
        ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
        fr: "Dis : Je cherche refuge auprès du Seigneur de l'aube",
        transliteration: "Qoul a'oûdhou bi rabbi l-falaq",
        mots_cles: [
          {
            ar: "الْفَلَقِ",
            fr: "l'aube",
            explication_enfant:
              "Le moment où la nuit se fend pour laisser entrer la lumière du matin",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 2,
        ar: "مِن شَرِّ مَا خَلَقَ",
        fr: "Contre le mal de ce qu'Il a créé",
        transliteration: "Min charri mâ khalaq",
        mots_cles: [
          {
            ar: "شَرِّ",
            fr: "le mal",
            explication_enfant: "Tout ce qui peut nous faire du tort ou nous blesser",
          },
          {
            ar: "خَلَقَ",
            fr: "Il a créé",
            explication_enfant:
              "Tout ce qu'Allah a créé dans l'univers, y compris les dangers",
          },
        ],
        difficulte: 1,
      },
      {
        numero: 3,
        ar: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
        fr: "Et contre le mal de l'obscurité quand elle s'étend",
        transliteration: "Wa min charri ghâsiqin idhâ waqab",
        mots_cles: [
          {
            ar: "غَاسِقٍ",
            fr: "l'obscurité",
            explication_enfant:
              "La nuit très noire quand il n'y a plus de lumière du tout",
          },
          {
            ar: "وَقَبَ",
            fr: "s'étend",
            explication_enfant: "Quand le noir envahit et couvre tout autour de nous",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 4,
        ar: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
        fr: "Et contre le mal de celles qui soufflent sur les nœuds",
        transliteration: "Wa min charri n-naffâthâti fi l-'ouqad",
        mots_cles: [
          {
            ar: "النَّفَّاثَاتِ",
            fr: "celles qui soufflent",
            explication_enfant:
              "Ceux qui pratiquent la magie en soufflant sur des nœuds — Allah nous en protège",
          },
          {
            ar: "الْعُقَدِ",
            fr: "les nœuds",
            explication_enfant:
              "Des nœuds utilisés dans la sorcellerie qu'Allah nous ordonne d'éviter",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 5,
        ar: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        fr: "Et contre le mal de l'envieux quand il envie",
        transliteration: "Wa min charri hâsidin idhâ hasad",
        mots_cles: [
          {
            ar: "حَاسِدٍ",
            fr: "l'envieux",
            explication_enfant:
              "Quelqu'un qui te veut du mal parce qu'il est jaloux de toi",
          },
          {
            ar: "حَسَدَ",
            fr: "envier",
            explication_enfant:
              "La jalousie est un mauvais sentiment qui peut faire du tort — Allah nous en protège",
          },
        ],
        difficulte: 2,
      },
    ],
  },
  {
    numero: 1,
    slug: "al-fatiha",
    nom_ar: "الْفَاتِحَة",
    nom_fr: "Al-Fâtiha",
    nom_transliteration: "Al-Fâtiha",
    signification: "L'ouverture",
    description_enfant:
      "C'est la sourate la plus importante du Coran ! On la récite dans chaque rak'a de la prière. Elle est comme une conversation entre nous et Allah : on Le loue et on Lui demande de nous guider sur le bon chemin.",
    difficulte: 3,
    ordre_apprentissage: 5,
    versets: [
      {
        numero: 1,
        ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
        transliteration: "Bismi l-lâhi r-rahmâni r-rahîm",
        mots_cles: [
          {
            ar: "بِسْمِ",
            fr: "Au nom de",
            explication_enfant:
              "On commence tout ce qu'on fait par le nom d'Allah pour avoir Sa bénédiction",
          },
          {
            ar: "الرَّحْمَٰنِ",
            fr: "le Tout Miséricordieux",
            explication_enfant:
              "Allah donne Ses bienfaits à tout le monde, même à ceux qui ne croient pas en Lui",
          },
          {
            ar: "الرَّحِيمِ",
            fr: "le Très Miséricordieux",
            explication_enfant:
              "Allah pardonne spécialement aux croyants — Il nous aime encore plus que nos parents",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 2,
        ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        fr: "Toute louange appartient à Allah, Seigneur des mondes",
        transliteration: "Al-hamdu lil-lâhi rabbi l-'âlamîn",
        mots_cles: [
          {
            ar: "الْحَمْدُ",
            fr: "la louange",
            explication_enfant:
              "Dire qu'Allah est parfait et que tout ce qui est beau et bien vient de Lui",
          },
          {
            ar: "الْعَالَمِينَ",
            fr: "les mondes",
            explication_enfant:
              "Tout l'univers : la Terre, le ciel, les étoiles, les anges, les hommes et les djinns",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 3,
        ar: "الرَّحْمَٰنِ الرَّحِيمِ",
        fr: "Le Tout Miséricordieux, le Très Miséricordieux",
        transliteration: "Ar-rahmâni r-rahîm",
        mots_cles: [
          {
            ar: "الرَّحْمَٰنِ",
            fr: "le Tout Miséricordieux",
            explication_enfant:
              "Allah répète Ses beaux noms pour qu'on comprenne à quel point Il est bon avec nous",
          },
          {
            ar: "الرَّحِيمِ",
            fr: "le Très Miséricordieux",
            explication_enfant:
              "Allah nous aime tellement qu'Il nous pardonne encore et encore quand on fait des erreurs",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 4,
        ar: "مَٰلِكِ يَوْمِ الدِّينِ",
        fr: "Maître du Jour du Jugement",
        transliteration: "Mâliki yawmi d-dîn",
        mots_cles: [
          {
            ar: "مَٰلِكِ",
            fr: "Maître, Roi",
            explication_enfant:
              "Allah est le seul vrai maître, surtout le Jour où chacun recevra ce qu'il mérite",
          },
          {
            ar: "الدِّينِ",
            fr: "le Jugement",
            explication_enfant:
              "Le grand jour où Allah regardera tout ce que nous avons fait et sera juste avec tout le monde",
          },
        ],
        difficulte: 2,
      },
      {
        numero: 5,
        ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        fr: "C'est Toi seul que nous adorons et c'est Toi seul dont nous implorons l'aide",
        transliteration: "Iyyâka na'boudu wa iyyâka nasta'în",
        mots_cles: [
          {
            ar: "نَعْبُدُ",
            fr: "nous adorons",
            explication_enfant:
              "On fait la prière, le jeûne et tout ce qu'Allah aime uniquement pour Lui",
          },
          {
            ar: "نَسْتَعِينُ",
            fr: "nous demandons l'aide",
            explication_enfant:
              "Quand on a besoin d'aide, on la demande d'abord à Allah avant tout le monde",
          },
        ],
        difficulte: 3,
      },
      {
        numero: 6,
        ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
        fr: "Guide-nous dans le droit chemin",
        transliteration: "Ihdina s-sirâta l-moustaqîm",
        mots_cles: [
          {
            ar: "اهْدِنَا",
            fr: "guide-nous",
            explication_enfant:
              "Demander à Allah de nous montrer le bon chemin comme une lampe dans l'obscurité",
          },
          {
            ar: "الصِّرَاطَ الْمُسْتَقِيمَ",
            fr: "le droit chemin",
            explication_enfant:
              "Le chemin qui mène au bonheur dans cette vie et au Paradis dans l'autre vie",
          },
        ],
        difficulte: 3,
      },
      {
        numero: 7,
        ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
        fr: "Le chemin de ceux que Tu as comblés de bienfaits, non celui de ceux qui ont mérité Ta colère ni des égarés",
        transliteration:
          "Sirâta l-ladhîna an'amta 'alayhim ghayri l-maghdoûbi 'alayhim wa lâ d-dâllîn",
        mots_cles: [
          {
            ar: "أَنْعَمْتَ عَلَيْهِمْ",
            fr: "que Tu as comblés de bienfaits",
            explication_enfant:
              "Les prophètes, les croyants sincères et tous ceux qu'Allah a récompensés",
          },
          {
            ar: "الْمَغْضُوبِ",
            fr: "ceux qui méritent la colère",
            explication_enfant:
              "Ceux qui connaissaient la vérité mais l'ont refusée exprès",
          },
          {
            ar: "الضَّالِّينَ",
            fr: "les égarés",
            explication_enfant:
              "Ceux qui se sont perdus et ne savent plus quel est le bon chemin",
          },
        ],
        difficulte: 3,
      },
    ],
  },
]

export function getSourateBySlug(slug: string): Sourate | undefined {
  return SOURATES.find((s) => s.slug === slug)
}

export function getVersetByIndex(slug: string, index: number): Verset | undefined {
  const sourate = getSourateBySlug(slug)
  if (!sourate) return undefined
  return sourate.versets[index]
}
