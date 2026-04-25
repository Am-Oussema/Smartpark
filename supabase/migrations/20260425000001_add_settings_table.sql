CREATE TABLE public.settings (
  id               int          PRIMARY KEY DEFAULT 1,
  base_price       numeric(8,3) NOT NULL DEFAULT 2.0,
  surge_threshold  int          NOT NULL DEFAULT 70,
  surge_multiplier numeric(4,2) NOT NULL DEFAULT 1.2,
  alert_threshold  int          NOT NULL DEFAULT 80,
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON public.settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (id) VALUES (1);