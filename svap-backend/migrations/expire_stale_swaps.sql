-- Swap request timeout: request creation starts the 48-hour deadline (expires_at).
-- Run this migration in Supabase SQL Editor before deploying the backend.

-- Prevent the first checkout order from marking a swap completed.
-- It becomes completed only after both participants have an order.
CREATE OR REPLACE FUNCTION public.handle_order_placed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  buyer_username text;
  offered_title text;
  requested_title text;
  participant_order_count integer;
BEGIN
  SELECT username INTO buyer_username
  FROM public.profiles
  WHERE id = NEW.from_user_id;

  SELECT p.title INTO offered_title
  FROM public.swap_requests sr
  JOIN public.products p ON p.id = sr.offered_product_id
  WHERE sr.id = NEW.swap_request_id;

  SELECT p.title INTO requested_title
  FROM public.swap_requests sr
  JOIN public.products p ON p.id = sr.requested_product_id
  WHERE sr.id = NEW.swap_request_id;

  INSERT INTO public.notifications (user_id, type, title, body, route)
  VALUES (
    NEW.to_user_id,
    'order_update',
    'Order placed for your swap',
    '@' || COALESCE(buyer_username, 'A user') || ' has placed an order. Prepare your item for shipping.',
    '/swaps'
  );

  IF NEW.swap_request_id IS NOT NULL THEN
    SELECT count(DISTINCT o.from_user_id)
      INTO participant_order_count
    FROM public.orders o
    JOIN public.swap_requests sr ON sr.id = o.swap_request_id
    WHERE o.swap_request_id = NEW.swap_request_id
      AND o.from_user_id IN (sr.from_user_id, sr.to_user_id);

    IF participant_order_count >= 2 THEN
      UPDATE public.swap_requests
      SET status = 'completed'
      WHERE id = NEW.swap_request_id
        AND status IN ('accepted', 'completed');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

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
  -- Acceptance commits both swap participants exactly once per status transition.
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    UPDATE public.profiles
    SET committed_swaps = COALESCE(committed_swaps, 0) + 1,
        swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
          COALESCE(completed_swaps, 0)::numeric * 5 /
          NULLIF(COALESCE(committed_swaps, 0) + 1, 0)
        )), 1)
    WHERE id IN (NEW.from_user_id, NEW.to_user_id);
  END IF;

  -- Completion records one successful swap for each participant.
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

    UPDATE public.products
    SET status = 'swapped'
    WHERE id IN (NEW.offered_product_id, NEW.requested_product_id);
  END IF;

  -- On timeout, a participant who checked out is not penalized; keep the
  -- commitment only for the participant who did not complete checkout.
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

-- Notify the order owner about their own status. If a partner order is cancelled
-- after this user has paid, tell them to contact support about their refund.
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_title text;
  v_body text;
  v_partner_user_id uuid;
  v_partner_order_status text;
  v_partner_has_order boolean := false;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'payment_verification' THEN
      v_title := 'Payment Verification';
      v_body := 'We''re verifying your payment. You''ll be notified once confirmed.';
    WHEN 'product_verification' THEN
      v_title := 'Product Verification';
      v_body := 'Payment confirmed! Please prepare your item for dispatch.';
    WHEN 'item_verification' THEN
      v_title := 'Item Verification';
      v_body := 'Your payment is confirmed. Please prepare your item for dispatch.';
    WHEN 'shipped' THEN
      v_title := 'Order Shipped';
      v_body := 'Your swap order is on its way! Check your orders tab for tracking details.';
    WHEN 'delivered' THEN
      v_title := 'Order Delivered';
      v_body := 'Your swap order has been delivered. Enjoy your new item!';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_body := 'Your order has been cancelled. Contact our support team if you need assistance.';
    ELSE
      RETURN NEW;
  END CASE;

  -- This notification is for the owner of the order whose status changed.
  INSERT INTO public.notifications (user_id, type, title, body, route)
  VALUES (NEW.from_user_id, 'order_status', v_title, v_body, '/profile');

  -- Notify only the swap partner whose own payment is still awaiting verification.
  IF NEW.status IN ('product_verification', 'item_verification')
    AND COALESCE(OLD.status, '') NOT IN ('product_verification', 'item_verification')
    AND NEW.swap_request_id IS NOT NULL THEN
    SELECT CASE
        WHEN sr.from_user_id = NEW.from_user_id THEN sr.to_user_id
        ELSE sr.from_user_id
      END
      INTO v_partner_user_id
    FROM public.swap_requests sr
    WHERE sr.id = NEW.swap_request_id;

    SELECT o.status
      INTO v_partner_order_status
    FROM public.orders o
    WHERE o.swap_request_id = NEW.swap_request_id
      AND o.from_user_id = v_partner_user_id
    ORDER BY o.created_at DESC
    LIMIT 1;
    v_partner_has_order := FOUND;

    IF v_partner_user_id IS NOT NULL
      AND (NOT v_partner_has_order OR v_partner_order_status IN ('pending', 'payment_verification')) THEN
      INSERT INTO public.notifications (user_id, type, title, body, route)
      VALUES (
        v_partner_user_id,
        'order_status',
        'Swap Partner Payment Verified',
        'Your svap partner''s payment is verified by us. Now the item will be inspected',
        '/profile'
      );
    END IF;
  END IF;

  IF NEW.status = 'cancelled' AND NEW.swap_request_id IS NOT NULL THEN
    SELECT CASE
        WHEN sr.from_user_id = NEW.from_user_id THEN sr.to_user_id
        ELSE sr.from_user_id
      END
      INTO v_partner_user_id
    FROM public.swap_requests sr
    WHERE sr.id = NEW.swap_request_id;

    SELECT o.status
      INTO v_partner_order_status
    FROM public.orders o
    WHERE o.swap_request_id = NEW.swap_request_id
      AND o.from_user_id = v_partner_user_id
    ORDER BY o.created_at DESC
    LIMIT 1;

    IF FOUND AND v_partner_user_id IS NOT NULL THEN
      IF v_partner_order_status IN ('product_verification', 'item_verification', 'shipped', 'delivered') THEN
        INSERT INTO public.notifications (user_id, type, title, body, route)
        VALUES (
          v_partner_user_id,
          'order_status',
          'Swap Partner Order Cancelled',
          'Your swap partner''s order was cancelled. Please contact our support team to arrange your refund.',
          '/profile'
        );
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, route)
        VALUES (
          v_partner_user_id,
          'order_status',
          'Swap Partner Order Cancelled',
          'Your swap partner''s order was cancelled. Contact our support team if you need assistance.',
          '/profile'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Exclude only timeout-cancelled orders from the existing generic notification trigger.
-- The expiry function inserts the specific timeout/refund notifications instead.
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (
  NEW.status <> 'cancelled'
  OR COALESCE(NEW.admin_notes, '') NOT LIKE
    'Auto-cancelled: partner did not checkout in time.%'
)
EXECUTE FUNCTION public.notify_order_status_change();

-- This function is safe to invoke repeatedly: it changes request status before
-- creating notifications, so only the transaction that cancels the request
-- can emit its timeout notifications.
CREATE OR REPLACE FUNCTION public.expire_stale_swaps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  r record;
  checkout_count integer;
  checkout_user uuid;
  no_checkout_user uuid;
  changed_id uuid;
  expired_count integer := 0;
  timeout_note constant text :=
    'Auto-cancelled: partner did not checkout in time. Refund required.';
BEGIN
  FOR r IN
    SELECT sr.*
    FROM public.swap_requests sr
    WHERE sr.expires_at <= now()
      AND sr.status IN ('pending', 'accepted', 'completed')
      AND (
        (sr.status = 'pending' AND NOT EXISTS (
          SELECT 1 FROM public.orders o WHERE o.swap_request_id = sr.id
        ))
        OR (sr.status = 'accepted' AND (
          SELECT count(DISTINCT o.from_user_id) FROM public.orders o
          WHERE o.swap_request_id = sr.id
            AND o.from_user_id IN (sr.from_user_id, sr.to_user_id)
        ) < 2)
        OR (sr.status = 'completed' AND (
          SELECT count(DISTINCT o.from_user_id) FROM public.orders o
          WHERE o.swap_request_id = sr.id
            AND o.from_user_id IN (sr.from_user_id, sr.to_user_id)
        ) < 2)
      )
    ORDER BY sr.expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT count(DISTINCT o.from_user_id)
      INTO checkout_count
    FROM public.orders o
    WHERE o.swap_request_id = r.id
      AND o.from_user_id IN (r.from_user_id, r.to_user_id);

    SELECT o.from_user_id
      INTO checkout_user
    FROM public.orders o
    WHERE o.swap_request_id = r.id
      AND o.from_user_id IN (r.from_user_id, r.to_user_id)
    ORDER BY o.created_at
    LIMIT 1;

    UPDATE public.swap_requests
    SET status = 'cancelled'
    WHERE id = r.id
      AND status = r.status
    RETURNING id INTO changed_id;

    IF changed_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.orders
    SET status = 'cancelled',
        admin_notes = concat_ws(E'\n', NULLIF(admin_notes, ''), timeout_note)
    WHERE swap_request_id = r.id
      AND from_user_id IN (r.from_user_id, r.to_user_id)
      AND status <> 'cancelled';

    UPDATE public.products
    SET status = 'active'
    WHERE id IN (r.offered_product_id, r.requested_product_id)
      AND status <> 'active';


    -- The old order trigger may already have counted a one-order swap as
    -- completed. Reverse that count only for those legacy false completions.
    IF r.status = 'completed' AND checkout_count < 2 THEN
      UPDATE public.profiles
      SET total_swaps = GREATEST(0, total_swaps - 1)
      WHERE id IN (r.from_user_id, r.to_user_id);
    END IF;

    IF checkout_count = 0 THEN
      INSERT INTO public.notifications (user_id, type, title, body, route, is_read)
      VALUES
        (r.from_user_id, 'swap_timeout', 'Swap Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the swap has been cancelled.',
         '/requests', false),
        (r.to_user_id, 'swap_timeout', 'Swap Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the swap has been cancelled.',
         '/requests', false);
    ELSE
      no_checkout_user :=
        CASE WHEN checkout_user = r.from_user_id THEN r.to_user_id ELSE r.from_user_id END;

      INSERT INTO public.notifications (user_id, type, title, body, route, is_read)
      VALUES
        (no_checkout_user, 'swap_timeout', 'Swap Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the swap has been cancelled.',
         '/requests', false),
        (checkout_user, 'swap_timeout', 'Swap Cancelled - Timeout',
         'Your swap partner did not complete checkout within 48 hours, so the swap has been cancelled. Your order was cancelled and a refund is required.',
         '/requests', false);
    END IF;

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.expire_stale_swaps() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_swaps() TO service_role;

-- Backend node-cron invokes public.expire_stale_swaps() every five minutes.
-- No pg_cron extension or database-side schedule is required.

