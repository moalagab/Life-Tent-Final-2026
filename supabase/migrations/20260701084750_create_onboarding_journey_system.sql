-- ── 1. Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_journey_state (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id     text        NOT NULL DEFAULT 'lt_onboarding_v1',
  step_id        text        NOT NULL,
  day_offset     smallint    NOT NULL,
  channel        text        NOT NULL CHECK (channel IN ('email','push','in_app')),
  scheduled_at   timestamptz NOT NULL,
  sent_at        timestamptz,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','sent','skipped','failed')),
  skip_reason    text,
  metadata       jsonb       DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  UNIQUE (user_id, step_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_ojs_pending
  ON public.onboarding_journey_state (scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ojs_user
  ON public.onboarding_journey_state (user_id);

ALTER TABLE public.onboarding_journey_state ENABLE ROW LEVEL SECURITY;
-- No user-facing policy — service role only

-- ── 2. Enroll function ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enroll_user_in_onboarding_journey()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  t timestamptz := NEW.created_at;
BEGIN
  INSERT INTO public.onboarding_journey_state
    (user_id, step_id, day_offset, scheduled_at, channel)
  VALUES
    -- Day 0 — immediate
    (NEW.id, 'day0_activation',           0,  t,                                                        'email'),
    (NEW.id, 'day0_activation',           0,  t,                                                        'in_app'),
    -- Day 1 — 07:00 KSA = 04:00 UTC
    (NEW.id, 'day1_first_ritual',         1,  date_trunc('day', t) + interval '1 day 4 hours',          'push'),
    (NEW.id, 'day1_first_ritual',         1,  date_trunc('day', t) + interval '1 day 4 hours',          'email'),
    -- Day 3 — 09:00 KSA = 06:00 UTC
    (NEW.id, 'day3_progress_celebration', 3,  date_trunc('day', t) + interval '3 days 6 hours',         'email'),
    (NEW.id, 'day3_progress_celebration', 3,  date_trunc('day', t) + interval '3 days 6 hours',         'in_app'),
    -- Day 5 — 09:00 KSA
    (NEW.id, 'day5_ai_studio_softpaywall',5,  date_trunc('day', t) + interval '5 days 6 hours',         'in_app'),
    -- Day 7 — 09:00 KSA
    (NEW.id, 'day7_weekly_report',        7,  date_trunc('day', t) + interval '7 days 6 hours',         'push'),
    (NEW.id, 'day7_weekly_report',        7,  date_trunc('day', t) + interval '7 days 6 hours',         'email'),
    -- Day 14 — 09:00 KSA
    (NEW.id, 'day14_referral_prompt',    14,  date_trunc('day', t) + interval '14 days 6 hours',        'email'),
    -- Day 30 — 09:00 KSA
    (NEW.id, 'day30_monthly_review',     30,  date_trunc('day', t) + interval '30 days 6 hours',        'email')
  ON CONFLICT (user_id, step_id, channel) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 3. Trigger on auth.users ──────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created_journey ON auth.users;
CREATE TRIGGER on_auth_user_created_journey
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enroll_user_in_onboarding_journey();

-- ── 4. Backfill existing users ────────────────────────────────────────────────
-- Past steps → skipped (pre-system), future steps → pending
DO $$
DECLARE
  u   RECORD;
  t   timestamptz;
  now timestamptz := now();

  steps text[][]  := ARRAY[
    ARRAY['day0_activation',           '0',  '0',   'email'],
    ARRAY['day0_activation',           '0',  '0',   'in_app'],
    ARRAY['day1_first_ritual',         '1',  '28',  'push'],
    ARRAY['day1_first_ritual',         '1',  '28',  'email'],
    ARRAY['day3_progress_celebration', '3',  '30',  'email'],
    ARRAY['day3_progress_celebration', '3',  '30',  'in_app'],
    ARRAY['day5_ai_studio_softpaywall','5',  '30',  'in_app'],
    ARRAY['day7_weekly_report',        '7',  '30',  'push'],
    ARRAY['day7_weekly_report',        '7',  '30',  'email'],
    ARRAY['day14_referral_prompt',     '14', '30',  'email'],
    ARRAY['day30_monthly_review',      '30', '30',  'email']
  ];
  s text[];
  sched timestamptz;
  offset_days integer;
  hour_offset integer;
BEGIN
  FOR u IN SELECT id, created_at FROM auth.users LOOP
    t := u.created_at;
    FOREACH s SLICE 1 IN ARRAY steps LOOP
      offset_days := s[2]::integer;
      hour_offset := CASE WHEN offset_days = 0 THEN 0 ELSE 6 END;
      sched := date_trunc('day', t) + (offset_days || ' days')::interval + (hour_offset || ' hours')::interval;

      INSERT INTO public.onboarding_journey_state
        (user_id, step_id, day_offset, scheduled_at, channel, status, skip_reason)
      VALUES (
        u.id,
        s[1],
        offset_days,
        sched,
        s[4],
        CASE WHEN sched < now THEN 'skipped' ELSE 'pending' END,
        CASE WHEN sched < now THEN 'pre_system_enrollment' ELSE NULL END
      )
      ON CONFLICT (user_id, step_id, channel) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
