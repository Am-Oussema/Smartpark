-- Spot events table — records every state change for occupancy calculation
CREATE TABLE public.spot_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id     int         NOT NULL REFERENCES public.parking_spots,
  event       text        NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spot_events_event_check CHECK (event IN ('occupied', 'free'))
);

ALTER TABLE public.spot_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read events (for analytics charts)
CREATE POLICY "Authenticated users can read spot events"
  ON public.spot_events FOR SELECT TO authenticated
  USING (true);

-- Only service_role can insert (Edge Function + triggers)
-- No INSERT policy = only service_role bypasses RLS

-- Index for fast time-range queries
CREATE INDEX spot_events_occurred_at_idx
  ON public.spot_events (spot_id, occurred_at DESC);

-- Seed initial state — mark currently occupied/pending spots
INSERT INTO public.spot_events (spot_id, event, occurred_at)
SELECT id, 'occupied', last_updated
FROM public.parking_spots
WHERE status IN ('pending', 'occupied');