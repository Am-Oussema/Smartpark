
UPDATE public.reservations
  SET status = 'pending'
  WHERE status = 'active';

-- ============================================================
-- parking_spots table
-- ============================================================
CREATE TABLE public.parking_spots (
  id            int         PRIMARY KEY,
  status        text        NOT NULL DEFAULT 'free',
  current_plate text,
  last_updated  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parking_spots_status_check
    CHECK (status IN ('free', 'pending', 'occupied', 'flagged'))
);

ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read spots (for live map)
CREATE POLICY "Authenticated users can read spots"
  ON public.parking_spots FOR SELECT TO authenticated
  USING (true);

-- Only service_role can update spots (ESP8266 via Edge Function)
-- No UPDATE policy = only service_role bypasses RLS

-- Seed 4 spots
INSERT INTO public.parking_spots (id, status) VALUES
  (1, 'free'), (2, 'free'), (3, 'free'), (4, 'free');


UPDATE public.parking_spots ps
SET status = 'pending', last_updated = now()
FROM public.reservations r
WHERE r.spot_number = ps.id
  AND r.status = 'pending'
  AND r.expires_at > now();

-- ============================================================
-- Extend reservations table
-- ============================================================
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS vehicle_id     uuid        REFERENCES public.vehicles ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plate          text,
  ADD COLUMN IF NOT EXISTS grace_minutes  int         NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS started_at     timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at       timestamptz,
  ADD COLUMN IF NOT EXISTS duration_min   int,
  ADD COLUMN IF NOT EXISTS amount_due     numeric(8,3),
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(8,3) NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS deposit_refunded boolean    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show        boolean     NOT NULL DEFAULT false;

-- DB-level guarantee: only one pending/active reservation per spot
CREATE UNIQUE INDEX IF NOT EXISTS reservations_spot_active_unique
  ON public.reservations (spot_number)
  WHERE status IN ('pending', 'active');

-- ============================================================
-- reservation_cooldowns table
-- ============================================================
CREATE TABLE public.reservation_cooldowns (
  user_id       uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  spot_id       int         NOT NULL REFERENCES public.parking_spots,
  blocked_until timestamptz NOT NULL,
  reason        text,
  PRIMARY KEY (user_id, spot_id)
);

ALTER TABLE public.reservation_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own cooldowns"
  ON public.reservation_cooldowns FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Enable Realtime on parking_spots
-- (broadcasts changes to all connected clients)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_spots;