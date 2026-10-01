CREATE OR REPLACE FUNCTION public.update_swap_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  checkout_count integer;
  checkout_user uuid;
  remaining_commitments integer;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    UPDATE public.profiles
    SET committed_swaps = COALESCE(committed_swaps, 0) + 1,
        swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
          COALESCE(completed_swaps, 0)::numeric * 5 /
          NULLIF(COALESCE(committed_swaps, 0) + 1, 0)
        )), 1)
    WHERE id IN (NEW.from_user_id, NEW.to_user_id);
  END IF;

  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.profiles
    SET total_swaps = COALESCE(total_swaps, 0) + 1,
        completed_swaps = COALESCE(completed_swaps, 0) + 1,
        swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
          COALESCE(
            (COALESCE(completed_swaps, 0) + 1)::numeric * 5 /
              NULLIF(COALESCE(committed_swaps, 0), 0),
            0::numeric
          )
        )), 1)
    WHERE id IN (NEW.from_user_id, NEW.to_user_id);

    -- Products remain reserved until both orders are delivered.
  END IF;

  IF NEW.status = 'cancelled'
    AND OLD.status IN ('accepted', 'completed')
    AND NEW.expires_at <= now() THEN
    SELECT count(DISTINCT o.from_user_id)
      INTO checkout_count
    FROM public.orders o
    WHERE o.swap_request_id = NEW.id
      AND o.from_user_id IN (NEW.from_user_id, NEW.to_user_id);

    IF checkout_count = 1 THEN
      SELECT o.from_user_id
        INTO checkout_user
      FROM public.orders o
      WHERE o.swap_request_id = NEW.id
        AND o.from_user_id IN (NEW.from_user_id, NEW.to_user_id)
      ORDER BY o.created_at
      LIMIT 1;

      UPDATE public.profiles
      SET committed_swaps = GREATEST(COALESCE(committed_swaps, 0) - 1, 0)
      WHERE id = checkout_user
      RETURNING committed_swaps INTO remaining_commitments;

      UPDATE public.profiles
      SET swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
        COALESCE(
          COALESCE(completed_swaps, 0)::numeric * 5 /
            NULLIF(remaining_commitments, 0),
          0::numeric
        )
      )), 1)
      WHERE id = checkout_user;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
