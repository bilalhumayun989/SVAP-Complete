-- Keep products private from public listing queries while an accepted SVAP is
-- awaiting checkout/delivery. Existing public queries already select status='active'.
-- SVAP request/order joins do not filter by product status, so both participants
-- retain the product names and images in their own checkout/order context.

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

CREATE OR REPLACE FUNCTION public.sync_swap_product_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    IF EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id IN (NEW.offered_product_id, NEW.requested_product_id)
        AND p.status IS DISTINCT FROM 'active'
    ) THEN
      RAISE EXCEPTION 'A product in this SVAP is no longer available';
    END IF;

    UPDATE public.products
    SET status = 'reserved'
    WHERE id IN (NEW.offered_product_id, NEW.requested_product_id)
      AND status = 'active';
  ELSIF NEW.status IN ('rejected', 'cancelled')
    AND OLD.status IN ('accepted', 'completed') THEN
    UPDATE public.products p
    SET status = 'active'
    WHERE p.id IN (NEW.offered_product_id, NEW.requested_product_id)
      AND p.status = 'reserved'
      AND NOT EXISTS (
        SELECT 1
        FROM public.swap_requests other_request
        WHERE other_request.id <> NEW.id
          AND other_request.status IN ('accepted', 'completed')
          AND p.id IN (other_request.offered_product_id, other_request.requested_product_id)
      );
  END IF;

  -- 'completed' means both checkout orders exist in the current workflow.
  -- Product status changes to 'swapped' only after both orders are delivered.
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_swap_product_visibility ON public.swap_requests;
CREATE TRIGGER on_swap_product_visibility
AFTER UPDATE OF status ON public.swap_requests
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION public.sync_swap_product_visibility();

CREATE OR REPLACE FUNCTION public.mark_swap_products_swapped_after_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  participant_from uuid;
  participant_to uuid;
  delivered_participants integer;
  offered_id uuid;
  requested_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM 'delivered'
    OR OLD.status IS NOT DISTINCT FROM 'delivered'
    OR NEW.swap_request_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT sr.from_user_id, sr.to_user_id, sr.offered_product_id, sr.requested_product_id
    INTO participant_from, participant_to, offered_id, requested_id
  FROM public.swap_requests sr
  WHERE sr.id = NEW.swap_request_id
    AND sr.status IN ('accepted', 'completed');

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT count(DISTINCT o.from_user_id)
    INTO delivered_participants
  FROM public.orders o
  WHERE o.swap_request_id = NEW.swap_request_id
    AND o.from_user_id IN (participant_from, participant_to)
    AND o.status = 'delivered';

  IF delivered_participants = 2 THEN
    UPDATE public.products
    SET status = 'swapped'
    WHERE id IN (offered_id, requested_id)
      AND status IN ('reserved', 'active');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_swap_products_delivered ON public.orders;
CREATE TRIGGER on_swap_products_delivered
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.mark_swap_products_swapped_after_delivery();

-- Reserve existing accepted/checkout-in-progress listings too. Older logic
-- marked products swapped after checkout, so restore those to reserved until
-- both participants actually have delivered orders.
UPDATE public.products p
SET status = 'reserved'
WHERE p.status IN ('active', 'swapped')
  AND EXISTS (
    SELECT 1
    FROM public.swap_requests sr
    WHERE sr.status IN ('accepted', 'completed')
      AND p.id IN (sr.offered_product_id, sr.requested_product_id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.swap_requests delivered_swap
        WHERE delivered_swap.status IN ('accepted', 'completed')
          AND p.id IN (delivered_swap.offered_product_id, delivered_swap.requested_product_id)
          AND (
            SELECT count(DISTINCT o.from_user_id)
            FROM public.orders o
            WHERE o.swap_request_id = delivered_swap.id
              AND o.from_user_id IN (delivered_swap.from_user_id, delivered_swap.to_user_id)
              AND o.status = 'delivered'
          ) = 2
      )
  );
-- Preserve the permanent status for any historical swaps whose two orders are
-- already delivered, even if an earlier run left a product active/reserved.
UPDATE public.products p
SET status = 'swapped'
WHERE p.status IN ('active', 'reserved')
  AND EXISTS (
    SELECT 1
    FROM public.swap_requests sr
    WHERE sr.status IN ('accepted', 'completed')
      AND p.id IN (sr.offered_product_id, sr.requested_product_id)
      AND (
        SELECT count(DISTINCT o.from_user_id)
        FROM public.orders o
        WHERE o.swap_request_id = sr.id
          AND o.from_user_id IN (sr.from_user_id, sr.to_user_id)
          AND o.status = 'delivered'
      ) = 2
  );