-- Swap request timeout: request creation starts the 48-hour deadline (expires_at).
-- Run this migration in Supabase SQL Editor before deploying the backend.

-- Prevent the first checkout order from marking a swap completed.
-- It becomes completed only after both participants have an order.
CREATE OR REPLACE FUNCTION public.handle_order_placed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  buyer_username text;
  participant_order_count integer;
BEGIN
  SELECT username INTO buyer_username
  FROM public.profiles
  WHERE id = NEW.from_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, route)
  VALUES (
    NEW.to_user_id,
    'Order placed for your SVAP',
    'order_update',
    '@' || COALESCE(buyer_username, 'A user') || ' has placed an order. Prepare your item for shipping. Order ID: ' || NEW.id::text,
    '/orders'
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
  v_order_ref text := 'Order ID: ' || NEW.id::text;
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
      v_body := 'Your SVAP order is on its way! Check your orders tab for tracking details.';
    WHEN 'delivered' THEN
      v_title := 'Order Delivered';
      v_body := 'Your SVAP order has been delivered. Enjoy your SVAP!';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      IF OLD.status IN ('product_verification', 'item_verification', 'shipped', 'delivered') THEN
        v_body := 'Your payment was verified before this SVAP was cancelled. Our support team will contact you to arrange your refund.';
      ELSE
        v_body := 'Your order has been cancelled.';
      END IF;
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, body, route)
  VALUES (NEW.from_user_id, 'order_status', v_title, v_body || ' ' || v_order_ref, '/profile');

  -- Notify only the partner whose own payment is still awaiting verification.
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
        'SVAP Partner Payment Verified',
        'Your SVAP partner''s payment is verified by us. Now the item will be inspected. ' || v_order_ref,
        '/orders'
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
          'SVAP Partner Order Cancelled',
          'Your SVAP partner''s order was cancelled. Our support team will contact you to arrange your refund. ' || v_order_ref,
          '/orders'
        );
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, route)
        VALUES (
          v_partner_user_id,
          'order_status',
          'SVAP Partner Order Cancelled',
          'Your SVAP partner''s order was cancelled.' || v_order_ref,
          '/orders'
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
  checkout_order_id uuid;
  no_checkout_user uuid;
  changed_id uuid;
  expired_count integer := 0;
  timeout_note constant text :=
    'Auto-cancelled: partner did not checkout in time. Our support team will contact you to arrange your refund.';
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

    SELECT o.from_user_id, o.id
      INTO checkout_user, checkout_order_id
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

    IF r.status = 'completed' AND checkout_count < 2 THEN
      UPDATE public.profiles
      SET total_swaps = GREATEST(0, total_swaps - 1)
      WHERE id IN (r.from_user_id, r.to_user_id);
    END IF;

    IF checkout_count = 0 THEN
      INSERT INTO public.notifications (user_id, type, title, body, route, is_read)
      VALUES
        (r.from_user_id, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the SVAP has been cancelled.',
         '/requests', false),
        (r.to_user_id, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the SVAP has been cancelled.',
         '/requests', false);
    ELSE
      no_checkout_user :=
        CASE WHEN checkout_user = r.from_user_id THEN r.to_user_id ELSE r.from_user_id END;

      INSERT INTO public.notifications (user_id, type, title, body, route, is_read)
      VALUES
        (no_checkout_user, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the SVAP has been cancelled. Order ID: ' || checkout_order_id::text,
         '/requests', false),
        (checkout_user, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Your SVAP partner did not complete checkout within 48 hours, so the SVAP has been cancelled. Our support team will contact you to arrange your refund. Order ID: ' || checkout_order_id::text,
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

