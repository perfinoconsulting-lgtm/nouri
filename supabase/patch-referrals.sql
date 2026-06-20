-- Patch parrainage Lisani
-- A executer une fois dans Supabase SQL Editor si la base existe deja.

ALTER TABLE parents
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES parents(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES parents(id) ON DELETE CASCADE UNIQUE,
  code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'canceled')),
  reward_applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parents_referral_code ON parents(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'parents'
      AND policyname = 'Les parents peuvent créer leur profil'
  ) THEN
    CREATE POLICY "Les parents peuvent créer leur profil"
    ON parents FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referrals'
      AND policyname = 'Voir ses parrainages'
  ) THEN
    CREATE POLICY "Voir ses parrainages"
    ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referrals'
      AND policyname = 'Créer son parrainage'
  ) THEN
    CREATE POLICY "Créer son parrainage"
    ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referrals'
      AND policyname = 'Modifier ses parrainages'
  ) THEN
    CREATE POLICY "Modifier ses parrainages"
    ON referrals FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;
END $$;
