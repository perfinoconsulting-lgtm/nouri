-- supabase/schema.sql

-- Activer l'extension pgcrypto pour gen_random_uuid() si nécessaire
CREATE EXTENSION IF NOT EXISTS pgcrypto;

---------------------------------------------
-- 1. Table PARENTS
---------------------------------------------
CREATE TABLE parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  prenom text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  stripe_customer_id text UNIQUE,
  onboarding_completed boolean DEFAULT false,
  referral_code text UNIQUE
);

---------------------------------------------
-- 2. Table CHILDREN
---------------------------------------------
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES parents(id) ON DELETE CASCADE,
  prenom text NOT NULL,
  age int CHECK (age >= 3 AND age <= 15),
  avatar text, -- Peut stocker un emoji, une couleur ou une URL
  niveau int DEFAULT 1 CHECK (niveau >= 1 AND niveau <= 5),
  created_at timestamptz DEFAULT now(),
  last_active timestamptz
);

---------------------------------------------
-- 3. Table SUBSCRIPTIONS
---------------------------------------------
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES parents(id) ON DELETE CASCADE,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text, -- active, canceled, past_due, trialing
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

---------------------------------------------
-- 4. Table REFERRALS
---------------------------------------------
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES parents(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES parents(id) ON DELETE CASCADE UNIQUE,
  code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'canceled')),
  reward_applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

---------------------------------------------
-- 5. Table CONTENT_MODULES
---------------------------------------------
CREATE TABLE content_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, -- ex: 'alphabet', 'syllabes', 'mots'
  titre text NOT NULL,
  titre_ar text,
  description text,
  niveau_requis int DEFAULT 1,
  is_premium boolean DEFAULT false,
  ordre int,
  created_at timestamptz DEFAULT now()
);

---------------------------------------------
-- 6. Table CONTENT_ITEMS
---------------------------------------------
CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES content_modules(id) ON DELETE CASCADE,
  type text, -- 'lettre', 'syllabe', 'mot', 'phrase', 'sourate'
  contenu_ar text NOT NULL,
  contenu_fr text,
  transliteration text,
  son text,
  emoji text,
  svg_key text,
  ordre int,
  metadata jsonb DEFAULT '{}'::jsonb, -- Pour stocker les 4 formes des lettres, ex: {"formes": {"isol": "ا", "debut": "ا", "milieu": "ـا", "fin": "ـا"}}
  created_at timestamptz DEFAULT now()
);

---------------------------------------------
-- 6. Table PROGRESS
---------------------------------------------
CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  item_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  score int DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  attempts int DEFAULT 0,
  correct_answers int DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  next_review timestamptz DEFAULT now(),
  mastered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

---------------------------------------------
-- 7. Table SESSIONS
---------------------------------------------
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds int,
  items_reviewed int DEFAULT 0,
  correct_answers int DEFAULT 0,
  module_slug text
);


---------------------------------------------
-- Triggers pour updated_at
---------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parents_updated_at
BEFORE UPDATE ON parents
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


---------------------------------------------
-- Index pour optimiser les jointures
---------------------------------------------
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_subscriptions_parent_id ON subscriptions(parent_id);
CREATE INDEX idx_subscriptions_child_id ON subscriptions(child_id);
CREATE INDEX idx_parents_referral_code ON parents(referral_code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_content_items_module_id ON content_items(module_id);
CREATE INDEX idx_progress_child_id ON progress(child_id);
CREATE INDEX idx_progress_item_id ON progress(item_id);
CREATE INDEX idx_progress_next_review ON progress(next_review);
CREATE INDEX idx_sessions_child_id ON sessions(child_id);


---------------------------------------------
-- RLS (Row Level Security) Policies
---------------------------------------------
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Note: Par défaut pour l'auth de Supabase, \`auth.uid()\` correspond à \`parents.id\`

-- PARENTS: Un parent ne peut voir et modifier que son propre profil
CREATE POLICY "Les parents peuvent voir leur profil" 
ON parents FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Les parents peuvent créer leur profil"
ON parents FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Les parents peuvent modifier leur profil" 
ON parents FOR UPDATE USING (auth.uid() = id);

-- REFERRALS: Un parent voit les parrainages qui le concernent
CREATE POLICY "Voir ses parrainages"
ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Créer son parrainage"
ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
CREATE POLICY "Modifier ses parrainages"
ON referrals FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- CHILDREN: Un parent gère ses propres enfants
CREATE POLICY "Voir ses enfants" 
ON children FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Modifier ses enfants" 
ON children FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Ajouter des enfants" 
ON children FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Supprimer ses enfants" 
ON children FOR DELETE USING (auth.uid() = parent_id);

-- SUBSCRIPTIONS: En lecture pour le parent
CREATE POLICY "Voir ses abonnements" 
ON subscriptions FOR SELECT USING (auth.uid() = parent_id);

-- CONTENT (Modules & Items): Lecture publique pour tout utilisateur connecté (voire non connecté selon l'app)
CREATE POLICY "Lecture modules pour tous" 
ON content_modules FOR SELECT USING (true);
CREATE POLICY "Lecture items pour tous" 
ON content_items FOR SELECT USING (true);

-- PROGRESS: Le parent a accès à la progression de SES enfants
CREATE POLICY "Voir progression enfants" 
ON progress FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
CREATE POLICY "Modifier progression enfants" 
ON progress FOR ALL USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- SESSIONS: Accès limité aux enfants du parent
CREATE POLICY "Voir sessions enfants" 
ON sessions FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
CREATE POLICY "Créer sessions enfants" 
ON sessions FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
CREATE POLICY "Modifier sessions enfants" 
ON sessions FOR UPDATE USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);


---------------------------------------------
-- 8. Table MILESTONE_NOTIFICATIONS
---------------------------------------------
CREATE TABLE milestone_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, milestone_type)
);

ALTER TABLE milestone_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_own" ON milestone_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE id = child_id AND parent_id = auth.uid())
  );

CREATE INDEX idx_milestone_child_id ON milestone_notifications(child_id);


---------------------------------------------
-- Fonctions SQL (RPC)
---------------------------------------------

-- 1. get_child_stats : Retourne les stats agrégées d'un enfant
CREATE OR REPLACE FUNCTION get_child_stats(target_child_id uuid)
RETURNS json AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'total_items_mastered', COUNT(*) FILTER (WHERE mastered = true),
    'total_sessions', (SELECT COUNT(*) FROM sessions WHERE child_id = target_child_id),
    'total_time_spent_seconds', COALESCE((SELECT SUM(duration_seconds) FROM sessions WHERE child_id = target_child_id), 0),
    'average_score', COALESCE(AVG(score), 0)
  ) INTO stats
  FROM progress
  WHERE child_id = target_child_id;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_items_for_review : Algorithme SM-2 simplifié (Spaced Repetition)
CREATE OR REPLACE FUNCTION get_items_for_review(target_child_id uuid, target_limit int DEFAULT 10)
RETURNS TABLE (
  item_id uuid,
  contenu_ar text,
  transliteration text,
  type text,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT ci.id, ci.contenu_ar, ci.transliteration, ci.type, ci.metadata
  FROM progress p
  JOIN content_items ci ON ci.id = p.item_id
  WHERE p.child_id = target_child_id
    AND p.next_review <= now()
    AND p.mastered = false
  ORDER BY p.next_review ASC
  LIMIT target_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. calculate_level : Calcule et met à jour le niveau (1 à 5)
CREATE OR REPLACE FUNCTION calculate_level(target_child_id uuid)
RETURNS int AS $$
DECLARE
  total_score int;
  new_level int;
BEGIN
  -- Calculer le score total basé sur la table progress
  SELECT SUM(score) INTO total_score FROM progress WHERE child_id = target_child_id;
  total_score := COALESCE(total_score, 0);
  
  -- Logique: 500 pts = +1 niveau
  new_level := 1 + FLOOR(total_score / 500);
  IF new_level > 5 THEN new_level := 5; END IF;
  
  -- Mettre à jour l'enfant
  UPDATE children SET niveau = new_level WHERE id = target_child_id;
  
  RETURN new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
