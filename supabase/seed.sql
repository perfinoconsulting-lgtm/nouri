-- supabase/seed.sql

-- 1. Insérer le module de l'alphabet (ID fixé pour lier les enfants)
INSERT INTO content_modules (id, slug, titre, titre_ar, description, niveau_requis, is_premium, ordre)
VALUES 
  ('m0000000-0000-0000-0000-000000000001', 'alphabet', 'L''alphabet', 'الحروف', 'Apprendre les 28 lettres de l''alphabet arabe', 1, false, 1)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insérer les 28 lettres de l'alphabet arabe
INSERT INTO content_items (module_id, type, contenu_ar, contenu_fr, transliteration, son, emoji, ordre, metadata) VALUES
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ا', 'Alif', 'alif', 'Allonge la voyelle', '🅰️', 1, '{"formes": {"isol": "ا", "debut": "ا", "milieu": "ـا", "fin": "ـا"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ب', 'Baa', 'baa', 'Comme B en français', '🏠', 2, '{"formes": {"isol": "ب", "debut": "بـ", "milieu": "ـبـ", "fin": "ـب"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ت', 'Taa', 'taa', 'Comme T en français', '🍎', 3, '{"formes": {"isol": "ت", "debut": "تـ", "milieu": "ـتـ", "fin": "ـت"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ث', 'Thaa', 'thaa', 'Comme TH dans "think" en anglais', '🦊', 4, '{"formes": {"isol": "ث", "debut": "ثـ", "milieu": "ـثـ", "fin": "ـث"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ج', 'Jiim', 'jiim', 'Comme J dans "djinn"', '🐪', 5, '{"formes": {"isol": "ج", "debut": "جـ", "milieu": "ـجـ", "fin": "ـج"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ح', 'Haa', 'haa', 'H expiré du fond de la gorge', '🐴', 6, '{"formes": {"isol": "ح", "debut": "حـ", "milieu": "ـحـ", "fin": "ـح"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'خ', 'Khaa', 'khaa', 'Comme Jota en espagnol ou CH dans "Bach"', '🍞', 7, '{"formes": {"isol": "خ", "debut": "خـ", "milieu": "ـخـ", "fin": "ـخ"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'د', 'Daal', 'daal', 'Comme D en français', '🐻', 8, '{"formes": {"isol": "د", "debut": "د", "milieu": "ـد", "fin": "ـد"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ذ', 'Dhaal', 'dhaal', 'Comme TH dans "this" en anglais', '🐺', 9, '{"formes": {"isol": "ذ", "debut": "ذ", "milieu": "ـذ", "fin": "ـذ"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ر', 'Raa', 'raa', 'R roulé', '🪶', 10, '{"formes": {"isol": "ر", "debut": "ر", "milieu": "ـر", "fin": "ـر"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ز', 'Zaay', 'zaay', 'Comme Z en français', '🦒', 11, '{"formes": {"isol": "ز", "debut": "ز", "milieu": "ـز", "fin": "ـز"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'س', 'Siin', 'siin', 'Comme S dans "poisson"', '🐟', 12, '{"formes": {"isol": "س", "debut": "سـ", "milieu": "ـسـ", "fin": "ـس"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ش', 'Shiin', 'shiin', 'Comme CH dans "chat"', '☀️', 13, '{"formes": {"isol": "ش", "debut": "شـ", "milieu": "ـشـ", "fin": "ـش"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ص', 'Saad', 'saad', 'S emphatique', '🦅', 14, '{"formes": {"isol": "ص", "debut": "صـ", "milieu": "ـصـ", "fin": "ـص"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ض', 'Daad', 'daad', 'D emphatique', '🐸', 15, '{"formes": {"isol": "ض", "debut": "ضـ", "milieu": "ـضـ", "fin": "ـض"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ط', 'Taa', 'taa2', 'T emphatique', '🦚', 16, '{"formes": {"isol": "ط", "debut": "طـ", "milieu": "ـطـ", "fin": "ـط"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ظ', 'Zaa', 'zaa', 'DH emphatique', '🦮', 17, '{"formes": {"isol": "ظ", "debut": "ظـ", "milieu": "ـظـ", "fin": "ـظ"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ع', 'Ayn', 'ayn', 'Son guttural', '👁️', 18, '{"formes": {"isol": "ع", "debut": "عـ", "milieu": "ـعـ", "fin": "ـع"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'غ', 'Ghayn', 'ghayn', 'R grasseyé', '☁️', 19, '{"formes": {"isol": "غ", "debut": "غـ", "milieu": "ـغـ", "fin": "ـغ"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ف', 'Faa', 'faa', 'Comme F en français', '🐘', 20, '{"formes": {"isol": "ف", "debut": "فـ", "milieu": "ـفـ", "fin": "ـف"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ق', 'Qaaf', 'qaaf', 'K emphatique de la gorge', '🐒', 21, '{"formes": {"isol": "ق", "debut": "قـ", "milieu": "ـقـ", "fin": "ـق"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ك', 'Kaaf', 'kaaf', 'Comme K en français', '🐕', 22, '{"formes": {"isol": "ك", "debut": "كـ", "milieu": "ـكـ", "fin": "ـك"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ل', 'Laam', 'laam', 'Comme L en français', '🍋', 23, '{"formes": {"isol": "ل", "debut": "لـ", "milieu": "ـلـ", "fin": "ـل"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'م', 'Miim', 'miim', 'Comme M en français', '🍌', 24, '{"formes": {"isol": "م", "debut": "مـ", "milieu": "ـمـ", "fin": "ـم"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ن', 'Nuun', 'nuun', 'Comme N en français', '🐝', 25, '{"formes": {"isol": "ن", "debut": "نـ", "milieu": "ـنـ", "fin": "ـن"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ه', 'Haa', 'haa2', 'H léger du fond de la gorge', '🎁', 26, '{"formes": {"isol": "ه", "debut": "هـ", "milieu": "ـهـ", "fin": "ـه"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'و', 'Waaw', 'waaw', 'Comme W dans "oui"', '🌹', 27, '{"formes": {"isol": "و", "debut": "و", "milieu": "ـو", "fin": "ـو"}}'),
('m0000000-0000-0000-0000-000000000001', 'lettre', 'ي', 'Yaa', 'yaa', 'Comme Y dans "yaourt"', '✋', 28, '{"formes": {"isol": "ي", "debut": "يـ", "milieu": "ـيـ", "fin": "ـي"}}');
