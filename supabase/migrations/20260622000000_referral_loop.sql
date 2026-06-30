-- Referral Loop: add referral_code to profiles + referrals table + RPCs

-- 1. Add referral_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Helper: generate 8-char random code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Backfill existing profiles that have no code
DO $$
DECLARE
  p RECORD;
  new_code TEXT;
BEGIN
  FOR p IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
    LOOP
      new_code := generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code);
    END LOOP;
    UPDATE profiles SET referral_code = new_code WHERE id = p.id;
  END LOOP;
END;
$$;

-- 4. Trigger function: auto-set code for new profiles
CREATE OR REPLACE FUNCTION trg_set_referral_code_fn()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code);
      attempts := attempts + 1;
      EXIT WHEN attempts >= 10;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_referral_code ON profiles;
CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_referral_code_fn();

-- 5. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrer reads own referrals" ON referrals;
CREATE POLICY "referrer reads own referrals" ON referrals
  FOR SELECT USING (referrer_id = auth.uid());

-- 6. RPC: record_referral(code)
CREATE OR REPLACE FUNCTION record_referral(p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_caller_id UUID := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN RETURN FALSE; END IF;

  SELECT user_id INTO v_referrer_id
  FROM profiles
  WHERE upper(referral_code) = upper(trim(p_referral_code));

  IF v_referrer_id IS NULL OR v_referrer_id = v_caller_id THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = v_caller_id) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
  VALUES (v_referrer_id, v_caller_id, upper(trim(p_referral_code)), 'completed');

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- 7. RPC: get_my_referral_stats()
CREATE OR REPLACE FUNCTION get_my_referral_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_referral_code TEXT;
  v_count BIGINT;
  v_reward_days BIGINT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('referral_code', null, 'referral_count', 0, 'reward_days', 0);
  END IF;

  SELECT referral_code INTO v_referral_code FROM profiles WHERE user_id = v_caller_id;

  SELECT COUNT(*), COALESCE(SUM(reward_days), 0)
  INTO v_count, v_reward_days
  FROM referrals
  WHERE referrer_id = v_caller_id AND status IN ('completed', 'rewarded');

  RETURN json_build_object(
    'referral_code', v_referral_code,
    'referral_count', COALESCE(v_count, 0),
    'reward_days', COALESCE(v_reward_days, 0)
  );
END;
$$;
