const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Syllables lists
const SYLLABES = [
  // 1. ALIF
  { id: "a", lettre_ar: "ا", voyelle: "fatha", ar: "أَ", transliteration: "a", fr: "a" },
  { id: "i", lettre_ar: "ا", voyelle: "kasra", ar: "إِ", transliteration: "i", fr: "i" },
  { id: "ou", lettre_ar: "ا", voyelle: "damma", ar: "أُ", transliteration: "ou", fr: "ou" },
  { id: "a_sukun", lettre_ar: "ا", voyelle: "sukun", ar: "أْ", transliteration: "a", fr: "a" },
  // 2. WAW
  { id: "wa", lettre_ar: "و", voyelle: "fatha", ar: "وَ", transliteration: "wa", fr: "wa" },
  { id: "wi", lettre_ar: "و", voyelle: "kasra", ar: "وِ", transliteration: "wi", fr: "wi" },
  { id: "wou", lettre_ar: "و", voyelle: "damma", ar: "وُ", transliteration: "wou", fr: "wou" },
  { id: "w_sukun", lettre_ar: "و", voyelle: "sukun", ar: "وْ", transliteration: "w", fr: "w" },
  // 3. RA
  { id: "ra", lettre_ar: "ر", voyelle: "fatha", ar: "رَ", transliteration: "ra", fr: "ra" },
  { id: "ri", lettre_ar: "ر", voyelle: "kasra", ar: "رِ", transliteration: "ri", fr: "ri" },
  { id: "rou", lettre_ar: "ر", voyelle: "damma", ar: "رُ", transliteration: "rou", fr: "rou" },
  { id: "r_sukun", lettre_ar: "ر", voyelle: "sukun", ar: "رْ", transliteration: "r", fr: "r" },
  // 4. ZAY
  { id: "za", lettre_ar: "ز", voyelle: "fatha", ar: "زَ", transliteration: "za", fr: "za" },
  { id: "zi", lettre_ar: "ز", voyelle: "kasra", ar: "زِ", transliteration: "zi", fr: "zi" },
  { id: "zou", lettre_ar: "ز", voyelle: "damma", ar: "زُ", transliteration: "zou", fr: "zou" },
  { id: "z_sukun", lettre_ar: "ز", voyelle: "sukun", ar: "زْ", transliteration: "z", fr: "z" },
  // 5. BA
  { id: "ba", lettre_ar: "ب", voyelle: "fatha", ar: "بَ", transliteration: "ba", fr: "ba" },
  { id: "bi", lettre_ar: "ب", voyelle: "kasra", ar: "بِ", transliteration: "bi", fr: "bi" },
  { id: "bou", lettre_ar: "ب", voyelle: "damma", ar: "بُ", transliteration: "bou", fr: "bou" },
  { id: "b_sukun", lettre_ar: "ب", voyelle: "sukun", ar: "بْ", transliteration: "b", fr: "b" },
  // 6. TA
  { id: "ta", lettre_ar: "ت", voyelle: "fatha", ar: "تَ", transliteration: "ta", fr: "ta" },
  { id: "ti", lettre_ar: "ت", voyelle: "kasra", ar: "تِ", transliteration: "ti", fr: "ti" },
  { id: "tou", lettre_ar: "ت", voyelle: "damma", ar: "تُ", transliteration: "tou", fr: "tou" },
  { id: "t_sukun", lettre_ar: "ت", voyelle: "sukun", ar: "تْ", transliteration: "t", fr: "t" },
  // 7. THA
  { id: "tha", lettre_ar: "ث", voyelle: "fatha", ar: "ثَ", transliteration: "tha", fr: "tha" },
  { id: "thi", lettre_ar: "ث", voyelle: "kasra", ar: "ثِ", transliteration: "thi", fr: "thi" },
  { id: "thou", lettre_ar: "ث", voyelle: "damma", ar: "ثُ", transliteration: "thou", fr: "thou" },
  { id: "th_sukun", lettre_ar: "ث", voyelle: "sukun", ar: "ثْ", transliteration: "th", fr: "th" },
  // 8. JIM
  { id: "dja", lettre_ar: "ج", voyelle: "fatha", ar: "جَ", transliteration: "dja", fr: "dja" },
  { id: "dji", lettre_ar: "ج", voyelle: "kasra", ar: "جِ", transliteration: "dji", fr: "dji" },
  { id: "djou", lettre_ar: "ج", voyelle: "damma", ar: "جُ", transliteration: "djou", fr: "djou" },
  { id: "dj_sukun", lettre_ar: "ج", voyelle: "sukun", ar: "جْ", transliteration: "dj", fr: "dj" },
  // 9. HA
  { id: "hha", lettre_ar: "ح", voyelle: "fatha", ar: "حَ", transliteration: "ha", fr: "ha" },
  { id: "hhi", lettre_ar: "ح", voyelle: "kasra", ar: "حِ", transliteration: "hi", fr: "hi" },
  { id: "hhou", lettre_ar: "ح", voyelle: "damma", ar: "حُ", transliteration: "hou", fr: "hou" },
  { id: "hh_sukun", lettre_ar: "ح", voyelle: "sukun", ar: "حْ", transliteration: "h", fr: "h" },
  // 10. KHA
  { id: "kha", lettre_ar: "خ", voyelle: "fatha", ar: "خَ", transliteration: "kh", fr: "kh" },
  { id: "khi", lettre_ar: "خ", voyelle: "kasra", ar: "خِ", transliteration: "khi", fr: "khi" },
  { id: "khou", lettre_ar: "خ", voyelle: "damma", ar: "خُ", transliteration: "khou", fr: "khou" },
  { id: "kh_sukun", lettre_ar: "خ", voyelle: "sukun", ar: "خْ", transliteration: "kh", fr: "kh" },
  // 11. SIN
  { id: "sa", lettre_ar: "س", voyelle: "fatha", ar: "سَ", transliteration: "sa", fr: "sa" },
  { id: "si", lettre_ar: "س", voyelle: "kasra", ar: "سِ", transliteration: "si", fr: "si" },
  { id: "sou", lettre_ar: "س", voyelle: "damma", ar: "سُ", transliteration: "sou", fr: "sou" },
  { id: "s_sukun", lettre_ar: "س", voyelle: "sukun", ar: "سْ", transliteration: "s", fr: "s" },
  // 12. SHIN
  { id: "cha", lettre_ar: "ش", voyelle: "fatha", ar: "شَ", transliteration: "cha", fr: "cha" },
  { id: "chi", lettre_ar: "ش", voyelle: "kasra", ar: "شِ", transliteration: "chi", fr: "chi" },
  { id: "chou", lettre_ar: "ش", voyelle: "damma", ar: "شُ", transliteration: "chou", fr: "chou" },
  { id: "ch_sukun", lettre_ar: "ش", voyelle: "sukun", ar: "شْ", transliteration: "ch", fr: "ch" },
  // 13. SAD
  { id: "ssa", lettre_ar: "ص", voyelle: "fatha", ar: "صَ", transliteration: "ṣa", fr: "ṣa" },
  { id: "ssi", lettre_ar: "ص", voyelle: "kasra", ar: "صِ", transliteration: "ṣi", fr: "ṣi" },
  { id: "ssou", lettre_ar: "ص", voyelle: "damma", ar: "صُ", transliteration: "ṣou", fr: "ṣou" },
  { id: "ss_sukun", lettre_ar: "ص", voyelle: "sukun", ar: "صْ", transliteration: "ṣ", fr: "ṣ" },
  // 14. DAD
  { id: "dda", lettre_ar: "ض", voyelle: "fatha", ar: "ضَ", transliteration: "ḍa", fr: "ḍa" },
  { id: "ddi", lettre_ar: "ض", voyelle: "kasra", ar: "ضِ", transliteration: "ḍi", fr: "ḍi" },
  { id: "ddou", lettre_ar: "ض", voyelle: "damma", ar: "ضُ", transliteration: "ḍou", fr: "ḍou" },
  { id: "dd_sukun", lettre_ar: "ض", voyelle: "sukun", ar: "ضْ", transliteration: "ḍ", fr: "ḍ" },
  // 15. TAA (Emphatique)
  { id: "tta", lettre_ar: "ط", voyelle: "fatha", ar: "طَ", transliteration: "ṭa", fr: "ṭa" },
  { id: "tti", lettre_ar: "ط", voyelle: "kasra", ar: "طِ", transliteration: "ṭi", fr: "ṭi" },
  { id: "ttou", lettre_ar: "ط", voyelle: "damma", ar: "طُ", transliteration: "ṭou", fr: "ṭou" },
  { id: "tt_sukun", lettre_ar: "ط", voyelle: "sukun", ar: "طْ", transliteration: "ṭ", fr: "ṭ" },
  // 16. ZAA (Emphatique)
  { id: "zza", lettre_ar: "ظ", voyelle: "fatha", ar: "ظَ", transliteration: "ẓa", fr: "ẓa" },
  { id: "zzi", lettre_ar: "ظ", voyelle: "kasra", ar: "ظِ", transliteration: "ẓi", fr: "ẓi" },
  { id: "zzou", lettre_ar: "ظ", voyelle: "damma", ar: "ظُ", transliteration: "ẓou", fr: "ẓou" },
  { id: "zz_sukun", lettre_ar: "ظ", voyelle: "sukun", ar: "ظْ", transliteration: "ẓ", fr: "ẓ" },
  // 17. AYN
  { id: "aa", lettre_ar: "ع", voyelle: "fatha", ar: "عَ", transliteration: "a'", fr: "a'" },
  { id: "ii", lettre_ar: "ع", voyelle: "kasra", ar: "عِ", transliteration: "i'", fr: "i'" },
  { id: "oou", lettre_ar: "ع", voyelle: "damma", ar: "عُ", transliteration: "ou'", fr: "ou'" },
  { id: "a_sukun_ayn", lettre_ar: "ع", voyelle: "sukun", ar: "عْ", transliteration: "a'", fr: "a'" },
  // 18. GHAYN
  { id: "gha", lettre_ar: "غ", voyelle: "fatha", ar: "غَ", transliteration: "gha", fr: "gha" },
  { id: "ghi", lettre_ar: "غ", voyelle: "kasra", ar: "غِ", transliteration: "ghi", fr: "ghi" },
  { id: "ghou", lettre_ar: "غ", voyelle: "damma", ar: "غُ", transliteration: "ghou", fr: "ghou" },
  { id: "gh_sukun", lettre_ar: "غ", voyelle: "sukun", ar: "غْ", transliteration: "gh", fr: "gh" },
  // 19. FAA
  { id: "fa", lettre_ar: "ف", voyelle: "fatha", ar: "فَ", transliteration: "fa", fr: "fa" },
  { id: "fi", lettre_ar: "ف", voyelle: "kasra", ar: "فِ", transliteration: "fi", fr: "fi" },
  { id: "fou", lettre_ar: "ف", voyelle: "damma", ar: "فُ", transliteration: "fou", fr: "fou" },
  { id: "f_sukun", lettre_ar: "ف", voyelle: "sukun", ar: "فْ", transliteration: "f", fr: "f" },
  // 20. QAAF
  { id: "qa", lettre_ar: "ق", voyelle: "fatha", ar: "قَ", transliteration: "qa", fr: "qa" },
  { id: "qi", lettre_ar: "ق", voyelle: "kasra", ar: "قِ", transliteration: "qi", fr: "qi" },
  { id: "qou", lettre_ar: "ق", voyelle: "damma", ar: "قُ", transliteration: "qou", fr: "qou" },
  { id: "q_sukun", lettre_ar: "ق", voyelle: "sukun", ar: "قْ", transliteration: "q", fr: "q" },
  // 21. KAAF
  { id: "ka", lettre_ar: "ك", voyelle: "fatha", ar: "كَ", transliteration: "ka", fr: "ka" },
  { id: "ki", lettre_ar: "ك", voyelle: "kasra", ar: "كِ", transliteration: "ki", fr: "ki" },
  { id: "kou", lettre_ar: "ك", voyelle: "damma", ar: "كُ", transliteration: "kou", fr: "kou" },
  { id: "k_sukun", lettre_ar: "ك", voyelle: "sukun", ar: "كْ", transliteration: "k", fr: "k" },
  // 22. LAAM
  { id: "la", lettre_ar: "ل", voyelle: "fatha", ar: "لَ", transliteration: "la", fr: "la" },
  { id: "li", lettre_ar: "ل", voyelle: "kasra", ar: "لِ", transliteration: "li", fr: "li" },
  { id: "lou", lettre_ar: "ل", voyelle: "damma", ar: "لُ", transliteration: "lou", fr: "lou" },
  { id: "l_sukun", lettre_ar: "ل", voyelle: "sukun", ar: "لْ", transliteration: "l", fr: "l" },
  // 23. MIIM
  { id: "ma", lettre_ar: "م", voyelle: "fatha", ar: "مَ", transliteration: "ma", fr: "ma" },
  { id: "mi", lettre_ar: "م", voyelle: "kasra", ar: "مِ", transliteration: "mi", fr: "mi" },
  { id: "mou", lettre_ar: "م", voyelle: "damma", ar: "مُ", transliteration: "mou", fr: "mou" },
  { id: "m_sukun", lettre_ar: "م", voyelle: "sukun", ar: "مْ", transliteration: "m", fr: "m" },
  // 24. NUUN
  { id: "na", lettre_ar: "ن", voyelle: "fatha", ar: "نَ", transliteration: "na", fr: "na" },
  { id: "ni", lettre_ar: "ن", voyelle: "kasra", ar: "نِ", transliteration: "ni", fr: "ni" },
  { id: "nou", lettre_ar: "ن", voyelle: "damma", ar: "نُ", transliteration: "nou", fr: "nou" },
  { id: "n_sukun", lettre_ar: "ن", voyelle: "sukun", ar: "نْ", transliteration: "n", fr: "n" },
  // 25. HAA (Léger)
  { id: "ha_light", lettre_ar: "ه", voyelle: "fatha", ar: "هَ", transliteration: "ha", fr: "ha" },
  { id: "hi_light", lettre_ar: "ه", voyelle: "kasra", ar: "هِ", transliteration: "hi", fr: "hi" },
  { id: "hou_light", lettre_ar: "ه", voyelle: "damma", ar: "هُ", transliteration: "hou", fr: "hou" },
  { id: "h_sukun_light", lettre_ar: "ه", voyelle: "sukun", ar: "هْ", transliteration: "h", fr: "h" },
  // 26. YAA
  { id: "ya", lettre_ar: "ي", voyelle: "fatha", ar: "يَ", transliteration: "ya", fr: "ya" },
  { id: "yi", lettre_ar: "ي", voyelle: "kasra", ar: "يِ", transliteration: "yi", fr: "yi" },
  { id: "you", lettre_ar: "ي", voyelle: "damma", ar: "يُ", transliteration: "you", fr: "you" },
  { id: "y_sukun", lettre_ar: "ي", voyelle: "sukun", ar: "يْ", transliteration: "y", fr: "y" },
  // 27. DAAL
  { id: "da", lettre_ar: "د", voyelle: "fatha", ar: "دَ", transliteration: "da", fr: "da" },
  { id: "di", lettre_ar: "د", voyelle: "kasra", ar: "دِ", transliteration: "di", fr: "di" },
  { id: "dou", lettre_ar: "د", voyelle: "damma", ar: "دُ", transliteration: "dou", fr: "dou" },
  { id: "d_sukun", lettre_ar: "د", voyelle: "sukun", ar: "دْ", transliteration: "d", fr: "d" },
  // 28. DHAAL
  { id: "dha", lettre_ar: "ذ", voyelle: "fatha", ar: "ذَ", transliteration: "dha", fr: "dha" },
  { id: "dhi", lettre_ar: "ذ", voyelle: "kasra", ar: "ذِ", transliteration: "dhi", fr: "dhi" },
  { id: "dhou", lettre_ar: "ذ", voyelle: "damma", ar: "ذُ", transliteration: "dhou", fr: "dhou" },
  { id: "dh_sukun", lettre_ar: "ذ", voyelle: "sukun", ar: "ذْ", transliteration: "dh", fr: "dh" },
];

const WORDS = [
  { ar: 'كِتَاب', fr: 'livre', emoji: '📚', transliteration: 'kitab' },
  { ar: 'بَيْت', fr: 'maison', emoji: '🏠', transliteration: 'bayt' },
  { ar: 'سَمَك', fr: 'poisson', emoji: '🐟', transliteration: 'samak' },
  { ar: 'قَمَر', fr: 'lune', emoji: '🌙', transliteration: 'qamar' },
  { ar: 'مَاء', fr: 'eau', emoji: '💧', transliteration: 'maa' },
  { ar: 'أَسَد', fr: 'lion', emoji: '🦁', transliteration: 'asad' },
];

async function main() {
  console.log("Upserting modules...");
  
  // 1. Module Syllables
  const { data: modSyll, error: errSyll } = await supabase
    .from('content_modules')
    .upsert({
      slug: 'syllabes',
      titre: 'Les Syllabes',
      titre_ar: 'المقاطع الصوتية',
      description: 'Apprendre à lire les syllabes avec les voyelles courtes',
      is_premium: true,
      ordre: 2
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (errSyll) throw errSyll;
  console.log("Module Syllables upserted, ID:", modSyll.id);

  // 2. Module Words
  const { data: modWords, error: errWords } = await supabase
    .from('content_modules')
    .upsert({
      slug: 'mots',
      titre: 'Les Mots',
      titre_ar: 'الكلمات',
      description: 'Apprendre à assembler et lire des mots simples',
      is_premium: true,
      ordre: 3
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (errWords) throw errWords;
  console.log("Module Words upserted, ID:", modWords.id);

  // 3. Insert Syllables content items
  console.log(`Inserting ${SYLLABES.length} syllables...`);
  const syllableItems = SYLLABES.map((s, idx) => ({
    module_id: modSyll.id,
    type: 'syllabe',
    contenu_ar: s.id, // match progress API query
    contenu_fr: s.fr,
    transliteration: s.transliteration,
    emoji: '',
    ordre: idx + 1,
    metadata: {
      voyelle: s.voyelle,
      lettre_ar: s.lettre_ar,
      ar: s.ar
    }
  }));

  const { error: insSyllErr } = await supabase
    .from('content_items')
    .upsert(syllableItems, { onConflict: 'module_id, type, contenu_ar' }); // note: we can use a select and insert if conflict policy doesn't match

  if (insSyllErr) {
    console.error("Upserting syllables directly failed, trying simple insert...");
    // Fallback delete and insert
    await supabase.from('content_items').delete().eq('module_id', modSyll.id);
    const { error: insSyllErr2 } = await supabase.from('content_items').insert(syllableItems);
    if (insSyllErr2) throw insSyllErr2;
  }
  console.log("Syllables inserted successfully!");

  // 4. Insert Words content items
  console.log(`Inserting ${WORDS.length} words...`);
  const wordItems = WORDS.map((w, idx) => ({
    module_id: modWords.id,
    type: 'mot',
    contenu_ar: w.ar, // match progress API query (itemId.replace('mot_', ''))
    contenu_fr: w.fr,
    transliteration: w.transliteration,
    emoji: w.emoji,
    ordre: idx + 1,
    metadata: {}
  }));

  const { error: insWordsErr } = await supabase
    .from('content_items')
    .upsert(wordItems, { onConflict: 'module_id, type, contenu_ar' });

  if (insWordsErr) {
    console.error("Upserting words directly failed, trying simple insert...");
    // Fallback delete and insert
    await supabase.from('content_items').delete().eq('module_id', modWords.id);
    const { error: insWordsErr2 } = await supabase.from('content_items').insert(wordItems);
    if (insWordsErr2) throw insWordsErr2;
  }
  console.log("Words inserted successfully!");
  console.log("Database seeded successfully!");
}

main().catch(e => {
  console.error("Fatal Error seeding:", e);
  process.exit(1);
});
