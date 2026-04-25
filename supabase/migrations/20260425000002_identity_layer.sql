-- Extend profiles with identity + trust fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified  boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trust_score     int          NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS daily_res_count int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_reset_at  date         NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS ban_until       timestamptz;

-- Phone uniqueness enforced at DB level (ignores nulls and empty strings)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND phone != '';

-- Vehicles table
CREATE TABLE public.vehicles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plate      text        NOT NULL,
  label      text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_plate_unique UNIQUE (plate)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);