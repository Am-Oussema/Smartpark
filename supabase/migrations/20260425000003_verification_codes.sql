CREATE TABLE public.verification_codes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  phone      text        NOT NULL,
  code       text        NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  used       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own codes"
  ON public.verification_codes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);