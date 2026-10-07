-- Keep review ratings in profiles.swap_score. Reliability is a separate metric.
-- Existing total_swaps remains the app's completed activity count.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS committed_swaps integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_swaps integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reliability_score numeric(4,2) NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ALTER COLUMN committed_swaps SET DEFAULT 0,
  ALTER COLUMN completed_swaps SET DEFAULT 0,
  ALTER COLUMN reliability_score SET DEFAULT 0;

UPDATE public.profiles
SET committed_swaps = COALESCE(committed_swaps, 0),
    completed_swaps = COALESCE(completed_swaps, 0),
    reliability_score = COALESCE(reliability_score, 0);

ALTER TABLE public.profiles
  ALTER COLUMN committed_swaps SET NOT NULL,
  ALTER COLUMN completed_swaps SET NOT NULL,
  ALTER COLUMN reliability_score SET NOT NULL;

ALTER TABLE public.swap_requests
  ADD COLUMN IF NOT EXISTS cancelled_by_user_id uuid
  REFERENCES public.profiles(id) ON DELETE SET NULL;

WITH history AS (
  SELECT p.id,
    COUNT(sr.id) FILTER (WHERE sr.status = 'accepted')::integer AS accepted_count,
    COUNT(sr.id) FILTER (WHERE sr.status = 'completed')::integer AS completed_count
  FROM public.profiles p
  LEFT JOIN public.swap_requests sr
    ON sr.from_user_id = p.id OR sr.to_user_id = p.id
  GROUP BY p.id
)
UPDATE public.profiles p
SET completed_swaps = GREATEST(COALESCE(p.completed_swaps,0), history.completed_count),
    committed_swaps = GREATEST(
      COALESCE(p.committed_swaps,0),
      history.completed_count + history.accepted_count
    );

CREATE OR REPLACE FUNCTION public.recalculate_reliability_for_users(p_user_ids uuid[])
RETURNS void LANGUAGE sql AS $$
  UPDATE public.profiles
  SET reliability_score = CASE
    WHEN COALESCE(committed_swaps,0) <= 0 THEN 0
    ELSE LEAST(5, GREATEST(0, ROUND(COALESCE(completed_swaps,0)::numeric / committed_swaps * 5, 1)))
  END
  WHERE id = ANY(p_user_ids);
$$;

CREATE OR REPLACE FUNCTION public.update_swap_counts()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  participant_ids uuid[] := ARRAY[NEW.from_user_id, NEW.to_user_id];
  checkout_count integer := 0;
  checkout_user_id uuid;
  responsible_user_id uuid;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'accepted' THEN
    UPDATE public.profiles
    SET committed_swaps = COALESCE(committed_swaps,0) + 1
    WHERE id = ANY(participant_ids);
    PERFORM public.recalculate_reliability_for_users(participant_ids);

  ELSIF NEW.status = 'completed' THEN
    UPDATE public.profiles
    SET completed_swaps = COALESCE(completed_swaps,0) + 1
    WHERE id = ANY(participant_ids);
    UPDATE public.products
    SET status = 'swapped'
    WHERE id = ANY(ARRAY[NEW.offered_product_id, NEW.requested_product_id]::uuid[]);
    PERFORM public.recalculate_reliability_for_users(participant_ids);

  ELSIF NEW.status = 'cancelled' AND OLD.status = 'accepted' THEN
    responsible_user_id := NEW.cancelled_by_user_id;
    IF responsible_user_id IS NULL THEN
      SELECT COUNT(DISTINCT o.from_user_id)::integer,
             (ARRAY_AGG(DISTINCT o.from_user_id))[1]
      INTO checkout_count, checkout_user_id
      FROM public.orders o
      WHERE o.swap_request_id = NEW.id
        AND o.from_user_id = ANY(participant_ids);
      IF checkout_count = 1 THEN
        responsible_user_id := CASE WHEN checkout_user_id = NEW.from_user_id
          THEN NEW.to_user_id ELSE NEW.from_user_id END;
      ELSIF checkout_count = 0 THEN
        responsible_user_id := NEW.to_user_id;
      END IF;
    END IF;
    IF responsible_user_id = ANY(participant_ids) THEN
      UPDATE public.profiles
      SET committed_swaps = GREATEST(COALESCE(committed_swaps,0)-1,0)
      WHERE id = ANY(participant_ids) AND id <> responsible_user_id;
    ELSE
      UPDATE public.profiles
      SET committed_swaps = GREATEST(COALESCE(committed_swaps,0)-1,0)
      WHERE id = ANY(participant_ids);
    END IF;
    PERFORM public.recalculate_reliability_for_users(participant_ids);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_swap_completed ON public.swap_requests;
CREATE TRIGGER on_swap_completed
  AFTER UPDATE OF status ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_swap_counts();

SELECT public.recalculate_reliability_for_users(ARRAY(SELECT id FROM public.profiles));
COMMIT;