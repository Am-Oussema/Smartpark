-- ============================================================================
-- Migration : Réservations par plage horaire
-- - Ajoute start_time / end_time (plage horaire configurable par l'utilisateur)
-- - Ajoute updated_at pour traçabilité des modifications
-- - Ajoute une contrainte d'exclusion GiST pour détecter les conflits horaires
--   atomiquement côté base (deux réservations actives sur la même place ne
--   peuvent pas se chevaucher).
-- ============================================================================

-- btree_gist est nécessaire pour combiner un int (spot_number) et un range
-- dans une contrainte d'exclusion.
create extension if not exists btree_gist;

-- 1. Nouvelles colonnes
alter table public.reservations
  add column if not exists start_time timestamptz,
  add column if not exists end_time   timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Migration des anciennes lignes : on considère la fenêtre [reserved_at, expires_at)
update public.reservations
set start_time = coalesce(start_time, reserved_at),
    end_time   = coalesce(end_time,   expires_at)
where start_time is null or end_time is null;

-- 3. On rend les colonnes obligatoires une fois la migration des données faite
alter table public.reservations
  alter column start_time set not null,
  alter column end_time   set not null;

-- 4. Valeurs par défaut pour les nouvelles insertions (fenêtre de 30 min)
alter table public.reservations
  alter column start_time set default now(),
  alter column end_time   set default (now() + interval '30 minutes');

-- 5. expires_at devient optionnel (le code l'aligne automatiquement sur end_time)
alter table public.reservations
  alter column expires_at drop not null;

-- 6. Contraintes de cohérence
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_time_order_check'
  ) then
    alter table public.reservations
      add constraint reservations_time_order_check
      check (start_time < end_time);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'reservations_max_duration_check'
  ) then
    alter table public.reservations
      add constraint reservations_max_duration_check
      check (end_time - start_time <= interval '24 hours');
  end if;
end $$;

-- 7. Contrainte d'exclusion : pas deux réservations actives qui se chevauchent
--    sur la même place. C'est la détection de conflit "atomique" côté base.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_no_overlap_active'
  ) then
    alter table public.reservations
      add constraint reservations_no_overlap_active
      exclude using gist (
        spot_number with =,
        tstzrange(start_time, end_time, '[)') with &&
      )
      where (status = 'active');
  end if;
end $$;

-- 8. Synchronisation automatique expires_at <- end_time + updated_at <- now()
create or replace function public.sync_reservation_times()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.end_time;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reservations_sync_times on public.reservations;
create trigger reservations_sync_times
  before insert or update on public.reservations
  for each row execute function public.sync_reservation_times();

-- 9. Index utile pour les requêtes "réservations actives à un instant t"
create index if not exists idx_reservations_active_time
  on public.reservations (spot_number, start_time, end_time)
  where status = 'active';
