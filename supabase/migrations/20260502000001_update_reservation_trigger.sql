CREATE OR REPLACE FUNCTION public.handle_reservation_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'expired') AND OLD.status = 'pending' THEN
    UPDATE public.parking_spots
    SET status = 'free',
        last_updated = now(),
        expires_at = NULL,
        current_plate = NULL  -- ← add this
    WHERE id = NEW.spot_number AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;