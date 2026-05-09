CREATE OR REPLACE FUNCTION public.handle_reservation_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'expired') AND OLD.status = 'pending' THEN
    -- Free the spot
    UPDATE public.parking_spots
    SET status = 'free',
        last_updated = now(),
        expires_at = NULL,
        current_plate = NULL
    WHERE id = NEW.spot_number AND status = 'pending';

    -- Log the free event
    INSERT INTO public.spot_events (spot_id, event, occurred_at)
    VALUES (NEW.spot_number, 'free', now());
  END IF;
  RETURN NEW;
END;
$$;